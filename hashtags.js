#!/usr/bin/env node

var Parse = require('parse/node').Parse;
var Rx = require('rx');
var configPath = process.env.HOME + '/.parse/' + 'config.json'; // $ docker-parse list 8tory_dev
var config = hasFile(configPath) ? require(configPath) : null;
var program = require('commander');
var Tag = Parse.Object.extend('Tag');
var Post = Parse.Object.extend('Post');

program
  .version('1.0.0')
  .option('-p, --production', 'production')
  .option('-a, --appId <appId>', 'appId')
  .option('-j, --jsKey <jsKey>', 'jsKey')
  .option('-m, --masterKey <masterKey>', 'masterKey')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;

console.log(hasFile(configPath));
if (config) {
  if (program.production) {
    appId     = appId ? appId : config.production.appId;
    jsKey     = jsKey ? jsKey : config.production.jsKey;
    masterKey = masterKey ? masterKey : config.production.masterKey;
  } else {
    appId     = appId ? appId : config.dev.appId;
    jsKey     = jsKey ? jsKey : config.dev.jsKey;
    masterKey = masterKey ? masterKey : config.dev.masterKey;
  }
} else {
  console.warn('missing ' + configPath);
}

// TODO fatal error and exit
if (!appId) console.error('missing appId');
if (!jsKey) console.error('missing jsKey');
if (!masterKey) console.error('missing masterKey');

Parse.initialize(appId, jsKey, masterKey);

Parse.Cloud.useMasterKey();

// We should use message_tags from Facebook, not parse message field that's prefix with #
//
// ref.https://developers.facebook.com/docs/graph-api/reference/v2.6/post
//
// {
//   "message_tags": {
//     "{tag-key}": object,
//     "id": string,
//     "name": string,
//     "type": enum{user, page, group},
//     "offset": integer,
//     "length": integer,
//   }
// }
//

var query = new Parse.Query("Post");
query.equalTo("source", "Fb");
query.notEqualTo("message", "");
query.ascending('createdAt');
query.include('tagList');

all(query).concatMap(function (post) {
  var msg = post.get('message');
  if (!msg) return Rx.Observable.empty();
  var tokens = msg.match(/\#([^\u3000-\u303F。，\s]|[\w_-])+/g);

  return tokens ? Rx.Observable.from(tokens).doOnNext(function (token) {
    console.log(msg + ':= ' + token);
}) : Rx.Observable.empty();
}).subscribe();

/**
 * Require `query.ascending('createdAt')` and did not set limit(), please use Rx.Observable.take() instead.
 * @param {Parse.Query} query
 */
function all(query) {
  var chunkSize = 100;
  return Rx.Observable.fromPromise(query.find()).concatMap(function (posts) {
    if (posts.length == chunkSize) {
      var q = query.greaterThan('createdAt', posts[posts.length - 1].get('createdAt'));
      return Rx.Observable.concat(Rx.Observable.from(posts), all(q));
    } else {
      return Rx.Observable.from(posts);
    }
  }).distinct(function (it) {
    return it.id;
  });
}

/**
 * @param {Parse.Object} parseObject
 */
function fetch(parseObject) {
  return Rx.Observable.fromPromise(parseObject.fetch()).map(function (it) {
    return parseObject;
  }).defaultIfEmpty(parseObject);
}

/**
 * @param {Parse.Object} parseObject
 */
function save(parseObject) {
  return Rx.Observable.fromPromise(parseObject.save()).map(function (it) {
    return parseObject;
  }).defaultIfEmpty(parseObject);
}

function hasFile(f) {
  var fs = require('fs');
  var b = false;
  try {
    b = fs.statSync(f).isFile();
  } catch (e) {
  }
  return b;
}

/* vim: set sw=2: */
