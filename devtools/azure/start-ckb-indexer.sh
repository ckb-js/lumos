#!/bin/bash

nohup yarn workspace @ckb-lumos/testkit start &
sleep 5
nohup ./ckb-indexer -c http://127.0.0.1:8118/rpc -l 127.0.0.1:8120 -s indexer-store-tmp &
sleep 5
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_tip"
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8120