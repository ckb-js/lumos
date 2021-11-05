# `@ckb-lumos/base`

Test toolkit for testing CKB dApps

## Work With CKB Indexer

Starting a CKB mock rpc

```
$ ts-node packages/testkit/example-ckb-nodes.ts
server listen to 8118
```

And then launching a CKB indexer sync block data from the mock server

```
ckb-indexer -c http://127.0.0.1:8118/rpc -l 127.0.0.1:8116 -s indexer-store-tmp
```
