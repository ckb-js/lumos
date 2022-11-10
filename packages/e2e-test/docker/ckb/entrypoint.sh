#!/bin/sh

if ! [ -f ckb.toml ]; then
  /bin/ckb init --chain "$CKB_CHAIN" --import-spec /var/dev.toml --ba-arg "$BA_ARG" --ba-code-hash "$BA_CODE_HASH" --ba-hash-type "$BA_HASH_TYPE" --ba-message "$BA_MESSAGE" \
  && sed -ic 's/filter = "info"/filter = "info,ckb-script=debug"/g' ckb.toml
fi

cp /var/ckb-miner.toml /var/lib/ckb/ckb-miner.toml

exec /bin/ckb run --indexer &
sleep 3
exec /bin/ckb miner
