#!/bin/sh
set -e

peer_id=$(curl http://$ckb_host:8114/ -X POST -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "local_node_info", "params": [], "id": 1}' |
dasel select -p json --plain '.result.node_id')

dasel delete -f config.toml -p toml '.network.bootnodes'
dasel put string -f ./config.toml -p toml -m '.network.bootnodes.[]' "/ip4/$ckb_host/tcp/8115/p2p/$peer_id"

echo "connect to /ip4/$ckb_host/tcp/8115/p2p/$peer_id"

sleep 3
export RUST_LOG=info,ckb_light_client=trace
exec ckb-light-client run --config-file ./config.toml