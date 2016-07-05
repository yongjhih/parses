module.exports = Parses;

function Parses() {
}

var Parse = require('parse/node').Parse;
var Rx = require('rx');
require('./rx.distincts');

/**
 * Required unset limit(), please use Rx.Observable.take() instead.
 * @param {Parse.Query} query
 */
function all(query) {
  return allDesc(query);
}
Parses.all = all;

function allAsc(query) {
  var chunkSize = 100;
  query.ascending('createdAt');
  return Rx.Observable.fromPromise(query.find()).concatMap(function (posts) {
    if (posts.length == chunkSize) {
      var q = query.greaterThanOrEqualTo('createdAt', posts[posts.length - 1].get('createdAt'));
      return Rx.Observable.concat(Rx.Observable.from(posts), all(q));
    } else {
      return Rx.Observable.from(posts);
    }
  }).distinct(function (it) {
    return it.id;
  });
}
Parses.allAsc = allAsc;

function allDesc(query) {
  var chunkSize = 100;
  query.descending('createdAt');
  return Rx.Observable.fromPromise(query.find()).concatMap(function (posts) {
    if (posts.length == chunkSize) {
      var q = query.lessThanOrEqualTo('createdAt', posts[posts.length - 1].get('createdAt'));
      return Rx.Observable.concat(Rx.Observable.from(posts), all(q));
    } else {
      return Rx.Observable.from(posts);
    }
  }).distinct(function (it) {
    return it.id;
  });
}
Parses.allDesc = allDesc;

/**
 * @param {Parse.Query} query
 */
function find(query) {
  return Rx.Observable.fromPromise(query.find());
}
Parses.find = find;

/**
 * @param {Parse.Query} query
 * @param {String} id
 */
function get(query, id) {
  return Rx.Observable.fromPromise(query.get(id));
}
Parses.get = get;

/**
 * @param {Parse.Object} parseObject
 */
function fetch(parseObject) {
  return Rx.Observable.fromPromise(parseObject.fetch()).map(function (it) {
    return parseObject;
  }).defaultIfEmpty(parseObject);
}
Parses.fetch = fetch;

/**
 * @param {Parse.Object} parseObject
 */
function save(parseObject) {
  return Rx.Observable.fromPromise(parseObject.save()).map(function (it) {
    return parseObject;
  }).defaultIfEmpty(parseObject);
}
Parses.save = save;

function removeAll(parseQuery) {
  return all(parseQuery).concatMap(function (parseObject) {
    return parseObject.destroy({});
  });
}
Parses.removeAll = removeAll;

function removeDup(parseQuery, keySelector) {
  return all(parseQuery).distincts(keySelector, null, function (it) {
    it.destroy({});
  });
}
Parses.removeDup = removeDup;

function removeDupByColumn(parseQuery, column) {
  return removeDup(parseQuery, function (it) {
    return it.get(column);
  });
}
Parses.removeDupByColumn = removeDupByColumn;

}));
/* vim: set sw=2: */
