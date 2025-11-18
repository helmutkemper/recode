# Dicas

## Tabela de ícones principais

| Propósito (PT/EN)          | FA 4.7 (nome)          | `typedInput.icon`            | `registerType.icon`                    |
|----------------------------|------------------------|------------------------------|----------------------------------------|
| Dados / Data               | `database`             | `fa fa-database`             | `font-awesome/fa-database`             |
| Arquivo / File             | `file`                 | `fa fa-file`                 | `font-awesome/fa-file`                 |
| Arquivo texto / File text  | `file-text-o`          | `fa fa-file-text-o`          | `font-awesome/fa-file-text-o`          |
| Pasta / Folder             | `folder`               | `fa fa-folder`               | `font-awesome/fa-folder`               |
| Pasta aberta / Folder open | `folder-open`          | `fa fa-folder-open`          | `font-awesome/fa-folder-open`          |
| Link / Link                | `link`                 | `fa fa-link`                 | `font-awesome/fa-link`                 |
| Nuvem / Cloud              | `cloud`                | `fa fa-cloud`                | `font-awesome/fa-cloud`                |
| Download                   | `download`             | `fa fa-download`             | `font-awesome/fa-download`             |
| Upload                     | `upload`               | `fa fa-upload`               | `font-awesome/fa-upload`               |
| Cadeado / Lock             | `lock`                 | `fa fa-lock`                 | `font-awesome/fa-lock`                 |
| Chave / Key                | `key`                  | `fa fa-key`                  | `font-awesome/fa-key`                  |
| Usuário / User             | `user`                 | `fa fa-user`                 | `font-awesome/fa-user`                 |
| Grupo / Users              | `users`                | `fa fa-users`                | `font-awesome/fa-users`                |
| Engrenagem / Settings      | `cog`                  | `fa fa-cog`                  | `font-awesome/fa-cog`                  |
| Engrenagens / Settings     | `cogs`                 | `fa fa-cogs`                 | `font-awesome/fa-cogs`                 |
| Terminal / Terminal        | `terminal`             | `fa fa-terminal`             | `font-awesome/fa-terminal`             |
| Código / Code              | `code`                 | `fa fa-code`                 | `font-awesome/fa-code`                 |
| Bug / Bug                  | `bug`                  | `fa fa-bug`                  | `font-awesome/fa-bug`                  |
| Play                       | `play`                 | `fa fa-play`                 | `font-awesome/fa-play`                 |
| Stop                       | `stop`                 | `fa fa-stop`                 | `font-awesome/fa-stop`                 |
| Pause                      | `pause`                | `fa fa-pause`                | `font-awesome/fa-pause`                |
| Refresh / Sync             | `refresh`              | `fa fa-refresh`              | `font-awesome/fa-refresh`              |
| Power / On-off             | `power-off`            | `fa fa-power-off`            | `font-awesome/fa-power-off`            |
| Info                       | `info-circle`          | `fa fa-info-circle`          | `font-awesome/fa-info-circle`          |
| Ajuda / Help               | `question-circle`      | `fa fa-question-circle`      | `font-awesome/fa-question-circle`      |
| Aviso / Warning            | `exclamation-triangle` | `fa fa-exclamation-triangle` | `font-awesome/fa-exclamation-triangle` |
| Erro / Error               | `exclamation-circle`   | `fa fa-exclamation-circle`   | `font-awesome/fa-exclamation-circle`   |
| Sucesso / Success          | `check-circle`         | `fa fa-check-circle`         | `font-awesome/fa-check-circle`         |
| Lista / List               | `list`                 | `fa fa-list`                 | `font-awesome/fa-list`                 |
| Filtro / Filter            | `filter`               | `fa fa-filter`               | `font-awesome/fa-filter`               |
| Barra / Menu               | `bars`                 | `fa fa-bars`                 | `font-awesome/fa-bars`                 |
| Grade / Grid               | `th`                   | `fa fa-th`                   | `font-awesome/fa-th`                   |
| Troca / Switch             | `exchange`             | `fa fa-exchange`             | `font-awesome/fa-exchange`             |
| Aleatório / Random         | `random`               | `fa fa-random`               | `font-awesome/fa-random`               |
| Árvore / Sitemap           | `sitemap`              | `fa fa-sitemap`              | `font-awesome/fa-sitemap`              |
| Plug / Plug                | `plug`                 | `fa fa-plug`                 | `font-awesome/fa-plug`                 |
| Wi-Fi / Wireless           | `wifi`                 | `fa fa-wifi`                 | `font-awesome/fa-wifi`                 |
| Relógio / Time             | `clock-o`              | `fa fa-clock-o`              | `font-awesome/fa-clock-o`              |
| Calendário / Calendar      | `calendar`             | `fa fa-calendar`             | `font-awesome/fa-calendar`             |
| Lixo / Trash               | `trash`                | `fa fa-trash`                | `font-awesome/fa-trash`                |
| Lápis / Editar             | `pencil`               | `fa fa-pencil`               | `font-awesome/fa-pencil`               |
| Git                        | `git`                  | `fa fa-git`                  | `font-awesome/fa-git`                  |
| GitHub                     | `github`               | `fa fa-github`               | `font-awesome/fa-github`               |

No ícone do nó (registerType):

```javascript
RED.nodes.registerType("meu-no", {
  icon: "font-awesome/fa-database"
});
```

No TypedInput (tipo customizado):

```javascript
$("#node-input-target").typedInput({
  types: [{
    value: "url",
    label: "URL",
    icon: "fa fa-link",
    hasValue: true,
    validate: v => /^https?:\/\//.test(v)
  }]
});
```

## Formulário

O texto abaixo mostra algumas dicas de como fazer um formulário no node-red.

O código abaixo é usado no `.html` do componente node-red

```html
<!-- No template do nó -->
<div class="form-row">
  <label for="node-input-target">Target</label>
  <input type="text" id="node-input-target">
  <input type="hidden" id="node-input-targetType">
</div>
```

```javascript
// Dentro de oneditprepare/oneditsave do seu .html do nó:

/**
 * oneditprepare
 *
 * English:
 *  Configure typedInput with built-ins and a custom type ("url").
 *  Keep a separate hidden field (#node-input-targetType) to persist the selected type.
 *
 * Português:
 *  Configura o typedInput com tipos nativos e um tipo customizado ("url").
 *  Mantém um campo hidden (#node-input-targetType) para persistir o tipo escolhido.
 */
oneditprepare: function () {
  const $ti = $("#node-input-target").typedInput({
    // Escolha os tipos que quer oferecer (adicione/remova à vontade)
    types: [
      // Contexto
      "msg", "flow", "global",
      // Nativos comuns
      "str", "num", "bool", "json", "date", "re", "env", "jsonata",
      // Exemplo de tipo customizado
      {
        value: "url",
        label: "URL",
        icon: "fa fa-link",
        hasValue: true,
        // Validação simples: exige http/https
        validate: (v) => /^https?:\/\//.test(v)
      }
    ],
    // (Opcional) vincule o field do tipo para o Node-RED persistir junto
    typeField: $("#node-input-targetType")
  });

  // Semeia com os valores atuais da instância
  $ti.typedInput("type",  this.targetType || "msg");
  $ti.typedInput("value", this.target     || "");
},

/**
 * oneditsave
 *
 * English:
 *  Read both the current value and the selected type to persist on the node.
 *
 * Português:
 *  Lê o valor atual e o tipo selecionado para persistir na instância do nó.
 */
oneditsave: function () {
  const $ti = $("#node-input-target");
  this.target     = $ti.typedInput("value");
  this.targetType = $ti.typedInput("type");
}
```

### Tabela de tipos

| Tipo             | O que é                           | Como escrever no editor             | Exemplo                 | Como o Node-RED resolve           | Observações                                                  |
|------------------|-----------------------------------|-------------------------------------|-------------------------|-----------------------------------|--------------------------------------------------------------|
| `msg`            | Caminho em `msg` (mensagem)       | `msg.<propriedade>`                 | `msg.payload`           | Lê `msg.payload` no runtime       | Usa notação de caminho; se não existir, retorna `undefined`. |
| `flow`           | Caminho no **contexto de fluxo**  | `flow.<chave>`                      | `flow.token`            | `flow.get("token")`               | Persiste conforme o store configurado de contexto.           |
| `global`         | Caminho no **contexto global**    | `global.<chave>`                    | `global.baseUrl`        | `global.get("baseUrl")`           | Igual ao `flow`, mas no escopo global.                       |
| `str`            | **String literal**                | Texto livre                         | `hello`                 | Valor literal `"hello"`           | Não faz interpolação automática.                             |
| `num`            | **Número literal**                | Dígitos                             | `42`                    | Número `42`                       | Rejeita texto não numérico.                                  |
| `bool`           | **Booleano**                      | `true` ou `false` (UI mostra opção) | `true`                  | Boolean `true/false`              | Útil para flags.                                             |
| `json`           | **JSON literal**                  | Objeto/array válido                 | `{"a":1}`               | Objeto/array JS                   | Precisa ser JSON válido.                                     |
| `date`           | **Timestamp atual**               | (sem valor)                         | —                       | `Date.now()` no runtime           | Avaliado quando o nó executa.                                |
| `re`             | **Expressão Regular (JS)**        | `/padrão/flags`                     | `/^ab+c$/i`             | Objeto `RegExp`                   | Use sintaxe JS; sem âncoras automáticas.                     |
| `env`            | **Variável de ambiente**          | Nome da env                         | `MY_TOKEN`              | `process.env.MY_TOKEN`            | Depende do ambiente do runtime.                              |
| `jsonata`        | **Expressão JSONata**             | Expressão                           | `$uppercase(msg.topic)` | Avaliada contra `msg/flow/global` | Pode ser custosa; suporta funções JSONata.                   |
| `url` *(custom)* | **Tipo personalizado** (ex.: URL) | Texto validado por você             | `https://api.ex.com`    | Valor literal, após sua validação | Definido via objeto em `types` com `validate`, `icon`, etc.  |

