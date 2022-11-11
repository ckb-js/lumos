import { Parser as NearleyParser, Grammar as NearleyGrammar } from "nearley";
import { createCodecMap } from "./codec";
import {
  Struct,
  Vector,
  Union,
  Array,
  Table,
  Field,
  MolType,
  MolTypeMap,
  Parser,
  ParseOptions,
} from "./type";
import { nonNull, toMolTypeMap } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const grammar = require("./grammar/mol.js");

export const createParser = (): Parser => {
  return {
    parse: (
      data,
      option: ParseOptions = {
        refs: {},
        skipDependenciesCheck: false,
      }
    ) => {
      const parser = new NearleyParser(NearleyGrammar.fromCompiled(grammar));
      parser.feed(data);
      const results = parser.results[0].filter(
        (result: MolType | null) => !!result
      ) as MolType[];
      validateParserResults(results, option);
      return createCodecMap(results, option.refs);
    },
  };
};
/**
 * primitive type
 */
export const byte = "byte";

const validateParserResults = (results: MolType[], option: ParseOptions) => {
  checkDuplicateNames(results);
  // skip check is refs presents
  if (!option.skipDependenciesCheck && !option.refs) {
    checkDependencies(results);
  }
};

const checkDuplicateNames = (results: MolType[]) => {
  const names = new Set<string>();
  results.forEach((result) => {
    const currentName = result.name;
    if (names.has(currentName)) {
      throw new Error(`Duplicate name: ${currentName}`);
    }
    names.add(currentName);
    const currentType = result.type;
    // check duplicate field names in `struct` and `table`
    if (currentType === "struct" || currentType === "table") {
      const fieldNames = new Set<string>();
      (result as Struct).fields.forEach((field: Field) => {
        const currentFieldName = field.name;
        if (fieldNames.has(currentFieldName)) {
          throw new Error(`Duplicate field name: ${currentFieldName}`);
        }
        fieldNames.add(currentFieldName);
      });
    }
  });
};
export const checkDependencies = (results: MolType[]): void => {
  const map = toMolTypeMap(results);
  for (const key in map) {
    const molItem = map[key];
    nonNull(molItem);
    const type = molItem.type;
    switch (type) {
      case "array":
      case "struct": {
        assertFixedMolType(molItem.name, map);
        break;
      }
      case "vector":
      case "option": {
        if ((molItem as Vector).item !== byte) {
          nonNull(map[(molItem as Vector).item]);
        }
        break;
      }
      case "union": {
        const unionDeps = (molItem as Union).items;
        unionDeps.forEach((dep: string) => {
          if (dep !== byte) {
            nonNull(map[dep]);
          }
        });
        break;
      }
      case "table": {
        const tableDeps = (molItem as Table).fields.map(
          (field: Field) => field.type
        );
        tableDeps.forEach((dep: string) => {
          if (dep !== byte) {
            nonNull(map[dep]);
          }
        });

        break;
      }
      default:
        break;
    }
  }
};

/**
 * mol type `array` and `struct` should have fixed byte length
 */
const assertFixedMolType = (name: string, map: MolTypeMap) => {
  const molItem = map[name];
  nonNull(molItem);
  const type = molItem.type;
  switch (type) {
    case "array": {
      if ((molItem as Array).item !== byte) {
        assertFixedMolType(molItem.name, map);
      }
      break;
    }
    case "struct": {
      const fields = (molItem as Struct).fields;
      fields.forEach((field: Field) => {
        if (field.type !== byte) {
          assertFixedMolType(field.type, map);
        }
      });
      break;
    }
    default:
      throw new Error(`Type ${name} should be fixed length.`);
  }
};
