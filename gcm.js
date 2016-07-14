#!/usr/bin/env node

var program = require('commander');

program
  .version('1.0.0')
  .option('--id <id>', '')
  .option('--key <key>', '')
  .option('--token <token>', '')
  .option('-m <msg>', '')
  .option('--dryrun', 'Dryrun')
  .parse(process.argv);

var gcmId = program.id;
var gcmKey = program.key;
var msg = program.msg;
var token = program.token;

if (!gcmId) {
  console.error('missing gcmId');
}
if (!gcmKey) {
  console.error('missing gcmKey');
  process.exit();
}
if (!token) {
  console.error('missing token');
  process.exit();
}

console.log(gcmId);
console.log(gcmKey);

var gcm = require('node-gcm');

var sender = new gcm.Sender(gcmKey);

var message = new gcm.Message();
message.addNotification('title', msg);

sender.send(message, token, function (err, response) {
    if (err) console.error(err);
    else    console.log(response);
});

