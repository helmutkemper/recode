/**
 * English:
 *  - GET /git/:id/inject: triggers node.receive with a default payload (no body).
 *  - POST /git/:id/inject: optional JSON body {payload: ...}; responds immediately.
 *  - On input, POSTs msg.payload to the Go endpoint as JSON.
 *
 * Português:
 *  - GET /git/:id/inject: aciona node.receive com payload padrão (sem corpo).
 *  - POST /git/:id/inject: body JSON opcional {payload: ...}; responde na hora.
 *  - Ao receber input, faz POST de msg.payload ao endpoint Go em JSON.
 */
function initRuleBook() {}

module.exports = function (RED) {
    const http = require('http');
    const https = require('https');

    // --- Admin routes ----------------------------------------------------

    // GET: clique do botão (sem corpo)
    RED.httpAdmin.get('/git/:id/inject', function (req, res) {
        let node = RED.nodes.getNode(req.params.id);
        if (!node) { return res.sendStatus(404); }
        const payload = { from: 'git', click: true, at: new Date().toISOString() };
        RED.log.info(`[git] admin GET inject -> ${req.params.id}`);
        node.receive({ payload });
        res.json({ ok: true });
    });

    // POST: opcional, caso queira enviar payload custom por curl
    RED.httpAdmin.post('/git/:id/inject', function (req, res) {
        const node = RED.nodes.getNode(req.params.id);
        if (!node) { return res.sendStatus(404); }

        // Coleta corpo (até 1MB) mas NÃO segura a resposta se nada vier
        let raw = '', tooBig = false, done = false;
        const endOK = (obj) => {
            if (done) return; done = true;
            const pl = (obj && Object.prototype.hasOwnProperty.call(obj,'payload'))
                ? obj.payload
                : { from: 'git', click: true, at: new Date().toISOString() };
            RED.log.info(`[git] admin POST inject -> ${req.params.id}`);
            node.receive({ payload: pl });
            res.json({ ok: true });
        };

        req.on('data', ch => {
            raw += ch;
            if (raw.length > (1<<20)) { tooBig = true; req.destroy(); }
        });
        req.on('end', () => {
            if (tooBig) return endOK({});
            if (!raw)   return endOK({});
            try { endOK(JSON.parse(raw)); }
            catch { endOK({}); }
        });
        req.on('error', () => endOK({}));
    });

    // --- Node runtime ----------------------------------------------------

    function GitNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const endpoint = (config.endpoint || process.env.GO_INGEST_URL || 'http://server:8080/ingest').trim();

        function postJSON(endpoint, body, cb) {
            let u; try { u = new URL(endpoint); } catch { return cb(new Error('invalid endpoint URL')); }
            const isTLS = u.protocol === 'https:';
            const mod = isTLS ? https : http;
            const opts = {
                hostname: u.hostname,
                port: u.port || (isTLS ? 443 : 80),
                path: (u.pathname || '/') + (u.search || ''),
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
                timeout: 8000
            };
            const req = mod.request(opts, (res) => {
                let chunks = '';
                res.on('data', d => chunks += d.toString());
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) return cb(new Error(`HTTP ${res.statusCode}: ${chunks}`));
                    cb(null, { statusCode: res.statusCode, body: chunks });
                });
            });
            req.on('timeout', () => req.destroy(new Error('timeout')));
            req.on('error', cb);
            req.write(body); req.end();
        }

        node.status({ fill: 'grey', shape: 'dot', text: 'idle' });
        node.status({ fill: "yellow", shape: "ring", text: config.name });

        node.on('input', function (msg, send, done) {
            const out = {
                from: 'git',
                at: new Date().toISOString(),
                payload: (msg && Object.prototype.hasOwnProperty.call(msg,'payload')) ? msg.payload : null
            };
            const body = JSON.stringify(out);

            node.status({ fill: 'blue', shape: 'dot', text: 'posting…' });
            RED.log.info(`[git] POST -> ${endpoint}`);

            postJSON(endpoint, body, (err, resp) => {
                if (err) {
                    RED.log.warn(`[git] POST error: ${err.message}`);
                    node.status({ fill: 'red', shape: 'ring', text: err.message });
                    if (done) return done(err); return node.error(err, msg);
                }
                RED.log.info(`[git] POST ok: ${resp.statusCode}`);
                node.status({ fill: 'green', shape: 'dot', text: `sent ${resp.statusCode}` });
                msg.git = { endpoint, response: resp };
                send(msg);
                if (done) done();
            });
        });

        /*
        // exemplo de status --- início
        node.status({ fill: "yellow", shape: "ring", text: "aguardando…" });

        node.on("input", (msg, send, done) => {
            // English: update status when things are OK
            // Português: atualize o status quando estiver OK
            node.status({ fill: "green", shape: "dot", text: "conectado" });
            send(msg);
            done();
        });

        node.on("close", () => {
            // English: clear status on shutdown
            // Português: limpe o status ao encerrar
            node.status({});
        });
        // exemplo de status --- fim
        */
    }

    RED.nodes.registerType('git', GitNode);
};
