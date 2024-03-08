import { MolType, MolTypeMap, Import } from "./type";

export function nonNull<T>(data: T): asserts data is NonNullable<T> {
  if (data === null || data === undefined) throw new Error("NonNullable");
}

export const toMolTypeMap = (results: MolType[]): MolTypeMap => {
  const map: MolTypeMap = {};
  results.forEach((result) => {
    if (result.name !== null && result.name !== undefined) {
      map[result.name] = result;
    }
  });
  return map;
};

const determineImportType = (importStatement: String) => {
  const parts = importStatement.split(' ');
  const defaultExportExists = parts.includes('defaultExport,') || parts.includes('defaultExport');
  const secondPart = parts[1];
  const importTypeThreeFourSecondPart = parts[0];
  if (defaultExportExists && secondPart === '{') {
    return 'importTypeOne';
  }
  else if (defaultExportExists && secondPart !== '{' && secondPart !== '*' && parts.includes('from')) {
    return 'importTypeTwo';
  }
  else if (!defaultExportExists && importTypeThreeFourSecondPart === '{') {
    const braceContent = importStatement.substring(
      importStatement.indexOf('{') + 1,
      importStatement.indexOf('}')
    );
    const asCount = braceContent.split(' as ').length - 1;
    if (asCount === 1 && parts.includes('from')) {
      return 'importTypeThree';
    } else {
      return 'importTypeSix';
    }
  }
  else if (importTypeThreeFourSecondPart === '*' && parts.includes('from')) {
    return 'importTypeFour';
  }
  else if (defaultExportExists && secondPart === '*' && parts.includes('from')) {
    return 'importTypeFive';
  }
  return 'unknownImportType';
};

const parseImportTypeOne = (importContent: string): Import => {
  const braceContent = importContent.substring(importContent.indexOf('{') + 1, importContent.lastIndexOf('}'));
  const exportedImports = braceContent.split(',').map(part => {
    const [namePart, aliasPart] = part.split(' as ');
    return { name: namePart.trim(), alias: aliasPart ? aliasPart.trim() : null };
  });
  let defaultImport = importContent.split('{')[0].trim().split(' ').pop();
  if (defaultImport?.endsWith(',')) {
    defaultImport = defaultImport.slice(0, -1);
  }
  const fromIndex = importContent.indexOf('from');
  let from = fromIndex !== -1 ? importContent.substring(fromIndex + 4).trim() : null;
  if (from && from.startsWith('"') && from.endsWith('"')) {
    from = from.slice(1, -1);
  }

  return {
    type: 'import',
    name: 'importTypeOne',
    defaultImport: defaultImport,
    exportedImports: exportedImports.length > 0 ? exportedImports : null,
    alias: null,
    from: from ? from.replace(/['"]+/g, '') : null,
  };
};

const parseImportTypeTwo = (importContent: string): Import => {
  const parts = importContent.split(' ').map(part => part.trim());
  const defaultImport = parts[0];
  const fromIndex = parts.findIndex(part => part === 'from');
  const from = fromIndex !== -1 ? parts[fromIndex + 1] : null;

  return {
    type: 'import',
    name: 'importTypeTwo',
    defaultImport: defaultImport,
    exportedImports: null,
    alias: null,
    from: from ? from.replace(/['"]+/g, '') : null,
  };
};

const parseImportTypeThree = (importContent: string): Import => {
  const parts = importContent.split('{')[1].split('}')[0].split(',').map(part => part.trim());
  const exportedImports = parts.map(part => {
    const [namePart, aliasPart] = part.split(' as ');
    return { name: namePart.trim(), alias: aliasPart ? aliasPart.trim() : null };
  });
  const fromIndex = importContent.indexOf('from');
  const from = fromIndex !== -1 ? importContent.substring(fromIndex + 5).trim() : null;

  return {
    type: 'import',
    name: 'importTypeThree',
    defaultImport: null,
    exportedImports: exportedImports.length > 0 ? exportedImports : null,
    alias: null,
    from: from ? from.replace(/['"]+/g, '') : null,
  };
};

const parseImportTypeFour = (importContent: string): Import => {
  const parts = importContent.split(' ').map(part => part.trim());
  const alias = parts[2];
  const fromIndex = parts.findIndex(part => part === 'from');
  const from = fromIndex !== -1 ? parts[fromIndex + 1] : null;

  return {
    type: 'import',
    name: 'importTypeFour',
    defaultImport: null,
    exportedImports: null,
    alias: alias ? alias.replace(/['"]+/g, '') : null,
    from: from ? from.replace(/['"]+/g, '') : null,
  };
};

const parseImportTypeFive = (importContent: string): Import => {
  const parts = importContent.split(' ').map(part => part.trim());
  let defaultImport = parts[0];
  if (defaultImport.endsWith(',')) {
    defaultImport = defaultImport.slice(0, -1);
  };
  const fromIndex = parts.findIndex(part => part === 'from');
  const from = fromIndex !== -1 ? parts[fromIndex + 1] : null;

  return {
    type: 'import',
    name: 'importTypeFive',
    defaultImport: defaultImport,
    exportedImports: null,
    alias: from ? from.replace(/['"]+/g, '') : null,
    from: from ? from.replace(/['"]+/g, '') : null,
  };
};

const parseImportTypeSix = (importContent: string): Import => {
  const braceContent = importContent.split('{')[1].split('}')[0];
  const parts = braceContent.split(',').map(part => part.trim());
  const exportedImports = parts.map(part => {
    const [namePart, aliasPart] = part.split(' as ');
    return { name: namePart.trim(), alias: aliasPart ? aliasPart.trim() : null };
  });
  const fromIndex = importContent.indexOf('from');
  const from = fromIndex !== -1 ? importContent.substring(fromIndex + 5).trim() : null;

  return {
    type: 'import',
    name: 'importTypeSix',
    defaultImport: null,
    exportedImports: exportedImports.length > 0 ? exportedImports : null,
    alias: null,
    from: from ? from.replace(/['"]+/g, '') : null,
  };
};

export const parseImportStatement = (statement: string): Import => {
  const importRegex = /^import\s+([^;]+);?$/;
  const match = statement.match(importRegex);

  if (!match) {
    throw new Error(`Invalid import statement: ${statement}`);
  }

  const importContent = match[1].trim();

  const importType = determineImportType(importContent);

  switch (importType) {
    case 'importTypeOne':
      return parseImportTypeOne(importContent);
    case 'importTypeTwo':
      return parseImportTypeTwo(importContent);
    case 'importTypeThree':
      return parseImportTypeThree(importContent);
    case 'importTypeFour':
      return parseImportTypeFour(importContent);
    case 'importTypeFive':
      return parseImportTypeFive(importContent);
    case 'importTypeSix':
      return parseImportTypeSix(importContent);
    default:
      throw new Error(`Unknown import type: ${importType}`);
  };
};
