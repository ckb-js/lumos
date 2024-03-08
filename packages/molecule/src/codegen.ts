import { MolType } from "./type";
import { Grammar as NearleyGrammar, Parser as NearleyParser } from "nearley";
import { circularIterator } from "./circularIterator";
import grammar from "./grammar/mol";

export type Options = {
  /**
   * an import statement to prepend to the generated code, used to import and override <br/>
   * e.g. `"import { Uint32, Uint64 } from './customized'"` to override the default `Uint32` and `Uint64` types
   */
  prepend?: string;
  formatObjectKeys?: (key: string, molType: MolType) => string;
};

function id<T>(value: T): T {
  return value;
}

export function scanCustomizedTypes(prepend: string): string[] {
  if (!prepend) return [];

  const matched = prepend.match(/(?<={)([^}]+)(?=})/g);
  if (!matched) return [];

  // parse the override import statements to get the items
  return matched.flatMap((item) =>
    item
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}

/**
 * generate TypeScript code from molecule schema
 * @param schema
 * @param options
 */
export function codegen(schema: string, options: Options = {}): string {
  const parser = new NearleyParser(NearleyGrammar.fromCompiled(grammar));
  parser.feed(schema);

  // the items that don't need to be generated
  const importedModules: string[] = scanCustomizedTypes(options.prepend || "");

  const molTypes = prepareMolTypes(
    parser.results[0].filter(Boolean),
    importedModules
  );

  const codecs = molTypes
    .map((molType) => {
      if (importedModules.includes(molType.name)) return "";

      if (molType.type === "array") {
        if (molType.item === "byte") {
          return `export const ${molType.name} = createFallbackFixedBytesCodec(${molType.item_count});`;
        }

        return `export const ${molType.name} = array(${molType.item}, ${molType.item_count});`;
      }

      if (molType.type === "vector") {
        if (molType.item === "byte") {
          return `export const ${molType.name} = fallbackBytesCodec;`;
        }

        return `export const ${molType.name} = vector(${molType.item});`;
      }

      if (molType.type === "option") {
        return `export const ${molType.name} = option(${molType.item});`;
      }

      const formatObjectKey = (str: string) =>
        (options.formatObjectKeys || id)(str, molType);

      if (molType.type === "struct") {
        const fields = molType.fields
          .map((field) => `  ${formatObjectKey(field.name)}: ${field.type}`)
          .join(",\n");
        const keys = molType.fields
          .map((field) => `'${formatObjectKey(field.name)}'`)
          .join(", ");
        return `export const ${molType.name} = struct({\n${fields}\n}, [${keys}]);`;
      }

      if (molType.type === "table") {
        const fields = molType.fields
          .map((field) => `  ${formatObjectKey(field.name)}: ${field.type}`)
          .join(",\n");
        const keys = molType.fields
          .map((field) => `'${formatObjectKey(field.name)}'`)
          .join(", ");
        return `export const ${molType.name} = table({\n${fields}\n}, [${keys}]);`;
      }

      if (molType.type === "union") {
        if (Array.isArray(molType.items[0])) {
          const items = molType.items as [string, number][];

          const fields = items
            .map(([itemName]) => `  ${formatObjectKey(itemName)}`)
            .join(",\n");

          const keys = items
            .map(([itemName, key]) => `'${formatObjectKey(itemName)}': ${key}`)
            .join(", ");

          return `export const ${molType.name} = union({\n${fields}\n}, {${keys}});`;
        }

        if (typeof molType.items[0] === "string") {
          const items = (molType.items as string[]).map((itemName) =>
            formatObjectKey(itemName)
          );

          const fields = items.map((itemName) => `  ${itemName}`).join(",\n");
          const keys = items.map((itemName) => `'${itemName}'`).join(", ");

          return `export const ${molType.name} = union({\n${fields}\n}, [${keys}]);`;
        }
      }
    })
    .filter(Boolean)
    .join("\n\n");

  // the JS multiple-line comment in string could break some renderer,
  // such as the editor of GitHub and WebStorm,
  // so the header is extracted separately to avoid error rendering
  const header = [
    "// This file is generated by @ckb-lumos/molecule, please do not modify it manually.",
    "/* eslint-disable */",
  ].join("\n");

  return `${header}
import { bytes, createBytesCodec, createFixedBytesCodec, molecule } from "@ckb-lumos/codec";
${options.prepend || ""}

const { array, vector, union, option, struct, table } = molecule;

const fallbackBytesCodec = createBytesCodec({
  pack: bytes.bytify,
  unpack: bytes.hexify,
});

function createFallbackFixedBytesCodec(byteLength: number) {
  return createFixedBytesCodec({
    pack: bytes.bytify,
    unpack: bytes.hexify,
    byteLength,
  });
}

const byte = createFallbackFixedBytesCodec(1);

${codecs}
`;
}

// sort molecule types by their dependencies, to make sure the known types can be used in the front
function prepareMolTypes(
  types: MolType[],
  importedTypes: string[] = []
): MolType[] {
  // check if the molecule definition can be parsed
  function checkCanParse(molType: MolType): boolean {
    if (availableTypes.has(molType.name)) {
      return true;
    }

    const layoutType = molType.type;

    switch (layoutType) {
      case "array":
      case "vector":
      case "option": {
        if (!availableTypes.has(molType.item)) {
          return false;
        }
        availableTypes.add(molType.name);
        return true;
      }

      case "struct":
      case "table": {
        const fieldsAreKnown = molType.fields.every((field) =>
          availableTypes.has(field.type)
        );
        if (!fieldsAreKnown) {
          return false;
        }
        availableTypes.add(molType.name);
        return true;
      }

      case "union": {
        const itemsAreKnown = molType.items.every((item) =>
          Array.isArray(item)
            ? availableTypes.has(item[0])
            : availableTypes.has(item)
        );
        if (!itemsAreKnown) {
          return false;
        }

        availableTypes.add(molType.name);
        return true;
      }

      default: {
        throw new Error(`Unknown molecule layout ${layoutType}`);
      }
    }
  }

  // temp set to store the known types
  const availableTypes = new Set(importedTypes.concat("byte"));
  const sortedTypes: MolType[] = [];

  const iterator = circularIterator(types);

  // the worst case is that the known types are at the end of the list,
  // therefore, the max scan times is the sum of 1 to n
  // sigma(n) = n * (n + 1) / 2
  const maxScanTimes = ((1 + types.length) * types.length) / 2;
  let scanTimes = 0;
  while (iterator.current() != null && scanTimes < maxScanTimes) {
    scanTimes++;

    const molType = iterator.current()!;
    if (checkCanParse(molType)) {
      sortedTypes.push(molType);
      availableTypes.add(molType.name);
      iterator.removeAndNext();
      continue;
    }

    iterator.next();
  }

  if (scanTimes >= maxScanTimes) {
    const unknownTypes = types
      .filter((type) => !availableTypes.has(type.name))
      .map((type) => type.name)
      .join(", ");

    if (unknownTypes) {
      throw new Error(
        `Circular dependency or unknown type found in ${unknownTypes}`
      );
    }
  }

  return sortedTypes;
}
