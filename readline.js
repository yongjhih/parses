#!/usr/bin/env node

var Rx = require('rx');
var program = require('commander');
require('./io');

program
  .version('1.0.0')
  .option('-f, --file <file>', 'file path')
  .parse(process.argv);

readline(program.file).subscribe(function (line) {
  console.log(line);
});
/* vim: set sw=2: */
