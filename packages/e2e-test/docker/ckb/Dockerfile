FROM nervos/ckb:v0.106.0

ENV CKB_CHAIN=dev
ENV BA_ARG=0x839f6f4d6fdf773d3e015f8b19fe5c4ccb07723d
ENV BA_CODE_HASH=0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8
ENV BA_HASH_TYPE=type
ENV BA_MESSAGE=0x1234

EXPOSE 8114 8115

COPY --chown=ckb ./entrypoint.sh /bin/
COPY --chown=ckb ./dev.toml ./ckb-miner.toml /var/

ENTRYPOINT ["/bin/entrypoint.sh"]
