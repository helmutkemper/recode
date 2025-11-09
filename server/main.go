// main.go
//
// English:
//   Minimal HTTP server to receive and display user-generated JSON data,
//   and to visualize the user's Node-RED diagram (nodes+wires) on a canvas.
//   Endpoints:
//     - POST /ingest     : accept arbitrary JSON; stores it in memory
//     - GET  /events     : returns last events as JSON
//     - GET  /           : HTML page: send/view data + flow viewer canvas
//     - GET  /nr/flows   : proxy Node-RED flows JSON (from http://node-red:1880/flows)
//     - GET  /healthz    : liveness probe
//
//   Design notes:
//   - Single-responsibility, self-contained handlers.
//   - No external deps; all stdlib.
//   - CORS enabled for simple integration.
//
// Português:
//   Servidor HTTP minimalista para receber e exibir dados JSON e
//   visualizar o diagrama do Node-RED (nós+fios) em um canvas.
//   Endpoints:
//     - POST /ingest     : recebe JSON arbitrário; guarda em memória
//     - GET  /events     : retorna eventos em JSON
//     - GET  /           : página HTML (envio/visualização + viewer do flow)
//     - GET  /nr/flows   : proxy do JSON de flows do Node-RED
//     - GET  /healthz    : verificador de vida
//
//   Notas de projeto:
//   - Handlers simples e auto contidos.
//   - Sem dependências externas; apenas stdlib.
//   - CORS habilitado para integração simples.

package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"path"
	"strings"
	"sync"
	"time"
)

// initRuleBook
//
// English:
//
//	Organises complex rules, mainly business rules and visual rules.
//	All rules must be straightforward and respect the single responsibility of the function,
//	and the function must be self-contained.
//
// Português:
//
//	Organiza as regras complexas (negócio/visuais).
//	Todas as funções devem ser simples, responsabilidade única e auto contidas.
//func initRuleBook() {}

// ------------------------- SSE payload -------------------------

type sseMsg struct {
	Type   string `json:"type"`             // "hello" | "log" | "done"
	Stream string `json:"stream,omitempty"` // "stdout" | "stderr"
	Line   string `json:"line,omitempty"`
	Code   int    `json:"code,omitempty"`
	Target string `json:"target,omitempty"`
}

// ------------------------- SSE hub ----------------------------

type sseClient struct {
	w  http.ResponseWriter
	fl http.Flusher
}

type sseHub struct {
	mu      sync.RWMutex
	clients map[string]map[*sseClient]struct{} // nodeId -> set
}

func newSSEHub() *sseHub {
	return &sseHub{clients: make(map[string]map[*sseClient]struct{})}
}

func (h *sseHub) add(id string, c *sseClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[id] == nil {
		h.clients[id] = make(map[*sseClient]struct{})
	}
	h.clients[id][c] = struct{}{}
}

func (h *sseHub) remove(id string, c *sseClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if set := h.clients[id]; set != nil {
		delete(set, c)
		if len(set) == 0 {
			delete(h.clients, id)
		}
	}
}

func (h *sseHub) broadcast(id string, msg sseMsg) {
	h.mu.RLock()
	set := h.clients[id]
	h.mu.RUnlock()
	if len(set) == 0 {
		return
	}
	data, _ := json.Marshal(msg)
	for c := range set {
		c.w.Header().Set("Access-Control-Allow-Origin", "*") // CORS simples
		_, _ = c.w.Write([]byte("data: " + string(data) + "\n\n"))
		c.fl.Flush()
	}
}

// ------------------------- LiveLog io.Writer ------------------

// sseWriter converte writes arbitrários em linhas no SSE.
// Ele acumula fragmentos que não terminam com '\n' até completar uma linha.
type sseWriter struct {
	h      *sseHub
	id     string
	stream string
	buf    []byte
}

func (w *sseWriter) Write(p []byte) (int, error) {
	w.buf = append(w.buf, p...)
	sc := bufio.NewScanner(bytes.NewReader(w.buf))
	sc.Split(bufio.ScanLines)

	used := 0
	for sc.Scan() {
		line := sc.Text()
		used += len(line) + 1 // + '\n' (se não houver, ajustamos abaixo)
		w.h.broadcast(w.id, sseMsg{Type: "log", Stream: w.stream, Line: line + "\n"})
	}
	// Se o último fragmento não tinha '\n', o 'used' vai avançar 1 além do tamanho real.
	if used > len(w.buf) {
		used = len(w.buf)
	}
	w.buf = w.buf[used:]
	return len(p), nil
}

func LiveLogWriter(h *sseHub, nodeID, stream string) *sseWriter {
	return &sseWriter{h: h, id: nodeID, stream: stream}
}

// GET /git/clone/stream/{id}  -> abre SSE
func handleGitStream(h *sseHub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		nodeID := strings.TrimPrefix(r.URL.Path, "/git/clone/stream/")
		nodeID = path.Clean("/" + nodeID)[1:] // sanitiza. IMPORTANTE: precisa existir id

		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		fl, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}

		c := &sseClient{w: w, fl: fl}
		h.add(nodeID, c)

		_, _ = w.Write([]byte("data: {\"type\":\"hello\"}\n\n"))
		fl.Flush()

		tick := time.NewTicker(25 * time.Second)
		defer tick.Stop()

		ctx := r.Context()
		for {
			select {
			case <-ctx.Done():
				h.remove(nodeID, c)
				return
			case <-tick.C:
				_, _ = w.Write([]byte("event: ping\ndata: {}\n\n"))
				fl.Flush()
			}
		}
	}
}

type startReq struct {
	NodeID string `json:"nodeId"`
	Repo   string `json:"repo"`
	Branch string `json:"branch"`
	Dest   string `json:"destDir"`
}

// POST /git/clone/start  -> simula "git clone" por ~2min e escreve em tempo real
func handleGitStart(h *sseHub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var in startReq
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			http.Error(w, "bad json", http.StatusBadRequest)
			return
		}
		if in.NodeID == "" {
			http.Error(w, "nodeId required", http.StatusBadRequest)
			return
		}

		// Goroutine que escreve stdout/stderr no SSE por ~2min.
		go func(id string) {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
			defer cancel()

			stdout := LiveLogWriter(h, id, "stdout")
			stderr := LiveLogWriter(h, id, "stderr")

			fmt.Fprintln(stdout, "starting clone...")
			target := "/tmp/fake/" + id
			t := time.NewTicker(900 * time.Millisecond)
			defer t.Stop()

			step := 0
			for {
				select {
				case <-ctx.Done():
					h.broadcast(id, sseMsg{Type: "done", Code: 0, Target: target, Line: "finished\n"})
					return
				case <-t.C:
					step++
					if step%4 == 0 {
						fmt.Fprintln(stderr, "remote: counting objects...")
					} else {
						fmt.Fprintf(stdout, "Cloning into '%s'... step=%d\n", target, step)
					}
				}
			}
		}(in.NodeID)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"started": true,
			"pid":     12345,
			"target":  "/tmp/fake/" + in.NodeID,
		})
	}
}

// initRuleBook
//
// English:
//
//	Organises complex rules, mainly business rules and visual rules.
//	All rules must be straightforward and respect the single responsibility of the function, and the function must be
//	self-contained, that is, enabling something already enabled does not have an adverse effect on the
//	functioning of the code.
//	All functions must be straightforward.
//
// Português:
//
//	Organiza as regras complexas, principalmente regras de negócios e regras visuais.
//	Todas as regras devem ser simples e respeitar a responsabilidade única da função, e a função deve ser
//	auto contida, ou seja, habilitar algo que já está habilitado não gera efeito adverso ao funcionamento do código.
//	Todas as funções devem ser simples
func initRuleBook() {}

// Event represents one stored JSON event.
//
// Português:
// Event representa um evento JSON armazenado.
type Event struct {
	ID         string          `json:"id"`
	At         time.Time       `json:"at"`
	RemoteAddr string          `json:"remoteAddr"`
	Body       json.RawMessage `json:"body"`
}

// memoryStore is a simple in-memory ring buffer.
//
// Português:
// memoryStore é um buffer circular simples em memória.
type memoryStore struct {
	mu     sync.Mutex
	events []Event
	max    int
}

func newMemoryStore(max int) *memoryStore {
	return &memoryStore{events: make([]Event, 0, max), max: max}
}

func (s *memoryStore) add(ev Event) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.events) == s.max {
		copy(s.events, s.events[1:])
		s.events[len(s.events)-1] = ev
		return
	}
	s.events = append(s.events, ev)
}

func (s *memoryStore) list() []Event {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Event, len(s.events))
	copy(out, s.events)
	return out
}

// writeJSON writes obj as JSON with code and CORS headers.
//
// Português:
// writeJSON escreve obj como JSON com código e cabeçalhos CORS.
func writeJSON(w http.ResponseWriter, code int, obj any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(obj)
}

// corsPreflight handles OPTIONS for CORS.
//
// Português:
// corsPreflight lida com OPTIONS para CORS.
func corsPreflight(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		writeJSON(w, http.StatusNoContent, map[string]string{"ok": "true"})
		return
	}
	http.NotFound(w, r)
}

// handleHealthz returns 200 OK.
//
// Português:
// handleHealthz retorna 200 OK.
func handleHealthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleIngest receives arbitrary JSON and stores it.
//
// Português:
// handleIngest recebe JSON arbitrário e armazena.
func handleIngest(store *memoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsPreflight(w, r)
			return
		}
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		defer r.Body.Close()

		// 1MB cap to avoid abuse in demo
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

		var raw json.RawMessage
		if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": fmt.Sprintf("invalid JSON: %v", err)})
			return
		}

		ev := Event{
			ID:         fmt.Sprintf("%d", time.Now().UnixNano()),
			At:         time.Now(),
			RemoteAddr: r.RemoteAddr,
			Body:       raw,
		}
		store.add(ev)
		writeJSON(w, http.StatusAccepted, map[string]any{"status": "accepted", "id": ev.ID})
	}
}

// handleEvents returns all stored events.
//
// Português:
// handleEvents retorna todos os eventos armazenados.
func handleEvents(store *memoryStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			corsPreflight(w, r)
			return
		}
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		writeJSON(w, http.StatusOK, store.list())
	}
}

// fetchNodeRedFlows fetches /flows from Node-RED admin API.
//
// Português:
// fetchNodeRedFlows busca /flows da API admin do Node-RED.
func fetchNodeRedFlows(nodeRedBase string) ([]byte, int, error) {
	url := nodeRedBase + "/flows"
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	client := &http.Client{Timeout: 8 * time.Second}

	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return body, resp.StatusCode, fmt.Errorf("node-red returned %d", resp.StatusCode)
	}
	return body, resp.StatusCode, nil
}

// handleNodeRedFlows proxies Node-RED flows to the browser.
//
// Português:
// handleNodeRedFlows faz proxy do JSON de flows do Node-RED para o browser.
func handleNodeRedFlows(nodeRedBase string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// CORS para permitir leitura de outros hosts se necessário
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET,OPTIONS")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
			return
		}
		body, _, err := fetchNodeRedFlows(nodeRedBase)
		if err != nil {
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write(body)
	}
}

var indexTPL = template.Must(template.New("index").Parse(`<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<title>recode · Go ingest + flow viewer</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  :root { --bg:#0f1115; --fg:#e5e7eb; --card:#1a1d23; --line:#2a2f3a; }
  body{background:var(--bg);color:var(--fg);font-family:system-ui,Segoe UI,Roboto,Ubuntu,"Helvetica Neue",sans-serif;margin:0;padding:24px}
  h1{margin:0 0 12px;font-weight:600}
  .row{display:flex;gap:16px;flex-wrap:wrap}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;flex:1;min-width:320px}
  textarea{width:100%;height:160px;background:#0b0d11;color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:10px}
  pre{white-space:pre-wrap;word-break:break-word;background:#0b0d11;border:1px solid var(--line);border-radius:8px;padding:10px;max-height:420px;overflow:auto}
  canvas{background:#0b0d11;border:1px solid var(--line);border-radius:8px;width:100%;height:420px}
  button{background:#334155;border:0;border-radius:8px;color:var(--fg);padding:10px 14px;cursor:pointer}
  button:hover{filter:brightness(1.1)}
  small{opacity:.75}
  .toolbar{display:flex;gap:8px;align-items:center;margin:.5rem 0 0}
</style>
<body>
  <h1>recode · Go ingest + flow viewer</h1>

  <div class="row">
    <div class="card">
      <h3>Send JSON</h3>
      <textarea id="payload">{ "hello": "from browser", "t": "{{ .Now }}" }</textarea>
      <div class="toolbar">
        <button id="btn">POST /ingest</button>
        <small>Tip: <code>curl -XPOST -H "Content-Type: application/json" --data '{"foo":42}' {{ .BaseURL }}/ingest</code></small>
      </div>
      <h3 style="margin-top:18px">Last events (GET /events)</h3>
      <pre id="events">loading…</pre>
    </div>

    <div class="card">
      <h3>Node-RED Flow</h3>
      <div class="toolbar">
        <button id="refreshFlow">Refresh flow</button>
        <small>Source: <code>/nr/flows</code> ({{ .NodeRedBase }})</small>
      </div>
      <canvas id="flow"></canvas>
      <details style="margin-top:10px">
        <summary>Show raw JSON</summary>
        <pre id="flowjson">loading…</pre>
      </details>
    </div>
  </div>

<script>
// ------- Ingest demo -------
const base = {{ .BaseURLJS }};
async function postIngest() {
  const txt = document.getElementById('payload').value || "{}";
  let obj; try { obj = JSON.parse(txt) } catch(e) { alert("Invalid JSON: " + e.message); return; }
  await fetch(base + "/ingest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });
  await refreshEvents();
}
async function refreshEvents() {
  const res = await fetch(base + "/events");
  const arr = await res.json();
  document.getElementById('events').textContent = JSON.stringify(arr, null, 2);
}
document.getElementById('btn').addEventListener('click', postIngest);
refreshEvents(); setInterval(refreshEvents, 2500);

// ------- Flow viewer (simple canvas) -------
async function loadFlow() {
  const res = await fetch(base + "/nr/flows");
  const flows = await res.json();
  document.getElementById('flowjson').textContent = JSON.stringify(flows, null, 2);

  // Pick first tab
  const tabs = flows.filter(n => n.type === 'tab');
  if (!tabs.length) { drawFlow([], {}); return; }
  const tab = tabs[0];

  // Nodes that belong to this tab and have coordinates
  const nodes = flows.filter(n => n.z === tab.id && n.type !== 'tab' && n.x != null && n.y != null);
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  drawFlow(nodes, byId);
}

function drawFlow(nodes, byId) {
  const canvas = document.getElementById('flow');
  const ctx = canvas.getContext('2d');

  // Determine bounds and scale canvas
  const pad = 60, bw = 100, bh = 36;
  let minX=0, maxX=400, minY=0, maxY=300;
  if (nodes.length) {
    minX = Math.min(...nodes.map(n => n.x));
    maxX = Math.max(...nodes.map(n => n.x));
    minY = Math.min(...nodes.map(n => n.y));
    maxY = Math.max(...nodes.map(n => n.y));
  }
  const W = Math.max(400, (maxX - minX) + bw + pad*2);
  const H = Math.max(300, (maxY - minY) + bh + pad*2);
  canvas.width = W;
  canvas.height = H;

  // Clear
  ctx.clearRect(0,0,W,H);
  ctx.lineWidth = 1;

  // Edges (simple straight lines)
  ctx.strokeStyle = '#64748b';
  nodes.forEach(n => {
    if (Array.isArray(n.wires)) {
      // Node-RED keeps wires as array-of-arrays; flatten
      n.wires.flat().forEach(tid => {
        const t = byId[tid];
        if (!t) return;
        const x1 = n.x - minX + pad + bw/2;
        const y1 = n.y - minY + pad;
        const x2 = t.x - minX + pad - bw/2;
        const y2 = t.y - minY + pad;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }
  });

  // Nodes
  nodes.forEach(n => {
    const x = n.x - minX + pad, y = n.y - minY + pad;
    // box
    ctx.fillStyle = '#2a2f3a';
    ctx.strokeStyle = '#8b9cb3';
    ctx.beginPath();
    ctx.rect(x - bw/2, y - bh/2, bw, bh);
    ctx.fill(); ctx.stroke();
    // label
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = (n.name && String(n.name).trim()) || String(n.type);
    ctx.fillText(label, x, y);
  });
}

document.getElementById('refreshFlow').addEventListener('click', loadFlow);
loadFlow();
</script>
</body>
</html>`))

// handleIndex serves the HTML page.
//
// Português:
// handleIndex serve a página HTML.
func handleIndex(baseURL, nodeRedBase string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		data := map[string]any{
			"BaseURL":     baseURL,
			"BaseURLJS":   template.JS(fmt.Sprintf("%q", baseURL)),
			"NodeRedBase": nodeRedBase,
			"Now":         time.Now().Format(time.RFC3339),
		}
		_ = indexTPL.Execute(w, data)
	}
}

// main wires the HTTP server.
//
// Português:
// main conecta o servidor HTTP.
func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	baseURL := fmt.Sprintf("http://localhost:%s", port)

	// Node-RED base URL (inside Docker network). Default: http://node-red:1880
	nodeRedBase := os.Getenv("NODE_RED_URL")
	if nodeRedBase == "" {
		nodeRedBase = "http://node-red:1880"
	}

	store := newMemoryStore(100)

	mux := http.NewServeMux()
	mux.HandleFunc("/", handleIndex(baseURL, nodeRedBase))
	mux.HandleFunc("/healthz", handleHealthz)
	mux.HandleFunc("/ingest", handleIngest(store))
	mux.HandleFunc("/events", handleEvents(store))
	mux.HandleFunc("/nr/flows", handleNodeRedFlows(nodeRedBase)) // <<< viewer usa isto
	mux.HandleFunc("/options", corsPreflight)

	h := newSSEHub()
	mux.HandleFunc("/git/clone/stream/", handleGitStream(h))
	mux.HandleFunc("/git/clone/start", handleGitStart(h))

	addr := ":" + port
	log.Printf("server listening on %s (Node-RED at %s)", addr, nodeRedBase)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("fatal: %v", err)
	}
}
