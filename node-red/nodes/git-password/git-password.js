module.exports = function(RED) {
    function gitPasswordNode(config) {
        RED.nodes.createNode(this,config);
        let node = this;
        node.on('input', function(msg, send, done) {
            msg.payload = msg.payload.toLowerCase();
            node.send(msg);

            console.log("msg", msg);
            console.log("send", send);
            console.log("done", done);
            node.error("houve um erro", msg);

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
            node.error("houve um erro", msg);

            send = send || function() { node.send.apply(node,arguments) }



            msg.payload = "hi";
            send(msg);

            if (done) {
                done();
            }
        });
    }
    RED.nodes.registerType("git-password",gitPasswordNode);
}
