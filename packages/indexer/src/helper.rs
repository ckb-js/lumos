extern crate lazysort;
use crate::indexer::Error;
use ckb_jsonrpc_types::BlockView;
use ckb_types::{
    core::ScriptHashType,
    packed::{Script, ScriptBuilder},
    prelude::*,
};
use std::fs::File;
use std::path::PathBuf;

pub fn assemble_packed_script(
    code_hash: &[u8],
    hash_type: f64,
    args: &[u8],
) -> Result<Script, Error> {
    let code_hash = if code_hash.len() == 32 {
        let mut buf = [0u8; 32];
        buf.copy_from_slice(&code_hash[0..32]);
        buf.pack()
    } else {
        return Err(Error::Other("Invalid code hash length!".to_string()));
    };
    let hash_type = if hash_type as u32 == 1 {
        ScriptHashType::Type
    } else {
        ScriptHashType::Data
    }
    .into();
    let args = args.pack();
    let script = ScriptBuilder::default()
        .code_hash(code_hash)
        .hash_type(hash_type)
        .args(args)
        .build();
    Ok(script)
}

pub fn load_blocks_from_json_file(file_path: &str) -> Vec<BlockView> {
    let path = PathBuf::from(file_path);
    let file = File::open(path).expect("opening test blocks data json file");
    let blocks_data: serde_json::Value =
        serde_json::from_reader(file).expect("reading test blocks data json file");
    let blocks_data_array = blocks_data.as_array().expect("loading in array format");
    let mut block_view_vec = vec![];
    for i in 0..blocks_data_array.len() {
        let block_value = blocks_data_array[i].clone();
        let block_view: BlockView = serde_json::from_value(block_value).unwrap();
        block_view_vec.push(block_view);
    }
    block_view_vec
}

pub fn check_script_args_prefix_match(emitter_script: Script, script: Script) -> bool {
    // when emitter_script's args_len smaller than actual script args' len, meaning it's prefix match
    let script_args = script.args();
    // the first 4 bytes mark the byteslength of script_args according to molecule
    let args_prefix = &script_args.as_slice()[4..];
    let emitter_script_args = emitter_script.args();
    let emitter_script_args_prefix = &emitter_script_args.as_slice()[4..];
    let check_args_prefix = args_prefix.starts_with(&emitter_script_args_prefix);
    emitter_script.code_hash() == script.code_hash()
        && emitter_script.hash_type() == script.hash_type()
        && check_args_prefix
}
