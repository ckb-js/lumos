#[macro_use]
extern crate log;
extern crate lazysort;

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
use std::ops::Deref;
use std::path::PathBuf;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, RwLock,
};
use std::thread;
use std::time::Duration;
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

#[rpc(client)]
pub trait CkbRpc {
    #[rpc(name = "get_block_by_number")]
    fn get_block_by_number(&self, _number: BlockNumber) -> Result<Option<BlockView>>;
}

pub struct TransactionIterator(Box<dyn Iterator<Item = (Box<[u8]>, Box<[u8]>)>>);
pub struct LiveCellIterator(Box<dyn Iterator<Item = (Box<[u8]>, Box<[u8]>)>>);

#[derive(Clone)]
pub struct Emitter {
    cb: Option<EventHandler>,
    lock: Option<Script>,
    type_: Option<Script>,
    args_len: ArgsLen,
    output_data: Option<Bytes>,
    from_block: u64,
}

#[derive(Clone)]
pub struct BlockEmitter {
    cb: Option<EventHandler>,
}

#[derive(Clone)]
pub struct NativeIndexer {
    uri: String,
    poll_interval: Duration,
    running: Arc<AtomicBool>,
    indexer: Arc<Indexer<RocksdbStore>>,
    emitters: Arc<RwLock<Vec<Emitter>>>,
    block_emitter: Option<Arc<RwLock<BlockEmitter>>>,
}

impl NativeIndexer {
    pub fn running(&self) -> bool {
        self.running.load(Ordering::Acquire)
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Release);
    }

    pub fn poll(&self, rpc_client: gen_client::Client) -> Result<(), Error> {
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
                        debug!("append {}, {}", block.number(), block.hash());
                        self.indexer.append(&block)?;
                        self.publish_append_block_events(&block)?;
                    } else {
                        info!("rollback {}, {}", tip_number, tip_hash);
                        // Publish changed events before rollback. It's possible the event published while the rollback operation failed.
                        // Make sure to pull data from db after get notified, as the notification mechanism's design principle is unreliable queue.
                        self.publish_rollback_events()?;
                        self.indexer.rollback()?;
                    }
                } else {
                    thread::sleep(self.poll_interval);
                }
            } else {
                if let Some(block) = rpc_client.get_block_by_number(0u64.into()).wait()? {
                    let block: CoreBlockView = block.into();
                    debug!("append genesis block hash: {}", block.hash());
                    self.indexer.append(&block)?;
                    self.publish_append_block_events(&block)?;
                }
            }
        }
        Ok(())
    }

    fn init_db_from_json_file(&self, file_path: &str) -> Result<(), Error> {
        let blocks: Vec<BlockView> = load_blocks_from_json_file(file_path);
        for block_item in blocks.iter() {
            let block: CoreBlockView = block_item.to_owned().into();
            self.indexer.append(&block)?;
            self.publish_append_block_events(&block)?;
        }
        Ok(())
    }

    fn clear_db(&self, file_path: &str) -> Result<(), Error> {
        let blocks: Vec<BlockView> = load_blocks_from_json_file(file_path);
        for _block_item in blocks.iter() {
            self.publish_rollback_events()?;
            self.indexer.rollback()?;
        }
        Ok(())
    }

    fn publish_append_block_events(&self, block: &CoreBlockView) -> Result<(), IndexerError> {
        let transactions = block.transactions();
        self.emit_block_events();
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
                    self.filter_events(output, block.number(), output_data);
                }
            }
            // publish changed events if subscribed script exists in output cells.
            for (output_index, output) in tx.outputs().into_iter().enumerate() {
                let output_data = tx
                    .outputs_data()
                    .get(output_index)
                    .expect("outputs_data len should equals outputs len");
                self.filter_events(output, block.number(), output_data);
            }
        }
        Ok(())
    }

    fn publish_rollback_events(&self) -> Result<(), IndexerError> {
        self.emit_block_events();
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
                    self.filter_events(output, block_number, output_data);
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
                        self.filter_events(output, block_number, output_data);
                    }
                }
            }
        }
        Ok(())
    }

    fn filter_events(&self, output: CellOutput, block_number: u64, output_data: Bytes) {
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
                self.emit_changed_event(emitter);
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
                    self.emit_changed_event(emitter);
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

    fn emit_changed_event(&self, emitter: &Emitter) {
        if let Some(cb) = &emitter.cb {
            cb.schedule(move |cx| vec![cx.string("changed").upcast()] as Vec<Handle<JsValue>>)
        }
    }

    fn emit_block_events(&self) {
        if let Some(block_emitter) = &self.block_emitter {
            let block_emitter = block_emitter.read().unwrap();
            self.emit_block_event(&block_emitter);
        }
    }

    fn emit_block_event(&self, emitter: &BlockEmitter) {
        if let Some(cb) = &emitter.cb {
            cb.schedule(move |cx| vec![cx.string("changed").upcast()] as Vec<Handle<JsValue>>)
        }
    }
}

declare_types! {
    pub class JsNativeIndexer for NativeIndexer {
        init(mut cx) {
            let uri: Handle<JsString> = cx.argument::<JsString>(0)?;
            let path: Handle<JsString> = cx.argument::<JsString>(1)?;
            let interval_secs = match cx.argument_opt(2) {
                Some(arg) => arg.downcast::<JsNumber>().or_throw(&mut cx)?.value(),
                None => 2 as f64,
            };
            let indexer = Arc::new(Indexer::new(
                RocksdbStore::new(&path.value()),
                10000,
                1000,
            ));
            Ok(NativeIndexer {
                uri: uri.value(),
                poll_interval: Duration::from_secs(interval_secs as u64),
                running: Arc::new(AtomicBool::new(false)),
                indexer: indexer,
                emitters: Arc::new(RwLock::new(vec![])),
                block_emitter: None,
            })
        }

        method running(mut cx) {
            let this = cx.this();
            let running = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.running()
            };
            Ok(cx.boolean(running).upcast())
        }

        method start(mut cx) {
            let this = cx.this();
            let indexer = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.clone()
            };
            let indexer2 = indexer.clone();
            thread::spawn(move || {
                rt::run(rt::lazy(move || {
                    http::connect(&indexer.uri)
                        .map_err(|e| {
                            e.into()
                        })
                        .and_then(move |client| {
                            indexer.poll(client)
                        })
                        .map_err(move |e| {
                            indexer2.stop();
                            error!("Indexer stopped with error: {:?}", e);
                        })
                }))
            });
            Ok(cx.undefined().upcast())
        }

        method init_db_from_json_file(mut cx) {
            let this = cx.this();
            let file_path = cx.argument::<JsString>(0)?.value();
            let indexer = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.clone()
            };
            match indexer.init_db_from_json_file(&file_path) {
                Ok(()) => Ok(cx.undefined().upcast()),
                Err(e) => cx.throw_error(format!("init_db_from_json_file failed: {:?}", e)),
            }
        }

        method clear_db(mut cx) {
            let this = cx.this();
            let file_path = cx.argument::<JsString>(0)?.value();
            let indexer = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.clone()
            };
            match indexer.clear_db(&file_path) {
                Ok(()) => Ok(cx.undefined().upcast()),
                Err(e) => cx.throw_error(format!("clear_db failed: {:?}", e)),
            }
        }

        method stop(mut cx) {
            let this = cx.this();
            {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.stop();
            }
            Ok(cx.undefined().upcast())
        }

        method tip(mut cx) {
            let this = cx.this();
            let tip = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.indexer.tip()
            };
            if tip.is_err() {
                return cx.throw_error(format!("Error fetching tip: {:?}", tip.unwrap_err()));
            }
            let tip = tip.unwrap();
            match tip {
                Some((block_number, block_hash)) => {
                    let js_object = JsObject::new(&mut cx);
                    let js_block_number = cx.string(format!("{:#x}", block_number));
                    js_object.set(&mut cx, "block_number", js_block_number)?;
                    let js_block_hash = cx.string(format!("{:#x}", block_hash));
                    js_object.set(&mut cx, "block_hash", js_block_hash)?;
                    Ok(js_object.upcast())
                },
                None => Ok(cx.undefined().upcast())
            }
        }

        method getLiveCellsByScriptIterator(mut cx) {
            let this = cx.this().upcast();

            let js_script = cx.argument::<JsValue>(0)?;
            let script_type = cx.argument::<JsValue>(1)?;
            let args_len = cx.argument::<JsValue>(2)?;

            let from_block = cx.argument::<JsValue>(3)?;
            let to_block = cx.argument::<JsValue>(4)?;
            let order = cx.argument::<JsValue>(5)?;
            let skip = cx.argument::<JsValue>(6)?;

            Ok(JsLiveCellIterator::new(&mut cx, vec![this, js_script, script_type, args_len, from_block, to_block, order, skip])?.upcast())
        }

        method getTransactionsByScriptIterator(mut cx) {
            let this = cx.this().upcast();

            let js_script = cx.argument::<JsValue>(0)?;
            let script_type = cx.argument::<JsValue>(1)?;
            let args_len = cx.argument::<JsValue>(2)?;
            let io_type = cx.argument::<JsValue>(3)?;

            let from_block = cx.argument::<JsValue>(4)?;
            let to_block = cx.argument::<JsValue>(5)?;
            let order = cx.argument::<JsValue>(6)?;
            let skip = cx.argument::<JsValue>(7)?;

            Ok(JsTransactionIterator::new(&mut cx, vec![this, js_script, script_type, args_len, io_type, from_block, to_block, order, skip])?.upcast())
        }

        method getDetailedLiveCell(mut cx) {
            let js_buffer = cx.argument::<JsArrayBuffer>(0)?;
            let out_point = {
                let guard = cx.lock();
                let buffer = js_buffer.borrow(&guard);
                OutPoint::from_slice(buffer.as_slice())
            };
            if out_point.is_err() {
                return cx.throw_error(format!("You must provide an ArrayBuffer containing a valid OutPoint!"));
            }
            let out_point = out_point.unwrap();
            let this = cx.this();
            let inner_indexer = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.indexer.clone()
            };
            let detailed_cell = inner_indexer.get_detailed_live_cell(&out_point);
            if detailed_cell.is_err() {
                return cx.throw_error(format!("Error getting live cell: {:?}", detailed_cell.err().unwrap()));
            }
            let detailed_cell = detailed_cell.unwrap();
            if detailed_cell.is_none() {
                return Ok(cx.undefined().upcast());
            }
            let detailed_cell = detailed_cell.unwrap();

            let js_cell = JsObject::new(&mut cx);
            let capacity: u64 = detailed_cell.cell_output.capacity().unpack();
            let js_capacity = cx.string(format!("{:#x}", capacity));
            js_cell.set(&mut cx, "capacity", js_capacity)?;

            let js_lock = {
                let script = JsObject::new(&mut cx);
                let code_hash = cx.string(format!("{:#x}", detailed_cell.cell_output.lock().code_hash()));
                script.set(&mut cx, "code_hash", code_hash)?;
                let hash_type = if detailed_cell.cell_output.lock().hash_type().as_slice()[0] == 1 {
                    cx.string("type")
                } else {
                    cx.string("data")
                };
                script.set(&mut cx, "hash_type", hash_type)?;
                let args = cx.string(format!("0x{:x}", detailed_cell.cell_output.lock().args().raw_data()));
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

            let result = JsObject::new(&mut cx);
            result.set(&mut cx, "cell_output", js_cell)?;

            let js_out_point = JsObject::new(&mut cx);
            let js_tx_hash = cx.string(format!("{:#x}", out_point.tx_hash()));
            js_out_point.set(&mut cx, "tx_hash", js_tx_hash)?;
            let index: u32 = out_point.index().unpack();
            let js_index = cx.string(format!("{:#x}", index));
            js_out_point.set(&mut cx, "index", js_index)?;
            result.set(&mut cx, "out_point", js_out_point)?;

            let js_block_hash = cx.string(format!("{:#x}", detailed_cell.block_hash));
            let js_block_number = cx.string(format!("{:#x}", detailed_cell.block_number));
            result.set(&mut cx, "block_hash", js_block_hash)?;
            result.set(&mut cx, "block_number", js_block_number)?;

            let js_data = cx.string(format!("0x{:x}", detailed_cell.cell_data.raw_data()));
            result.set(&mut cx, "data", js_data)?;

            Ok(result.upcast())
        }

        method getEmitter(mut cx) {
            let mut this = cx.this();
            let js_script = cx.argument::<JsValue>(0)?;
            let script_type = cx.argument::<JsValue>(1)?;
            let args_len = cx.argument::<JsValue>(2)?;
            let data = cx.argument::<JsValue>(3)?;
            let from_block = cx.argument::<JsValue>(4)?;
            let emitter = JsEmitter::new(&mut cx, vec![js_script, script_type, args_len, data, from_block])?;
            {
                let guard = cx.lock();
                let emitter = emitter.borrow(&guard);
                let native_indexer = this.borrow_mut(&guard);
                let mut emitters = native_indexer.emitters.write().unwrap();
                emitters.push(emitter.clone());
            }
            Ok(emitter.upcast())
        }

        method getBlockEmitter(mut cx) {
            let mut this = cx.this();
            let block_emitter =
            {
                let guard = cx.lock();
                let mut native_indexer = this.borrow_mut(&guard);
                if let Some(block_emitter) = native_indexer.block_emitter {
                    let block_emitter: BlockEmitter = block_emitter.read().unwrap().deref().to_owned();
                    // TODO convert block_emitter to JsValue
                    // js_block_emitter
                } else {
                    let js_block_emitter = JsBlockEmitter::new::<_, JsBlockEmitter, _>(&mut cx, vec![])?;
                    let block_emitter = js_block_emitter.borrow(&guard);
                    let block_emitter = Arc::new(RwLock::new(block_emitter.clone()));
                    native_indexer.block_emitter = Some(block_emitter);
                    js_block_emitter
                }
            };

            Ok(block_emitter.upcast())
        }
    }

    pub class JsEmitter for Emitter {
        init(mut cx) {
            let js_script  = cx.argument::<JsObject>(0)?;
            let js_code_hash = js_script.get(&mut cx, "code_hash")?
                .downcast::<JsArrayBuffer>()
                .or_throw(&mut cx)?;
            let code_hash = {
                let guard = cx.lock();
                let code_hash = js_code_hash.borrow(&guard);
                code_hash.as_slice().to_vec()
            };
            let js_hash_type = js_script.get(&mut cx, "hash_type")?
                .downcast::<JsNumber>()
                .or_throw(&mut cx)?
                .value();
            let js_args = js_script.get(&mut cx, "args")?
                .downcast::<JsArrayBuffer>()
                .or_throw(&mut cx)?;
            let args = {
                let guard = cx.lock();
                let args = js_args.borrow(&guard);
                args.as_slice().to_vec()
            };
            let script = assemble_packed_script(&code_hash, js_hash_type, &args);
            if script.is_err() {
                return cx.throw_error(format!("Error assembling script: {:?}", script.unwrap_err()));
            }
            let script = script.unwrap();
            let script_type = cx.argument::<JsNumber>(1)?.value() as u8;
            let args_len = cx.argument::<JsValue>(2)?;
            let args_len = if args_len.is_a::<JsString>() {
                let args_len = args_len.downcast::<JsString>().or_throw(&mut cx)?.value();
                if args_len != "any" {
                    return cx.throw_error(format!("The field argsLen must be string \'any\' when it's String type, it's \'{}\' now.", args_len));
                }
                ArgsLen::StringAny
            } else if args_len.is_a::<JsNumber>() {
                let args_len = args_len.downcast::<JsNumber>().or_throw(&mut cx)?.value();
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
            let output_data = if js_output_data.is_a::<JsArrayBuffer>() {
                let output_data = js_output_data.downcast::<JsArrayBuffer>().or_throw(&mut cx)?;
                let data = cx.borrow(&output_data, |data| { data.as_slice().pack() });
                Some(data)
            } else {
                None
            };
            let from_block = cx.argument::<JsValue>(4)?;
            let from_block_number = if from_block.is_a::<JsString>() {
                let from_block_hex = from_block.downcast::<JsString>().or_throw(&mut cx)?.value();
                let from_block_result = u64::from_str_radix(&from_block_hex[2..],16);
                if from_block_result.is_err() {
                    return cx.throw_error(format!("Error resolving from_block: {:?}", from_block_result.unwrap_err()));
                }
                from_block_result.unwrap()
            } else {
                0_u64
            };
            let (lock, type_) = if script_type == 0  {
                    (Some(script),None)
            } else {
                    (None, Some(script))
            };
            Ok(Emitter{
                cb: None,
                lock: lock,
                type_: type_,
                args_len: args_len,
                output_data: output_data,
                from_block: from_block_number,
            })
        }

        constructor(mut cx) {
            let mut this = cx.this();
            let f = this.get(&mut cx, "emit")?
                .downcast::<JsFunction>()
                .or_throw(&mut cx)?;
            let cb = EventHandler::new(&cx, this, f);
            {
              let guard = cx.lock();
              let mut emitter = this.borrow_mut(&guard);
              emitter.cb = Some(cb);
            }
            Ok(None)
        }
    }

    pub class JsBlockEmitter for BlockEmitter {
        init(mut _cx) {
            Ok(BlockEmitter{
                cb: None,
            })
        }

        constructor(mut cx) {
            let mut this = cx.this();
            let f = this.get(&mut cx, "emit")?
                .downcast::<JsFunction>()
                .or_throw(&mut cx)?;
            let cb = EventHandler::new(&cx, this, f);
            {
                let guard = cx.lock();
                let mut block_emitter = this.borrow_mut(&guard);
                block_emitter.cb = Some(cb);
            }
            Ok(None)
        }
    }

    pub class JsLiveCellIterator for LiveCellIterator {
        init(mut cx) {
            let indexer = cx.argument::<JsNativeIndexer>(0)?;
            let store = {
                let guard = cx.lock();
                let indexer = indexer.borrow(&guard);
                indexer.indexer.store().clone()
            };
            let js_script: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let js_code_hash = js_script.get(&mut cx, "code_hash")?
                .downcast::<JsArrayBuffer>()
                .or_throw(&mut cx)?;
            let code_hash = {
                let guard = cx.lock();
                let code_hash = js_code_hash.borrow(&guard);
                code_hash.as_slice().to_vec()
            };
            let js_hash_type = js_script.get(&mut cx, "hash_type")?
                .downcast::<JsNumber>()
                .or_throw(&mut cx)?
                .value();
            let js_args = js_script.get(&mut cx, "args")?
                .downcast::<JsArrayBuffer>()
                .or_throw(&mut cx)?;
            let args = {
                let guard = cx.lock();
                let args = js_args.borrow(&guard);
                args.as_slice().to_vec()
            };
            let script = assemble_packed_script(&code_hash, js_hash_type, &args);
            if script.is_err() {
                return cx.throw_error(format!("Error assembling script: {:?}", script.unwrap_err()));
            }
            let script = script.unwrap();

            let prefix = if cx.argument::<JsNumber>(2)?.value() as u32 == 1 {
                KeyPrefix::CellTypeScript
            } else {
                KeyPrefix::CellLockScript
            };
            let args_len = cx.argument::<JsValue>(3)?;
            let args_len = if args_len.is_a::<JsString>() {
                let args_len = args_len.downcast::<JsString>().or_throw(&mut cx)?.value();
                if args_len != "any" {
                    return cx.throw_error(format!("The field argsLen must be string \'any\' when it's String type, it's \'{}\' now.", args_len));
                }
                ArgsLen::StringAny
            } else if args_len.is_a::<JsNumber>() {
                let args_len = args_len.downcast::<JsNumber>().or_throw(&mut cx)?.value();
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
            let from_block_number_slice = if from_block.is_a::<JsString>() {
                let from_block_hex = from_block.downcast::<JsString>().or_throw(&mut cx)?.value();
                let from_block_result = u64::from_str_radix(&from_block_hex[2..],16);
                if from_block_result.is_err() {
                    return cx.throw_error(format!("Error resolving fromBlock: {:?}", from_block_result.unwrap_err()));
                }
                from_block_result.unwrap().to_be_bytes()
            } else {
                0_u64.to_be_bytes()
            };
            let to_block = cx.argument::<JsValue>(5)?;
            let to_block_number_slice = if to_block.is_a::<JsString>() {
                let to_block_hex = to_block.downcast::<JsString>().or_throw(&mut cx)?.value();
                let to_block_result = u64::from_str_radix(&to_block_hex[2..],16);
                if to_block_result.is_err() {
                    return cx.throw_error(format!("Error resolving toBlock: {:?}", to_block_result.unwrap_err()));
                }
                to_block_result.unwrap().to_be_bytes()
            } else {
                u64::MAX.to_be_bytes()
            };

            let order = cx.argument::<JsString>(6)?.value();
            let skip = cx.argument::<JsValue>(7)?;
            let skip_number = if skip.is_a::<JsNumber>() {
                skip.downcast::<JsNumber>().or_throw(&mut cx)?.value() as usize
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| { key.starts_with(&start_key) })
                            .filter( move |(key, _)| {
                                // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                                // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                                // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                                // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                                let args_slice: Vec<u8> = key[38..key.len()-16].try_into().unwrap();
                                if args_slice.starts_with(&args) {
                                    from_block_number_slice <= block_number_slice.unwrap() && block_number_slice.unwrap() <= to_block_number_slice
                                } else {
                                    false
                                }
                            })
                            // For the same script prefix(key_prefix + script's code_hash, hash_type and args),
                            // keys are ordered by block_number in rocksdb by default. when args_len = 'any',
                            // there's no guarantee for block_number monotonicity, where extra sort
                            // work is required.
                            .sorted_by(|a ,b | {
                                let a_key = a.clone().0;
                                let a_block_number_slice: Vec<u8> = a_key[a_key.len() - 16..a_key.len() - 8].try_into().unwrap();
                                let b_key = b.clone().0;
                                let b_block_number_slice: Vec<u8> = b_key[b_key.len() - 16..b_key.len() - 8].try_into().unwrap();
                                a_block_number_slice.cmp(&b_block_number_slice)
                            })
                            .skip(skip_number);
                       Ok(LiveCellIterator(Box::new(iter)))
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| {
                                // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                                // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                                // iterate from the minimal key start with `start_key`, stop til meet a key with the block number bigger than `to_block_number_slice`
                                key.starts_with(&start_key) && to_block_number_slice >= block_number_slice.unwrap()
                            })
                            .filter( move |(key, _)| {
                                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                                // filter out all keys start with `start_key` but the block number smaller than `from_block_number_slice`
                                from_block_number_slice <= block_number_slice.unwrap()
                            })
                            .skip(skip_number);
                        Ok(LiveCellIterator(Box::new(iter)))
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| { key.starts_with(&base_prefix) })
                            .filter( move |(key, _)| {
                                // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                                // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                                // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                                // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                                let args_slice: Vec<u8> = key[38..key.len()-16].try_into().unwrap();
                                if args_slice.starts_with(&args) {
                                    from_block_number_slice <= block_number_slice.unwrap() && block_number_slice.unwrap() <= to_block_number_slice
                                } else {
                                    false
                                }
                            })
                            // For the same script prefix(key_prefix + script's code_hash, hash_type and args),
                            // keys are ordered by block_number in rocksdb by default. when args_len = 'any',
                            // there's no guarantee for block_number monotonicity, where extra sort
                            // work is required.
                            .sorted_by(|a ,b | {
                                let a_key = a.clone().0;
                                let a_block_number_slice: Vec<u8> = a_key[a_key.len() - 16..a_key.len() - 8].try_into().unwrap();
                                let b_key = b.clone().0;
                                let b_block_number_slice: Vec<u8> = b_key[b_key.len() - 16..b_key.len() - 8].try_into().unwrap();
                                b_block_number_slice.cmp(&a_block_number_slice)
                            })
                            .skip(skip_number);
                        Ok(LiveCellIterator(Box::new(iter)))
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| {
                                // 16 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index)
                                // 8 bytes = 4 bytes(tx_index) + 4 bytes(io_index)
                                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                                // iterate from the maximal key start with `prefix`, stop til meet a key with the block number smaller than `from_block_number_slice`
                                key.starts_with(&base_prefix) && from_block_number_slice <= block_number_slice.unwrap()
                            })
                            .filter( move |(key, _)| {
                                // filter out all keys start with `prefix` but the block number bigger than `to_block_number_slice`
                                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                                to_block_number_slice >= block_number_slice.unwrap()
                            })
                            .skip(skip_number);
                        Ok(LiveCellIterator(Box::new(iter)))
                    }
                }
            } else {
                return cx.throw_error("Order must be either asc or desc!");
            }
        }

        method collect(mut cx) {
            let mut this = cx.this();
            let live_cell_key_values = {
                let guard = cx.lock();
                let mut iterator = this.borrow_mut(&guard);
                let mut key_values = vec![];
                while let Some((key, value)) = iterator.0.next() {
                    key_values.push((key,value));
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
                if cx.argument::<JsBoolean>(0)?.value() {
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

            Ok(js_out_points.upcast())
        }
    }
    pub class JsTransactionIterator for TransactionIterator {
        init(mut cx) {
            let indexer = cx.argument::<JsNativeIndexer>(0)?;
            let store = {
                let guard = cx.lock();
                let indexer = indexer.borrow(&guard);
                indexer.indexer.store().clone()
            };
            let js_script: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let js_code_hash = js_script.get(&mut cx, "code_hash")?
                .downcast::<JsArrayBuffer>()
                .or_throw(&mut cx)?;
            let code_hash = {
                let guard = cx.lock();
                let code_hash = js_code_hash.borrow(&guard);
                code_hash.as_slice().to_vec()
            };
            let js_hash_type = js_script.get(&mut cx, "hash_type")?
                .downcast::<JsNumber>()
                .or_throw(&mut cx)?
                .value();
            let js_args = js_script.get(&mut cx, "args")?
                .downcast::<JsArrayBuffer>()
                .or_throw(&mut cx)?;
            let args = {
                let guard = cx.lock();
                let args = js_args.borrow(&guard);
                args.as_slice().to_vec()
            };
            let script = assemble_packed_script(&code_hash, js_hash_type, &args);
            if script.is_err() {
                return cx.throw_error(format!("Error assembling script: {:?}", script.unwrap_err()));
            }
            let script = script.unwrap();

            let prefix = if cx.argument::<JsNumber>(2)?.value() as u32 == 1 {
                KeyPrefix::TxTypeScript
            } else {
                KeyPrefix::TxLockScript
            };


            let args_len = cx.argument::<JsValue>(3)?;
            let args_len = if args_len.is_a::<JsString>() {
                let args_len = args_len.downcast::<JsString>().or_throw(&mut cx)?.value();
                if args_len != "any" {
                    return cx.throw_error(format!("The field argsLen must be string \'any\' when it's String type, it's \'{}\' now.", args_len));
                }
                ArgsLen::StringAny
            } else if args_len.is_a::<JsNumber>() {
                let args_len = args_len.downcast::<JsNumber>().or_throw(&mut cx)?.value();
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

            let io_type: String = cx.argument::<JsString>(4)?.value();
            let io_type_mark = match &io_type[..] {
                "input" => vec![0],
                "output" => vec![1],
                "both" => vec![],
                _ => return cx.throw_error("io_type should be input or output or both!")
            };

            let from_block = cx.argument::<JsValue>(5)?;
            let from_block_number_slice = if from_block.is_a::<JsString>() {
                let from_block_hex = from_block.downcast::<JsString>().or_throw(&mut cx)?.value();
                let from_block_result = u64::from_str_radix(&from_block_hex[2..],16);
                if from_block_result.is_err() {
                    return cx.throw_error(format!("Error resolving fromBlock: {:?}", from_block_result.unwrap_err()));
                }
                from_block_result.unwrap().to_be_bytes()
            } else {
                0_u64.to_be_bytes()
            };
            let to_block = cx.argument::<JsValue>(6)?;
            let to_block_number_slice = if to_block.is_a::<JsString>() {
                let to_block_hex = to_block.downcast::<JsString>().or_throw(&mut cx)?.value();
                let to_block_result = u64::from_str_radix(&to_block_hex[2..],16);
                if to_block_result.is_err() {
                    return cx.throw_error(format!("Error resolving toBlock: {:?}", to_block_result.unwrap_err()));
                }
                to_block_result.unwrap().to_be_bytes()
            } else {
                u64::MAX.to_be_bytes()
            };

            let order = cx.argument::<JsString>(7)?.value();
            let skip = cx.argument::<JsValue>(8)?;
            let skip_number = if skip.is_a::<JsNumber>() {
                skip.downcast::<JsNumber>().or_throw(&mut cx)?.value() as usize
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| { key.starts_with(&start_key) })
                            .filter( move |(key, _)| {
                                // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                                // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                                // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                                let args_slice: Vec<u8> = key[38..key.len()-17].try_into().unwrap();
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
                            .sorted_by(|a ,b | {
                                let a_key = a.clone().0;
                                let a_block_number_slice: Vec<u8> = a_key[a_key.len() - 16..a_key.len() - 8].try_into().unwrap();
                                let b_key = b.clone().0;
                                let b_block_number_slice: Vec<u8> = b_key[b_key.len() - 16..b_key.len() - 8].try_into().unwrap();
                                a_block_number_slice.cmp(&b_block_number_slice)
                            })
                            .skip(skip_number);
                        Ok(TransactionIterator(Box::new(iter)))
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| {
                                // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                                // iterate from the minimal key start with `start_key`, stop til meet a key with the block number bigger than `to_block_number_slice`
                                key.starts_with(&start_key) && to_block_number_slice >= block_number_slice.unwrap()
                            })
                            .filter( move |(key, _)| {
                                let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                                // filter out all keys start with `start_key` but the block number smaller than `from_block_number_slice`
                                from_block_number_slice <= block_number_slice.unwrap()
                                && key.ends_with(&io_type_mark)
                            })
                            .skip(skip_number);
                        Ok(TransactionIterator(Box::new(iter)))
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| { key.starts_with(&base_prefix) })
                            .filter( move |(key, _)| {
                                // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                                // 38 bytes = 1 byte(key_prefix) + 32 bytes(code_hash) + 1 byte(hash_type) + 4 bytes(args_len)
                                // the `args_len` is unknown when using `any`, but we can extract the full args_slice and do the prefix match.
                                let args_slice: Vec<u8> = key[38..key.len()-17].try_into().unwrap();
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
                            .sorted_by(|a ,b | {
                                let a_key = a.clone().0;
                                let a_block_number_slice: Vec<u8> = a_key[a_key.len() - 16..a_key.len() - 8].try_into().unwrap();
                                let b_key = b.clone().0;
                                let b_block_number_slice: Vec<u8> = b_key[b_key.len() - 16..b_key.len() - 8].try_into().unwrap();
                                b_block_number_slice.cmp(&a_block_number_slice)
                            })
                            .skip(skip_number);
                        Ok(TransactionIterator(Box::new(iter)))
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
                        let iter = iter.unwrap()
                            .take_while(move |(key, _)| {
                                // 17 bytes = 8 bytes(block_number) + 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                // 9 bytes = 4 bytes(tx_index) + 4 bytes(io_index) + 1 byte(io_type)
                                let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                                // iterate from the maximal key start with `prefix`, stop til meet a key with the block number smaller than `from_block_number_slice`
                                key.starts_with(&base_prefix) && from_block_number_slice <= block_number_slice.unwrap()
                            })
                            .filter( move |(key, _)| {
                                // filter out all keys start with `prefix` but the block number bigger than `to_block_number_slice`
                                let block_number_slice = key[key.len() - 17..key.len() - 9].try_into();
                                to_block_number_slice >= block_number_slice.unwrap()
                                && key.ends_with(&io_type_mark)
                            })
                            .skip(skip_number);
                        Ok(TransactionIterator(Box::new(iter)))
                    }
                }
            } else {
                return cx.throw_error("Order must be either asc or desc!");
            }
        }

        method count(mut cx) {
            let mut this = cx.this();
            let count = {
                let guard = cx.lock();
                let mut iterator = this.borrow_mut(&guard);
                let mut count = 0;
                while iterator.0.next().is_some() {
                    count += 1;
                }
                count
            };
            Ok(cx.number(count as f64).upcast())
        }

        method collect(mut cx) {
            let mut this = cx.this();
            let hashes = {
                let guard = cx.lock();
                let mut iterator = this.borrow_mut(&guard);
                let mut hashes = vec![];
                while let Some((_key, value)) = iterator.0.next() {
                            hashes.push(value.to_vec());
                }
                hashes
            };
            let js_hashes = JsArray::new(&mut cx, hashes.len() as u32);
            for (i, value) in hashes.iter().enumerate() {
                let hash = Byte32::from_slice(&value);
                if hash.is_err() {
                    return cx.throw_error("Malformed data!");
                }
                let js_hash = cx.string(format!("{:#x}", hash.unwrap()));
                js_hashes.set(&mut cx, i as u32, js_hash)?;
            }
            Ok(js_hashes.upcast())
        }

        method next(mut cx) {
            let mut this = cx.this();
            let item = {
                let guard = cx.lock();
                let mut iterator = this.borrow_mut(&guard);
                iterator.0.next()
            };
            match item {
                Some((_key, value)) => {
                    let hash = Byte32::from_slice(&value);
                    if hash.is_err() {
                        return cx.throw_error("Malformed data!");
                    }
                    let js_hash = cx.string(format!("{:#x}", hash.unwrap()));
                    Ok(js_hash.upcast())
                }
                None => Ok(cx.undefined().upcast())
            }
        }
    }
}

fn assemble_packed_script(code_hash: &[u8], hash_type: f64, args: &[u8]) -> Result<Script, Error> {
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
fn load_blocks_from_json_file(file_path: &str) -> Vec<BlockView> {
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
fn check_script_args_prefix_match(emitter_script: Script, script: Script) -> bool {
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

register_module!(mut cx, {
    drop(env_logger::init());
    if num_cpus::get() <= 1 {
        return cx.throw_error("lumos indexer requires at least 2 cores to function!");
    }
    debug!("Native indexer module initialized!");
    cx.export_class::<JsNativeIndexer>("Indexer")?;
    cx.export_class::<JsEmitter>("Emitter")?;
    cx.export_class::<JsBlockEmitter>("BlockEmitter")?;
    Ok(())
});
