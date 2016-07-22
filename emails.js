#!/usr/bin/env node

var program = require('commander');

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
  .option('--url <url>', 'Specifiy parse api url')
  .option('-f, --config <config>', 'Specifiy config path')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;
var url = program.url;
var days = program.days;

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
if (!masterKey) {
  console.error('missing masterKey');
}
//if (!url) console.error('missing server url');

console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(url);

var Parse = require('parse/node').Parse;
var Rx = require('rx');
var Parses = require('./parses');

if (url) Parse.serverURL = url;
Parse.initialize(appId, jsKey, masterKey);
if (masterKey) Parse.Cloud.useMasterKey();

var query = new Parse.Query("User");
if (days) {
  query.ascending('createdAt');
  var daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  query.greaterThanOrEqualTo('createdAt', daysAgo);
}

Parses.allAsc(query)
  .doOnNext(function(user) {
    console.log(user.get('email'));
  }).subscribe(function (it) {
    console.log(it.get('createdAt'));
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
