import test from "ava";
import { delay, timeout, race, retry } from "../src";

test("async#delay", async (t) => {
  const before = Date.now();
  await delay(200);
  const after = Date.now();
  t.true(after - before >= 200);
});

test("async#race", async (t) => {
  const result = await race([
    delay(100).then(() => Promise.resolve(100)),
    delay(200).then(() => Promise.resolve(200)),
  ]);

  t.is(result, 100);
});

test("async#timeout", async (t) => {
  await timeout(delay(100), 200).then(() => t.pass(), t.fail);
  await timeout(delay(200), {
    milliseconds: 100,
    message: "Custom message",
  }).then(
    () => t.fail(),
    (e: Error) => {
      t.true(e.message.includes("Custom message"));
    }
  );
});

test("async#retry", async (t) => {
  function passOn(times: number): () => Promise<void> {
    let count = 0;
    return () =>
      new Promise<void>((resolve, reject) => {
        count++;
        if (count >= times) resolve();
        else reject(new Error("Failed"));
      });
  }

  await retry(passOn(3), { retries: 3 });
  t.pass();

  let failed = false;
  await retry(passOn(3), { retries: 2 }).then(
    () => t.fail(),
    (e: Error) => {
      failed = true;
      t.true(e.message.includes("Failed"));
    }
  );
  t.true(failed);
});

test("async#retry with timeout", async (t) => {
  let called = false;
  let failed = false;
  await retry(
    () => {
      called = true;
      return delay(100);
    },
    { timeout: 50, retries: 3 }
  ).catch(() => {
    failed = true;
  });

  t.true(called);
  t.true(failed);
});
