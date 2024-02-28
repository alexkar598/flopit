#!/bin/bash

# Démarrer le serveur graphql
cd server || exit
../node_modules/.bin/nodemon -L src/index.ts &

# Démarrer le serveur angular
cd ../client || exit
../node_modules/.bin/ng serve --disable-host-check --poll 1000 --hmr &

# Construire le client graphql continuellement
sh poll-gql.sh &

# Attendre qu'un des processus finissent
wait -n

# Sortir du script avec le code de sortit du processus concerné
exit $?
