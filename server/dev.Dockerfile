FROM node:21.6.1-alpine3.19 as build

COPY package-lock.json .
COPY server/package.json .
COPY server/schema.prisma .

RUN npm install
RUN npx prisma generate

FROM alpine:3.19.1

RUN apk add nodejs curl

WORKDIR /app

COPY server/tsconfig.json .
COPY server/nodemon.json .
COPY server/package.json .

COPY --from=build node_modules node_modules

VOLUME ["/app/src"]

EXPOSE 3000

CMD ["./node_modules/.bin/nodemon", "-L", "src/index.ts"]