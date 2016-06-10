#!/usr/bin/env node

var Parse = require('parse/node').Parse; // for parse
var Rx = require('rx'); // for rx
var configPath = process.env.HOME + '/.parse/' + 'config.json'; // $ docker-parse list 8tory_dev
var config = hasFile(configPath) ? require(configPath) : null;
var program = require('commander'); // for cli args
var Tag = Parse.Object.extend('Tag');
var Post = Parse.Object.extend('Post');

program
  .version('1.0.0')
  .option('-p, --production', 'production')
  .option('-a, --appId <appId>', 'appId')
  .option('-j, --jsKey <jsKey>', 'jsKey')
  .option('-m, --masterKey <masterKey>', 'masterKey')
  //.option('-d, --debug', 'Show debug messages')
  //.option('-i, --info', 'Show info only')
  //.option('-vv, --verbose', 'Show more messages')
  //.option('--years_ago <YEARS_AGO>', 'sync <YEARS_AGO> today 00:00:00 in user\'s timezone')
  //.option('--days <DAYS>', 'sync <DAYS> from <YEARS_AGO>')
  //.option('--since <SINCE>', 'A Unix timestamp or strtotime data value that points to the start of the range of time-based data')
  //.option('--until <UNTIL>', 'A Unix timestamp or strtotime data value that points to the end of the range of time-based data')
  //.option('--location', 'sync only location posts')
  //.option('-u, --user <USER>', 'User\'s object ID')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;

console.log(hasFile(configPath));
if (config) {
  if (program.production) {
    console.warn('production');
    appId     = appId ? appId : config.production.appId;
    jsKey     = jsKey ? jsKey : config.production.jsKey;
    masterKey = masterKey ? masterKey : config.production.masterKey;
  } else {
    console.warn('dev');
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
//query.equalTo("isMainPost", true);
query.equalTo("source", "Fb");
query.notEqualTo("message", "");
query.ascending('createdAt'); // required for all(Parse.Query)
//var Post = Parse.Object.extend('Post');
query.include('tagList');

all(query).concatMap(function (post) {
  var msg = post.get('message');
  if (!msg) return Rx.Observable.empty();
  // ref. http://stackoverflow.com/questions/21109011/javascript-unicode-string-chinese-character-but-no-punctuation
  //var tokens = msg.match(/\#([\u4E00–\u9FCC\u3400–\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d])+/g);
  //var tokens = msg.match(/\#([^\u0000-\u007F]|[\w_-])+/g);
  //var tokens = msg.match(/\#([\u2FF0-\u2FFF]|[\w_-])+/g);
  var tokens = msg.match(/\#([^\u3000-\u303F。，\s]|[\w_-])+/g);

  return tokens ? Rx.Observable.from(tokens).doOnNext(function (token) {
    console.log(msg + ':= ' + token);
}) : Rx.Observable.empty();
}).subscribe();
//}).subscribe();

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

function testSaveTagIntoPost() {
  var q = new Parse.Query("Post");
  q.equalTo("objectId", "gpJQW0ZOgD");
  q.include("tagList");
  all(q).concatMap(function (post) {
    var q2 = new Parse.Query("Tag");
    q2.equalTo("objectId", "dCUztbH1jG");
    return all(q2).concatMap(function (tag) {
      console.log(post);
      console.log(post.get('tagList'));
      post.add('tagList', tag);
      console.log(post.get('tagList'));
      //return save(post);
      return Rx.Observable.fromPromise(post.save());
    });
  }).subscribe(function (it) {
    console.log(it);
  }, function (e) {
    console.log(e);
  });
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
