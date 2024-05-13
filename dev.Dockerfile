FROM prismagraphql/build:alpine-libssl3.0.x as prisma_build

WORKDIR /root

RUN git clone --depth 1 --branch 5.8.1 https://github.com/prisma/prisma-engines.git

ENV SQLITE_MAX_VARIABLE_NUMBER=250000
ENV SQLITE_MAX_EXPR_DEPTH=10000
ENV LIBZ_SYS_STATIC=1

RUN sed -i -e 's|"uuid()"|"cast(create_uuid7() as char(36) charset utf8mb4)"|g' ./prisma-engines/quaint/src/visitor.rs
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    cd prisma-engines && cargo build --release -p query-engine-node-api --manifest-path query-engine/query-engine-node-api/Cargo.toml

FROM node:20.11.1-alpine3.18

RUN apk add --no-cache gcompat

WORKDIR /app

RUN mkdir client server
COPY /client/package.json client/
COPY /client/patches/ client/patches/
COPY /server/package.json server/
COPY /package-lock.json .
COPY /package.json .

COPY --from=prisma_build /root/prisma-engines/target/release/libquery_engine.so libquery_engine.so.node
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/libquery_engine.so.node

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm install

COPY /server/schema.prisma server/

RUN npx prisma generate --schema=server/schema.prisma

COPY /client/ client/
COPY /server/ server/
COPY /dev.sh .

RUN chmod +x client/poll-gql.sh

VOLUME ["/app/client/src", "/app/server/src", "/app/shared"]

EXPOSE 4200 3000

CMD ["sh", "dev.sh"]
