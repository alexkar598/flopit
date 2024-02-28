FROM node:21.6.1-alpine3.19 as build

WORKDIR /app

COPY package-lock.json .
COPY server/package.json .
COPY server/schema.prisma .

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm install
RUN npx prisma generate

FROM prismagraphql/build:alpine-libssl3.0.x as prisma_build

WORKDIR /root

RUN git clone --depth 1 --branch 5.8.1 https://github.com/prisma/prisma-engines.git

ENV SQLITE_MAX_VARIABLE_NUMBER=250000
ENV SQLITE_MAX_EXPR_DEPTH=10000
ENV LIBZ_SYS_STATIC=1

RUN sed -i -e 's|"uuid()"|"cast(create_uuid7() as char(36) charset utf8mb4)"|g' ./prisma-engines/quaint/src/visitor.rs
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cd prisma-engines && cargo build --release -p query-engine-node-api --manifest-path query-engine/query-engine-node-api/Cargo.toml



FROM alpine:3.19.1

RUN apk add nodejs

WORKDIR /app

COPY server/tsconfig.json .
COPY server/nodemon.json .
COPY server/package.json .

COPY --from=build /app/node_modules node_modules
COPY --from=prisma_build /root/prisma-engines/target/release/libquery_engine.so libquery_engine.so.node

ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/libquery_engine.so.node

VOLUME ["/app/src"]

EXPOSE 3000

CMD ["./node_modules/.bin/nodemon", "-L", "src/index.ts"]