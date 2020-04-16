#[macro_use]
extern crate log;

use ckb_indexer::{
    indexer::{Error as IndexerError, Indexer},
    store::{RocksdbStore, Store},
};
use ckb_jsonrpc_types::{BlockNumber, BlockView};
use ckb_types::{
    core::{BlockView as CoreBlockView, ScriptHashType},
    packed::{Script, ScriptBuilder},
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
    Arc,
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

#[derive(Clone)]
pub struct NativeIndexer {
    uri: String,
    poll_interval: Duration,
    running: Arc<AtomicBool>,
    indexer: Arc<Indexer<RocksdbStore>>,
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
                    } else {
                        info!("rollback {}, {}", tip_number, tip_hash);
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
                }
            }
        }
        Ok(())
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
                indexer,
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

        method getLiveCellsByScript(mut cx) {
            let this = cx.this();
            let inner_indexer = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.indexer.clone()
            };
            let js_script: Handle<JsObject> = cx.argument::<JsObject>(0)?;
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
            let out_points = if cx.argument::<JsNumber>(1)?.value() as u32 == 1 {
                inner_indexer.get_live_cells_by_type_script(&script)
            } else {
                inner_indexer.get_live_cells_by_lock_script(&script)
            };
            if out_points.is_err() {
                return cx.throw_error(format!("Error fetching cells: {:?}", out_points.unwrap_err()));
            }
            let out_points = out_points.unwrap();
            let js_out_points = JsArray::new(&mut cx, out_points.len() as u32);
            for (i, out_point) in out_points.iter().enumerate() {
                let js_out_point = JsObject::new(&mut cx);
                let js_tx_hash = cx.string(format!("{:#x}", out_point.tx_hash()));
                js_out_point.set(&mut cx, "tx_hash", js_tx_hash)?;
                let index: u32 = out_point.index().unpack();
                let js_index = cx.string(format!("{:#x}", index));
                js_out_point.set(&mut cx, "index", js_index)?;
                js_out_points.set(&mut cx, i as u32, js_out_point)?;
            }

            Ok(js_out_points.upcast())
        }

        method getTransactionsByScript(mut cx) {
            let this = cx.this();
            let inner_indexer = {
                let guard = cx.lock();
                let indexer = this.borrow(&guard);
                indexer.indexer.clone()
            };
            let js_script: Handle<JsObject> = cx.argument::<JsObject>(0)?;
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
            let hashes = if cx.argument::<JsNumber>(1)?.value() as u32 == 1 {
                inner_indexer.get_transactions_by_type_script(&script)
            } else {
                inner_indexer.get_transactions_by_lock_script(&script)
            };
            if hashes.is_err() {
                return cx.throw_error(format!("Error fetching transactions: {:?}", hashes.unwrap_err()));
            }
            let hashes = hashes.unwrap();
            let js_hashes = JsArray::new(&mut cx, hashes.len() as u32);
            for (i, hash) in hashes.iter().enumerate() {
                let js_hash = cx.string(format!("{:#x}", hash));
                js_hashes.set(&mut cx, i as u32, js_hash)?;
            }

            Ok(js_hashes.upcast())
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
    debug!("Native indexer module initialized!");
    cx.export_class::<JsNativeIndexer>("Indexer")
});
