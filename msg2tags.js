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
  .option('-u, --user <USER>', 'Specifiy user id')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;

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

if (user) {
  query.equalTo("user", user);
}

all(query).doOnNext(function(post) {
  console.log('before: ');
  console.log(post);
  console.log(post.get('message'));
  console.log(post.get('tagList'));
  //var tags = post.get('tagList');
  //for (var i = 0; i < tags.length; ++i) {
    //console.log(tags[i].hashtag);
  //}
}).concatMap(function (post) {
  var msg = post.get('message');
  if (!msg) return Rx.Observable.empty();
  var tokens = msg.match(/\#([^\u3000-\u303F。，\s]|[\w_-])+/g);
  return tokens ? Rx.Observable.from(tokens).concatMap(function (token) {
    var tagQuery = new Parse.Query('Tag');
    tagQuery.equalTo('hashtag', token);

    return Rx.Observable.fromPromise(tagQuery.first()).defaultIfEmpty(null).concatMap(function (tag) { // simulate switchIfEmpty(Rx.Observable)
      if (!tag) {
        var t = new Tag(); // for default
        t.set('type', 'hashtag');
        t.set('hashtag', token);
        console.log('token: ' + token);
        console.log('tag: ' + t);
        console.log(t);
        return save(t);
      } else {
        return Rx.Observable.just(tag);
      }
    });
  }).concatMap(function (tag) {
    return fetch(tag); // it's necessary after tag saving, TODO move up save(tag).concatMap(tag -> fetch(tag));
  }).doOnNext(function (tag) {
    console.log(tag);
  }).toArray().filter(function (it) {
    return it.length > 0;
  }).concatMap(function (tags) {
    console.log(tags);
    for (var i = 0; i < tags.length; ++i) {
      console.log("add(): " + tags[i].hashtag);
      post.addUnique('tagList', tags[i]); // addUnique(key, item)
    }
    //post.addUnique('tagList', tags); // addUnique(key, array) has been tested, it's not expected
    console.log("add(): " + post);
    console.log(post);
    console.log(post.get('tagList'));
    return save(post);
  }) : Rx.Observable.empty();
}).doOnNext(function (post) {
  console.log('after:');
  console.log(post);
  console.log(post.get('taglist'));
  console.log('after: ' + post.get('tagList'));
  console.log('---');
}).subscribe(function (it) {}, function (e) {
  console.log(e);
});
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
