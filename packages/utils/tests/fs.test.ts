import test from "ava";
import { replaceContent, replaceContentSync } from "../src";
import { readFileSync, rmSync, writeFileSync } from "fs";

let file: string;
let content = "hello world";

test.beforeEach(() => {
  file = `test-fs-${Date.now()}.txt`;
  writeFileSync(file, content);
});

test.afterEach(() => {
  rmSync(file);
});

test.serial("fs#replaceContent", async (t) => {
  t.plan(3);

  await new Promise<void>((resolve) => {
    replaceContent(
      file,
      (source) => {
        t.is(source, content);
        return "changed";
      },
      (err) => {
        t.is(err, null);
        resolve();
      }
    );
  });

  const changed = readFileSync(file).toString();
  t.is(changed, "changed");
});

test.serial("fs#replaceContentSync", async (t) => {
  t.plan(2);

  replaceContentSync(file, (source) => {
    t.is(source, content);
    return "changed";
  });

  const changed = readFileSync(file).toString();
  t.is(changed, "changed");
});
