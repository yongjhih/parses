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
  //.option('--days <DAYS>', 'sync <DAYS> from <YEARS_AGO>')
  //.option('--since <SINCE>', 'A Unix timestamp or strtotime data value that points to the start of the range of time-based data')
  //.option('--until <UNTIL>', 'A Unix timestamp or strtotime data value that points to the end of the range of time-based data')
  //.option('--location', 'sync only location posts')
  .option('--url <url>', 'Specifiy parse api url')
  .option('-f, --config <config>', 'Specifiy config path')
  .option('--dryrun', 'Dryrun')
  .arguments('<files...>')
  .action(function (_files) {
    files = _files;
  })
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var user = program.user ? program.user : process.env.PARSE_USER;
var url = program.url;

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
if (!masterKey) {
  console.error('missing masterKey');
}
if (!files) {
  console.error('missing files');
  process.exit();
}
//if (!url) console.error('missing server url');

console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(url);
console.log(files);

var Parses = require('./parses');
var Parse = require('parse/node').Parse;
var Rx = require('rx');

if (url) Parse.serverURL = url;
Parse.initialize(appId, jsKey, masterKey);
if (masterKey) Parse.Cloud.useMasterKey();

Parses.importJson(files)
  .retryWhen(function (attempts) {
    return Rx.Observable.range(1, 3).zip(attempts, function (i) { return i; }).flatMap(function (i) {
      console.log("delay retry by " + i + " second(s)");
      return Rx.Observable.timer(i * 1000);
    });
  })
  .subscribe(function (it) {
    console.log(it);
  }, function (e) {
    console.log(e);
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

/* vim: set sw=2: */
