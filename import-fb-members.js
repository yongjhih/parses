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
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;

// TODO fatal error and exit
if (!appId) console.error('missing appId');
if (!jsKey) console.error('missing jsKey');
if (!masterKey) console.error('missing masterKey');
if (!program.token) console.error('missing token');
if (!program.group) console.error('missing group');

console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(program.group);
console.log(program.token);
console.log(program.url);
Parse.initialize(appId, jsKey, masterKey);
if (program.url) Parse.serverURL = program.url;
Parse.Cloud.useMasterKey();

//require('es6-promise').polyfill();
//var Fetch = require('isomorphic-fetch');
var RxFacebook = require('rx-facebook');

RxFacebook.Members(program.group, program.token).take(50).flatMap(function (member) {
  return getFbUserByFbId(member.id).flatMap(function (fbUser) {
    console.log("save group" + program.group);
    fbUser.addUnique("groups", program.group);
    fbUser.set("fbid", member.id);
    fbUser.set("name", member.name);
    fbUser.set("administrator", member.administrator);
    return Rx.Observable.fromPromise(fbUser.save()); // target, new or update
  });
})
.subscribe(function (it) {
  console.log(it);
}, function (e) {
  console.log(e);
});

function getFbUserByFbId(fbid) {
  Parse.Cloud.useMasterKey();
  console.log("getFbUserByFbId: " + fbid);
  console.log(1);
  var FbUser = Parse.Object.extend("FbUser");
  console.log(2);
  var query = new Parse.Query(FbUser);
  console.log(3);
  query.equalTo("fbid", fbid);
  console.log(4);
  return Rx.Observable.fromPromise(query.first()).map(function (user) {
    console.log(5);
    return (user != null) ? user : new FbUser();
  }).defaultIfEmpty(new FbUser());
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
