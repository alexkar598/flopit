FROM node:21.6.1-alpine3.19 as build

COPY package-lock.json .
COPY client/package.json .

RUN npm install

FROM alpine:3.19.1

RUN apk add nodejs curl

WORKDIR /app

COPY client/tsconfig.json .
COPY client/tsconfig.app.json .
COPY client/tsconfig.spec.json .
COPY client/package.json .
COPY client/server.ts .
COPY client/angular.json .

COPY --from=build node_modules node_modules

VOLUME ["/app/src"]

EXPOSE 4200

CMD ["./node_modules/.bin/ng", "serve", "--host", "0.0.0.0", "--poll", "1000", "--hmr"]
