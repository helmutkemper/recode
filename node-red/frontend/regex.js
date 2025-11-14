/**
 * getRegexBranchName
 *
 * English:
 *  Returns a regular expression that validates Git branch names (refname rules used by tools like `git check-ref-format`).
 *  It rejects unsafe or reserved forms and allows path-like names made of valid components separated by '/'.
 *
 *  Disallows (high level):
 *   • "@" alone and the sequence "@{"
 *   • Leading '-' or '.'
 *   • Any component that starts with '.' (e.g., "/.hidden")
 *   • Trailing '.' at the end of the name
 *   • Double dots ("..") and double slashes ("//")
 *   • Any component ending with ".lock"
 *   • Spaces, control chars (\x00–\x1F, \x7F) and characters: ~ ^ : ? * [ \
 *
 * Português:
 *  Retorna uma expressão regular que valida nomes de branch do Git (regras de refname usadas por `git check-ref-format`).
 *  Rejeita formas inseguras ou reservadas e permite nomes com múltiplos componentes separados por '/'.
 *
 *  Proíbe (visão geral):
 *   • "@" sozinho e a sequência "@{"
 *   • Início com '-' ou '.'
 *   • Qualquer componente que comece com '.' (ex.: "/.oculto")
 *   • Ponto final no fim do nome
 *   • Sequências de dois pontos ("..") e barras duplas ("//")
 *   • Componentes terminados em ".lock"
 *   • Espaços, caracteres de controle (\x00–\x1F, \x7F) e caracteres: ~ ^ : ? * [ \
 *
 * @returns {RegExp} A compiled RegExp that matches valid branch names.
 *
 * @example
 *  getRegexBranchName().test("feature/login"); // true
 *  getRegexBranchName().test("bad..name");     // false
 *  getRegexBranchName().test("@{bad}");        // false
 *  getRegexBranchName().test("release/v1.0");  // true
 */
function getRegexBranchName() {
    // Breakdown of the main parts (lookaheads):
    // ^(?!@$)                 -> not exactly "@"
    // (?!-)                   -> must not start with '-'
    // (?!\.)                  -> must not start with '.'
    // (?!.*\/\.)              -> no path component starting with "."
    // (?!.*\.\.)              -> no double dots anywhere
    // (?!.*\/\/)              -> no double slashes
    // (?!.*@{)                -> forbid "@{"
    // (?!.*(?:^|\/)[^/]*\.lock(?:\/|$)) -> no component ending with ".lock"
    // (?!.*\.$)               -> must not end with '.'
    // [^ \x00-\x1F\x7F~^:?*\[\\]+
    //   -> characters allowed inside a component (no spaces, control chars, or ~ ^ : ? * [ \ )
    // (?:\/[^ ... ]+)*        -> zero or more "/<component>" repetitions
    // $
    return /^(?!@$)(?!-)(?!\.)(?!.*\/\.)(?!.*\.\.)(?!.*\/\/)(?!.*@{)(?!.*(?:^|\/)[^/]*\.lock(?:\/|$))(?!.*\.$)[^ \x00-\x1F\x7F~^:?*\[\\]+(?:\/[^ \x00-\x1F\x7F~^:?*\[\\]+)*$/;
}

/**
 * getRegexIsNonEmpty
 *
 * English:
 *  Returns a regular expression that matches if a string contains at least one
 *  non-whitespace character. Equivalent to `/\S/`. Use `getRegexIsNonEmpty().test(s)`
 *  to check that `s` is not blank (ignoring spaces, tabs, newlines).
 *  Note: the regex is not anchored; it succeeds if *any* non-space appears anywhere.
 *
 * Português:
 *  Retorna uma expressão regular que confere se a string contém ao menos um
 *  caractere não espaço em branco. Equivalente a `/\S/`. Use `getRegexIsNonEmpty().test(s)`
 *  para verificar que `s` não está em branco (ignora espaços, tabs, quebras de linha).
 *  Observação: a regex não é ancorada; passa se *qualquer* caractere não espaço existir.
 *
 * @returns {RegExp} Regex that detects non-blank strings.
 *
 * @example
 *  const rx = getRegexIsNonEmpty();
 *  rx.test("   ");    // false
 *  rx.test("  a ");   // true
 *  rx.test("\n\t");   // false
 *  rx.test("🚀");     // true
 */
function getRegexIsNonEmpty() {
    return /\S/;
}

/**
 * getRegexDns1123Label
 *
 * English:
 *  Returns a regular expression that validates a single DNS-1123 label:
 *  - allowed: lowercase letters `a–z`, digits `0–9`, and hyphen `-`
 *  - must start/end with an alphanumeric character
 *  - length: 1–63 characters
 *
 * Português:
 *  Retorna uma expressão regular que valida um único rótulo DNS-1123:
 *  - permitido: letras minúsculas `a–z`, dígitos `0–9` e hífen `-`
 *  - deve começar/terminar com caractere alfanumérico
 *  - tamanho: 1–63 caracteres
 *
 * @returns {RegExp} Regex for a DNS-1123 label.
 * @example
 *  const rx = getRegexDns1123Label();
 *  rx.test("app");        // true
 *  rx.test("my-app-01");  // true
 *  rx.test("-bad");       // false (starts with '-')
 *  rx.test("Bad");        // false (uppercase not allowed)
 */
function getRegexDns1123Label() {
    return /^[a-z0-9](?:[-a-z0-9]{0,61}[a-z0-9])?$/;
}

/**
 * getRegexDns1123SubdomainLabel
 *
 * English:
 *  Returns a regular expression that validates a DNS-1123 subdomain
 *  (one or more labels separated by dots), where each label follows
 *  the DNS-1123 label rules above. Note: the overall length limit
 *  (≤ 253 chars) is NOT enforced by this regex—check it separately.
 *
 * Português:
 *  Retorna uma expressão regular que valida um subdomínio DNS-1123
 *  (um ou mais rótulos separados por pontos), em que cada rótulo
 *  segue as regras de DNS-1123 descritas acima. Observação: o limite
 *  de comprimento total (≤ 253 chars) NÃO é garantido por esta regex—
 *  verifique à parte.
 *
 * @returns {RegExp} Regex for a DNS-1123 subdomain (dot-separated labels).
 * @example
 *  const rx = getRegexDns1123SubdomainLabel();
 *  rx.test("api.local");          // true
 *  rx.test("svc.cluster.local");  // true
 *  rx.test("My.Domain");          // false (uppercase)
 *  // Optional extra check:
 *  // const valid = name.length <= 253 && rx.test(name);
 */
function getRegexDns1123SubdomainLabel() {
    return /^(?:[a-z0-9](?:[-a-z0-9]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[-a-z0-9]{0,61}[a-z0-9])?))*$/;
}

/**
 * getRegexCidrIpv4
 *
 * English:
 *  Returns a strict regular expression that validates an IPv4 CIDR in the form
 *  "a.b.c.d/prefix", where each octet is 0–255 and the prefix length is 0–32.
 *  Note: this does NOT verify network alignment (e.g., whether 10.0.0.1/16 is
 *  a network address). It only checks syntax and numeric ranges.
 *
 * Português:
 *  Retorna uma expressão regular estrita que valida um CIDR IPv4 no formato
 *  "a.b.c.d/prefixo", em que cada octeto está entre 0–255 e o prefixo entre 0–32.
 *  Observação: não verifica alinhamento de rede (ex.: se 10.0.0.1/16 é endereço
 *  de rede). Valida apenas sintaxe e faixas numéricas.
 *
 * @returns {RegExp} Regex for IPv4 CIDR like "10.0.0.0/16".
 *
 * @example
 *  const rx = getRegexCidrIpv4();
 *  rx.test("10.0.0.0/16");      // true
 *  rx.test("192.168.1.1/24");   // true
 *  rx.test("256.0.0.1/24");     // false (octet > 255)
 *  rx.test("10.0.0.0/33");      // false (prefix > 32)
 */
function getRegexCidrIpv4() {
    // English (breakdown):
    //  - Octet: (25[0-5]|2[0-4]\d|1?\d?\d)   -> 250–255 | 200–249 | 0–199
    //  - IPv4:  octet ( "." octet ){3}
    //  - Prefix: (3[0-2]|[12]?\d)           -> 30–32 | 0–29 (no leading '+' or spaces)
    //
    // Português (detalhamento):
    //  - Octeto: (25[0-5]|2[0-4]\d|1?\d?\d) -> 250–255 | 200–249 | 0–199
    //  - IPv4:   octeto ( "." octeto ){3}
    //  - Prefixo: (3[0-2]|[12]?\d)          -> 30–32 | 0–29 (sem sinais/ espaços)
    return /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\/(?:3[0-2]|[12]?\d)$/;
}

/**
 * getRegexIpv4Gateway
 *
 * English:
 *  Returns a regular expression for a *typical* IPv4 gateway address:
 *   - Format: a.b.c.d (dotted-quad)
 *   - Octets a,b,c: numeric 0–255 (a cannot be 0)
 *   - Octet d (host id): 1–254 (excludes network .0 and broadcast .255)
 *   - Excludes loopback (127.x.x.x) and link-local (169.254.x.x)
 *   - Also excludes multicast/experimental by limiting first octet to 1–223
 *
 *  Note: This only validates syntax and common constraints for “gateway-like”
 *  host addresses. It does not guarantee that the address is the correct
 *  gateway for a given subnet.
 *
 * Português:
 *  Retorna uma expressão regular para um endereço IPv4 de *gateway* típico:
 *   - Formato: a.b.c.d (quadrupla pontuada)
 *   - Octetos a,b,c: numéricos 0–255 (a não pode ser 0)
 *   - Octeto d (host): 1–254 (exclui rede .0 e broadcast .255)
 *   - Exclui loopback (127.x.x.x) e link-local (169.254.x.x)
 *   - Também exclui multicast/experimental limitando o primeiro octeto a 1–223
 *
 *  Observação: valida apenas sintaxe e restrições comuns de “endereço de gateway”.
 *  Não garante que o endereço seja o gateway correto para uma sub-rede específica.
 *
 * @returns {RegExp} Regex matching common IPv4 gateway addresses.
 *
 * @example
 *  const rx = getRegexIpv4Gateway();
 *  rx.test("10.0.0.1");        // true
 *  rx.test("192.168.1.254");   // true
 *  rx.test("192.168.1.0");     // false (network)
 *  rx.test("192.168.1.255");   // false (broadcast)
 *  rx.test("127.0.0.1");       // false (loopback)
 *  rx.test("169.254.1.1");     // false (link-local)
 */
function getRegexIpv4Gateway() {
    // First octet: 1–223, but not 127 (loopback) and not 169.254.x.x (link-local)
    // Middle octets: 0–255
    // Last octet: 1–254 (no .0 or .255)
    return /^(?!(?:127|169\.254)\.)(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])\.(?:25[0-5]|2[0-4]\d|1?\d?\d)\.(?:25[0-5]|2[0-4]\d|1?\d?\d)\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])$/;
}

/**
 * getRegexLinuxRelativePathSafe
 *
 * English:
 *  Returns a regex for a **safe relative Linux path** intended for creating folders.
 *  Rules enforced:
 *   - Must be **relative** (cannot start with `/`).
 *   - No empty segments or `//`.
 *   - No `.` or `..` segments (prevents traversal).
 *   - Each segment (folder name) allows only `[A–Z a–z 0–9 . _ -]`, length 1–255.
 *   - No NUL (`\x00`). No trailing `/`.
 *
 *  Notes:
 *   - Hidden names like `.git` are **allowed** (only `.` and `..` are forbidden).
 *   - This checks syntax only; actual creation depends on permissions/existence.
 *
 * Português:
 *  Retorna uma regex para um **path relativo seguro no Linux** para criar pastas.
 *  Regras aplicadas:
 *   - Deve ser **relativo** (não pode começar com `/`).
 *   - Sem segmentos vazios ou `//`.
 *   - Sem segmentos `.` ou `..` (evita travessia de diretórios).
 *   - Cada segmento (nome da pasta) permite apenas `[A–Z a–z 0–9 . _ -]`, tamanho 1–255.
 *   - Sem NUL (`\x00`). Sem `/` no final.
 *
 *  Observações:
 *   - Nomes “ocultos” como `.git` são **permitidos** (apenas `.` e `..` são proibidos).
 *   - Valida só a sintaxe; a criação real depende de permissões/existência.
 *
 * @returns {RegExp} Regex that matches a safe relative Linux directory path.
 *
 * @example
 *  const rx = getRegexLinuxRelativePathSafe();
 *  rx.test("assets/images/icons");     // true
 *  rx.test(".config/nvim");            // true
 *  rx.test("..");                      // false (traversal)
 *  rx.test("a//b");                    // false (empty segment)
 *  rx.test("/var/tmp");                // false (absolute)
 *  rx.test("folder/");                 // false (trailing slash)
 */
function getRegexLinuxRelativePathSafe() {
    // Breakdown:
    // ^                      start
    // (?!\/)                 not starting with '/'
    // (?!.*\/\/)             no double slashes anywhere
    // (?!.*\x00)             no NUL byte
    // (?:                    zero or more "<segment>/"
    //   (?!\.{1,2}(?:\/|$))  segment is not "." or ".."
    //   [A-Za-z0-9._-]{1,255}
    //   /
    // )*
    // (?!\.{1,2}$)           last segment is not "." or ".."
    // [A-Za-z0-9._-]{1,255}  last segment
    // $                      end
    return /^(?!\/)(?!.*\/\/)(?!.*\x00)(?:(?!\.{1,2}(?:\/|$))[A-Za-z0-9._-]{1,255}\/)*(?!\.{1,2}$)[A-Za-z0-9._-]{1,255}$/;
}
