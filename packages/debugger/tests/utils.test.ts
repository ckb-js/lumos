import test from "ava";
import { groupBy } from "../src/utils";

test("utils#groupBy", (t) => {
  const list = [
    { key: { val: 1 }, name: "group1", payload: "payload1" },
    { key: { val: 2 }, name: "group2", payload: "payload2" },
    { key: { val: 1 }, name: "group1", payload: "payload3" },
  ];

  const grouped = groupBy(list, (val) => val.key);

  t.deepEqual(grouped.get({ val: 1 }), [
    { key: { val: 1 }, name: "group1", payload: "payload1" },
    { key: { val: 1 }, name: "group1", payload: "payload3" },
  ]);

  t.deepEqual(grouped.get({ val: 2 }), [
    { key: { val: 2 }, name: "group2", payload: "payload2" },
  ]);

  t.deepEqual(grouped.get({ val: 3 }), []);

  t.is(grouped.hashKeys()[0], JSON.stringify({ val: 1 }));
  t.is(grouped.hashKeys()[1], JSON.stringify({ val: 2 }));
  t.deepEqual(grouped.listKeys()[0], { val: 1 });
  t.deepEqual(grouped.listKeys()[1], { val: 2 });
});

test("utils#groupBy with custom hashCode", (t) => {
  const list = [
    { key: { val: 1 }, name: "group1", payload: "payload1" },
    { key: { val: 2 }, name: "group2", payload: "payload2" },
    { key: { val: 1 }, name: "group1", payload: "payload3" },
  ];

  const grouped = groupBy(list, (val) => val.key, {
    hashCode: (x) => x.val.toString(),
  });

  t.deepEqual(grouped.get({ val: 1 }), [
    { key: { val: 1 }, name: "group1", payload: "payload1" },
    { key: { val: 1 }, name: "group1", payload: "payload3" },
  ]);

  t.deepEqual(grouped.get({ val: 2 }), [
    { key: { val: 2 }, name: "group2", payload: "payload2" },
  ]);

  t.deepEqual(grouped.get({ val: 3 }), []);
});
