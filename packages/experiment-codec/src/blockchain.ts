import { AnyCodec, BytesCodec, UnpackResult } from "./base";
import { createFixedBytesCodec, FixedBytesCodec } from "./base";
import { toArrayBuffer, toHex } from "./utils";
import { byteVecOf, option, table, vector } from "./molecule";

export const createFixedHexBytesCodec = (
  byteLength: number
): FixedBytesCodec<string> =>
  createFixedBytesCodec<string>({
    byteLength,
    pack: (hex) => toArrayBuffer(hex),
    unpack: (buf) => toHex(buf),
  });

/**
 * placeholder codec, generally used as a placeholder
 * ```
 * // for example, when some BytesOpt is not used, it will be filled with this codec
 * // option BytesOpt (Bytes);
 * const UnusedBytesOpt = UnknownOpt
 * ```
 */
// export const UnusedOpt = option(Unknown);

// vector Bytes <byte>
export const Bytes = byteVecOf<string>({
  pack: (hex) => toArrayBuffer(hex),
  unpack: (buf) => toHex(buf),
});

export const BytesOpt = option(Bytes);
export const BytesVec = vector(Bytes);
export const Byte32 = createFixedHexBytesCodec(32);
export const Byte32Vec = vector(Byte32);

export function WitnessArgsOf<
  LockCodec extends AnyCodec,
  InputTypeCodec extends AnyCodec,
  OutputTypeCodec extends AnyCodec
>(payload: {
  lock: LockCodec;
  input_type: InputTypeCodec;
  output_type: OutputTypeCodec;
}): BytesCodec<{
  lock?: UnpackResult<LockCodec>;
  input_type?: UnpackResult<InputTypeCodec>;
  output_type?: UnpackResult<OutputTypeCodec>;
}> {
  return table(
    {
      lock: option(byteVecOf(payload.lock)),
      input_type: option(byteVecOf(payload.input_type)),
      output_type: option(byteVecOf(payload.output_type)),
    },
    ["lock", "input_type", "output_type"]
  );
}

/**
 *
 * @example
 * ```ts
 * // secp256k1 lock witness
 * WitnessArgs.pack({ lock: '0x' + '00'.repeat(65) })
 * ```
 */
export const WitnessArgs = WitnessArgsOf({
  lock: BytesOpt,
  input_type: BytesOpt,
  output_type: BytesOpt,
});
