#!/usr/bin/env node

var Parse = require('parse/node').Parse;
var Rx = require('rx');
var configPath = process.env.HOME + '/.parse/' + 'config.json'; // $ docker-parse list 8tory_dev
var config = hasFile(configPath) ? require(configPath) : null;
var program = require('commander');
var Parses = require('./parses');

program
  .version('1.0.0')
  .option('-p, --production', 'production')
  .option('-a, --appId <appId>', 'appId')
  .option('-j, --jsKey <jsKey>', 'jsKey')
  .option('-m, --masterKey <masterKey>', 'masterKey')
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

Parses.all(query).doOnNext(function(user) {
  console.log(user.get('email'));
}).subscribe();

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
