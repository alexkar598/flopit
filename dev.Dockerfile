FROM node:20.11.1-alpine3.18

WORKDIR /app

COPY /client/ client/
COPY /server/ server/
COPY /package-lock.json .
COPY /package.json .
COPY /dev.sh .

RUN rm -rf client/src/
RUN rm -rf server/src/

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.cache \
    npm install

RUN npx prisma generate --schema=server/schema.prisma

VOLUME ["/app/client/src", "/app/server/src"]

EXPOSE 4200 3000

CMD ["sh", "dev.sh"]
