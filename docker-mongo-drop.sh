#!/usr/bin/env bash

collection="$1"
[ "$collection" ] || exit 1

docker run -it -v `pwd`:`pwd` -w `pwd` mongo mongo \
           --eval "db.getCollection(\"${collection}\").drop()" \
           --host 172.17.0.1 \
           --port 27017 \
           dev
