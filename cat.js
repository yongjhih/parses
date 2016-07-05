#!/usr/bin/env node

var Rx = require('rx');
var program = require('commander');
require('./rxio');

program
  .version('1.0.0')
  .arguments('<files...>')
  .action(function (files) {
    _files = files
  })
  .parse(process.argv);

if (typeof _files === 'undefined') {
   console.error('no files!');
   process.exit(1);
}

Rx.Observable.from(_files).flatMap(function (file) {
  return readline(file);
})
.subscribe(function (line) {
  console.log(line);
});
/* vim: set sw=2: */
