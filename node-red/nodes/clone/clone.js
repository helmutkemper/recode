/**
 * Shoelace Git Clone node (runtime)
 *
 * English:
 *  - Exposes admin endpoints:
 *      GET  /shoelace/*               -> serves Shoelace assets (same-origin, avoids CSP issues)
 *      GET  /git/clone/stream/:id     -> SSE stream for live logs
 *      POST /git/clone/start          -> starts `git clone` and streams stdout/stderr to SSE clients
 *  - Keeps a per-node set of SSE clients and broadcasts progress lines.
 *  - Sends a final message on node output when clone finishes.
 *
 * Português:
 *  - Expõe endpoints admin:
 *      GET  /shoelace/*               -> entrega assets do Shoelace (mesma origem, evita CSP)
 *      GET  /git/clone/stream/:id     -> fluxo SSE para logs em tempo real
 *      POST /git/clone/start          -> inicia `git clone` e transmite stdout/stderr aos clientes SSE
 *  - Mantém um conjunto de clientes SSE por nó e transmite as linhas de progresso.
 *  - Envia uma mensagem na saída do nó quando o clone termina.
 */
module.exports = function (RED) {
    const { spawn } = require("child_process");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
    const express = require("express");

    // --- Shoelace static (serve same-origin to satisfy Node-RED editor CSP)
    const shoelaceDir = path.dirname(
        require.resolve("@shoelace-style/shoelace/dist/shoelace.js")
    );
    RED.httpAdmin.use("/shoelace", express.static(shoelaceDir));

    // --- In-memory SSE registry: nodeId -> Set(res)
    const streams = new Map();

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
    function broadcast(nodeId, payload) {
        const set = streams.get(nodeId);
        if (!set) return;
        for (const res of set) {
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
    }

    // --- SSE endpoint
    RED.httpAdmin.get("/git/clone/stream/:id", (req, res) => {
        const nodeId = req.params.id;
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        // Initial hello
        res.write(`data: ${JSON.stringify({ type: "hello", nodeId })}\n\n`);
        addClient(nodeId, res);

        // Heartbeat para manter conexão viva
        const hb = setInterval(() => {
            res.write("event: ping\ndata: {}\n\n");
        }, 25000);

        req.on("close", () => {
            clearInterval(hb);
            removeClient(nodeId, res);
            res.end();
        });
    });

    // --- Start clone endpoint
    RED.httpAdmin.post("/git/clone/start", express.json(), (req, res) => {
        const { nodeId, repo, branch, destDir } = req.body || {};
        if (!nodeId || !repo) {
            return res.status(400).json({ error: "nodeId and repo are required" });
        }

        // Resolve destino (seguro/simples): /tmp/node-red-git/<nodeId>/<basename(dest)>
        const base = destDir ? path.basename(destDir) : `repo-${Date.now()}`;
        const root = path.join(os.tmpdir(), "node-red-git", nodeId);
        const target = path.join(root, base);
        fs.mkdirSync(root, { recursive: true });

        // Comando git
        const args = ["clone", "--progress"];
        if (branch) {
            args.push("--branch", branch);
        }
        args.push(repo, target);

        // Spawn
        const child = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"] });

        // Helpers para enviar linhas
        function sendLine(line, stream) {
            broadcast(nodeId, { type: "log", stream, line });
        }
        child.stdout.on("data", (chunk) => {
            sendLine(chunk.toString("utf8"), "stdout");
        });
        child.stderr.on("data", (chunk) => {
            // git clone costuma mandar progresso no stderr
            sendLine(chunk.toString("utf8"), "stderr");
        });

        child.on("close", (code) => {
            broadcast(nodeId, {
                type: "done",
                code,
                target
            });
            // Opcional: podemos também notificar o(s) nó(s) no fluxo via events
            // (mantemos simples e resolvemos via node.send() dentro do node instance)
        });

        res.status(202).json({ started: true, pid: child.pid, target });
    });

    // --- Node constructor
    function ShoelaceGitCloneNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Apenas para refletir status no editor
        node.status({ fill: "grey", shape: "dot", text: "idle" });

        // Quando receber msg, opcionalmente inicia clone pelo fluxo
        node.on("input", (msg, send, done) => {
            const repo = msg.repo || config.repo;
            const branch = msg.branch || config.branch;
            const destDir = msg.dest || config.dest;

            // Dispara o endpoint interno para manter caminho único de execução
            const payload = JSON.stringify({
                nodeId: node.id,
                repo,
                branch,
                destDir
            });

            const http = require("http");
            const opts = {
                method: "POST",
                host: "localhost",
                port: RED.settings.uiPort,
                path: "/git/clone/start",
                headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
            };

            node.status({ fill: "blue", shape: "dot", text: "cloning..." });

            const req = http.request(opts, (resp) => {
                let data = "";
                resp.on("data", (d) => (data += d));
                resp.on("end", () => {
                    try {
                        const info = JSON.parse(data);
                        send({ payload: { event: "started", info } });
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });

            req.on("error", (err) => {
                node.status({ fill: "red", shape: "ring", text: "error" });
                done(err);
            });

            req.write(payload);
            req.end();
        });

        node.on("close", () => {
            // Nada especial aqui; SSE clients são limpos no 'close' da requisição
        });
    }

    RED.nodes.registerType("shoelace-git-clone", ShoelaceGitCloneNode);
};
