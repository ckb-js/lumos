import test from "ava";
import { parseDebuggerMessage } from "../src/parse";

test("parse#parseDebuggerMessage works correctly", (t) => {
  const parsed = parseDebuggerMessage(`Run result: 0
Total cycles consumed: 1722678(1.6M)
Transfer cycles: 12680(12.4K), running cycles: 1709998(1.6M)`);

  t.is(parsed.code, 0);
  t.is(parsed.cycles, 1722678);
});

test("parse#parseDebuggerMessage throws error if message is invalid", (t) => {
  const message = `thread 'main' panicked at 'called \`Option::unwrap()\` on a \`None\` value', src/main.rs:271:10
note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace`;

  t.throws(() => parseDebuggerMessage(message));
});
