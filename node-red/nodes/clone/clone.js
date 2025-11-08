/**
 * shoelace-git-clone runtime
 *
 * English:
 *  - Admin endpoints:
 *      GET  /shoelace/*              -> serve Shoelace assets (same-origin)
 *      GET  /git/clone/stream/:id    -> SSE for live logs
 *      POST /git/clone/start         -> start `git clone` + stream progress
 *      POST /git/clone/cancel        -> cancel running clone for nodeId
 *  - Keeps SSE clients per node and a ring buffer for bootstrap.
 *  - Emits a node message when the clone finishes.
 *
 * Português:
 *  - Endpoints admin:
 *      GET  /shoelace/*              -> entrega assets Shoelace (mesma origem)
 *      GET  /git/clone/stream/:id    -> SSE para logs ao vivo
 *      POST /git/clone/start         -> inicia `git clone` e transmite progresso
 *      POST /git/clone/cancel        -> cancela clone em execução do nodeId
 *  - Mantém clientes SSE por nó e ring buffer para histórico inicial.
 *  - Emite mensagem do nó quando o clone finaliza.
 */

// initRuleBook
//
// English:
//
//  Organises simple, single-responsibility helpers with no adverse effects
//  from repeated enablement. All functions are straightforward and
//  self-contained.
//
// Português:
//
//  Organiza ajudantes de responsabilidade única, simples e auto-contidos,
//  sem efeitos adversos ao habilitar algo já habilitado.
function initRuleBook() {}

module.exports = function (RED) {
    const { spawn } = require("child_process");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");

    // ---- Shoelace static (no external 'express' required)
    let shoelaceDir = null;
    try {
        // Try resolve from userDir (/data) or CWD
        shoelaceDir = path.dirname(
            require.resolve("@shoelace-style/shoelace/dist/shoelace.js", { paths: [process.cwd(), "/data"] })
        );
    } catch (e) {
        // Not installed -> UI won't find assets until user installs it.
        shoelaceDir = null;
    }

    RED.httpAdmin.get("/shoelace/*", (req, res) => {
        if (!shoelaceDir) return res.status(404).send("Shoelace not installed");
        const rel = req.params[0] || "";
        res.sendFile(path.join(shoelaceDir, rel));
    });

    // ---- SSE registry, ring buffer and running processes
    const streams = new Map(); // nodeId -> Set(res)
    const buffers = new Map(); // nodeId -> string[]
    const procs   = new Map(); // nodeId -> ChildProcess

    function addClient(nodeId, res) {
        if (!streams.has(nodeId)) streams.set(nodeId, new Set());
        streams.get(nodeId).add(res);
    }
    function removeClient(nodeId, res) {
        const set = streams.get(nodeId);
        if (!set) return;
        set.delete(res);
        if (!set.size) streams.delete(nodeId);
    }
    function pushLog(nodeId, line) {
        const buf = buffers.get(nodeId) || [];
        buf.push(line);
        if (buf.length > 2000) buf.shift();
        buffers.set(nodeId, buf);
    }
    function broadcast(nodeId, payload) {
        const set = streams.get(nodeId);
        if (!set) return;
        const data = `data: ${JSON.stringify(payload)}\n\n`;
        for (const res of set) res.write(data);
    }

    // ---- SSE endpoint
    RED.httpAdmin.get("/git/clone/stream/:id", (req, res) => {
        const nodeId = req.params.id;
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        // Bootstrap with history
        const hist = buffers.get(nodeId) || [];
        res.write(`data: ${JSON.stringify({ type: "bootstrap", hist })}\n\n`);

        addClient(nodeId, res);
        const hb = setInterval(() => { res.write("event: ping\ndata: {}\n\n"); }, 25000);

        req.on("close", () => {
            clearInterval(hb);
            removeClient(nodeId, res);
            res.end();
        });
    });

    // ---- Parse JSON body (no express.json)
    function parseJsonBody(req, cb) {
        let body = "";
        req.on("data", (c) => {
            body += c;
            if (body.length > 1e6) { try { req.destroy(); } catch {} } // basic guard
        });
        req.on("end", () => {
            let data = {};
            try { data = JSON.parse(body || "{}"); } catch {}
            cb(data);
        });
    }

    // ---- Start clone
    RED.httpAdmin.post("/git/clone/start", (req, res) => {
        parseJsonBody(req, (data) => {
            const { nodeId, repo, branch, destDir } = data || {};
            if (!nodeId || !repo) return res.status(400).json({ error: "nodeId and repo are required" });

            // Basic URL guard + dest normalization
            if (!/^((git@|https?:\/\/)[\w.-]+[:/])/.test(String(repo))) {
                return res.status(400).json({ error: "invalid repo url" });
            }
            const base   = destDir ? path.basename(destDir) : `repo-${Date.now()}`;
            const root   = path.join(os.tmpdir(), "node-red-git", nodeId);
            const target = path.join(root, base);
            fs.mkdirSync(root, { recursive: true });

            const args = ["clone", "--progress"];
            if (branch) args.push("--branch", branch);
            args.push(repo, target);

            const child = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"] });
            procs.set(nodeId, child);

            function sendLine(line, stream) {
                pushLog(nodeId, `[${stream}] ${line}`);
                broadcast(nodeId, { type: "log", stream, line });
            }

            child.stdout.on("data", (chunk) => sendLine(chunk.toString("utf8"), "stdout"));
            child.stderr.on("data", (chunk) => sendLine(chunk.toString("utf8"), "stderr")); // git progress often on stderr

            child.on("close", (code) => {
                procs.delete(nodeId);
                broadcast(nodeId, { type: "done", code, target });

                const n = RED.nodes.getNode(nodeId);
                if (n) {
                    n.send({ payload: { event: "done", code, target, repo, branch } });
                    n.status({ fill: code === 0 ? "green" : "red", shape: "dot", text: `exit ${code}` });
                }
            });

            res.status(202).json({ started: true, pid: child.pid, target });

            const n = RED.nodes.getNode(nodeId);
            n && n.status({ fill: "blue", shape: "dot", text: "cloning..." });
        });
    });

    // ---- Cancel clone
    RED.httpAdmin.post("/git/clone/cancel", (req, res) => {
        parseJsonBody(req, (data) => {
            const { nodeId } = data || {};
            const p = nodeId && procs.get(nodeId);
            if (!p) return res.status(404).json({ ok: false, error: "no process" });
            try { p.kill("SIGTERM"); } catch {}
            res.json({ ok: true });
        });
    });

    // ---- Node constructor
    function ShoelaceGitCloneNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Persisted properties (include Description)
        node.name   = config.name;
        node.info   = config.info;   // Description (per-instance)
        node.repo   = config.repo;
        node.branch = config.branch;
        node.dest   = config.dest;

        node.status({ fill: "grey", shape: "dot", text: "idle" });

        // Allow triggering via msg
        node.on("input", (msg, send, done) => {
            const repo   = msg.repo   || node.repo;
            const branch = msg.branch || node.branch;
            const dest   = msg.dest   || node.dest;

            if (!repo) { done(new Error("repo is required")); return; }

            const payload = JSON.stringify({ nodeId: node.id, repo, branch, destDir: dest });
            const http = require("http");
            const opts = {
                method: "POST",
                host: "localhost",
                port: RED.settings.uiPort,
                path: "/git/clone/start",
                headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
            };

            const req = http.request(opts, (resp) => {
                let data = "";
                resp.on("data", (d) => (data += d));
                resp.on("end", () => {
                    try {
                        const info = JSON.parse(data || "{}");
                        send({ payload: { event: "started", info } });
                        done();
                    } catch (e) { done(e); }
                });
            });

            req.on("error", (err) => { node.status({ fill: "red", shape: "ring", text: "error" }); done(err); });
            req.write(payload);
            req.end();
        });

        node.on("close", () => {
            // SSE clients are removed on HTTP 'close'; nothing extra needed here.
        });
    }

    RED.nodes.registerType("shoelace-git-clone", ShoelaceGitCloneNode);
};
