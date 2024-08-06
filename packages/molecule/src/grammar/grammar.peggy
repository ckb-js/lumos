grammar
  = brk*
    version:syntax_version_stmt?
    brk*
    imports:import_stmt*
    brk*
    declares:decl_stmt+ {
      return {
        syntaxVersion: version,
        imports,
        declares,
      };
    }

decl_stmt
  = brk*
    declare:(
      option_decl
      / union_decl
      / array_decl
      / struct_decl
      / vector_decl
      / table_decl
    )
    brk* { return declare; }

table_decl
  = "table" brk+ name:identifier brk* "{" brk* fields:field_decl* "}" {
      return {
        type: "table",
        name,
        fields,
      };
    }

vector_decl
  = "vector"
    brk+
    name:identifier
    brk*
    "<"
    brk*
    item:identifier
    brk*
    ">"
    brk*
    stmt_end {
      return {
        type: "vector",
        name,
        item,
      };
    }

struct_decl
  = "struct" brk+ name:identifier brk* "{" brk* fields:field_decl* "}" {
      return {
        type: "struct",
        name,
        fields,
      };
    }

field_decl
  = name:identifier brk* ":" brk* type:identifier brk* field_end brk* {
      return { name, type };
    }

array_decl
  = "array"
    brk+
    name:identifier
    brk*
    "["
    brk*
    item:identifier
    brk*
    ";"
    brk*
    item_count:number_gt_zero
    brk*
    "]"
    brk*
    stmt_end {
      return {
        type: "array",
        name,
        item,
        item_count,
      };
    }

union_decl
  = "union"
    brk+
    name:identifier
    brk*
    "{"
    brk*
    declares:(item_decl / custom_union_item_decl)+
    "}" {
      return {
        type: "union",
        name,
        items: declares,
      };
    }

item_decl = name:identifier brk* item_end brk* { return name; }

custom_union_item_decl
  = name:identifier brk* ":" brk* id:number_gte_zero brk* field_end brk* {
      return [name, id];
    }

number_gte_zero
  = zero
  / number_gt_zero

number_gt_zero = head:nonzero tail:digit* { return head + tail.join(""); }

option_decl
  = "option"
    brk+
    name:identifier
    brk*
    "("
    brk*
    item:identifier
    brk*
    ")"
    stmt_end {
      return {
        type: "option",
        name,
        item,
      };
    }

syntax_version_stmt
  = "syntax" brk* "=" brk* version:syntax_version brk* stmt_end {
      return version.join("");
    }

syntax_version = digit+

item_end = ","

field_end = ","

import_stmt = "import" brk* path:path brk* stmt_end brk* { return path; }

path
  = head:path_super* middle:(identifier "/")* tail:identifier {
      return head.join("") + middle.flatMap((x) => x).join("") + tail;
    }

path_super = "../"

identifier
  = head:letter tail:(letter / digit / "_")* { return head + tail.join(""); }

letter
  = uppercase
  / lowercase

uppercase = [A-Z]

lowercase = [a-z]

stmt_end = ";"

brk
  = whitespace
  / comment

comment
  = block_comment
  / line_comment

block_comment = "/*" [^*/]* "*/"

line_comment = ("//" / "#") ([^\n] / [^\r\n])*

whitespace
  = ifs
  / newline

ifs
  = " "
  / "\t"

newline
  = "\n"
  / "\r\n"

digit
  = zero
  / nonzero

nonzero = [1-9]

zero = "0"
