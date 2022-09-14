
# http://www.asciitable.com/
@{%
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
        value: s => s.substring(1)
    },
    block_comment: {
        match: /\/\*[\w\d\s\n\t\r]*\*\//,
        value: s => (s.substring(1))
    },
    string_literal: {
        match: /"(?:[^\n\\"]|\\["\\ntbfr])*"/,
        value: s => JSON.parse(s)
    },
    number_literal: {
        match: /[0-9]+/,
        value: s => Number(s)
    },
    identifier: {
        match: /[a-z_A-Z][a-z_A-Z_0-9]*/,
        type: moo.keywords({
            array: "array",
            vector: "vector",
            struct: "struct",
            tablle: "table",
        })
    }
});


function tokenStart(token) {
    return {
        line: token.line,
        col: token.col - 1
    };
}

function tokenEnd(token) {
    const lastNewLine = token.text.lastIndexOf("\n");
    if (lastNewLine !== -1) {
        throw new Error("Unsupported case: token with line breaks");
    }
    return {
        line: token.line,
        col: token.col + token.text.length - 1
    };
}

function convertToken(token) {
    return {
        type: token.type,
        value: token.value,
        start: tokenStart(token),
        end: tokenEnd(token)
    };
}

function convertTokenId(data) {
    return convertToken(data[0]);
}

%}

@lexer lexer

input -> top_level_statements {% id %}

top_level_statements
    -> _ top_level_statement
        {%
            d => [d[1]]
        %}
    |  _ top_level_statement _ "\n" _ top_level_statements
        {%
            d => [
                d[1],
                ...d[5]
            ]
        %}
    # below 2 sub-rules handle blank lines
    |  _ "\n" top_level_statements
        {%
            d => d[2]
        %}
    |  _
        {%
            d => []
        %}

top_level_statement
    -> array_definition   {% id %}
    |  vector_definition  {% id %}
    |  option_definition  {% id %}
    |  union_definition  {% id %}
    |  struct_definition  {% id %}
    |  table_definition  {% id %}
    |  line_comment     {% () => null %}
    |  block_comment     {% () => null %}

array_definition
    -> "array" __ identifier _ lbracket _ identifier _ semicolon _ number _ rbracket _ semicolon _ comment_opt
        {% 
            function(data) {
                return {
                    type: "array",
                    name: data[2].value,
                    item:  data[6].value,
                    item_count: data[10].value 
                };
            }
        %}

vector_definition
     -> "vector" __ identifier _ labracket _ identifier _ rabracket _ semicolon _ comment_opt
        {% 
            function(data) {
                return {
                    type: "vector",
                    name: data[2].value,
                    item:  data[6].value,
                };
            }
        %}

option_definition
     -> "option" __ identifier _ lparan _ identifier _ rparan _ semicolon _ comment_opt
        {% 
            function(data) {
                return {
                    type: "option",
                    name: data[2].value,
                    item:  data[6].value,
                };
            }
        %}

union_definition
     -> "union" __ identifier _ lbrace _ (multi_line_ws_char _ identifier _ comma _ comment_opt _ multi_line_ws_char):+  _ rbrace
        {% 
            function(data) {
                return {
                    type: "union",
                    name: data[2].value,
                    items:  data[6].map(d => d[2].value),
                };
            }
        %}

struct_definition
     -> "struct" __ identifier _ block_definition
        {% 
            function(data) {
                return {
                    type: "struct",
                    name: data[2].value,
                    fields:  data[4][2].map(d => ({name: d[2].value, type: d[6].value})),
                };
            }
        %}

table_definition
     -> "table" __ identifier _ block_definition
        {% 
            function(data) {
                return {
                    type: "table",
                    name: data[2].value,
                    fields:  data[4][2].map(d => ({name: d[2].value, type: d[6].value})),
                };
            }
        %}

block_definition
     -> lbrace _ (multi_line_ws_char _ identifier _ colon _ identifier _ comma _ comment_opt _ multi_line_ws_char):+  _ rbrace

comment_opt -> line_comment | block_comment | null {% () => ([]) %}
line_comment -> %line_comment {% id %}
block_comment -> %block_comment {% id %}
string_literal -> %string_literal {% convertTokenId %}
number -> %number_literal {% convertTokenId %}
lbracket -> %lbracket {% convertTokenId %}
rbracket -> %rbracket {% convertTokenId %}
labracket -> %labracket {% convertTokenId %}
rabracket -> %rabracket {% convertTokenId %}
lparan -> %lparan {% convertTokenId %}
rparan -> %rparan {% convertTokenId %}
lbrace -> %lbrace {% convertTokenId %}
rbrace -> %rbrace {% convertTokenId %}
comma -> %comma {% convertTokenId %}
colon -> %colon {% convertTokenId %}
semicolon -> %semicolon {% convertTokenId %}
identifier -> %identifier {% convertTokenId %}

_ml -> multi_line_ws_char:*

multi_line_ws_char
    -> %ws
    |  "\n"

__ -> %ws:+

_ -> %ws:*