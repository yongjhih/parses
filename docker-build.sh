#!/usr/bin/env bash

set -e

cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

url='git://github.com/yongjhih/parses.js'

generate-version() {
  local version="$1"
  docker build --rm -t yongjhih/parses:${version} docker/${version}
}

echo '# maintainer: Andrew Chen <yongjhih@gmail.com> (@yongjhih)'

versions=( docker/*/Dockerfile )
versions=( "${versions[@]#docker/}" )
versions=( "${versions[@]%/*}" )

for version in "${versions[@]}"; do
	generate-version "$version"
done
# vim: set sw=2:
