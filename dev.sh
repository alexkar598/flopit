#!/bin/bash

# Démarrer le serveur graphql
cd server || exit
npx nodemon -L src/index.ts &

# Démarrer le serveur angular
cd ../client || exit
npx ng serve --host 0.0.0.0 --disable-host-check --poll 1000 --hmr &

# Construire le client graphql continuellement
sh poll-gql.sh &

# Attendre qu'un des processus finissent
wait -n

# Sortir du script avec le code de sortit du processus concerné
exit $?
