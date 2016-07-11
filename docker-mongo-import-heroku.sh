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
           -u heroku_k5p5h95k \
           -p 5s9ln739rrviajj71leu324u47 \
           --host ds017195.mlab.com \
           --port 17195 \
           -d heroku_k5p5h95k
