import test from "ava";
import { groupBy, identity } from "../src/utils";
import { mapObj } from "../src/utils/mapObj";

test("utils#groupBy", (t) => {
  const list = [
    { key: { val: 1 }, name: "group1", payload: "payload1" },
    { key: { val: 2 }, name: "group2", payload: "payload2" },
    { key: { val: 1 }, name: "group1", payload: "payload3" },
  ];

  const grouped = groupBy(list, (val) => val.key, { hashCode: JSON.stringify });

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

  t.is(grouped.hashKeys().length, 2);
  t.is(grouped.listKeys().length, 2);
  t.deepEqual(grouped.listKeys()[0], { val: 1 });
  t.deepEqual(grouped.listKeys()[1], { val: 2 });
});

test("uitls#mapObj", (t) => {
  const mapped1 = mapObj({ key1: "1", key2: "2" }, Number);
  t.deepEqual(mapped1, { key1: 1, key2: 2 });

  const mappedNil = mapObj(undefined as any, identity);
  t.deepEqual(mappedNil, {});

  const mappedArr = mapObj([1, 2, 3, 4] as any, String);
  t.deepEqual(mappedArr, { 0: "1", 1: "2", 2: "3", 3: "4" });

  const mappedEmpty = mapObj({}, identity);
  t.deepEqual(mappedEmpty, {});
});
