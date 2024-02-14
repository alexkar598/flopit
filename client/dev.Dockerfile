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

COPY --from=build /app/node_modules node_modules

VOLUME ["/app/src"]

EXPOSE 4200

CMD ["./node_modules/.bin/ng", "serve", "--host", "0.0.0.0", "--poll", "1000", "--hmr"]
