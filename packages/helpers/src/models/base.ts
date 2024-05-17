import { bytes } from "@ckb-lumos/codec";
import { BytesCodec } from "@ckb-lumos/codec/lib/base";
import { ckbHash } from "@ckb-lumos/base/lib/utils";

/**
 * A helper object that provides common functionalities, such as create(clone), equals, hash, etc. for models.
 */
export type ModelHelper<Model, ModelLike = Model> = {
  /**
   * create a Model from a ModelLike
   * @param model
   */
  create(model: ModelLike): Model;
  /**
   * check if the two models are equals
   * @param modelL
   * @param modelR
   */
  equals(modelL: ModelLike, modelR: ModelLike): boolean;
  /**
   * create the hash of the model
   * @param model
   */
  hash(model: ModelLike): Uint8Array;
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
  };
}
