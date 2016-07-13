#!/usr/bin/env bash

docker run -it -v `pwd`:`pwd` -w `pwd` mongo mongorestore "$@"
