# Parses

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][coveralls-image]][coveralls-url]
[![Docker Pulls](https://img.shields.io/docker/pulls/yongjhih/parses.svg?style=flat-square)](https://hub.docker.com/r/yongjhih/parses/)
[![Docker Stars](https://img.shields.io/docker/stars/yongjhih/parses.svg?style=flat-square)](https://hub.docker.com/r/yongjhih/parses/)
[![](https://badge.imagelayers.io/yongjhih/parses.svg)](https://imagelayers.io/?images=yongjhih/parses:latest 'Get your own badge on imagelayers.io')

[npm-image]: https://img.shields.io/npm/v/parses.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/parses
[travis-image]: https://img.shields.io/travis/yongjhih/parses.js.svg?style=flat-square
[travis-url]: https://travis-ci.org/yongjhih/parses.js
[coveralls-image]: https://img.shields.io/coveralls/yongjhih/parses.js.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yongjhih/parses.js

![](art/parses.png)

rx-parse

Easy to use parse with RxJS. A Parse utilities library and cli.

* Get all emails with paging for example:

Before:

```js
var query = new Parse.Query("User");

all(query, 128).then(function(users) {
  for (var i = 0; i < users.length; i++) {
      console.log(users[i].get('email'));
  }
});

function all(query, limit) { // It's sync/blocking until collected due to limit
  var promise = new Parse.Promise();

  query.descending('createdAt');
  var list = [];
  var _all = function (_query) {
    _query.find().then(function (_list) {
      list = list.concat(_list);
      if (_list.length < 100 || list.length >= limit) {
        promise.resolve(list);
        return;
      }
      _query.lessThanOrEqualTo('createdAt', _list[_list.length - 1].createdAt);
      _all(_query);
    }, function (e) {
      promise.reject(e);
    });
  };

  _all(query);

  return promise;
}
```

After:

```js
var Parses = require('parses');
var query = new Parse.Query("User");

Parses.all(query).take(128).subscribe(function(user) { // async
  console.log(user.get('email'));
});
```

## Usage

* A parse-emails command line:

```sh
$ npm install parses
$ ./node_modules/.bin/parse-emails --appId fff --jsKey fff --masterKey fff
```

* A parse-emails docker command line:

```sh
docker run -it yongjhih/parses parse-emails --appId fff --jsKey fff --masterKey fff
```

## Persistent Configuration

~/.parse/config.json:

```json
{
    "dev": {
        "appId": "ffffffffffffffffffffffffffffffffffffffff",
        "jsKey": "ffffffffffffffffffffffffffffffffffffffff",
        "masterKey": "ffffffffffffffffffffffffffffffffffffffff"
    },
    "production": {
        "appId": "ffffffffffffffffffffffffffffffffffffffff",
        "jsKey": "ffffffffffffffffffffffffffffffffffffffff",
        "masterKey": "ffffffffffffffffffffffffffffffffffffffff"
    }
}
```

```sh
$ npm install parses
$ ./node_modules/.bin/parse-emails --production # default 'dev'
```

## Installation

```sh
$ npm install parses
```

## Reference

* https://github.com/ParsePlatform/parse-dashboard/issues/336
* https://github.com/ParsePlatform/parse-server/issues/78

## LICENSE

```
Copyright (C) 2016 8tory, Inc

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
