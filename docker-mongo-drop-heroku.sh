#!/usr/bin/env bash

collection="$1"
[ "$collection" ] || exit 1

docker run -it -v `pwd`:`pwd` -w `pwd` mongo mongo \
           --eval "db.getCollection(\"${collection}\").drop()" \
           -u heroku_k5p5h95k \
           -p 5s9ln739rrviajj71leu324u47 \
           --host ds017195.mlab.com \
           --port 17195 \
           heroku_k5p5h95k
