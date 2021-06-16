extern crate lazysort;
use crate::helper::*;
use crate::indexer::*;
use ckb_indexer::{
    indexer::{Error as IndexerError, Indexer, Key, KeyPrefix, Value},
    store::{IteratorDirection, RocksdbStore, Store},
};
use ckb_jsonrpc_types::{BlockNumber, BlockView};
use ckb_types::{
    core::{BlockView as CoreBlockView, ScriptHashType},
    packed::{Byte32, Bytes, CellOutput, OutPoint, Script, ScriptBuilder},
    prelude::*,
};
use futures::Future;
use hyper::rt;
use jsonrpc_core_client::{transports::http, RpcError};
use jsonrpc_derive::rpc;
use lazysort::SortedBy;
use neon::prelude::*;
use std::convert::TryInto;
use std::fmt;
use std::fs::File;
use std::path::PathBuf;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, RwLock,
};
use std::thread;
use std::time::Duration;
use std::{cell::RefCell, ops::Deref};

type BoxedTransactionIterator = JsBox<TransactionIterator>;
pub struct TransactionIterator(Box<dyn Send + Sync + Iterator<Item = (Box<[u8]>, Box<[u8]>)>>);
impl Finalize for TransactionIterator {}
impl TransactionIterator {}
pub fn get_transactions_by_script_iterator(
    mut cx: FunctionContext,
) -> JsResult<BoxedTransactionIterator> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let native_indexer = native_indexer.read().unwrap();
    let store = native_indexer.indexer.store();
    let js_script: Handle<JsObject> = cx.argument::<JsObject>(1)?;
    let js_code_hash = js_script
        .get(&mut cx, "code_hash")?
        .downcast::<JsArrayBuffer, _>(&mut cx)
        .or_throw(&mut cx)?;
    let code_hash = cx.borrow(&js_code_hash, |data| data.as_slice::<u8>());
    let js_hash_type = js_script
        .get(&mut cx, "hash_type")?
        .downcast::<JsNumber, _>(&mut cx)
        .or_throw(&mut cx)?
        .value(&mut cx);
    let js_args = js_script
        .get(&mut cx, "args")?
        .downcast::<JsArrayBuffer, _>(&mut cx)
        .or_throw(&mut cx)?;
    let args = cx.borrow(&js_args, |data| data.as_slice::<u8>());
    let script = assemble_packed_script(&code_hash, js_hash_type, &args);
    if script.is_err() {
        return cx.throw_error(format!(
            "Error assembling script: {:?}",
            script.unwrap_err()
        ));
    }
    let script = script.unwrap();

    let prefix = if cx.argument::<JsNumber>(2)?.value(&mut cx) as u32 == 1 {
        KeyPrefix::TxTypeScript
    } else {
        KeyPrefix::TxLockScript
    };

    let args_len = cx.argument::<JsValue>(3)?;
    let args_len = if args_len.is_a::<JsString, _>(&mut cx) {
        let args_len = args_len
            .downcast::<JsString, _>(&mut cx)
            .or_throw(&mut cx)?
            .value(&mut cx);
        if args_len != "any" {
            return cx.throw_error(format!(
                "The field argsLen must be string \'any\' when it's String type, it's \'{}\' now.",
                args_len
            ));
        }
        ArgsLen::StringAny
    } else if args_len.is_a::<JsNumber, _>(&mut cx) {
        let args_len = args_len
            .downcast::<JsNumber, _>(&mut cx)
            .or_throw(&mut cx)?
            .value(&mut cx);
        if args_len > u32::max_value() as f64 {
            return cx.throw_error("args length must fit in u32 value!");
        }
        let args_len = if args_len <= 0.0 {
            script.args().len() as u32
        } else {
            // when prefix search on args, the args parameter is be shorter than actual args, so need set the args_len manully.
            args_len as u32
        };
        ArgsLen::UintValue(args_len)
    } else {
        return cx.throw_error("The field argsLen must be either JsString or JsNumber");
    };

    let io_type: String = cx.argument::<JsString>(4)?.value(&mut cx);
    let io_type_mark = match &io_type[..] {
        "input" => vec![0],
        "output" => vec![1],
        "both" => vec![],
        _ => return cx.throw_error("io_type should be input or output or both!"),
    };
    let from_block = cx.argument::<JsValue>(5)?;
    let from_block_number_slice = if from_block.is_a::<JsString, _>(&mut cx) {
        let from_block_hex = from_block
            .downcast::<JsString, _>(&mut cx)
            .or_throw(&mut cx)?
            .value(&mut cx);
        let from_block_result = u64::from_str_radix(&from_block_hex[2..], 16);
        if from_block_result.is_err() {
            return cx.throw_error(format!(
                "Error resolving fromBlock: {:?}",
                from_block_result.unwrap_err()
            ));
        }
        from_block_result.unwrap().to_be_bytes()
    } else {
        0_u64.to_be_bytes()
    };
    let to_block = cx.argument::<JsValue>(6)?;
    let to_block_number_slice = if to_block.is_a::<JsString, _>(&mut cx) {
        let to_block_hex = to_block
            .downcast::<JsString, _>(&mut cx)
            .or_throw(&mut cx)?
            .value(&mut cx);
        let to_block_result = u64::from_str_radix(&to_block_hex[2..], 16);
        if to_block_result.is_err() {
            return cx.throw_error(format!(
                "Error resolving toBlock: {:?}",
                to_block_result.unwrap_err()
            ));
        }
        to_block_result.unwrap().to_be_bytes()
    } else {
        u64::MAX.to_be_bytes()
    };

    let order = cx.argument::<JsString>(7)?.value(&mut cx);
    let skip = cx.argument::<JsValue>(8)?;
    let skip_number = if skip.is_a::<JsNumber, _>(&mut cx) {
        skip.downcast::<JsNumber, _>(&mut cx)
            .or_throw(&mut cx)?
            .value(&mut cx) as usize
    } else {
        0_usize
    };

    let mut start_key = vec![prefix as u8];
    start_key.extend_from_slice(script.code_hash().as_slice());
    start_key.extend_from_slice(script.hash_type().as_slice());

    if order == "asc" {
        match args_len {
            ArgsLen::StringAny => {
                // The `start_key` includes key_prefix, script's code_hash and hash_type
                let iter = store.iter(&start_key, IteratorDirection::Forward);
                if iter.is_err() {
                    return cx.throw_error("Error creating iterator!");
                }
                let iter = iter
                    .unwrap()
                    .take_while(move |(key, _)| key.starts_with(&start_key))
                    .filter(move |(key, _)| {
                        // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                        // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                        // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                        let args_slice: Vec<u8> = key[38..key.len() - 17].try_into().unwrap();
                        if args_slice.starts_with(&args) {
                            from_block_number_slice <= block_number_slice.unwrap()
                                && block_number_slice.unwrap() <= to_block_number_slice
                                && key.ends_with(&io_type_mark)
                        } else {
                            false
                        }
                    })
                    // For the same script prefix(key_prefix + script's code_hash, hash_type and args),
                    // keys are ordered by block_number in rocksdb by default. when args_len = 'any',
                    // there's no guarantee for block_number monotonicity, where extra sort
                    // work is required.
                    .sorted_by(|a, b| {
                        let a_key = a.clone().0;
                        let a_block_number_slice: Vec<u8> =
                            a_key[a_key.len() - 16..a_key.len() - 8].try_into().unwrap();
                        let b_key = b.clone().0;
                        let b_block_number_slice: Vec<u8> =
                            b_key[b_key.len() - 16..b_key.len() - 8].try_into().unwrap();
                        a_block_number_slice.cmp(&b_block_number_slice)
                    })
                    .skip(skip_number);
                let boxed_transaction_iterator = cx.boxed(TransactionIterator(Box::new(iter)));
                Ok(boxed_transaction_iterator)
            }
            ArgsLen::UintValue(args_len) => {
                // The `start_key` includes key_prefix, script's code_hash, hash_type and args(total or partial)
                // args_len must cast to u32, matching the 4 bytes length rule in molecule encoding
                start_key.extend_from_slice(&args_len.to_le_bytes());
                start_key.extend_from_slice(&script.args().raw_data());
                let iter = store.iter(&start_key, IteratorDirection::Forward);
                if iter.is_err() {
                    return cx.throw_error("Error creating iterator!");
                }
                let iter = iter
                    .unwrap()
                    .take_while(move |(key, _)| {
                        // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                        // iterate from the minimal key start with `start_key`, stop til meet a key with the block number bigger than `to_block_number_slice`
                        key.starts_with(&start_key)
                            && to_block_number_slice >= block_number_slice.unwrap()
                    })
                    .filter(move |(key, _)| {
                        let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                        // filter out all keys start with `start_key` but the block number smaller than `from_block_number_slice`
                        from_block_number_slice <= block_number_slice.unwrap()
                            && key.ends_with(&io_type_mark)
                    })
                    .skip(skip_number).collect::<Vec<_>>();
                let boxed_transaction_iterator = cx.boxed(TransactionIterator(Box::new(iter.into_iter())));
                Ok(boxed_transaction_iterator)
            }
        }
    } else if order == "desc" {
        match args_len {
            ArgsLen::StringAny => {
                // The `base_prefix` includes key_prefix, script's code_hash and hash_type
                let base_prefix = start_key.clone();
                // Although `args_len` is unknown when using `any`, we need set it large enough(here use maximum value) to traverse db backward without missing any items.
                let start_key = [start_key, vec![0xff; 4]].concat();
                let iter = store.iter(&start_key, IteratorDirection::Reverse);
                if iter.is_err() {
                    return cx.throw_error("Error creating iterator!");
                }
                let iter = iter
                    .unwrap()
                    .take_while(move |(key, _)| key.starts_with(&base_prefix))
                    .filter(move |(key, _)| {
                        // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                        // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                        // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                        let args_slice: Vec<u8> = key[38..key.len() - 17].try_into().unwrap();
                        if args_slice.starts_with(&args) {
                            from_block_number_slice <= block_number_slice.unwrap()
                                && block_number_slice.unwrap() <= to_block_number_slice
                                && key.ends_with(&io_type_mark)
                        } else {
                            false
                        }
                    })
                    // For the same script prefix(key_prefix + script's code_hash, hash_type and args),
                    // keys are ordered by block_number in rocksdb by default. when args_len = 'any',
                    // there's no guarantee for block_number monotonicity, where extra sort
                    // work is required.
                    .sorted_by(|a, b| {
                        let a_key = a.clone().0;
                        let a_block_number_slice: Vec<u8> =
                            a_key[a_key.len() - 16..a_key.len() - 8].try_into().unwrap();
                        let b_key = b.clone().0;
                        let b_block_number_slice: Vec<u8> =
                            b_key[b_key.len() - 16..b_key.len() - 8].try_into().unwrap();
                        b_block_number_slice.cmp(&a_block_number_slice)
                    })
                    .skip(skip_number);
                let boxed_transaction_iterator = cx.boxed(TransactionIterator(Box::new(iter)));
                Ok(boxed_transaction_iterator)
            }
            ArgsLen::UintValue(args_len) => {
                // The `start_key` includes key_prefix, script's code_hash, hash_type and args(total or partial)
                // args_len must cast to u32, matching the 4 bytes length rule in molecule encoding
                start_key.extend_from_slice(&args_len.to_le_bytes());
                start_key.extend_from_slice(&script.args().raw_data());
                // base_prefix includes: key_prefix + script
                let base_prefix = start_key.clone();
                let remain_args_len = (args_len as usize) - script.args().len();
                // `start_key` includes base_prefix + block_number + tx_index + output_index + io_type,
                // we need to set the `start_key` large enough to traverse db backward without missing any items.
                let start_key = [start_key, vec![0xff; remain_args_len + 17]].concat();
                let iter = store.iter(&start_key, IteratorDirection::Reverse);
                if iter.is_err() {
                    return cx.throw_error("Error creating iterator!");
                }
                let iter = iter
                    .unwrap()
                    .take_while(move |(key, _)| {
                        // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                        let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                        // iterate from the maximal key start with `prefix`, stop til meet a key with the block number smaller than `from_block_number_slice`
                        key.starts_with(&base_prefix)
                            && from_block_number_slice <= block_number_slice.unwrap()
                    })
                    .filter(move |(key, _)| {
                        // filter out all keys start with `prefix` but the block number bigger than `to_block_number_slice`
                        let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                        to_block_number_slice >= block_number_slice.unwrap()
                            && key.ends_with(&io_type_mark)
                    })
                    .skip(skip_number).collect::<Vec<_>>();
                let boxed_transaction_iterator = cx.boxed(TransactionIterator(Box::new(iter.into_iter())));
                Ok(boxed_transaction_iterator)
            }
        }
    } else {
        return cx.throw_error("Order must be either asc or desc!");
    }
}

pub fn transaction_iterator_collect(mut cx: FunctionContext) -> JsResult<JsArray> {
    let transaction_iterator = cx.argument::<JsBox<TransactionIterator>>(0)?;
    let mut iterator = transaction_iterator.borrow_mut();
    let mut hashes = vec![];
    while let Some((_key, value)) = iterator.0.next() {
        hashes.push(value.to_vec());
    }
    let js_hashes = JsArray::new(&mut cx, hashes.len() as u32);
    for (i, value) in hashes.iter().enumerate() {
        let hash = Byte32::from_slice(&value);
        if hash.is_err() {
            return cx.throw_error("Malformed data!");
        }
        let js_hash = cx.string(format!("{:#x}", hash.unwrap()));
        js_hashes.set(&mut cx, i as u32, js_hash)?;
    }
    Ok(js_hashes)
}
