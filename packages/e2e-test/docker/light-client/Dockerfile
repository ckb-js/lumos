FROM nervos/ckb-docker-builder:bionic-rust-1.61.0 as light-client-docker-builder

WORKDIR /

RUN git clone https://github.com/nervosnetwork/ckb-light-client.git

RUN cd ckb-light-client \
    && git checkout develop \
    && cargo build --release

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl

RUN curl -sSLf "https://github.com/TomWright/dasel/releases/download/v1.27.3/dasel_linux_amd64" -L -o dasel && chmod +x dasel
RUN mv ./dasel /usr/local/bin/dasel

FROM ubuntu:bionic

COPY --from=light-client-docker-builder \
     /usr/lib/x86_64-linux-gnu/libssl.so.* \
     /usr/lib/x86_64-linux-gnu/libcrypto.so.* \
     /usr/lib/x86_64-linux-gnu/

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    curl

COPY --from=light-client-docker-builder \
     /ckb-light-client/target/release/ckb-light-client \
     /usr/local/bin/dasel \
     /usr/local/bin/

WORKDIR /home

COPY ./config.toml ./dev.toml ./entrypoint.sh /home/

ENTRYPOINT ["/home/entrypoint.sh"]
