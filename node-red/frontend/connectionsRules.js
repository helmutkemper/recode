(() => {
    // --- Evita registrar o mesmo handler mais de uma vez ---
    if (window.__recodeLinkGuardV1) return;
    window.__recodeLinkGuardV1 = true;

    // Par (src.type -> dst.type) permitido
    function isAllowedPair(srcType, dstType) {
        // return (srcType === "chaos-create-network" && dstType === "chaos-garbage-collector");
        return (srcType === "chaos-garbage-collector" && dstType === "chaos-create-network");
    }

    // Remove um link com histórico e redesenho
    function removeLinkWithHistory(link, reason) {
        try {
            RED.history.push({ t: "delete", links: [link], dirty: true });
            RED.nodes.removeLink(link);
            RED.view.redraw(true);
            if (reason) RED.notify(reason, "error");
        } catch (e) {
            console.error("removeLinkWithHistory failed:", e);
        }
    }

    // Conta links de entrada (inbound) para um nó alvo
    function countInboundLinks(targetId) {
        let count = 0;
        RED.nodes.eachLink(function (l) {
            if (l.target && l.target.id === targetId) count++;
        });
        return count;
    }

    // Handler principal: roda só para o link recém-adicionado
    RED.events.on("links:add", function (link) {
        try {
            const src = RED.nodes.node(link.source?.id);
            const dst = RED.nodes.node(link.target?.id);
            if (!src || !dst) return;

            // 1) Mesma aba (workspace) obrigatoriamente
            if (src.z !== dst.z) {
                return removeLinkWithHistory(link, `Conexão entre abas não permitida: '${src.type}' → '${dst.type}'`);
            }

            // 2) Par de tipos autorizado?
            if (!isAllowedPair(src.type, dst.type)) {
                return removeLinkWithHistory(link, `Conexão inválida: '${src.type}' → '${dst.type}'`);
            }

            // 3) Regra de negócio: no destino, apenas 1 conexão de entrada
            const inbound = countInboundLinks(dst.id);
            if (inbound > 1) {
                // Mantém o link recém-criado e remove os anteriores, OU remova o novo — escolha sua política.
                // Aqui: removemos os anteriores (mantemos o último arrasto do usuário).
                const toRemove = [];
                RED.nodes.eachLink(function (l) {
                    if (l.target && l.target.id === dst.id && l !== link) toRemove.push(l);
                });
                if (toRemove.length) {
                    RED.history.push({ t: "multi", events: [] });
                    toRemove.forEach((l) => {
                        RED.history.peek().events.push({ t: "delete", links: [l] });
                        RED.nodes.removeLink(l);
                    });
                    RED.view.redraw(true);
                    RED.notify(`Somente 1 entrada permitida em '${dst.type}'. Mantido o último link.`, "warning");
                }
            }

            // Se chegou até aqui, o link é válido e único no alvo → não toca nos demais nós.
        } catch (err) {
            console.error("links:add guard error:", err);
        }
    });
})();
