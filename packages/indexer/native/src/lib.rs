#[macro_use]
extern crate log;

use ckb_indexer::{
    indexer::{Error as IndexerError, Indexer, KeyPrefix, SCRIPT_SERIALIZE_OFFSET},
    store::{IteratorDirection, RocksdbStore, Store},
};
use ckb_jsonrpc_types::{BlockNumber, BlockView};
use ckb_types::{
    core::{BlockView as CoreBlockView, ScriptHashType},
    packed::{Byte32, OutPoint, Script, ScriptBuilder},
    prelude::*,
};
use futures::Future;
use hyper::rt;
use jsonrpc_core_client::{transports::http, RpcError};
use jsonrpc_derive::rpc;
use neon::prelude::*;
use std::convert::TryInto;
use std::fmt;
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
    // 0: cell, 1: transaction
    subscription_topic: u8,
}

#[derive(Clone)]
pub struct NativeIndexer {
    uri: String,
    poll_interval: Duration,
    running: Arc<AtomicBool>,
    indexer: Arc<Indexer<RocksdbStore>>,
    emitters: Arc<RwLock<Vec<Emitter>>>,
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
                        self.publish_new_block_info(&block);
                    } else {
                        info!("rollback {}, {}", tip_number, tip_hash);
                        self.indexer.rollback()?;
                        self.publish_fork_info(tip_number, tip_hash);
                    }
                } else {
                    thread::sleep(self.poll_interval);
                }
            } else {
                if let Some(block) = rpc_client.get_block_by_number(0u64.into()).wait()? {
                    let block: CoreBlockView = block.into();
                    debug!("append genesis block hash: {}", block.hash());
                    self.indexer.append(&block)?;
                }
            }
        }
        Ok(())
    }

    fn publish_new_block_info(&self, block: &CoreBlockView) {
        let emitters = self.emitters.read().unwrap();
        let lock_script_emitters = emitters.iter().filter(|x| x.lock.is_some());
        let type_script_emitters = emitters.iter().filter(|x| x.type_.is_some());

        let transactions = block.transactions();
        for (_tx_index, tx) in transactions.iter().enumerate() {
            // TODO: cell_consumed event ?
            for (output_index, output) in tx.outputs().into_iter().enumerate() {
                let lock_script = output.lock();
                for emitter in lock_script_emitters.clone() {
                    if lock_script == emitter.lock.clone().unwrap() {
                        if emitter.subscription_topic == 0 {
                            self.emit_cell_generated_event(emitter, tx.hash(), output_index);
                        } else {
                            self.emit_transaction_generated_event(emitter, tx.hash());
                        }
                    }
                }
                if let Some(type_script) = output.type_().to_opt() {
                    for emitter in type_script_emitters.clone() {
                        if type_script == emitter.type_.clone().unwrap() {
                            if emitter.subscription_topic == 0 {
                                self.emit_cell_generated_event(emitter, tx.hash(), output_index);
                            } else {
                                self.emit_transaction_generated_event(emitter, tx.hash());
                            }
                        }
                    }
                }
            }
        }
    }

    fn publish_fork_info(&self, tip_number: u64, tip_hash: Byte32) {
        let emitters = self.emitters.read().unwrap();
        for emitter in emitters.iter() {
            self.emit_chain_forked_event(emitter, tip_number, tip_hash.clone())
        }
    }

    fn emit_cell_generated_event(&self, emitter: &Emitter, tx_hash: Byte32, output_index: usize) {
        if let Some(cb) = &emitter.cb {
            cb.schedule(move |cx| {
                let out_point = OutPoint::new(tx_hash, output_index as u32);
                let mut out_point_buffer =
                    JsArrayBuffer::new(cx, out_point.as_slice().len() as u32).unwrap();
                {
                    let guard = cx.lock();
                    let buffer = out_point_buffer.borrow_mut(&guard);
                    buffer.as_mut_slice().copy_from_slice(out_point.as_slice());
                }
                let args: Vec<Handle<JsValue>> = vec![
                    cx.string("cell_generated").upcast(),
                    out_point_buffer.upcast(),
                ];
                args
            });
        }
    }

    fn emit_transaction_generated_event(&self, emitter: &Emitter, tx_hash: Byte32) {
        if let Some(cb) = &emitter.cb {
            cb.schedule(move |cx| {
                let args: Vec<Handle<JsValue>> = vec![
                    cx.string("transaction_generated").upcast(),
                    cx.string(format!("{:#}", tx_hash)).upcast(),
                ];
                args
            });
        }
    }

    fn emit_chain_forked_event(&self, emitter: &Emitter, block_number: u64, block_hash: Byte32) {
        if let Some(cb) = &emitter.cb {
            cb.schedule(move |cx| {
                let args: Vec<Handle<JsValue>> = vec![
                    cx.string("chain_forked").upcast(),
                    cx.number(block_number as f64).upcast(),
                    cx.string(format!("{:#x}", block_hash)).upcast(),
                ];
                args
            });
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
                emitters: Arc::new(RwLock::new(vec![]))
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
            let skip = cx.argument::<JsValue>(5)?;

            Ok(JsLiveCellIterator::new(&mut cx, vec![this, js_script, script_type, args_len, from_block, to_block, skip])?.upcast())
        }


        method getTransactionsByScriptIterator(mut cx) {
            let this = cx.this().upcast();

            let js_script = cx.argument::<JsValue>(0)?;
            let script_type = cx.argument::<JsValue>(1)?;
            let io_type = cx.argument::<JsValue>(2)?;

            let from_block = cx.argument::<JsValue>(3)?;
            let to_block = cx.argument::<JsValue>(4)?;
            let skip = cx.argument::<JsValue>(5)?;

            Ok(JsTransactionIterator::new(&mut cx, vec![this, js_script, script_type, io_type, from_block, to_block, skip])?.upcast())
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
            let subscription_topic = cx.argument::<JsValue>(2)?;
            let emitter = JsEmitter::new(&mut cx, vec![js_script, script_type, subscription_topic])?;
            {
                let guard = cx.lock();
                let emitter = emitter.borrow(&guard);
                let native_indexer = this.borrow_mut(&guard);
                let mut emitters = native_indexer.emitters.write().unwrap();
                emitters.push(emitter.clone());
            }
            Ok(emitter.upcast())
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
            let subscription_topic = cx.argument::<JsNumber>(2)?.value() as u8;
            let emitter = if script_type == 0  {
                Emitter {
                    cb: None,
                    lock: Some(script),
                    type_: None,
                    subscription_topic: subscription_topic,
                }
            } else {
                Emitter {
                    cb: None,
                    lock: None,
                    type_: Some(script),
                    subscription_topic: subscription_topic,
                }
            };
            Ok(emitter)
        }

        constructor(mut cx) {
            let mut this = cx.this();
            let f = this.get(&mut cx, "emit")?.downcast::<JsFunction>().or_throw(&mut cx)?;
            let cb = EventHandler::new(&cx, this, f);
            {
              let guard = cx.lock();
              let mut emitter = this.borrow_mut(&guard);
              emitter.cb = Some(cb);
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
            let args_len = cx.argument::<JsNumber>(3)?.value();
            if args_len > u32::max_value() as f64 {
                return cx.throw_error("args length must fit in u32 value!");
            }
            let args_len = if args_len <= 0.0 {
                script.args().len() as u32
            } else {
                // when prefix search on args, the args parameter is be shorter than actual args, so need set the args_len manully.
                args_len as u32
            };
            let mut start_key = vec![prefix as u8];
            start_key.extend_from_slice(script.code_hash().as_slice());
            start_key.extend_from_slice(script.hash_type().as_slice());
            start_key.extend_from_slice(&args_len.to_le_bytes());
            start_key.extend_from_slice(&script.args().raw_data());

            let from_block = cx.argument::<JsValue>(4)?;
            let to_block = cx.argument::<JsValue>(5)?;
            let from_block_number_slice = if from_block.is_a::<JsNumber>() {
                let from_block_number = from_block.downcast::<JsNumber>().or_throw(&mut cx)?.value() as u64;
                from_block_number.to_be_bytes()
            } else {
                0_u64.to_be_bytes()
            };
            let to_block_number_slice = if to_block.is_a::<JsNumber>() {
                // here set to_block_number as toBlock + 1, making the toBlock included in query range.
                let to_block_number = to_block.downcast::<JsNumber>().or_throw(&mut cx)?.value() as u64 + 1;
                to_block_number.to_be_bytes()
            } else {
                u64::MAX.to_be_bytes()
            };

            let skip = cx.argument::<JsValue>(6)?;
            let skip_number = if skip.is_a::<JsNumber>() {
                skip.downcast::<JsNumber>().or_throw(&mut cx)?.value() as usize
            } else {
                0_usize
            };

            let iter = store.iter(&start_key, IteratorDirection::Forward);
            if iter.is_err() {
                return cx.throw_error("Error creating iterator!");
            }

            let iter = iter.unwrap()
            .take_while(move |(key, _)| {
                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                key.starts_with(&start_key) && to_block_number_slice > block_number_slice.unwrap()
            })
            .filter( move |(key, _)| {
                let block_number_slice = key[key.len() - 16..key.len() - 8].try_into();
                from_block_number_slice <= block_number_slice.unwrap()
            })
            .skip(skip_number);

            Ok(LiveCellIterator(Box::new(iter)))
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

            let mut start_key = vec![prefix as u8];
            start_key.extend_from_slice(&script.as_slice()[SCRIPT_SERIALIZE_OFFSET..]);
            let mut end_key = start_key.clone();

            let io_type: String = cx.argument::<JsString>(3)?.value();
            let io_type_mark = match &io_type[..] {
                "input" => vec![0],
                "output" => vec![1],
                "both" => vec![],
                _ => return cx.throw_error("io_type should be input or output or both!")
            };

            let from_block = cx.argument::<JsValue>(4)?;
            if from_block.is_a::<JsNumber>() {
                let from_block_number = from_block.downcast::<JsNumber>().or_throw(&mut cx)?.value() as u64;
                start_key.extend_from_slice(&from_block_number.to_be_bytes());
            }
            let to_block = cx.argument::<JsValue>(5)?;
            if to_block.is_a::<JsNumber>() {
                // here set to_block_number as toBlock + 1, making the toBlock included in query range.
                let to_block_number = to_block.downcast::<JsNumber>().or_throw(&mut cx)?.value() as u64 + 1;
                end_key.extend_from_slice(&to_block_number.to_be_bytes());
            } else {
                end_key.extend_from_slice(&u64::MAX.to_be_bytes());
            }

            let skip = cx.argument::<JsValue>(6)?;
            let skip_number = if skip.is_a::<JsNumber>() {
                skip.downcast::<JsNumber>().or_throw(&mut cx)?.value() as usize
            } else {
                0_usize
            };

            let iter = store.iter(&start_key, IteratorDirection::Forward);
            if iter.is_err() {
                return cx.throw_error("Error creating iterator!");
            }
            let iter = iter.unwrap().take_while(move |(key, _)| key.to_vec() < end_key).filter(move |(key, _)| key.ends_with(&io_type_mark)).skip(skip_number);

            Ok(TransactionIterator(Box::new(iter)))
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

register_module!(mut cx, {
    drop(env_logger::init());
    if num_cpus::get() <= 1 {
        return cx.throw_error("lumos indexer requires at least 2 cores to function!");
    }
    debug!("Native indexer module initialized!");
    cx.export_class::<JsNativeIndexer>("Indexer")?;
    cx.export_class::<JsEmitter>("Emitter")?;
    Ok(())
});
