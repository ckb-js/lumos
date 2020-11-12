use anyhow::{anyhow, Result};
use gw_chain::{
    chain::{Chain, HeaderInfo},
    consensus::{single_aggregator::SingleAggregator, traits::Consensus},
    genesis,
    rpc::Server,
    state_impl::{StateImpl, SyncCodeStore},
    tx_pool::TxPool,
};
use gw_config::{Config, GenesisConfig};
use gw_generator::{Generator, HashMapCodeStore};
use gw_types::{
    packed::{AccountMerkleState, L2Block, RawL2Block},
    prelude::*,
};
use neon::prelude::*;
use parking_lot::Mutex;
use std::fs::File;
use std::sync::Arc;

pub struct NativeChain {
    config: Config,
    chain: Chain<SyncCodeStore, SingleAggregator>,
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

            Ok(NativeChain{ config: config, chain: chain})
        }

        method start(mut cx) {
            let this = cx.this();
            let config = cx.borrow(&this, |data| { data.config.clone() });
            let tx_pool = cx.borrow(&this, |data| { data.chain.tx_pool().clone() });
            Server::new()
                .enable_tx_pool(tx_pool)
                .start(&config.rpc.listen).expect("Starting server");
            Ok(cx.undefined().upcast())
        }
    }
}
