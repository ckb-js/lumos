extern crate lazysort;
use crate::helper::*;
use crate::indexer::*;
use ckb_indexer::{
    indexer::KeyPrefix,
    store::{IteratorDirection, Store},
};
use ckb_types::{
    packed::{Byte32, OutPoint},
    prelude::*,
};
use lazysort::SortedBy;
use neon::prelude::*;
use std::convert::TryInto;
use std::sync::{Arc, RwLock};

type BoxedLiveCellIterator = JsBox<Arc<RwLock<LiveCellIterator>>>;
pub struct LiveCellIterator(Box<dyn Iterator<Item = (Box<[u8]>, Box<[u8]>)> + Send + Sync>);
impl Finalize for LiveCellIterator {}
impl LiveCellIterator {}

pub fn get_live_cells_by_script_iterator(
    mut cx: FunctionContext,
) -> JsResult<BoxedLiveCellIterator> {
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
        KeyPrefix::CellTypeScript
    } else {
        KeyPrefix::CellLockScript
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

    let from_block = cx.argument::<JsValue>(4)?;
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
    let to_block = cx.argument::<JsValue>(5)?;
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

    let order = cx.argument::<JsString>(6)?.value(&mut cx);
    let skip = cx.argument::<JsValue>(7)?;
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
                        // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                        // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                        let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                        // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                        // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                        let args_slice: Vec<u8> = key[38..key.len() - 16].try_into().unwrap();
                        if args_slice.starts_with(&args) {
                            from_block_number_slice <= block_number_slice.unwrap()
                                && block_number_slice.unwrap() <= to_block_number_slice
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
                    .skip(skip_number)
                    .collect::<Vec<_>>();
                Ok(cx.boxed(Arc::new(RwLock::new(LiveCellIterator(Box::new(
                    iter.into_iter(),
                ))))))
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
                        // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                        // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                        let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                        // iterate from the minimal key start with `start_key`, stop til meet a key with the block number bigger than `to_block_number_slice`
                        key.starts_with(&start_key)
                            && to_block_number_slice >= block_number_slice.unwrap()
                    })
                    .filter(move |(key, _)| {
                        let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                        // filter out all keys start with `start_key` but the block number smaller than `from_block_number_slice`
                        from_block_number_slice <= block_number_slice.unwrap()
                    })
                    .skip(skip_number)
                    .collect::<Vec<_>>();
                Ok(cx.boxed(Arc::new(RwLock::new(LiveCellIterator(Box::new(
                    iter.into_iter(),
                ))))))
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
                        // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                        // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                        let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                        // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                        // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                        let args_slice: Vec<u8> = key[38..key.len() - 16].try_into().unwrap();
                        if args_slice.starts_with(&args) {
                            from_block_number_slice <= block_number_slice.unwrap()
                                && block_number_slice.unwrap() <= to_block_number_slice
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
                    .skip(skip_number)
                    .collect::<Vec<_>>();
                Ok(cx.boxed(Arc::new(RwLock::new(LiveCellIterator(Box::new(
                    iter.into_iter(),
                ))))))
            }
            ArgsLen::UintValue(args_len) => {
                // The `start_key` includes key_prefix, script's code_hash, hash_type and args(total or partial)
                // args_len must cast to u32, matching the 4 bytes length rule in molecule encoding
                start_key.extend_from_slice(&args_len.to_le_bytes());
                start_key.extend_from_slice(&script.args().raw_data());
                // base_prefix includes: key_prefix + script
                let base_prefix = start_key.clone();
                let remain_args_len = (args_len as usize) - script.args().len();
                // `start_key` includes base_prefix + block_number + tx_index + output_index,
                // we need to set the `start_key` large enough to traverse db backward without missing any items.
                let start_key = [start_key, vec![0xff; remain_args_len + 16]].concat();
                let iter = store.iter(&start_key, IteratorDirection::Reverse);
                if iter.is_err() {
                    return cx.throw_error("Error creating iterator!");
                }
                let iter = iter
                    .unwrap()
                    .take_while(move |(key, _)| {
                        // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                        // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                        let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                        // iterate from the maximal key start with `prefix`, stop til meet a key with the block number smaller than `from_block_number_slice`
                        key.starts_with(&base_prefix)
                            && from_block_number_slice <= block_number_slice.unwrap()
                    })
                    .filter(move |(key, _)| {
                        // filter out all keys start with `prefix` but the block number bigger than `to_block_number_slice`
                        let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                        to_block_number_slice >= block_number_slice.unwrap()
                    })
                    .skip(skip_number)
                    .collect::<Vec<_>>();
                Ok(cx.boxed(Arc::new(RwLock::new(LiveCellIterator(Box::new(
                    iter.into_iter(),
                ))))))
            }
        }
    } else {
        return cx.throw_error("Order must be either asc or desc!");
    }
}

pub fn live_cell_iterator_collect(mut cx: FunctionContext) -> JsResult<JsArray> {
    let live_cell_iterator = cx.argument::<JsBox<Arc<RwLock<LiveCellIterator>>>>(0)?;

    let live_cell_key_values = {
        let mut iterator = live_cell_iterator.write().unwrap();
        let mut key_values = vec![];
        while let Some((key, value)) = iterator.0.next() {
            key_values.push((key, value));
        }
        key_values
    };
    let js_out_points = JsArray::new(&mut cx, live_cell_key_values.len() as u32);
    for (i, (key, value)) in live_cell_key_values.iter().enumerate() {
        let tx_hash = Byte32::from_slice(&value);
        let index = key[key.len() - 4..].try_into();
        if tx_hash.is_err() || index.is_err() {
            return cx.throw_error("Malformed data!");
        }
        let index = u32::from_be_bytes(index.unwrap());
        let out_point = OutPoint::new(tx_hash.unwrap(), index);
        if cx.argument::<JsBoolean>(0)?.value(&mut cx) {
            let mut js_buffer = JsArrayBuffer::new(&mut cx, out_point.as_slice().len() as u32)?;
            {
                let guard = cx.lock();
                let buffer = js_buffer.borrow_mut(&guard);
                buffer.as_mut_slice().copy_from_slice(out_point.as_slice());
            }
            js_out_points.set(&mut cx, i as u32, js_buffer)?;
        } else {
            let js_out_point = JsObject::new(&mut cx);
            let js_tx_hash = cx.string(format!("{:#x}", out_point.tx_hash()));
            js_out_point.set(&mut cx, "tx_hash", js_tx_hash)?;
            let index: u32 = out_point.index().unpack();
            let js_index = cx.string(format!("{:#x}", index));
            js_out_point.set(&mut cx, "index", js_index)?;
            js_out_points.set(&mut cx, i as u32, js_out_point)?;
        }
    }
    Ok(js_out_points)
}
