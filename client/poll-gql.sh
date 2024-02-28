#!/bin/bash

../node_modules/.bin/graphql-codegen

# Date de dernière modification
LTIME=$(find src -type f -name "*.graphql" -print0 | xargs -0 stat | sort -nr | head -1)

while true
do
   ATIME=$(find src -type f -name "*.graphql" -print0 | xargs -0 stat | sort -nr | head -1)

   if [[ "$ATIME" != "$LTIME" ]]
   then
       ../node_modules/.bin/graphql-codegen
       LTIME=$ATIME
   fi
   sleep 1
done
