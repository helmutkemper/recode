module.exports = function(RED) {
    function gitPasswordNode(config) {
        RED.nodes.createNode(this,config);
        let node = this;

        node.status({ fill: "grey", shape: "ring", text: "busy" });



        async function initialize() {
            try {
                node.status({ fill: "yellow", shape: "dot", text: "initializing…" });

                // English: do your async work here (e.g., checking repo, warming cache…)
                // Português: faça seu trabalho assíncrono aqui (ex.: checar repo, aquecer cache…)
                await new Promise(r => setTimeout(r, 300)); // simulação

                const common = require("@recode/common");
                common.postJsonNoFetch("http://server:8080/options", { payload: config.cloneBranch })
                    .then((res) => {
                        node.status({ fill: "green", shape: "dot", text: "send: "+res.body.ok });
                    })
                    .catch(err => {
                        node.status({ fill: "red", shape: "ring", text: err.message });
                        node.error(err);
                    });

                // English: when ready, pass data to the next node
                // Português: quando pronto, envie dados ao próximo nó
                node.send({ payload: config.cloneBranch });

                // node.status({ fill: "green", shape: "dot", text: "ready" });
            } catch (err) {
                node.status({ fill: "red", shape: "ring", text: err.message });
                node.error(err);
            }
        }

        // English: run something right after deploy (node start)
        // Português: execute algo logo após o deploy (início do nó)
        initialize();

        node.on('input', function(msg, send, done) {
            // try {
            //     // …faça algo…
            //     send(msg);
            //     done();
            // } catch (e) { done(e); }
            //
            // return
            // msg.payload = msg.payload.toLowerCase();
            // node.send(msg);
            //
            // console.log("msg", msg);
            // console.log("send", send);
            // console.log("done", done);
            // node.error("houve um erro", msg);

            // Once finished, call 'done'.
            // This call is wrapped in a check that 'done' exists
            // so the node will work in earlier versions of Node-RED (<1.0)
            if (done) {
                done();
            }
        });
        this.on('output', function(msg, send, done) {
            // For maximum backwards compatibility, check that send exists.
            // If this node is installed in Node-RED 0.x, it will need to
            // fallback to using `node.send`

            console.log("msg", msg);
            console.log("send", send);
            console.log("done", done);
            // node.error("houve um erro", msg);

            // send = send || function() { node.send.apply(node,arguments) }



            // msg.payload = "hi";
            // send(msg);

            if (done) {
                done();
            }
        });
        this.on("close", (removed, done) => { done(); });
    }
    RED.nodes.registerType("git-clone-branch",gitPasswordNode);
}
