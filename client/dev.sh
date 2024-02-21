#!/bin/bash

# Démarrer le serveur angular
./node_modules/.bin/ng serve --host 0.0.0.0 --poll 1000 --hmr &

# Construire le client graphql continuellement
sh poll-gql.sh &

# Attendre qu'un des deux processus finissent
wait -n

# Sortir du script avec le code de sortit du processus concerné
exit $?
