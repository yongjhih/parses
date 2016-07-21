#!/usr/bin/env node

var program = require('commander');

program
  .version('1.0.0')
  .option('-p, --production', 'production')
  .option('-a, --appId <appId>', 'appId')
  .option('-j, --jsKey <jsKey>', 'jsKey')
  .option('-m, --masterKey <masterKey>', 'masterKey')
  .option('--url <url>', 'Specifiy parse api url')
  .option('-f, --config <config>', 'Specifiy config path')
  .option('--suffix <config>', 'Specifiy suffix role')
  .option('-c, --clazz <clazz>', 'Specifiy class name')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var url = program.url;
var clazz = program.clazz;
var suffix = program.suffix;

var configPath = program.config ? program.config : process.env.HOME + '/.parse/' + 'config.json'; // $ docker-parse list 8tory_dev
var config = hasFile(configPath) ? require(configPath) : null;

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
  console.error('missing class');
  process.exit();
}
if (!suffix) {
  console.error('missing role suffix');
  process.exit();
}
if (!masterKey) {
  console.error('missing masterKey');
}
//if (!url) console.error('missing server url');

console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(url);
console.log(clazz);
console.log(suffix);

var Parse = require('parse/node').Parse;
var Rx = require('rx');
var Parses = require('./parses');

if (url) Parse.serverURL = url;
Parse.initialize(appId, jsKey, masterKey);
if (masterKey) Parse.Cloud.useMasterKey();

var queryPublic = new Parse.Query(clazz);
queryPublic.equalTo('privacy', 'public');
var queryFriend = new Parse.Query(clazz);
queryFriend.equalTo('privacy', 'friend');

var query = Parse.Query.or(queryPublic, queryFriend);
// ref. https://www.parse.com/questions/how-to-check-if-a-user-has-a-specific-role
// ref. Parse.Query.or() https://parse.com/docs/js/api/classes/Parse.Query.html
// ref. Parse.Query.getACL() https://parse.com/docs/js/api/classes/Parse.Query.html
// ref. Parse.Query.setACL() https://parse.com/docs/js/api/classes/Parse.Query.html
// ref. https://parse.com/docs/js/api/classes/Parse.ACL.html
// https://github.com/Reactive-Extensions/RxJS/blob/master/doc/gettingstarted/errors.md
Parses.all(query).switchMap(function(it) {
  var roleName = it.get('user').id + suffix;
  console.log('user: "' + it.get('user').id + '"');
  console.log('name: "' + roleName + '"');
  var roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo('name', roleName);
  return Parses.first(roleQuery).retryWhen(function (attempts) {
          return Rx.Observable.range(1, 60).zip(attempts, function (i) { return i; }).switchMap(function (i) {
            return Rx.Observable.timer(i * 30000);
          });
        }).filter(function (role) { return role; }).switchMap(function (role) {
    console.log('"' + role + '"');
    var acl = it.getACL();
    acl.setRoleWriteAccess(role, true);
    it.setACL(acl);
    return Parses.save(it).retryWhen(function (attempts) {
      return Rx.Observable.range(1, 60).zip(attempts, function (i, e) {
        console.log(e);
        return i;
      }).switchMap(function (i) {
        return Rx.Observable.timer(i * 30000);
      });
    });
  });
})
.subscribe(function (it) {
  console.log(it);
}, function (e) {
  console.log(e);
});

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
