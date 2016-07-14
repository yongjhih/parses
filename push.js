#!/usr/bin/env node

var program = require('commander');

program
  .version('1.0.0')
  .option('-p, --production', 'production')
  .option('-a, --appId <appId>', 'appId')
  .option('-j, --jsKey <jsKey>', 'jsKey')
  .option('-m, --masterKey <masterKey>', 'masterKey')
  .option('--url <url>', 'api url')
  .option('-f, --config <config>', 'Specifiy config path')
  .parse(process.argv);

var appId = program.appId ? program.appId : process.env.APP_ID;
var jsKey = program.jsKey ? program.jsKey : process.env.JS_KEY;
var masterKey = program.masterKey ? program.masterKey : process.env.MASTER_KEY;
var url = program.url;
var configPath = program.config;
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
} else {
  console.warn('missing ' + configPath);
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

console.log(appId);
console.log(jsKey);
console.log(masterKey);
console.log(url);

var Parse = require('parse/node').Parse;
var Rx = require('rx');
require('./parses');

if (url) Parse.serverURL = url;
Parse.initialize(appId, jsKey, masterKey);
if (masterKey) Parse.Cloud.useMasterKey();

var query = new Parse.Query(Parse.Installation);

Parses.push({
  where: query ,
  data: {
    "title": "teting!",
    "alert": "Ne Server Test "
  }
}).subscribe(function (it) {
  console.log("ok");
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
