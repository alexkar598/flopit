FROM alpine:3.19.1

RUN apk add curl

CMD curl 'http://apiserver:3000/graphql' -X POST -H 'Accept: application/graphql-response+json' -H 'content-type: application/json' --data-raw '{"query":"mutation{resetDatabase}","extensions":{}}'