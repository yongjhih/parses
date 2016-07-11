#!/usr/bin/env bash

file="$1"
collection="${file##*/}"
collection="${collection%.json}"
[ -f "$file" ] || exit 1
[ "$collection" ] || exit 1

echo "$collection"

docker run -it -v `pwd`:`pwd` -w `pwd` mongo mongoimport \
           --collection "$collection" \
           --file "$file" \
           --jsonArray \
           --host localhost \
           --port 27017 \
           -d dev
