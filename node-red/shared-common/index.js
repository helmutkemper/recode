const { ping } = require("./ping");
const { allowed } = require("./allowed");
const { postJsonNoFetch } = require("./http/postJson");

module.exports = {
    ping,
    allowed,
    postJsonNoFetch,
};
