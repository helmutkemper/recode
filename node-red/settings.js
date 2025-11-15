module.exports = {
    httpStatic: "/data/frontend",
    userDir: "/data",
    uiPort: process.env.PORT || 1880,
    flowFile: process.env.FLOWS || "flows.json",
    credentialSecret: false,

    // Carrega seus nós locais (ex.: git)
    nodesDir: "/data/nodes",

    // 👇 Desabilita TODOS os core nodes apontando para uma pasta vazia
    coreNodesDir: "/data/core-disabled",

    // (opcional – cinta e suspensório)
    nodesExcludes: [
        "@node-red/nodes/**",        // Node-RED 3.x+
        "node-red/nodes/core/**"     // Node-RED 2.x
    ],

    editorTheme: {
        theme: "midnight",
        palette: { editable: false, categories: ["git"] },
        projects: { enabled: false },
        tours: false,
        page: {
            /** Extra CSS files (loaded in <head> of the editor) */
            css: [
                "/data/frontend/commons.css"
            ],
            /** Extra JS files (loaded in <head> of the editor) */
            scripts: [
                "/data/frontend/commons.js",
                "/data/frontend/regex.js",
                "/data/frontend/connectionsRules.js"
            ]
        }
    },

    logging: { console: { level: "info", metrics: false, audit: false } },
    functionGlobalContext: {}
};
