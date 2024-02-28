#!/bin/sh

# Démarrer le serveur graphql
cd server || exit
npx nodemon -L src/index.ts &

# Démarrer le serveur angular
cd ../client || exit
npx ng serve --host 0.0.0.0 --disable-host-check --poll 1000 --hmr &

# Construire le client graphql continuellement
pwd
ls -alhp
./poll-gql.sh