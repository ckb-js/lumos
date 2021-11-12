import { ScriptWrapper } from "@ckb-lumos/base";
import { Script } from "@ckb-lumos/base/lib/core";
import { SearchFilter, SearchKey } from "@ckb-lumos/ckb-indexer/lib/indexer";

const lockScript: ScriptWrapper = {
    lock: Script,
    ioType: 'input',
}

const typeScript: ScriptWrapper = {
    type: Script,
    ioType: 'output',
}

const searchKey: SearchKey {
    script: lock,
    scriptType: ScriptType.lock
    filter: {
        script: type
    }
}
lockIoType: 'input'
typeIoType: 'output'

{
    "jsonrpc": "2.0",
    "result": {
        "last_cursor": "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801dde7801c073dfb3464c7b1f05b806bb2bbb84e99000000000000001d000000000000000001",
        "objects": [
            {
                "block_number": "0x0",
                "io_index": "0x279",
                "io_type": "output",
                "tx_hash": "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c",
                "tx_index": "0x0"
            }
        ]
    },
    "id": 5
}