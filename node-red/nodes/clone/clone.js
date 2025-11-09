// initRuleBook
//
// English:
//  Keep responsibilities simple and self-contained.
//
// Português:
//  Mantém responsabilidades simples e auto-contidas.
function initRuleBook() {}

module.exports = function(RED){
    const path = require("path");
    let dir = null;
    try {
        dir = path.dirname(
            require.resolve("@shoelace-style/shoelace/dist/shoelace.js", { paths: [process.cwd(), "/data"] })
        );
    } catch (e) { dir = null; }

    RED.httpAdmin.get("/shoelace/*", (req, res) => {
        if (!dir) return res.status(404).send("Shoelace not installed");
        const rel = req.params[0] || "";
        res.sendFile(path.join(dir, rel));
    });

    function ShoelaceGitCloneNode(config){
        RED.nodes.createNode(this, config);
        this.status({ fill:"grey", shape:"dot", text:"idle" });
        this.on("input", (msg, send, done) => { send(msg); done(); });
    }
    RED.nodes.registerType("shoelace-git-clone", ShoelaceGitCloneNode);
};
