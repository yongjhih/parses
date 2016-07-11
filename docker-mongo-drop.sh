#!/usr/bin/env bash

collection="$1"
[ "$collection" ] || exit 1

docker run -it -v `pwd`:`pwd` -w `pwd` mongo mongo \
           --eval "db.getCollection(\"${collection}\").drop()" \
           --host localhost \
           --port 27017 \
           dev
