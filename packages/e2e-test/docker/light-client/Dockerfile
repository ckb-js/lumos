FROM nervos/ckb-docker-builder:bionic-rust-1.61.0 as light-client-docker-builder

WORKDIR /

RUN git clone https://github.com/nervosnetwork/ckb-light-client.git

RUN cd ckb-light-client \
    && git checkout develop \
    && cargo build --release

FROM ubuntu:bionic

COPY --from=light-client-docker-builder \
     /usr/lib/x86_64-linux-gnu/libssl.so.* \
     /usr/lib/x86_64-linux-gnu/libcrypto.so.* \
     /usr/lib/x86_64-linux-gnu/

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl

WORKDIR /home

COPY --from=light-client-docker-builder /ckb-light-client/target/release/ckb-light-client /home/
COPY ./config.toml /home/
COPY ./dev.toml /home/
COPY ./entrypoint.sh /home/
COPY ./dasel_linux_386 /usr/local/bin/dasel


ENTRYPOINT ["/home/entrypoint.sh"]
