#!/usr/bin/env node

var Parse = require('parse/node').Parse;
var Rx = require('rx');
var program = require('commander');
var Parses = require('./parses');

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
  .option('-d, --days <days>', 'Process <days> ago until now')
  //.option('--since <SINCE>', 'A Unix timestamp or strtotime data value that points to the start of the range of time-based data')
  //.option('--until <UNTIL>', 'A Unix timestamp or strtotime data value that points to the end of the range of time-based data')
  //.option('--location', 'sync only location posts')
  .option('-u, --user <USER>', 'Specifiy user id')
  .option('-S, --noSkip', 'Dont skip existing tags of post')
  .option('-f, --config <config>', 'Specifiy config path')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;
var days = program.days;
var noSkip = program.noSkip;

var configPath = program.config ? program.config : process.env.HOME + '/.parse/' + 'config.json'; // $ docker-parse list 8tory_dev
var config = hasFile(configPath) ? require(configPath) : null;

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

if (masterKey) Parse.Cloud.useMasterKey();

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
var Tag = Parse.Object.extend('Tag');
var Post = Parse.Object.extend('Post');
var query = new Parse.Query("Post");
query.equalTo("source", "Fb");
query.notEqualTo("message", "");
query.include('tagList');
if (days) {
  query.ascending('createdAt');
  var daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  query.greaterThanOrEqualTo('createdAt', daysAgo);
}
if (!noSkip) {
  query.doesNotExist('tagList');
}

var allObs = Parses.allAsc(query);
if (user) {
  allObs = Parses.get(new Parse.Query(Parse.User), user).flatMap(function (user) {
    query.equalTo('user', user);
    return Parses.allAsc(query);
  });
}

allObs.concatMap(function (post) {
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
        return Parses.save(t);
      } else {
        return Rx.Observable.just(tag);
      }
    });
  }).concatMap(function (tag) {
    return Parses.fetch(tag); // it's necessary after tag saving, TODO move up save(tag).concatMap(tag -> fetch(tag));
  })
  .distinct(function (tag) { return tag.id; })
  .toArray()
  .filter(function (tags) { return tags.length > 0; })
  .concatMap(function (tags) {
    var from = post.get('tagList');
    for (var i = 0; i < tags.length; i++) {
      if (!from || !~from.indexOf(tags[i])) post.addUnique('tagList', tags[i]); // addUnique(key, item)
    }
    return post.dirty() ? Parses.save(post) : Rx.Observable.just(post);
  }) : Rx.Observable.empty();
}).doOnNext(function (post) {
}).subscribe(function (it) {
  console.log(it.get('createdAt'));
}, function (e) { console.log(e); });

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
