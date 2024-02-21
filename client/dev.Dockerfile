FROM node:21.6.1-alpine3.19 as graphqlbuild

WORKDIR /app

COPY package-lock.json .
COPY server/tsconfig.json .
COPY server/package.json .
COPY server/schema.prisma .
COPY server/src src
COPY server/cli/schemagen.ts cli/schemagen.ts

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm install
RUN npx prisma generate
RUN npx tsx cli/schemagen.ts

FROM node:21.6.1-alpine3.19 as build

WORKDIR /app

COPY package-lock.json .
COPY client/package.json .

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm install

FROM alpine:3.19.1

RUN apk add nodejs

WORKDIR /app

COPY client/tsconfig.json .
COPY client/tsconfig.app.json .
COPY client/tsconfig.spec.json .
COPY client/package.json .
COPY client/server.ts .
COPY client/angular.json .
COPY client/dev.sh .
COPY client/poll-gql.sh .
COPY client/codegen.ts .
COPY --from=graphqlbuild /app/schema.graphql /server/schema.graphql

COPY --from=build /app/node_modules node_modules

VOLUME ["/app/src"]

EXPOSE 4200

CMD ["sh", "dev.sh"]
