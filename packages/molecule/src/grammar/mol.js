/* eslint-disable */
// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
  function id(x) {
    return x[0];
  }

  const moo = require("moo");

  const lexer = moo.compile({
    ws: /[ \t]+/,
    nl: { match: "\n", lineBreaks: true },
    lparan: "(",
    rparan: ")",
    comma: ",",
    lbracket: "[",
    rbracket: "]",
    lbrace: "{",
    rbrace: "}",
    labracket: "<",
    rabracket: ">",
    assignment: "=",
    colon: ":",
    semicolon: ";",
    line_comment: {
      match: /\/\/[^\n]*/,
      value: (s) => s.substring(1),
    },
    block_comment: {
      match: /\/\*[\w\d\s\n\t\r]*\*\//,
      value: (s) => s.substring(1),
    },
    string_literal: {
      match: /"(?:[^\n\\"]|\\["\\ntbfr])*"/,
      value: (s) => JSON.parse(s),
    },
    number_literal: {
      match: /[0-9]+/,
      value: (s) => Number(s),
    },
    identifier: {
      match: /[a-z_A-Z][a-z_A-Z_0-9]*/,
      type: moo.keywords({
        array: "array",
        vector: "vector",
        struct: "struct",
        tablle: "table",
      }),
    },
  });

  function tokenStart(token) {
    return {
      line: token.line,
      col: token.col - 1,
    };
  }

  function tokenEnd(token) {
    const lastNewLine = token.text.lastIndexOf("\n");
    if (lastNewLine !== -1) {
      throw new Error("Unsupported case: token with line breaks");
    }
    return {
      line: token.line,
      col: token.col + token.text.length - 1,
    };
  }

  function convertToken(token) {
    return {
      type: token.type,
      value: token.value,
      start: tokenStart(token),
      end: tokenEnd(token),
    };
  }

  function convertTokenId(data) {
    return convertToken(data[0]);
  }

  var grammar = {
    Lexer: lexer,
    ParserRules: [
      { name: "input", symbols: ["top_level_statements"], postprocess: id },
      {
        name: "top_level_statements",
        symbols: ["_", "top_level_statement"],
        postprocess: (d) => [d[1]],
      },
      {
        name: "top_level_statements",
        symbols: [
          "_",
          "top_level_statement",
          "_",
          { literal: "\n" },
          "_",
          "top_level_statements",
        ],
        postprocess: (d) => [d[1], ...d[5]],
      },
      {
        name: "top_level_statements",
        symbols: ["_", { literal: "\n" }, "top_level_statements"],
        postprocess: (d) => d[2],
      },
      { name: "top_level_statements", symbols: ["_"], postprocess: (d) => [] },
      {
        name: "top_level_statement",
        symbols: ["array_definition"],
        postprocess: id,
      },
      {
        name: "top_level_statement",
        symbols: ["vector_definition"],
        postprocess: id,
      },
      {
        name: "top_level_statement",
        symbols: ["option_definition"],
        postprocess: id,
      },
      {
        name: "top_level_statement",
        symbols: ["union_definition"],
        postprocess: id,
      },
      {
        name: "top_level_statement",
        symbols: ["struct_definition"],
        postprocess: id,
      },
      {
        name: "top_level_statement",
        symbols: ["table_definition"],
        postprocess: id,
      },
      {
        name: "top_level_statement",
        symbols: ["line_comment"],
        postprocess: () => null,
      },
      {
        name: "top_level_statement",
        symbols: ["block_comment"],
        postprocess: () => null,
      },
      {
        name: "array_definition",
        symbols: [
          { literal: "array" },
          "__",
          "identifier",
          "_",
          "lbracket",
          "_",
          "identifier",
          "_",
          "semicolon",
          "_",
          "number",
          "_",
          "rbracket",
          "_",
          "semicolon",
          "_",
          "comment_opt",
        ],
        postprocess: function (data) {
          return {
            type: "array",
            name: data[2].value,
            item: data[6].value,
            item_count: data[10].value,
          };
        },
      },
      {
        name: "vector_definition",
        symbols: [
          { literal: "vector" },
          "__",
          "identifier",
          "_",
          "labracket",
          "_",
          "identifier",
          "_",
          "rabracket",
          "_",
          "semicolon",
          "_",
          "comment_opt",
        ],
        postprocess: function (data) {
          return {
            type: "vector",
            name: data[2].value,
            item: data[6].value,
          };
        },
      },
      {
        name: "option_definition",
        symbols: [
          { literal: "option" },
          "__",
          "identifier",
          "_",
          "lparan",
          "_",
          "identifier",
          "_",
          "rparan",
          "_",
          "semicolon",
          "_",
          "comment_opt",
        ],
        postprocess: function (data) {
          return {
            type: "option",
            name: data[2].value,
            item: data[6].value,
          };
        },
      },
      {
        name: "union_item_decl",
        symbols: ["identifier", "_", { literal: ":" }, "_", "number"],
        postprocess: function (data) {
          return [data[0].value, Number(data[4].value)];
        },
      },
      {
        name: "union_item_decl",
        symbols: ["identifier"],
        postprocess: function (data) {
          return data[0].value;
        },
      },
      {
        name: "union_definition$ebnf$1$subexpression$1",
        symbols: [
          "multi_line_ws_char",
          "_",
          "union_item_decl",
          "_",
          "comma",
          "_",
          "comment_opt",
          "_",
          "multi_line_ws_char",
        ],
      },
      {
        name: "union_definition$ebnf$1",
        symbols: ["union_definition$ebnf$1$subexpression$1"],
      },
      {
        name: "union_definition$ebnf$1$subexpression$2",
        symbols: [
          "multi_line_ws_char",
          "_",
          "union_item_decl",
          "_",
          "comma",
          "_",
          "comment_opt",
          "_",
          "multi_line_ws_char",
        ],
      },
      {
        name: "union_definition$ebnf$1",
        symbols: [
          "union_definition$ebnf$1",
          "union_definition$ebnf$1$subexpression$2",
        ],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      {
        name: "union_definition",
        symbols: [
          { literal: "union" },
          "__",
          "identifier",
          "_",
          "lbrace",
          "_",
          "union_definition$ebnf$1",
          "_",
          "rbrace",
        ],
        postprocess: function (data) {
          return {
            type: "union",
            name: data[2].value,
            items: data[6].map((d) => d[2]),
          };
        },
      },
      {
        name: "struct_definition",
        symbols: [
          { literal: "struct" },
          "__",
          "identifier",
          "_",
          "block_definition",
        ],
        postprocess: function (data) {
          return {
            type: "struct",
            name: data[2].value,
            fields: data[4][2].map((d) => ({
              name: d[2].value,
              type: d[6].value,
            })),
          };
        },
      },
      {
        name: "table_definition",
        symbols: [
          { literal: "table" },
          "__",
          "identifier",
          "_",
          "block_definition",
        ],
        postprocess: function (data) {
          return {
            type: "table",
            name: data[2].value,
            fields: data[4][2].map((d) => ({
              name: d[2].value,
              type: d[6].value,
            })),
          };
        },
      },
      {
        name: "block_definition$ebnf$1$subexpression$1",
        symbols: [
          "multi_line_ws_char",
          "_",
          "identifier",
          "_",
          "colon",
          "_",
          "identifier",
          "_",
          "comma",
          "_",
          "comment_opt",
          "_",
          "multi_line_ws_char",
        ],
      },
      {
        name: "block_definition$ebnf$1",
        symbols: ["block_definition$ebnf$1$subexpression$1"],
      },
      {
        name: "block_definition$ebnf$1$subexpression$2",
        symbols: [
          "multi_line_ws_char",
          "_",
          "identifier",
          "_",
          "colon",
          "_",
          "identifier",
          "_",
          "comma",
          "_",
          "comment_opt",
          "_",
          "multi_line_ws_char",
        ],
      },
      {
        name: "block_definition$ebnf$1",
        symbols: [
          "block_definition$ebnf$1",
          "block_definition$ebnf$1$subexpression$2",
        ],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      {
        name: "block_definition",
        symbols: ["lbrace", "_", "block_definition$ebnf$1", "_", "rbrace"],
      },
      { name: "comment_opt", symbols: ["line_comment"] },
      { name: "comment_opt", symbols: ["block_comment"] },
      { name: "comment_opt", symbols: [], postprocess: () => [] },
      {
        name: "line_comment",
        symbols: [
          lexer.has("line_comment") ? { type: "line_comment" } : line_comment,
        ],
        postprocess: id,
      },
      {
        name: "block_comment",
        symbols: [
          lexer.has("block_comment")
            ? { type: "block_comment" }
            : block_comment,
        ],
        postprocess: id,
      },
      {
        name: "string_literal",
        symbols: [
          lexer.has("string_literal")
            ? { type: "string_literal" }
            : string_literal,
        ],
        postprocess: convertTokenId,
      },
      {
        name: "number",
        symbols: [
          lexer.has("number_literal")
            ? { type: "number_literal" }
            : number_literal,
        ],
        postprocess: convertTokenId,
      },
      {
        name: "lbracket",
        symbols: [lexer.has("lbracket") ? { type: "lbracket" } : lbracket],
        postprocess: convertTokenId,
      },
      {
        name: "rbracket",
        symbols: [lexer.has("rbracket") ? { type: "rbracket" } : rbracket],
        postprocess: convertTokenId,
      },
      {
        name: "labracket",
        symbols: [lexer.has("labracket") ? { type: "labracket" } : labracket],
        postprocess: convertTokenId,
      },
      {
        name: "rabracket",
        symbols: [lexer.has("rabracket") ? { type: "rabracket" } : rabracket],
        postprocess: convertTokenId,
      },
      {
        name: "lparan",
        symbols: [lexer.has("lparan") ? { type: "lparan" } : lparan],
        postprocess: convertTokenId,
      },
      {
        name: "rparan",
        symbols: [lexer.has("rparan") ? { type: "rparan" } : rparan],
        postprocess: convertTokenId,
      },
      {
        name: "lbrace",
        symbols: [lexer.has("lbrace") ? { type: "lbrace" } : lbrace],
        postprocess: convertTokenId,
      },
      {
        name: "rbrace",
        symbols: [lexer.has("rbrace") ? { type: "rbrace" } : rbrace],
        postprocess: convertTokenId,
      },
      {
        name: "comma",
        symbols: [lexer.has("comma") ? { type: "comma" } : comma],
        postprocess: convertTokenId,
      },
      {
        name: "colon",
        symbols: [lexer.has("colon") ? { type: "colon" } : colon],
        postprocess: convertTokenId,
      },
      {
        name: "semicolon",
        symbols: [lexer.has("semicolon") ? { type: "semicolon" } : semicolon],
        postprocess: convertTokenId,
      },
      {
        name: "identifier",
        symbols: [
          lexer.has("identifier") ? { type: "identifier" } : identifier,
        ],
        postprocess: convertTokenId,
      },
      { name: "_ml$ebnf$1", symbols: [] },
      {
        name: "_ml$ebnf$1",
        symbols: ["_ml$ebnf$1", "multi_line_ws_char"],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      { name: "_ml", symbols: ["_ml$ebnf$1"] },
      {
        name: "multi_line_ws_char",
        symbols: [lexer.has("ws") ? { type: "ws" } : ws],
      },
      { name: "multi_line_ws_char", symbols: [{ literal: "\n" }] },
      { name: "__$ebnf$1", symbols: [lexer.has("ws") ? { type: "ws" } : ws] },
      {
        name: "__$ebnf$1",
        symbols: ["__$ebnf$1", lexer.has("ws") ? { type: "ws" } : ws],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      { name: "__", symbols: ["__$ebnf$1"] },
      { name: "_$ebnf$1", symbols: [] },
      {
        name: "_$ebnf$1",
        symbols: ["_$ebnf$1", lexer.has("ws") ? { type: "ws" } : ws],
        postprocess: function arrpush(d) {
          return d[0].concat([d[1]]);
        },
      },
      { name: "_", symbols: ["_$ebnf$1"] },
    ],
    ParserStart: "input",
  };
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = grammar;
  } else {
    window.grammar = grammar;
  }
})();
