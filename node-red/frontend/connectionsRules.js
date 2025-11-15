/**
 * Link Guard — Multiple Rules
 *
 * English:
 *  Editor-side policy that validates newly created links in Node-RED and removes only
 *  the offending ones. Designed to avoid “global side effects” by acting strictly on
 *  the link being added. Register-once guard (per editor page).
 *
 * Português:
 *  Política no editor que valida links recém-criados no Node-RED e remove apenas
 *  os inválidos. Evita “efeitos globais” atuando estritamente no link adicionado.
 *  Guarda registrado apenas uma vez por página do editor.
 *
 * @typedef {Object} EditorNodeRef
 * @property {string} id  - EN: node id | PT: id do nó
 * @property {string} type - EN: node type | PT: tipo do nó
 * @property {string} z   - EN: workspace/tab id | PT: id da aba/workspace
 *
 * @typedef {Object} EditorLink
 * @property {{id:string}} source - EN: link source (node ref) | PT: nó de origem
 * @property {{id:string}} target - EN: link target (node ref) | PT: nó de destino
 */

(() => {

  // Evita registrar duas vezes ao reabrir o editor
  if (window.__recodeLinkGuardV2) return;
  window.__recodeLinkGuardV2 = true;

  /**
   * LINK_POLICY
   *
   * English:
   *  Centralized policy configuration:
   *   - sameTabOnly: forbid cross-workspace links
   *   - behavior.onMaxIn / onMaxOut: action when limits are exceeded
   *   - pairs: allowed sourceType -> [destType]
   *   - maxInByTargetType: input fan-in limit per target type
   *   - maxOutBySourceType: output fan-out limit per source type
   *
   * Português:
   *  Configuração central da política:
   *   - sameTabOnly: proíbe links entre abas
   *   - behavior.onMaxIn / onMaxOut: ação ao exceder limites
   *   - pairs: tipoOrigem -> [tiposDestino] permitidos
   *   - maxInByTargetType: limite de entradas por tipo alvo
   *   - maxOutBySourceType: limite de saídas por tipo origem
   */
  const LINK_POLICY = {
    /**
     * English: links must be within the same workspace/tab
     *
     * Português: links devem ficar na mesma aba/workspace
     *
     * @type {boolean} */
    sameTabOnly: true,

    /**
     * English: what to do when maxIn/maxOut is exceeded
     *
     *   'keep-last'  -> keep the new link, remove older ones
     *   'reject-new' -> remove the new link, keep older ones
     *
     * Português: o que fazer ao exceder os limites
     *
     * @type {{onMaxIn: "keep-last"|"reject-new", onMaxOut: "keep-last"|"reject-new"}} */
    behavior: {
      onMaxIn:  "reject-new",
      onMaxOut: "reject-new",
    },

    /**
     * English: allowed pairs by SOURCE node type → list of DESTINATION types
     *   If a src type is not present here, it means "no destinations allowed".
     *   You can add a fallback with key "*": ["debug", ...] if desired.
     *
     * Português: pares permitidos pelo tipo de nó de ORIGEM → lista de DESTINOS
     * @type {Record<string,string[]>} */
    pairs: {
      "git-clone-branch": ["git-password"],
      "git-password":     ["chaos-garbage-collector", "debug"],
      "chaos-garbage-collector": ["chaos-create-network"],
      // "*": ["debug"] // fallback opcional
    },

    /**
     * English: per TARGET TYPE inbound links limit (max inputs from wires)
     *
     * Português: limite de entradas por TIPO de nó DESTINO
     *
     * @type {Record<string,number>} */
    maxInByTargetType: {
        "chaos-create-network": 1
    },

    /**
     * English: per SOURCE TYPE outbound links limit (fan-out)
     *
     * Português: limite de saídas por TIPO de nó ORIGEM
     *
     * @type {Record<string,number>} */
    maxOutBySourceType: {
      "chaos-create-network": 1
    }
  };

  // =========================
  // Helpers / Utilitários
  // =========================

  /**
   * notify
   *
   * English:
   *  Wrapper for RED.notify with safe-guard.
   *
   * Português:
   *  Envoltório para RED.notify com proteção.
   *
   * @param {string} msg - EN: message | PT: mensagem
   * @param {"info"|"warning"|"error"|"success"} [level="info"] - EN: level | PT: nível
   */
  function notify(msg, level = "info") {
    try { RED.notify(msg, level); } catch {}
    }

  /**
   * removeLinkWithHistory
   *
   * English:
   *  Removes a single link, pushing history (undo) and forcing redraw.
   *
   * Português:
   *  Remove um único link, registrando histórico (desfazer) e redesenhando.
   *
   * @param {EditorLink} link - EN: link to remove | PT: link a remover
   * @param {string} [reason] - EN: optional notify reason | PT: razão opcional
   */
    function removeLinkWithHistory(link, reason) {
        try {
            RED.history.push({ t: "delete", links: [link], dirty: true });
            RED.nodes.removeLink(link);
            RED.view.redraw(true);
      if (reason) notify(reason, "error");
        } catch (e) {
            console.error("removeLinkWithHistory failed:", e);
        }
    }

  /**
   * eachLink
   *
   * English:
   *  Iterates over all links via RED.nodes.eachLink.
   *
   * Português:
   *  Itera sobre todos os links via RED.nodes.eachLink.
   *
   * @param {(l: any)=>void} cb - EN: callback per link | PT: callback por link
   */
  function eachLink(cb) {
    RED.nodes.eachLink(function(l){ cb(l); });
  }

  /**
   * getOutboundLinks
   *
   * English:
   *  Returns links whose source is the provided node id.
   *
   * Português:
   *  Retorna links cuja origem possui o id informado.
   *
   * @param {string} sourceId - EN: source node id | PT: id do nó de origem
   * @returns {EditorLink[]}  - EN/PT: outbound links
   */
  function getOutboundLinks(sourceId) {
    const arr = [];
    eachLink((l) => { if (l.source && l.source.id === sourceId) arr.push(l); });
    return arr;
  }

  /**
   * getInboundLinks
   *
   * English:
   *  Returns links whose target is the provided node id.
   *
   * Português:
   *  Retorna links cujo destino possui o id informado.
   *
   * @param {string} targetId - EN: target node id | PT: id do nó de destino
   * @returns {EditorLink[]}  - EN/PT: inbound links
   */
  function getInboundLinks(targetId) {
    const arr = [];
    eachLink((l) => { if (l.target && l.target.id === targetId) arr.push(l); });
    return arr;
  }

  /**
   * isAllowedPair
   *
   * English:
   *  Checks if (srcType -> dstType) is allowed by LINK_POLICY.pairs (with optional "*").
   *
   * Português:
   *  Verifica se (tipoOrigem -> tipoDestino) é permitido por LINK_POLICY.pairs (com "*" opcional).
   *
   * @param {string} srcType - EN: source node type | PT: tipo do nó origem
   * @param {string} dstType - EN: destination node type | PT: tipo do nó destino
   * @returns {boolean}      - EN/PT: true if allowed
   */
  function isAllowedPair(srcType, dstType) {
    const allowed = LINK_POLICY.pairs[srcType];
    if (!allowed) {
      // fallback opcional
      const fallback = LINK_POLICY.pairs["*"];
      return Array.isArray(fallback) && fallback.includes(dstType);
    }
    return Array.isArray(allowed) && allowed.includes(dstType);
  }

  /**
   * enforceMaxOut
   *
   * English:
   *  Enforces outbound (fan-out) limit for a source node type. Applies either:
   *   - "reject-new": remove the newly created link, or
   *   - "keep-last" : keep the new link and remove older ones beyond the limit.
   *
   * Português:
   *  Aplica limite de saídas por tipo do nó de origem. Aplica:
   *   - "reject-new": remove o link recém-criado, ou
   *   - "keep-last" : mantém o novo e remove antigos excedentes.
   *
   * @param {EditorNodeRef} src     - EN: source node | PT: nó de origem
   * @param {EditorLink}    newLink - EN: just created link | PT: link recém-criado
   */
  function enforceMaxOut(src, newLink) {
    const lim = LINK_POLICY.maxOutBySourceType[src.type];
    if (typeof lim !== "number") return;

    const all = getOutboundLinks(src.id);
    if (all.length <= lim) return;

    if (LINK_POLICY.behavior.onMaxOut === "reject-new") {
      // rejeita o novo
      removeLinkWithHistory(newLink, `Máximo de ${lim} saída(s) para '${src.type}'. Novo link rejeitado.`);
      return;
    }

    // keep-last: remove antigos e mantém o novo
    const toRemove = all.filter((l) => l !== newLink).slice(0, all.length - lim);
    if (toRemove.length) {
      RED.history.push({ t: "multi", events: [] });
      toRemove.forEach((l) => {
        RED.history.peek().events.push({ t: "delete", links: [l] });
        RED.nodes.removeLink(l);
        });
      RED.view.redraw(true);
      notify(`Mantido o último link. Máximo de ${lim} saída(s) em '${src.type}'.`, "warning");
    }
  }

  /**
   * enforceMaxIn
   *
   * English:
   *  Enforces inbound (fan-in) limit for a target node type. Applies either:
   *   - "reject-new": remove the newly created link, or
   *   - "keep-last" : keep the new link and remove older ones beyond the limit.
   *
   * Português:
   *  Aplica limite de entradas por tipo do nó de destino. Aplica:
   *   - "reject-new": remove o link recém-criado, ou
   *   - "keep-last" : mantém o novo e remove antigos excedentes.
   *
   * @param {EditorNodeRef} dst     - EN: target node | PT: nó de destino
   * @param {EditorLink}    newLink - EN: just created link | PT: link recém-criado
   */
  function enforceMaxIn(dst, newLink) {
    const lim = LINK_POLICY.maxInByTargetType[dst.type];
    if (typeof lim !== "number") return;

    const all = getInboundLinks(dst.id);
    if (all.length <= lim) return;

    if (LINK_POLICY.behavior.onMaxIn === "reject-new") {
      // rejeita o novo
      removeLinkWithHistory(newLink, `Máximo de ${lim} entrada(s) em '${dst.type}'. Novo link rejeitado.`);
      return;
    }

    // keep-last: remove antigos e mantém o novo
    const toRemove = all.filter((l) => l !== newLink).slice(0, all.length - lim);
    if (toRemove.length) {
      RED.history.push({ t: "multi", events: [] });
      toRemove.forEach((l) => {
        RED.history.peek().events.push({ t: "delete", links: [l] });
        RED.nodes.removeLink(l);
      });
      RED.view.redraw(true);
      notify(`Somente ${lim} entrada(s) permitida(s) em '${dst.type}'. Mantido o último link.`, "warning");
    }
    }

  // =========================
  // Main handler / Handler principal
  // =========================
    RED.events.on("links:add", function (link) {
        try {
            const src = RED.nodes.node(link.source?.id);
            const dst = RED.nodes.node(link.target?.id);
            if (!src || !dst) return;

      // 1) Same workspace? / Mesma aba?
      if (LINK_POLICY.sameTabOnly && src.z !== dst.z) {
                return removeLinkWithHistory(link, `Conexão entre abas não permitida: '${src.type}' → '${dst.type}'`);
            }

      // 2) Allowed pair? / Par permitido?
            if (!isAllowedPair(src.type, dst.type)) {
                return removeLinkWithHistory(link, `Conexão inválida: '${src.type}' → '${dst.type}'`);
            }

      // 3) Limits / Limites
      enforceMaxOut(src, link);
      enforceMaxIn(dst, link);

      // If we reach here, link is valid. No global changes.
      // Se chegou aqui, o link é válido. Sem alterações globais.
        } catch (err) {
            console.error("links:add guard error:", err);
        }
    });
})();
