import test from "ava";
import {
  resolveDependencies,
  extractAndEraseImportClauses,
} from "../src/resolve";

function expectResolveDependencies() {
  const generated = resolveDependencies(
    "character.mol",
    "./tests/mol",
    new Set()
  );

  return generated.length === 3 && generated[2].dependencies.length === 2;
}

test("dependencies length right", (t) => {
  t.true(expectResolveDependencies());
});

test("erase import base", (t) => {
  const result = extractAndEraseImportClauses(`
  import "base";
  // import "submodule/base";

  table Character {
    hair_color: RGB,
  }
  `);
  t.true(!result.includes(`import "base"`));
});
