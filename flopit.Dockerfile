FROM rust:1.79.0-alpine AS prisma_build

ENV RUSTFLAGS="-C target-feature=-crt-static" \
  PROTOC_INCLUDE="/usr/include" \
  PROTOC="/usr/bin/protoc"

RUN apk update && \
  apk add perl musl-dev build-base bash clang git protoc protobuf protobuf-dev wget linux-headers libssl3 openssl-dev

WORKDIR /root

RUN git clone --depth 1 --branch 5.8.1 https://github.com/prisma/prisma-engines.git

ENV SQLITE_MAX_VARIABLE_NUMBER=250000
ENV SQLITE_MAX_EXPR_DEPTH=10000
ENV LIBZ_SYS_STATIC=1

RUN sed -i -e 's|"uuid()"|"cast(create_uuid7() as char(36) charset utf8mb4)"|g' ./prisma-engines/quaint/src/visitor.rs
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cd prisma-engines && cargo build --release -p query-engine-node-api --manifest-path query-engine/query-engine-node-api/Cargo.toml

FROM node:20.11.1-alpine3.18 as server

RUN apk add --no-cache gcompat

WORKDIR /app

COPY /server/package.json .
COPY /package-lock.json .

COPY --from=prisma_build /root/prisma-engines/target/release/libquery_engine.so libquery_engine.so.node
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/libquery_engine.so.node

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm install

COPY /server/schema.prisma .

RUN npx prisma generate

COPY /server/ .
COPY /shared /shared

RUN npx tsx cli/schemagen.ts

EXPOSE 3000

CMD ["npx", "tsx", "src/index.ts"]

FROM node:20.11.1-alpine3.18 as client

WORKDIR /app

COPY /client/package.json .
COPY /client/patches/ patches/
COPY /package-lock.json .

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm install

COPY /client/ .
COPY /shared /shared

COPY --from=server /app/schema.graphql .
RUN npx graphql-codegen
RUN npx ng build -c production --source-map

EXPOSE 4200

CMD ["node", "dist/flopit-client/server/server.mjs"]

