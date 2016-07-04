#!/usr/bin/env node

var Parse = require('parse/node').Parse;
var Rx = require('rx');
require('./rx.distincts');
var program = require('commander');

program
  .version('1.0.0')
  .option('-p, --production', 'production')
  .option('-a, --appId <appId>', 'appId')
  .option('-j, --jsKey <jsKey>', 'jsKey')
  .option('-m, --masterKey <masterKey>', 'masterKey')
  .option('--url <url>', 'Specifiy parse api url')
  .option('-f, --config <config>', 'Specifiy config path')
  .option('-c, --class <clazz>', 'Specifiy class')
  .option('-k, --columns <columns>', 'Specifiy columns')
  .option('--dryrun', 'Dryrun')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;
var url = program.url;
var clazz = program.clazz;
var columns = program.columns;

var configPath = program.config;
var config = hasFile(configPath) ? require(configPath) : null;
var configJson;

if (config) {
  if (program.production) {
    appId     = appId ? appId : config.production.appId;
    jsKey     = jsKey ? jsKey : config.production.jsKey;
    masterKey = masterKey ? masterKey : config.production.masterKey;
    url = url ? url : config.production.url;
  } else {
    appId     = appId ? appId : config.dev.appId;
    jsKey     = jsKey ? jsKey : config.dev.jsKey;
    masterKey = masterKey ? masterKey : config.dev.masterKey;
    url = url ? url : config.dev.url;
  }
}

if (program.dryrun) {
  console.log(configJson);
  process.exit();
}

// TODO fatal error and exit
if (!appId) {
  console.error('missing appId');
  process.exit();
}
if (!jsKey) {
  console.error('missing jsKey');
  process.exit();
}
if (!clazz) {
  console.error('missing clazz');
}
console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(url);
if (url) Parse.serverURL = url;
Parse.initialize(appId, jsKey, masterKey);
if (masterKey) Parse.Cloud.useMasterKey();

var Clazz = Parse.Object.extend(clazz);
var query = new Parse.Query(Clazz);
all(query).distinct(function (it) {
  return it.get(columns);
}, null, function (it) {
  it.destroy({});
}).subscribe(function (it) {
  console.log(it);
});

function hasFile(f) {
  if (!f) return false;

  var fs = require('fs');
  var b = false;
  try {
    b = fs.statSync(f).isFile();
  } catch (e) {
  }
  return b;
}

function removeAll(parseQuery) {
  return all(parseQuery).concatMap(function (parseObject) {
    return parseObject.destroy({});
  });
}

/**
 * Required unset limit(), please use Rx.Observable.take() instead.
 * @param {Parse.Query} query
 */
function all(query) {
  return allAsc(query);
}

function allAsc(query) {
  var chunkSize = 100;
  query.ascending('createdAt');
  return Rx.Observable.fromPromise(query.find()).concatMap(function (posts) {
    if (posts.length == chunkSize) {
      var q = query.greaterThanOrEqualTo('createdAt', posts[posts.length - 1].get('createdAt'));
      return Rx.Observable.concat(Rx.Observable.from(posts), all(q));
    } else {
      return Rx.Observable.from(posts);
    }
  }).distinct(function (it) {
    return it.id;
  });
}

function allDesc(query) {
  var chunkSize = 100;
  query.descending('createdAt');
  return Rx.Observable.fromPromise(query.find()).concatMap(function (posts) {
    if (posts.length == chunkSize) {
      var q = query.lessThanOrEqualTo('createdAt', posts[posts.length - 1].get('createdAt'));
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

/* vim: set sw=2: */

