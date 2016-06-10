#!/usr/bin/env node

var Parse = require('parse/node').Parse; // for parse
var Rx = require('rx'); // for rx
var configPath = process.env.HOME + '/.parse/' + 'config.json'; // $ docker-parse list 8tory_dev
var config = hasFile(configPath) ? require(configPath) : null;
var program = require('commander'); // for cli args

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

var query = new Parse.Query("User");

all(query).doOnNext(function(user) {
  console.log(user.get('email'));
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