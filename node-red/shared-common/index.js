const http = require("http");
const https = require("https");
const { URL } = require("url");

function allowed(list, value) { return Array.isArray(list) && list.includes(value); }

function postJsonNoFetch(u, data, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const url = new URL(u);
        const lib = url.protocol === "https:" ? https : http;
        const payload = JSON.stringify(data);

        const req = lib.request({
            hostname: url.hostname,
            port: url.port || (url.protocol === "https:" ? 443 : 80),
            path: url.pathname + url.search,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload)
            }
        }, (res) => {
            let chunks = "";
            res.setEncoding("utf8");
            res.on("data", d => (chunks += d));
            res.on("end", () => {
                const ct = res.headers["content-type"] || "";
                let body = chunks;
                if (ct.includes("application/json")) {
                    try { body = JSON.parse(chunks); } catch {}
                }
                resolve({ status: res.statusCode, headers: res.headers, body });
            });
        });

        req.on("error", reject);
        req.setTimeout(timeoutMs, () => req.destroy(new Error("Timeout")));
        req.write(payload);
        req.end();
    });
}

module.exports = { allowed, postJsonNoFetch };
