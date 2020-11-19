use anyhow::{anyhow, Result};
use ckb_types::{
    bytes::Bytes,
    packed::{RawTransaction, Script, Transaction, WitnessArgs, WitnessArgsReader},
    prelude::Unpack,
};
use gw_chain::{
    chain::{Chain, HeaderInfo, ProduceBlockParam, SyncInfo, SyncParam, TransactionInfo},
    consensus::{single_aggregator::SingleAggregator, traits::Consensus},
    genesis,
    rpc::Server,
    state_impl::{StateImpl, SyncCodeStore},
    tx_pool::TxPool,
};
use gw_config::{Config, GenesisConfig};
use gw_generator::{generator::DepositionRequest, Generator, HashMapCodeStore};
use gw_types::{
    packed::{AccountMerkleState, L2Block, RawL2Block},
    prelude::*,
};
use neon::prelude::*;
use parking_lot::Mutex;
use std::fs::File;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct NativeChain {
    pub config: Config,
    pub running: Arc<AtomicBool>,
    pub chain: Arc<Chain<SyncCodeStore, SingleAggregator>>,
}

impl NativeChain {
    pub fn running(&self) -> bool {
        self.running.load(Ordering::Acquire)
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Release);
    }
}

declare_types! {
    pub class JsNativeChain for NativeChain {
        init(mut cx) {
            let configPath = cx.argument::<JsString>(0)?.value();
            let file = File::open(configPath).expect("Opening config file");
            //TODO: replace it with toml file
            let content: serde_json::Value = serde_json::from_reader(file).expect("Reading content from config file");
            let config: Config = serde_json::from_value(content).expect("Constructing config");
            let consensus = SingleAggregator::new(config.consensus.aggregator_id);
            let tip = genesis::build_genesis(&config.genesis).expect("Building genesis block from config");
            let genesis = unreachable!();
            let last_synced = HeaderInfo {
                number: 0,
                block_hash: unimplemented!(),
            };
            let code_store = SyncCodeStore::new(Default::default());
            let state = StateImpl::default();
            let tx_pool = {
                let generator = Generator::new(code_store.clone());
                let nb_ctx = consensus.next_block_context(&tip);
                let tx_pool = TxPool::create(state.new_overlay().expect("State new overlay"), generator, &tip, nb_ctx).expect("Creating TxPool");
                Arc::new(Mutex::new(tx_pool))
            };
            let chain = {
                let generator = Generator::new(code_store);
                Chain::new(
                    config.chain,
                    state,
                    consensus,
                    tip,
                    last_synced,
                    generator,
                    Arc::clone(&tx_pool),
                )
            };

            Ok(NativeChain {
                config: config,
                running: Arc::new(AtomicBool::new(false)),
                chain: Arc::new(chain)
            })
        }

        method start_rpc_server(mut cx) {
            let this = cx.this();
            let config = cx.borrow(&this, |data| { data.config.clone() });
            let tx_pool = cx.borrow(&this, |data| { data.chain.tx_pool().clone() });
            Server::new()
                .enable_tx_pool(tx_pool)
                .start(&config.rpc.listen).expect("Starting server");

            Ok(cx.undefined().upcast())
        }

        method sync(mut cx) {
            let this = cx.this();
            let transaction: Transaction = unimplemented!();
            let transaction_info = TransactionInfo {
                transaction: transaction,
                block_hash: [0u8;32]
            };
            let header_info = HeaderInfo {
                number: 100u64,
                block_hash: [0u8;32]
            };
            let deposition_request = DepositionRequest {
                pubkey_hash: [0u8;20],
                account_id: 0u32,
                token_id: [0u8;32],
                value: 100u128
            };
            let deposition_requests = vec![deposition_request];
            let sync_info = SyncInfo {
                transaction_info: transaction_info,
                header_info: header_info,
                deposition_requests: deposition_requests
            };
            let sync_infos: Vec<SyncInfo> = vec![sync_info];
            let forked = false;
            let sync_param = SyncParam {
                sync_infos: sync_infos,
                forked: forked
            };
            let chain = cx.borrow(&this, |data| { data.chain.clone() });
            chain.sync(sync_param).expect("Syncing chain");
            Ok(cx.undefined().upcast())
        }
    }
}
