#!/usr/bin/env bash

OPTIND=1

while getopts "h:d:u:p:" opt; do
    case "$opt" in
    h)  host=$OPTARG
        ;;
    d)  db=$OPTARG
        ;;
    u)  user=$OPTARG
        ;;
    p)  password=$OPTARG
        ;;
    esac
done

shift $((OPTIND-1))

[ "$1" = "--" ] && shift

collection="$1"
[ "$collection" ] || exit 1

host=$(port:-172.17.0.1:27017)
db=$(db:-dev)

docker run -it -v `pwd`:`pwd` -w `pwd` mongo mongo \
           --eval "db.getCollection(\"${collection}\").drop()" \
           --host "$host" \
           -u "$user"
           -p "$password"
           "$db"
