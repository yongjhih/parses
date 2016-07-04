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
  .option('-g, --group <group>', 'Specifiy group id')
  .option('--url <url>', 'Specifiy parse api url')
  .option('-f, --config <config>', 'Specifiy config path')
  .option('--dryrun', 'Dryrun')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;
var url = program.url;
var group = program.group;
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
    group = group ? group : config.dev.group;
  } else {
    appId     = appId ? appId : config.dev.appId;
    jsKey     = jsKey ? jsKey : config.dev.jsKey;
    masterKey = masterKey ? masterKey : config.dev.masterKey;
    url = url ? url : config.dev.url;
    token = token ? token : config.dev.token;
    group = group ? group : config.dev.group;
  }
}

if (program.dryrun) {
  console.log(configJson);
  process.exit();
}

// TODO fatal error and exit
if (!appId) console.error('missing appId');
if (!jsKey) console.error('missing jsKey');
if (!masterKey) console.error('missing masterKey');
if (!token) console.error('missing token');
if (!group) console.error('missing group');
//if (!url) console.error('missing server url');

console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(group);
console.log(token);
console.log(url);
if (url) Parse.serverURL = url;
Parse.initialize(appId, jsKey, masterKey);
Parse.Cloud.useMasterKey();

//require('es6-promise').polyfill();
//var Fetch = require('isomorphic-fetch');
var RxFacebook = require('rx-facebook');

RxFacebook.Members(group, token).flatMap(function (member) {
  return getFbUserByFbId(member.id).flatMap(function (fbUser) {
    fbUser.addUnique("groups", group);
    fbUser.set("fbid", member.id);
    fbUser.set("name", member.name);
    fbUser.set("administrator", member.administrator);
    return Rx.Observable.fromPromise(fbUser.save()); // target, new or update
  }).doOnNext(function (it) {
    console.log(it);
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

/* vim: set sw=2: */
