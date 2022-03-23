import {
  byteOf,
  byteVecOf,
  option,
  struct,
  table,
  Uint32,
  Uint8,
  union,
  vector,
} from "@ckb-lumos/experiment-codec";

// table Character {
//   main_equip: Equip,
//   sub_equip: EquipOpt,
// }
//
// option EquipOpt (Equip);
//
// union Equip {
//   Sword,
//   Wand,
//   Bow,
// }
//
// struct Sword {
//   material: byte,
// }
//
// table Wand {
//   gems: GemVec,
//   desc: DescOpt,
// }
//
// vector GemVec <Gem>;
//
// struct Gem {
//   color: byte,
//   shape: byte,
// }
//
// table Bow {
//   arrows: Uint32,
//   desc: DescOpt,
// }
//
// option DescOpt (UTF8String);
//
// # convention types
// array Uint32 [byte; 4];
// vector UTF8String <byte>;

// custom type
type Material = "wood" | "steel" | "crystal";
const SwordMaterial = byteOf<Material>({
  pack: (material) => {
    if (material === "wood") return Uint8.pack(0);
    if (material === "steel") return Uint8.pack(1);
    if (material === "crystal") return Uint8.pack(2);

    throw new Error("Unknown material " + material);
  },
  unpack: (bin) => {
    const u8 = Uint8.unpack(bin);

    if (u8 === 0) return "wood";
    if (u8 === 1) return "steel";
    if (u8 === 2) return "crystal";

    throw new Error("Unknown material binary: " + bin);
  },
});

const UTF8String = byteVecOf<string>({
  pack: (str) => {
    return Uint8Array.from(Buffer.from(str, "utf8")).buffer;
  },
  unpack: (buf) => {
    return Buffer.from(buf).toString("utf8");
  },
});

/***** molecule binding *****/
// option DescOpt (UTF8String);
const DescOpt = option(UTF8String);

// struct Sword {
//   material: byte,
// }
const Sword = struct(
  {
    material: SwordMaterial,
  },
  ["material"]
);

// struct Gem {
//   color: byte,
//   shape: byte,
// }
const Gem = struct(
  {
    color: Uint8,
    shape: Uint8,
  },
  ["color", "shape"]
);
const GemVec = vector(Gem);
const Wand = table(
  {
    gems: GemVec,
    desc: DescOpt,
  },
  ["gems", "desc"]
);

// table Bow {
//   arrows: Uint32,
//   desc: DescOpt,
// }
const Bow = table(
  {
    arrow: Uint32,
    desc: DescOpt,
  },
  ["arrow", "desc"]
);

// union Equip {
//   Sword,
//   Wand,
//   Bow,
// }
const Equip = union(
  {
    Sword,
    Wand,
    Bow,
  },
  ["Sword", "Wand", "Bow"]
);

// option EquipOpt (Equip);
const EquipOpt = option(Equip);

// table Character {
//   main_equip: Equip,
//   sub_equip: EquipOpt,
// }
const Character = table({ main_equip: Equip, sub_equip: EquipOpt }, [
  "main_equip",
  "sub_equip",
]);

function main() {
  /* usage */
  const buf = Character.pack({
    main_equip: {
      type: "Sword",
      value: { material: "wood" },
    },
    // main_equip: {
    //   type: "Bow",
    //   value: { arrow: 10, desc: "nice bow" },
    // },

    sub_equip: {
      type: "Sword",
      value: { material: "steel" },
    },
    // sub_equip: {
    //   type: "Wand",
    //   value: { gems: [{ color: 1, shape: 2 }], desc: "utf8 string" },
    // },
  });

  const character = Character.unpack(buf);
  const mainEquip = character.main_equip;

  if (mainEquip.type === "Sword" && mainEquip.value.material === "wood") {
    console.log("I am Yuusya, ⚔️");
  }

  if (mainEquip.type === "Bow") {
    console.log("I am Archer");
  }
}

main();
