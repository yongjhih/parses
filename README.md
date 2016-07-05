# Parses

[![npm version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][coveralls-image]][coveralls-url]

[npm-image]: https://img.shields.io/npm/v/parses.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/parses
[travis-image]: https://img.shields.io/travis/yongjhih/parses.js.svg?style=flat-square
[travis-url]: https://travis-ci.org/yongjhih/parses.js
[coveralls-image]: https://img.shields.io/coveralls/yongjhih/parses.js.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yongjhih/parses.js

![](art/parses.png)

## Usage

* Get all emails with paging for example:

```js
var Parses = require('parses');
var query = new Parse.Query("User");

Parses.all(query).subscribe(function(user) {
  console.log(user.get('email'));
});
```

* A parse-emails command line:

```sh
$ npm install parses
$ ./node_modules/.bin/parse-emails --appId fff --jsKey fff --masterKey fff
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
