extern crate lazysort;
use crate::helper::*;
use ckb_indexer::{
    indexer::{Error as IndexerError, Indexer, Key, Value},
    store::{RocksdbStore, Store},
};
use ckb_jsonrpc_types::{BlockNumber, BlockView};
use ckb_types::{
    core::BlockView as CoreBlockView,
    packed::{Bytes, CellOutput, OutPoint, Script},
    prelude::*,
};
use futures::Future;
use hyper::rt;
use jsonrpc_core_client::{transports::http, RpcError};
use jsonrpc_derive::rpc;
use neon::prelude::*;
use std::fmt;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, RwLock,
};
use std::thread;
use std::time::Duration;
use std::{cell::RefCell, ops::Deref};

#[derive(Debug)]
pub enum Error {
    Indexer(IndexerError),
    Rpc(RpcError),
    Other(String),
}

#[derive(Debug, PartialEq, Clone)]
pub enum ArgsLen {
    StringAny,
    UintValue(u32),
}

#[rpc(client)]
pub trait CkbRpc {
    #[rpc(name = "get_block_by_number")]
    fn get_block_by_number(&self, _number: BlockNumber) -> Result<Option<BlockView>>;
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl From<IndexerError> for Error {
    fn from(e: IndexerError) -> Error {
        Error::Indexer(e)
    }
}

impl From<RpcError> for Error {
    fn from(e: RpcError) -> Error {
        Error::Rpc(e)
    }
}

type BoxedEmitter = JsBox<RefCell<Emitter>>;
#[derive(Clone)]
pub struct Emitter {
    cb: Option<Arc<Root<JsFunction>>>,
    lock: Option<Script>,
    type_: Option<Script>,
    args_len: ArgsLen,
    output_data: Option<Bytes>,
    from_block: u64,
}

impl Finalize for Emitter {}

impl Emitter {
    pub fn new(mut cx: FunctionContext) -> JsResult<BoxedEmitter> {
        let this = cx.this();
        let callback = this
            .get(&mut cx, "emit")?
            .downcast::<JsFunction, _>(&mut cx)
            .or_throw(&mut cx)?
            .root(&mut cx);
        let js_script = cx.argument::<JsObject>(0)?;
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
        let script_type = cx.argument::<JsNumber>(1)?.value(&mut cx) as u8;
        let args_len = cx.argument::<JsValue>(2)?;
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
        let js_output_data = cx.argument::<JsValue>(3)?;
        let output_data = if js_output_data.is_a::<JsArrayBuffer, _>(&mut cx) {
            let output_data = js_output_data
                .downcast::<JsArrayBuffer, _>(&mut cx)
                .or_throw(&mut cx)?;
            let data = cx.borrow(&output_data, |data| data.as_slice().pack());
            Some(data)
        } else {
            None
        };
        let from_block = cx.argument::<JsValue>(4)?;
        let from_block_number = if from_block.is_a::<JsString, _>(&mut cx) {
            let from_block_hex = from_block
                .downcast::<JsString, _>(&mut cx)
                .or_throw(&mut cx)?
                .value(&mut cx);
            let from_block_result = u64::from_str_radix(&from_block_hex[2..], 16);
            if from_block_result.is_err() {
                return cx.throw_error(format!(
                    "Error resolving from_block: {:?}",
                    from_block_result.unwrap_err()
                ));
            }
            from_block_result.unwrap()
        } else {
            0_u64
        };
        let (lock, type_) = if script_type == 0 {
            (Some(script), None)
        } else {
            (None, Some(script))
        };
        let emitter = Emitter {
            cb: Some(Arc::new(callback)),
            lock: lock,
            type_: type_,
            args_len: args_len,
            output_data: output_data,
            from_block: from_block_number,
        };
        Ok(cx.boxed(RefCell::new(emitter)))
    }
}

type BoxedBlockEmitter = JsBox<RefCell<BlockEmitter>>;
#[derive(Clone)]
pub struct BlockEmitter {
    cb: Arc<Root<JsFunction>>,
}

impl Finalize for BlockEmitter {}

impl BlockEmitter {}

type BoxedNativeIndexer = JsBox<Arc<RwLock<NativeIndexer>>>;
#[derive(Clone)]
pub struct NativeIndexer {
    pub uri: String,
    pub poll_interval: Duration,
    pub running: Arc<AtomicBool>,
    pub indexer: Arc<Indexer<RocksdbStore>>,
    pub emitters: Arc<RwLock<Vec<Emitter>>>,
    pub block_emitter: Option<Arc<RwLock<BlockEmitter>>>,
    pub queue: Arc<EventQueue>,
}
//
impl Finalize for NativeIndexer {}
//
impl NativeIndexer {
    pub fn running(&self) -> bool {
        self.running.load(Ordering::Acquire)
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Release);
    }

    pub fn poll<'a, C: Context<'a>>(
        &self,
        rpc_client: gen_client::Client,
        cx: &mut C,
    ) -> Result<(), Error> {
        if self.running.compare_and_swap(false, true, Ordering::AcqRel) {
            return Ok(());
        }
        loop {
            if !self.running() {
                break;
            }
            if let Some((tip_number, tip_hash)) = self.indexer.tip()? {
                if let Some(block) = rpc_client
                    .get_block_by_number((tip_number + 1).into())
                    .wait()?
                {
                    let block: CoreBlockView = block.into();
                    if block.parent_hash() == tip_hash {
                        // debug!("append {}, {}", block.number(), block.hash());
                        self.indexer.append(&block)?;
                        self.publish_append_block_events(&block, cx)?;
                    } else {
                        // info!("rollback {}, {}", tip_number, tip_hash);
                        // Publish changed events before rollback. It's possible the event published while the rollback operation failed.
                        // Make sure to pull data from db after get notified, as the notification mechanism's design principle is unreliable queue.
                        self.publish_rollback_events(cx)?;
                        self.indexer.rollback()?;
                    }
                } else {
                    thread::sleep(self.poll_interval);
                }
            } else {
                if let Some(block) = rpc_client.get_block_by_number(0u64.into()).wait()? {
                    let block: CoreBlockView = block.into();
                    // debug!("append genesis block hash: {}", block.hash());
                    self.indexer.append(&block)?;
                    self.publish_append_block_events(&block, cx)?;
                }
            }
        }
        Ok(())
    }

    fn init_db_from_json_file<'a, C: Context<'a>>(
        &self,
        file_path: &str,
        cx: &mut C,
    ) -> Result<(), Error> {
        let blocks: Vec<BlockView> = load_blocks_from_json_file(file_path);
        for block_item in blocks.iter() {
            let block: CoreBlockView = block_item.to_owned().into();
            self.indexer.append(&block)?;
            self.publish_append_block_events(&block, cx)?;
        }
        Ok(())
    }

    fn clear_db<'a, C: Context<'a>>(&self, file_path: &str, cx: &mut C) -> Result<(), Error> {
        let blocks: Vec<BlockView> = load_blocks_from_json_file(file_path);
        for _block_item in blocks.iter() {
            self.publish_rollback_events(cx)?;
            self.indexer.rollback()?;
        }
        Ok(())
    }

    fn publish_append_block_events<'a, C: Context<'a>>(
        &self,
        block: &CoreBlockView,
        cx: &mut C,
    ) -> Result<(), IndexerError> {
        let transactions = block.transactions();
        // self.emit_block_events();
        for (tx_index, tx) in transactions.iter().enumerate() {
            // publish changed events if subscribed script exists in previous output cells , skip the cellbase.
            if tx_index > 0 {
                for (_input_index, input) in tx.inputs().into_iter().enumerate() {
                    let out_point = input.previous_output();
                    let consumed_cell = self
                        .indexer
                        .store()
                        .get(Key::ConsumedOutPoint(block.number(), &out_point).into_vec())?
                        .expect("Transaction inputs' previous_output should be consumed already");
                    let (_generated_by_block_number, _generated_by_tx_index, output, output_data) =
                        Value::parse_cell_value(&consumed_cell);
                    self.filter_events(output, block.number(), output_data, cx);
                }
            }
            // publish changed events if subscribed script exists in output cells.
            for (output_index, output) in tx.outputs().into_iter().enumerate() {
                let output_data = tx
                    .outputs_data()
                    .get(output_index)
                    .expect("outputs_data len should equals outputs len");
                self.filter_events(output, block.number(), output_data, cx);
            }
        }
        Ok(())
    }

    fn publish_rollback_events<'a, C: Context<'a>>(&self, cx: &mut C) -> Result<(), IndexerError> {
        // self.emit_block_events();
        if let Some((block_number, block_hash)) = self.indexer.tip()? {
            let txs = Value::parse_transactions_value(
                &self
                    .indexer
                    .store()
                    .get(Key::Header(block_number, &block_hash).into_vec())?
                    .expect("stored block"),
            );
            for (tx_index, (tx_hash, outputs_len)) in txs.into_iter().enumerate().rev() {
                let tx_index = tx_index as u32;
                // publish changed events if subscribed script exists in output cells.
                for output_index in 0..outputs_len {
                    let out_point = OutPoint::new(tx_hash.clone(), output_index);
                    let out_point_key = Key::OutPoint(&out_point).into_vec();

                    // output cells might be alive or be consumed by tx in the same block.
                    let (_generated_by_block_number, _generated_by_tx_index, output, output_data) =
                        if let Some(stored_live_cell) = self.indexer.store().get(&out_point_key)? {
                            Value::parse_cell_value(&stored_live_cell)
                        } else {
                            let consumed_cell = self
                                .indexer
                                .store()
                                .get(Key::ConsumedOutPoint(block_number, &out_point).into_vec())?
                                .expect("stored live cell or consume output in same block");
                            Value::parse_cell_value(&consumed_cell)
                        };
                    self.filter_events(output, block_number, output_data, cx);
                }
                let transaction_key = Key::TxHash(&tx_hash).into_vec();
                // publish changed events if subscribed script exists in previous output cells , skip the cellbase.
                if tx_index > 0 {
                    for (_input_index, out_point) in self
                        .indexer
                        .store()
                        .get(&transaction_key)?
                        .expect("stored transaction inputs")
                        .chunks_exact(OutPoint::TOTAL_SIZE)
                        .map(|slice| {
                            OutPoint::from_slice(slice)
                                .expect("stored transaction inputs out_point slice")
                        })
                        .enumerate()
                    {
                        let consumed_out_point_key =
                            Key::ConsumedOutPoint(block_number, &out_point).into_vec();

                        let stored_consumed_cell = self
                            .indexer
                            .store()
                            .get(consumed_out_point_key)?
                            .expect("stored consumed cells value");
                        let (
                            _generated_by_block_number,
                            _generated_by_tx_index,
                            output,
                            output_data,
                        ) = Value::parse_cell_value(&stored_consumed_cell);
                        self.filter_events(output, block_number, output_data, cx);
                    }
                }
            }
        }
        Ok(())
    }

    fn filter_events<'a, C: Context<'a>>(
        &self,
        output: CellOutput,
        block_number: u64,
        output_data: Bytes,
        cx: &mut C,
    ) {
        let emitters = self.emitters.read().unwrap();
        let lock_script_emitters = emitters.iter().filter(|x| x.lock.is_some());
        let type_script_emitters = emitters.iter().filter(|x| x.type_.is_some());

        let lock_script = output.lock();
        for emitter in lock_script_emitters.clone() {
            if self.check_filter_options(
                emitter,
                block_number,
                output_data.clone(),
                emitter.lock.clone().unwrap(),
                lock_script.clone(),
            ) {
                self.emit_changed_event(emitter, cx);
            }
        }
        if let Some(type_script) = output.type_().to_opt() {
            for emitter in type_script_emitters.clone() {
                if self.check_filter_options(
                    emitter,
                    block_number,
                    output_data.clone(),
                    emitter.type_.clone().unwrap(),
                    type_script.clone(),
                ) {
                    self.emit_changed_event(emitter, cx);
                }
            }
        }
    }

    /**
     * 1. check emitter's from block number;
     * 2. check emitter's output_data matches;
     * 3. check emitter's script matches(support args prefix matching);
     */
    fn check_filter_options(
        &self,
        emitter: &Emitter,
        block_number: u64,
        output_data: Bytes,
        emitter_script: Script,
        script: Script,
    ) -> bool {
        let check_block_number = emitter.from_block <= block_number;
        let check_output_data = if let Some(data) = &emitter.output_data {
            data.as_slice() == output_data.as_slice()
        } else {
            true
        };
        let check_script = match emitter.args_len {
            ArgsLen::UintValue(args_len) => {
                if args_len == script.args().len() as u32 {
                    if args_len == emitter_script.args().len() as u32 {
                        script == emitter_script
                    } else {
                        check_script_args_prefix_match(emitter_script, script)
                    }
                } else {
                    false
                }
            }
            ArgsLen::StringAny => check_script_args_prefix_match(emitter_script, script),
        };
        check_block_number && check_output_data && check_script
    }

    fn emit_changed_event<'a, C: Context<'a>>(&self, emitter: &Emitter, cx: &mut C) {
        let queue = Arc::clone(&self.queue);
        if let Some(cb) = &emitter.cb {
            let cb = cb.deref().clone(cx);
            std::thread::spawn(move || {
                queue.send(|mut cx| {
                    let callback = cb.into_inner(&mut cx);
                    let this = cx.undefined();
                    let args: Vec<Handle<JsValue>> = vec![cx.string("changed").upcast()];
                    callback.call(&mut cx, this, args).unwrap();
                    Ok(())
                })
            });
        }
    }

    // fn emit_block_events(&self) {
    //     let block_emitters = self.block_emitters.read().unwrap();
    //     for block_emitter in block_emitters.iter().clone() {
    //         self.emit_block_event(block_emitter);
    //     }
    // }

    // fn emit_block_event(&self, emitter: &BlockEmitter) {
    //     if let Some(cb) = &emitter.cb {
    //         cb.schedule(move |cx| vec![cx.string("changed").upcast()] as Vec<Handle<JsValue>>)
    //     }
    // }
}

pub fn new_indexer(mut cx: FunctionContext) -> JsResult<BoxedNativeIndexer> {
    let uri = cx.argument::<JsString>(0)?.value(&mut cx);
    let path = cx.argument::<JsString>(1)?.value(&mut cx);
    let interval_secs = match cx.argument_opt(2) {
        Some(arg) => arg
            .downcast::<JsNumber, _>(&mut cx)
            .or_throw(&mut cx)?
            .value(&mut cx),
        None => 2 as f64,
    };
    let indexer = Arc::new(Indexer::new(RocksdbStore::new(&path), 10000, 1000));
    let native_indexer = NativeIndexer {
        uri: uri,
        poll_interval: Duration::from_secs(interval_secs as u64),
        running: Arc::new(AtomicBool::new(false)),
        indexer: indexer,
        emitters: Arc::new(RwLock::new(vec![])),
        block_emitter: None,
        queue: Arc::new(cx.queue()),
    };
    Ok(cx.boxed(Arc::new(RwLock::new(native_indexer))))
}

pub fn get_emitter(mut cx: FunctionContext) -> JsResult<BoxedEmitter> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let native_indexer = native_indexer.read().unwrap();
    let emitter = Emitter::new(cx)?;
    let mut emitters = native_indexer.emitters.write().unwrap();
    emitters.push(emitter.borrow().clone());
    Ok(emitter)
}

pub fn get_block_emitter(mut cx: FunctionContext) -> JsResult<BoxedBlockEmitter> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let mut native_indexer = native_indexer.write().unwrap();
    if let Some(block_emitter) = &native_indexer.block_emitter {
        let block_emitter = block_emitter.read().unwrap().clone();
        Ok(cx.boxed(RefCell::new(block_emitter)))
    } else {
        let this = cx.this();
        let callback = this
            .get(&mut cx, "emit")?
            .downcast::<JsFunction, _>(&mut cx)
            .or_throw(&mut cx)?
            .root(&mut cx);
        let block_emitter = BlockEmitter {
            cb: Arc::new(callback),
        };
        native_indexer.block_emitter = Some(Arc::new(RwLock::new(block_emitter.clone())));
        Ok(cx.boxed(RefCell::new(block_emitter)))
    }
}

pub fn running(mut cx: FunctionContext) -> JsResult<JsBoolean> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let native_indexer = native_indexer.read().unwrap();
    let running = cx.boolean(native_indexer.running());
    Ok(running)
}

// pub fn start(mut cx: FunctionContext) -> JsResult<JsUndefined> {
//     let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
//     let queue = cx.queue();
//     let indexer = native_indexer.read().unwrap().clone();
//     let indexer2 = indexer.clone();
//     thread::spawn(move || {
//         rt::run(rt::lazy(move || {
//             http::connect(&indexer.uri)
//                 .map_err(|e| e.into())
//                 .and_then(move |client| indexer.poll(client, &mut cx))
//                 .map_err(move |e| {
//                     indexer2.stop();
//                     // error!("Indexer stopped with error: {:?}", e);
//                 })
//         }))
//     });
//     Ok(cx.undefined())
// }

pub fn indexer_init_db_from_json_file(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let native_indexer = native_indexer.read().unwrap();
    let file_path = cx.argument::<JsString>(1)?.value(&mut cx);
    match native_indexer.init_db_from_json_file(&file_path, &mut cx) {
        Ok(()) => Ok(cx.undefined()),
        Err(e) => cx.throw_error(format!("init_db_from_json_file failed: {:?}", e)),
    }
}

pub fn indexer_clear_db(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let native_indexer = native_indexer.read().unwrap();
    let file_path = cx.argument::<JsString>(1)?.value(&mut cx);
    match native_indexer.clear_db(&file_path, &mut cx) {
        Ok(()) => Ok(cx.undefined()),
        Err(e) => cx.throw_error(format!("clear_db failed: {:?}", e)),
    }
}

pub fn stop(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    native_indexer.read().unwrap().stop();
    Ok(cx.undefined())
}

pub fn tip(mut cx: FunctionContext) -> JsResult<JsObject> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let tip = native_indexer.read().unwrap().indexer.tip();
    if tip.is_err() {
        return cx.throw_error(format!("Error fetching tip: {:?}", tip.unwrap_err()));
    }
    let tip = tip.unwrap();
    match tip {
        Some((block_number, block_hash)) => {
            let js_object = cx.empty_object();
            let js_block_number = cx.string(format!("{:#x}", block_number));
            js_object.set(&mut cx, "block_number", js_block_number)?;
            let js_block_hash = cx.string(format!("{:#x}", block_hash));
            js_object.set(&mut cx, "block_hash", js_block_hash)?;
            Ok(js_object)
        }
        // None => Ok(cx.undefined()),
        None => return cx.throw_error("Tip block not found!"),
    }
}

pub fn get_detailed_live_cell(mut cx: FunctionContext) -> JsResult<JsObject> {
    let native_indexer = cx.argument::<JsBox<Arc<RwLock<NativeIndexer>>>>(0)?;
    let js_buffer = cx.argument::<JsArrayBuffer>(0)?;
    let out_point = {
        let guard = cx.lock();
        let buffer = js_buffer.borrow(&guard);
        OutPoint::from_slice(buffer.as_slice())
    };
    if out_point.is_err() {
        return cx.throw_error(format!(
            "You must provide an ArrayBuffer containing a valid OutPoint!"
        ));
    }
    let out_point = out_point.unwrap();
    let indexer = native_indexer.read().unwrap().indexer.clone();
    let detailed_cell = indexer.get_detailed_live_cell(&out_point);
    if detailed_cell.is_err() {
        return cx.throw_error(format!(
            "Error getting live cell: {:?}",
            detailed_cell.err().unwrap()
        ));
    }
    let detailed_cell = detailed_cell.unwrap().unwrap();
    // if detailed_cell.is_none() {
    //     return Ok(cx.undefined());
    // }
    // let detailed_cell = detailed_cell.unwrap();
    let js_cell = JsObject::new(&mut cx);
    let capacity: u64 = detailed_cell.cell_output.capacity().unpack();
    let js_capacity = cx.string(format!("{:#x}", capacity));
    js_cell.set(&mut cx, "capacity", js_capacity)?;

    let js_lock = {
        let script = JsObject::new(&mut cx);
        let code_hash = cx.string(format!(
            "{:#x}",
            detailed_cell.cell_output.lock().code_hash()
        ));
        script.set(&mut cx, "code_hash", code_hash)?;
        let hash_type = if detailed_cell.cell_output.lock().hash_type().as_slice()[0] == 1 {
            cx.string("type")
        } else {
            cx.string("data")
        };
        script.set(&mut cx, "hash_type", hash_type)?;
        let args = cx.string(format!(
            "0x{:x}",
            detailed_cell.cell_output.lock().args().raw_data()
        ));
        script.set(&mut cx, "args", args)?;
        script
    };
    js_cell.set(&mut cx, "lock", js_lock)?;

    if let Some(t) = detailed_cell.cell_output.type_().to_opt() {
        let js_type = {
            let script = JsObject::new(&mut cx);
            let code_hash = cx.string(format!("{:#x}", t.code_hash()));
            script.set(&mut cx, "code_hash", code_hash)?;
            let hash_type = if t.hash_type().as_slice()[0] == 1 {
                cx.string("type")
            } else {
                cx.string("data")
            };
            script.set(&mut cx, "hash_type", hash_type)?;
            let args = cx.string(format!("0x{:x}", t.args().raw_data()));
            script.set(&mut cx, "args", args)?;
            script
        };
        js_cell.set(&mut cx, "type", js_type)?;
    } else {
        let undefined = cx.undefined();
        js_cell.set(&mut cx, "type", undefined)?;
    }

    let cell = JsObject::new(&mut cx);
    cell.set(&mut cx, "cell_output", js_cell)?;

    let js_out_point = JsObject::new(&mut cx);
    let js_tx_hash = cx.string(format!("{:#x}", out_point.tx_hash()));
    js_out_point.set(&mut cx, "tx_hash", js_tx_hash)?;
    let index: u32 = out_point.index().unpack();
    let js_index = cx.string(format!("{:#x}", index));
    js_out_point.set(&mut cx, "index", js_index)?;
    cell.set(&mut cx, "out_point", js_out_point)?;

    let js_block_hash = cx.string(format!("{:#x}", detailed_cell.block_hash));
    let js_block_number = cx.string(format!("{:#x}", detailed_cell.block_number));
    cell.set(&mut cx, "block_hash", js_block_hash)?;
    cell.set(&mut cx, "block_number", js_block_number)?;

    let js_data = cx.string(format!("0x{:x}", detailed_cell.cell_data.raw_data()));
    cell.set(&mut cx, "data", js_data)?;
    Ok(cell)
}
