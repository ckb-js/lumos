import { blockchain } from '@ckb-lumos/base';
import { CodecMap } from "@ckb-lumos/molecule"
import { AnyCodec } from '@ckb-lumos/codec';

/**
 * built-in re-writable codecs
 */
export const builtinCodecs: CodecMap = new Map<string, AnyCodec>([
    ["Block", blockchain.Block],
    ["BlockV1", blockchain.BlockV1],
    ["CellDep", blockchain.CellDep],
    ["CellDepVec", blockchain.CellDepVec],
    ["CellInput", blockchain.CellInput],
    ["CellInputVec", blockchain.CellInputVec],
    ["CellOutput", blockchain.CellOutput],
    ["CellOutputVec", blockchain.CellOutputVec],
    ["CellbaseWitness", blockchain.CellbaseWitness],
    ["DepType", blockchain.DepType],
    ["HashType", blockchain.HashType],
    ["Header", blockchain.Header],
    ["OutPoint", blockchain.OutPoint],
    ["ProposalShortId", blockchain.ProposalShortId],
    ["ProposalShortIdVec", blockchain.ProposalShortIdVec],
    ["RawHeader", blockchain.RawHeader],
    ["RawTransaction", blockchain.RawTransaction],
    ["Script", blockchain.Script],
    ["ScriptOpt", blockchain.ScriptOpt],
    ["Transaction", blockchain.Transaction],
    ["TransactionVec", blockchain.TransactionVec],
    ["UncleBlock", blockchain.UncleBlock],
    ["UncleBlockVec", blockchain.UncleBlockVec],
    ["WitnessArgs", blockchain.WitnessArgs],
])
/**
 * merge user tokens with primitive tokens
 * @param userTokens
 */
export const mergeBuiltinCodecs = (userCodecs: CodecMap):CodecMap => {
    const result = new Map(builtinCodecs);
    const iter = userCodecs.entries()
    let nextKey = iter.next()
    while(!nextKey.done){
        result.set(nextKey.value[0], nextKey.value[1])
        nextKey = iter.next()
    }
    return result
}