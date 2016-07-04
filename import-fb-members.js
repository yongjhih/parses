#!/usr/bin/env node

var Parse = require('parse/node').Parse;
var Rx = require('rx');
var program = require('commander');

program
  .version('1.0.0')
  .option('-p, --production', 'production')
  .option('-a, --appId <appId>', 'appId')
  .option('-j, --jsKey <jsKey>', 'jsKey')
  .option('-m, --masterKey <masterKey>', 'masterKey')
  .option('-t, --token <token>', 'facebook access token')
  //.option('-d, --debug', 'Show debug messages')
  //.option('-i, --info', 'Show info only')
  //.option('-vv, --verbose', 'Show more messages')
  //.option('--years_ago <YEARS_AGO>', 'sync <YEARS_AGO> today 00:00:00 in user\'s timezone')
  //.option('--days <DAYS>', 'sync <DAYS> from <YEARS_AGO>')
  //.option('--since <SINCE>', 'A Unix timestamp or strtotime data value that points to the start of the range of time-based data')
  //.option('--until <UNTIL>', 'A Unix timestamp or strtotime data value that points to the end of the range of time-based data')
  //.option('--location', 'sync only location posts')
  .option('-g, --groups <groups>', 'Specifiy group ids')
  .option('--url <url>', 'Specifiy parse api url')
  .option('-f, --config <config>', 'Specifiy config path')
  .option('--dryrun', 'Dryrun')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;
var url = program.url;
var groups = program.groups;
var token = program.token;

var configPath = program.config;
var config = hasFile(configPath) ? require(configPath) : null;
var configJson;

if (config) {
  if (program.production) {
    appId     = appId ? appId : config.production.appId;
    jsKey     = jsKey ? jsKey : config.production.jsKey;
    masterKey = masterKey ? masterKey : config.production.masterKey;
    url = url ? url : config.production.url;
    token = token ? token : config.dev.token;
    groups = groups ? groups : config.dev.groups;
  } else {
    appId     = appId ? appId : config.dev.appId;
    jsKey     = jsKey ? jsKey : config.dev.jsKey;
    masterKey = masterKey ? masterKey : config.dev.masterKey;
    url = url ? url : config.dev.url;
    token = token ? token : config.dev.token;
    groups = groups ? groups : config.dev.groups;
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
if (!masterKey) {
  console.error('missing masterKey');
}
if (!token) {
  console.error('missing token');
  process.exit();
}
/*
if (!groups) {
  console.error('missing groups');
  process.exit();
}
*/
//if (!url) console.error('missing server url');

console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(groups);
console.log(token);
console.log(url);
if (url) Parse.serverURL = url;
Parse.initialize(appId, jsKey, masterKey);
Parse.Cloud.useMasterKey();

//require('es6-promise').polyfill();
//var Fetch = require('isomorphic-fetch');
var RxFacebook = require('rx-facebook');
var groupsJson = require('./a7-verified-groups.json');

Rx.Observable.from(groupsJson).map(function (group) { return group.id; })
  .concatMap(function (group) {
    return RxFacebook.Members(group, token)
      .concatMap(function (member) {
        return getFbUserByFbId(member.id).concatMap(function (fbUser) {
          console.log(member.id + ":" + group + ":\"" + member.name + "\"");
          fbUser.addUnique("groups", group);
          fbUser.set("fbid", member.id);
          fbUser.set("name", member.name);
          return save(fbUser); // target, new or update
        }).concatMap(function (fbUser) {
          fbUser.remove("groups", null);
          fbUser.remove("groups", "null");
          return save(fbUser);
        }).doOnNext(function (it) {
          console.log(it);
        });
      });
  })
  .subscribe(function (it) {
    //console.log(it);
  }, function (e) {
    console.log(e);
  });

function getFbUserByFbId(fbid) {
  var FbUser = Parse.Object.extend("FbUser");
  var query = new Parse.Query(FbUser);
  query.equalTo("fbid", fbid);
  return Rx.Observable.fromPromise(query.first()).catch(function (e) {
    return Rx.Observable.just(new FbUser());
  }).map(function (user) {
    return (user != null) ? user : new FbUser();
  //}).concatMap(function (user) { return fetch(user); }).defaultIfEmpty(new FbUser());
  }).defaultIfEmpty(new FbUser());
}

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
 * Require `query.ascending('createdAt')` and did not set limit(), please use Rx.Observable.take() instead.
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
