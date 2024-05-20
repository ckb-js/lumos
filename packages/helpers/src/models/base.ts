import { bytes } from "@ckb-lumos/codec";
import { BytesCodec } from "@ckb-lumos/codec/lib/base";
import { ckbHash } from "@ckb-lumos/base/lib/utils";

/**
 * A helper object that provides common functionalities, such as create(clone), equals, hash, etc. for models.
 */
export type ModelHelper<Model, ModelLike = Model> = {
  /**
   * create a Model from a ModelLike
   * @param modelLike
   */
  create(modelLike: ModelLike): Model;
  /**
   * check if the two models are equals
   * @param modelLike
   * @param modelR
   */
  equals(modelLike: ModelLike, modelR: ModelLike): boolean;
  /**
   * create the hash of the model
   * @param modelLike
   */
  hash(modelLike: ModelLike): Uint8Array;

  /**
   * clone a model
   * @param model
   */
  clone(model: Model): Model;
};

/**
 * create a {@link ModelHelper} with a {@link BytesCodec}
 * @param codec
 */
export function createModelHelper<Model, ModelLike>(
  codec: BytesCodec<Model, ModelLike>
): ModelHelper<Model, ModelLike> {
  return {
    create: (val) => codec.unpack(codec.pack(val)),
    hash: (val) => bytes.bytify(ckbHash(codec.pack(val))),
    equals: (a, b) => bytes.equal(codec.pack(a), codec.pack(b)),
    clone: defaultDeepClone,
  };
}

/**
 * @internal
 */
export function defaultDeepClone<T>(value: T): T {
  const valType = typeof value;

  if (
    valType === "number" ||
    valType === "string" ||
    valType === "boolean" ||
    valType === "bigint" ||
    value == null
  ) {
    return value;
  } else if (Array.isArray(value)) {
    return value.map(defaultDeepClone) as T;
  } else if (valType === "object") {
    return Object.entries(value).reduce(
      (result, [key, value]) =>
        Object.assign(result, { [key]: defaultDeepClone(value) }),
      {}
    ) as T;
  }

  throw new Error("Cannot clone the value: " + String(value));
}
