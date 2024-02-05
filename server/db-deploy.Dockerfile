FROM node:21.6.1-alpine3.19 as build

COPY package-lock.json .
COPY server/package.json .
RUN npm install --no-save prisma

FROM alpine:3.19.1

RUN apk add nodejs

WORKDIR /app

COPY --from=build node_modules node_modules
COPY server/schema.prisma .
COPY server/migrations migrations


CMD node node_modules/.bin/prisma migrate deploy