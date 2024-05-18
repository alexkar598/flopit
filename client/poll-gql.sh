#!/bin/sh

npx graphql-codegen
cp ../server/schema.graphql .

# Date de dernière modification
LTIME=$(find /app -type f -name "*.graphql" -print0 | xargs -0 stat | sort -nr | head -1)

while true
do
   ATIME=$(find /app -type f -name "*.graphql" -print0 | xargs -0 stat | sort -nr | head -1)

   if [[ "$ATIME" != "$LTIME" ]]
   then
       cp ../server/schema.graphql . -p
       npx graphql-codegen
       LTIME=$ATIME
   fi
   sleep 1
done
