build:
	yarn workspace @ckb-lumos/config-manager build
	yarn workspace @ckb-lumos/helpers build
	yarn workspace @ckb-lumos/rpc build
	yarn workspace @ckb-lumos/common-scripts build
	yarn workspace @ckb-lumos/hd build
	yarn workspace @ckb-lumos/hd-cache build
	yarn workspace @ckb-lumos/ckb-indexer build
	yarn workspace @ckb-lumos/lumos build

build-release: build
	yarn workspace @ckb-lumos/lumos build:umd

test:
	yarn workspace @ckb-lumos/base test
	yarn workspace @ckb-lumos/common-scripts test
	yarn workspace @ckb-lumos/config-manager test
	yarn workspace @ckb-lumos/hd test
	yarn workspace @ckb-lumos/hd-cache test
	yarn workspace @ckb-lumos/helpers test
	yarn workspace @ckb-lumos/indexer test
	yarn workspace @ckb-lumos/transaction-manager test
	yarn workspace @ckb-lumos/rpc test

test-coverage:
	yarn c8 --reporter=cobertura --reporter=html --clean -o coverage make test
	
lint:
	yarn workspaces run fmt
	yarn workspaces run lint
	git diff --exit-code