## Introduce

All the [indexing](https://github.com/nervosnetwork/ckb/tree/develop/rpc#indexer) RPCs built in the CKB has been deprecated since v0.36.0 and removed in v0.40.0. This is a standalone service for creating cell and transaction indexes as an alternate solution.

## Usage

Build binary from source

```bash
cargo build --release
```

Connect to default ckb rpc service at `http://127.0.0.1:8114` and stores the indexer data at `/tmp/ckb-indexer-test` folder
```bash
RUST_LOG=info ./target/release/ckb-indexer -s /tmp/ckb-indexer-test
```

Or connect to ckb rpc service at `tcp://127.0.0.1:18114`
```bash
RUST_LOG=info ./target/release/ckb-indexer -s /tmp/ckb-indexer-test -c tcp://127.0.0.1:18114
```

Indexing the pending txs in the ckb tx-pool
```bash
RUST_LOG=info ./target/release/ckb-indexer -s /tmp/ckb-indexer-test -c tcp://127.0.0.1:18114 --index-tx-pool
```

Run `ckb-indexer --help` for more information

## RPC

### `get_tip`

Returns the indexed tip block

#### Parameters
    null

#### Returns

    block_hash - indexed tip block hash
    block_number - indexed tip block number

#### Examples

```bash
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_tip"
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8116
```

### `get_cells`

Returns the live cells collection by the lock or type script.

#### Parameters

    search_key:
        script - Script
        scrip_type - enum, lock | type
        filter - filter cells by following conditions, all conditions are optional
            script: if search script type is lock, filter cells by type script prefix, and vice versa
            output_data_len_range: [u64; 2], filter cells by output data len range, [inclusive, exclusive]
            output_capacity_range: [u64; 2], filter cells by output capacity range, [inclusive, exclusive]
            block_range: [u64; 2], filter cells by block number range, [inclusive, exclusive]
    order: enum, asc | desc
    limit: result size limit
    after_cursor: pagination parameter, optional


#### Returns

    objects - live cells
    last_cursor - pagination parameter

#### Examples

get cells by lock script

```bash
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_cells",
    "params": [
        {
            "script": {
                "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                "hash_type": "type",
                "args": "0x8211f1b938a107cd53b6302cc752a6fc3965638d"
            },
            "script_type": "lock"
        },
        "asc",
        "0x64"
    ]
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8116
```

get cells by lock script and filter by type script

```bash
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_cells",
    "params": [
        {
            "script": {
                "code_hash": "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
                "hash_type": "type",
                "args": "0xb728659574c85e88d957bd643bb747a00f018d72"
            },
            "script_type": "lock",
            "filter": {
                "script": {
                    "code_hash": "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
                    "hash_type": "data",
                    "args": "0x94bbc8327e16d195de87815c391e7b9131e80419c51a405a0b21227c6ee05129"
                }
            }
        },
        "asc",
        "0x64"
    ]
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8116
```

get cells by lock script and filter capacity range

```bash
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_cells",
    "params": [
        {
            "script": {
                "code_hash": "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
                "hash_type": "type",
                "args": "0xb728659574c85e88d957bd643bb747a00f018d72"
            },
            "script_type": "lock",
            "filter": {
                "output_capacity_range": ["0x0", "0x6cf8719ffd"]
            }
        },
        "asc",
        "0x64"
    ]
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8116
```

### `get_transactions`

Returns the transactions collection by the lock or type script.

#### Parameters

    search_key:
        script - Script
        scrip_type - enum, lock | type
        filter - filter cells by following conditions, all conditions are optional
            script: if search script type is lock, filter cells by type script, and vice versa
            block_range: [u64; 2], filter cells by block number range, [inclusive, exclusive]
    order: enum, asc | desc
    limit: result size limit
    after_cursor: pagination parameter, optional


#### Returns

    objects - transactions
    last_cursor - pagination parameter

#### Examples

```bash
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_transactions",
    "params": [
        {
            "script": {
                "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                "hash_type": "type",
                "args": "0x8211f1b938a107cd53b6302cc752a6fc3965638d"
            },
            "script_type": "lock"
        },
        "asc",
        "0x64"
    ]
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8116
```

### `get_cells_capacity`

Returns the live cells capacity by the lock or type script.

#### Parameters

    search_key:
        script - Script
        scrip_type - enum, lock | type
        filter - filter cells by following conditions, all conditions are optional
            script: if search script type is lock, filter cells by type script prefix, and vice versa
            output_data_len_range: [u64; 2], filter cells by output data len range, [inclusive, exclusive]
            output_capacity_range: [u64; 2], filter cells by output capacity range, [inclusive, exclusive]
            block_range: [u64; 2], filter cells by block number range, [inclusive, exclusive]

#### Returns

    capacity - total capacity
    block_hash - indexed tip block hash
    block_number - indexed tip block number

#### Examples

```bash
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_cells_capacity",
    "params": [
        {
            "script": {
                "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
                "hash_type": "type",
                "args": "0x8211f1b938a107cd53b6302cc752a6fc3965638d"
            },
            "script_type": "lock"
        }
    ]
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8116
```

### `get_indexer_info`

Returns the indexer service information.

#### Returns

    version - indexer version

#### Examples

```bash
echo '{
    "id": 2,
    "jsonrpc": "2.0",
    "method": "get_indexer_info",
    "params": []
}' \
| tr -d '\n' \
| curl -H 'content-type: application/json' -d @- \
http://localhost:8116
```
