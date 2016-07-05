var chai = require('chai');
var expect = chai.expect;
var nock = require('nock');
var RxFacebook = require('../parses');

describe('parses', function() {
  it('should be defined', function() {
    expect(Parses).to.be.a('function');
  });

  it('should be .all defined', function() {
    expect(Parses.all).to.be.a('function');
  });

  it('should be .find defined', function() {
    expect(Parses.find).to.be.a('function');
  });

});

/* vim: set sw=2: */
