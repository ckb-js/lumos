"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createParser = exports.byte = void 0;

var _nearley = _interopRequireDefault(require("nearley"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const grammar = require("./grammar/mol.js");

const createParser = () => {
  return {
    parse: data => {
      const parser = new _nearley.default.Parser(_nearley.default.Grammar.fromCompiled(grammar));
      parser.feed(data);
      const results = parser.results[0].filter(result => !!result);
      validateParserResults(results);
      return results;
    }
  };
};
/**
 * primitive type
 */


exports.createParser = createParser;
const byte = "byte";
exports.byte = byte;

const validateParserResults = results => {
  checkDuplicateNames(results);
  checkDependencies(results);
};

const checkDuplicateNames = results => {
  const names = new Set();
  results.forEach(result => {
    const currentName = result.name;

    if (names.has(currentName)) {
      throw new Error(`Duplicate name: ${currentName}`);
    }

    names.add(currentName);
    const currentType = result.type; // check duplicate field names in `struct` and `table`

    if (currentType === "struct" || currentType === "table") {
      const fieldNames = new Set();
      result.fields.forEach(field => {
        const currentFieldName = field.name;

        if (fieldNames.has(currentFieldName)) {
          throw new Error(`Duplicate field name: ${currentFieldName}`);
        }

        fieldNames.add(currentFieldName);
      });
    }
  });
};

const checkDependencies = results => {
  const map = (0, _utils.toMolTypeMap)(results);

  for (const entry of map) {
    const molItem = map.get(entry[0]);
    (0, _utils.nonNull)(molItem);
    const type = molItem.type;

    switch (type) {
      case "array":
      case "struct":
        assertFixedMolType(molItem.name, map);
        break;

      case "vector":
      case "option":
        if (molItem.item !== byte) {
          (0, _utils.nonNull)(map.get(molItem.item));
        }

        break;
        5;

      case "union":
        const unionDeps = molItem.items;
        unionDeps.forEach(dep => {
          if (dep !== byte) {
            (0, _utils.nonNull)(map.get(dep));
          }
        });
        break;

      case "table":
        const tableDeps = molItem.fields.map(field => field.type);
        tableDeps.forEach(dep => {
          if (dep !== byte) {
            (0, _utils.nonNull)(map.get(dep));
          }
        });
        break;

      default:
        break;
    }
  }
};
/**
 * mol type `array` and `struct` should have fixed byte length
 */


const assertFixedMolType = (name, map) => {
  const molItem = map.get(name);
  (0, _utils.nonNull)(molItem);
  const type = molItem.type;

  switch (type) {
    case "array":
      if (molItem.item !== byte) {
        assertFixedMolType(molItem.name, map);
      }

      break;

    case "struct":
      const fields = molItem.fields;
      fields.forEach(field => {
        if (field.type !== byte) {
          assertFixedMolType(field.type, map);
        }
      });
      break;

    default:
      throw new Error(`Type ${name} should be fixed length.`);
  }
};
//# sourceMappingURL=nearley.js.map