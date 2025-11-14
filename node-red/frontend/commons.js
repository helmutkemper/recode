/**
 * English:
 *  Returns true if `value` exists in `list`.
 *
 * Português:
 *  Retorna true se `value` existir em `list`.
 *
 * @param {string[]} list - English: list of strings. | Português: lista de strings.
 * @param {string} value  - English: value to look for. | Português: valor a procurar.
 * @returns {boolean}     - English: presence flag. | Português: indicador de presença.
 * @example
 *  allowed(["a","b"], "a"); // true
 *  allowed(["a","b"], "c"); // false
 */
function allowed(list, value) {
    return Array.isArray(list) && list.includes(value);
}

/**
 * validateField
 *
 * English:
 *  Validates a Node-RED editor input field against a regular expression and shows/hides
 *  a companion help <div>. You pass a short selector like "#cloneBranch" (not the full
 *  "#node-input-..." id). The function will automatically normalize it to "#node-input-cloneBranch".
 *  It expects a help element with id "<normalizedSelector>-help", e.g. "#node-input-cloneBranch-help".
 *
 * Português:
 *  Valida um campo do editor do Node-RED usando uma expressão regular e exibe/oculta
 *  uma <div> de ajuda. Você passa um seletor curto como "#cloneBranch" (não o id completo
 *  "#node-input-..."). A função normaliza automaticamente para "#node-input-cloneBranch".
 *  Ela espera um elemento de ajuda com id "<seletorNormalizado>-help", ex.: "#node-input-cloneBranch-help".
 *
 * @param {string} selector  English: short CSS id (e.g. "#cloneBranch"). | Português: id curto do campo (ex.: "#cloneBranch").
 * @param {RegExp} pattern   English: regex to validate the input value.   | Português: regex para validar o valor do campo.
 * @param {string} helpText  English: message shown when invalid.          | Português: mensagem exibida quando inválido.
 */
function validateField(selector,pattern,helpText) {
    // English: normalize to the actual editor field id (#node-input-<name>)
    // Português: normaliza para o id real do editor (#node-input-<nome>)
    selector = "#node-input-"+selector.slice(1);

    // English: small validator runner we can call on events (keyup/blur) and once initially
    // Português: validador simples para chamar nos eventos (keyup/blur) e uma vez na inicialização
    const f = function(selector,pattern,helpText){
        // English: if the field doesn't exist, do nothing (keeps function safe on missing DOM)
        // Português: se o campo não existir, não faz nada (mantém a função segura sem DOM)
        if(!$(selector).length) {
            return;
        }

        // English: get current value and test it
        // Português: obtém o valor atual e testa
        const value = $(selector).val();
        const nameFilterPass = pattern.test(value);

        if (!nameFilterPass) {
            // English: show the help message when invalid
            // Português: exibe a mensagem de ajuda quando inválido
            $(selector+"-help").html(helpText);
            $(selector+"-help").show();
            return
        }

        // English: hide help when valid
        // Português: oculta a ajuda quando válido
        $(selector+"-help").hide();
    }

    // English: validate on each keystroke
    // Português: valida a cada tecla digitada
    $(selector).keyup(function() {
        f(selector,pattern,helpText);
    });

    // English: validate on losing focus (final check)
    // Português: valida ao perder o foco (checagem final)
    $(selector).blur(function() {
        f(selector,pattern,helpText);
    });

    // English: initial validation to reflect the current value on dialog open
    // Português: validação inicial para refletir o valor atual ao abrir o diálogo
    f(selector,pattern,helpText);
}
