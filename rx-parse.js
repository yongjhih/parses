;(function (factory) {
  var objectTypes = {
    'function': true,
    'object': true
  };

  function checkGlobal(value) {
    return (value && value.Object === Object) ? value : null;
  }

  var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType) ? exports : null;
  var freeModule = (objectTypes[typeof module] && module && !module.nodeType) ? module : null;
  var freeGlobal = checkGlobal(freeExports && freeModule && typeof global === 'object' && global);
  var freeSelf = checkGlobal(objectTypes[typeof self] && self);
  var freeWindow = checkGlobal(objectTypes[typeof window] && window);
  var moduleExports = (freeModule && freeModule.exports === freeExports) ? freeExports : null;
  var thisGlobal = checkGlobal(objectTypes[typeof this] && this);
  var root = freeGlobal || ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) || freeSelf || thisGlobal || Function('return this')();

  // Because of build optimizers
  if (typeof define === 'function' && define.amd) {
    define(function (exports) {
      return factory(root, exports);
    });
  } else if (typeof module === 'object' && module && module.exports === freeExports) {
    module.exports = factory(root, module.exports);
  } else {
    root.RxParse = factory(root, {});
  }
}.call(this, function (root, exp, undefined) {

  root.RxParse = RxParse; // FIXME

  function RxParse() {
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
  RxParse.all = all;

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
  RxParse.allAsc = allAsc;

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
  RxParse.allDesc = allDesc;

  /**
   * @param {Parse.Query} query
   */
  function find(query) {
    return Rx.Observable.fromPromise(query.find());
  }
  RxParse.find = find;

  /**
   * @param {Parse.Query} query
   * @param {String} id
   */
  function get(query, id) {
    return Rx.Observable.fromPromise(query.get(id));
  }
  RxParse.get = get;

  /**
   * @param {Parse.Object} parseObject
   */
  function fetch(parseObject) {
    return Rx.Observable.fromPromise(parseObject.fetch()).map(function (it) {
      return parseObject;
    }).defaultIfEmpty(parseObject);
  }
  RxParse.fetch = fetch;

  /**
   * @param {Parse.Object} parseObject
   */
  function save(parseObject) {
    return Rx.Observable.fromPromise(parseObject.save()).map(function (it) {
      return parseObject;
    }).defaultIfEmpty(parseObject);
  }
  RxParse.save = save;

  function removeAll(parseQuery) {
    return all(parseQuery).concatMap(function (parseObject) {
      return parseObject.destroy({});
    });
  }
  RxParse.removeAll = removeAll;

  function removeDup(parseQuery, keySelector) {
    return all(parseQuery).distincts(keySelector, null, function (it) {
      it.destroy({});
    });
  }
  RxParse.removeDup = removeDup;

  function removeDupByColumn(parseQuery, column) {
    return removeDup(parseQuery, function (it) {
      return it.get(column);
    });
  }
  RxParse.removeDupByColumn = removeDupByColumn;

  require('es6-promise').polyfill();

  function logInWithFacebook(permissions) {
    return Rx.Observable.fromPromise(logInWithFacebookPromise(permissions));
  }
  RxParse.logInWithFacebook = logInWithFacebook;

  function logInWithFacebookPromise(permissions) {
    return new Promise(function (resolve, reject) {
      Parse.FacebookUtils.logIn(permissions, {
        success: function(user) {
          resolve(user);
        },
        error: function(user, error) {
          reject(error);
        }
      });
    });
  }

  function linkFacebook(permissions, user) {
    return Rx.Observable.fromPromise(linkFacebookPromise(permissions, user));
  }
  RxParse.linkFacebook = linkFacebook;

  function linkFacebookPromise(permissions, user) {
    return new Promise(function (resolve, reject) {
      Parse.FacebookUtils.link(user ? user : Parse.User.current(), permissions, {
        success: function(_user) {
          resolve(_user);
        },
        error: function(_user, error) {
          reject(error);
        }
      });
    });
  }

  function importJsonRetry(jsons) {
    return importJson(jsons).retryWhen(function (attempts) {
      return Rx.Observable.range(1, 3).zip(attempts, function (i) { return i; }).flatMap(function (i) {
        return Rx.Observable.timer(i * 1000);
      });
    });
  }
  RxParse.importJsonRetry = importJsonRetry;

  function importJson(jsons) {
    return Rx.Observable.from(files)
      //.map(function (value) { return Rx.Observable.return(value).delay(100); })
      //.concatAll()
      .map(function (file) {
        var path = require('path');
        var className = path.basename(file, '.json')
          var json = require(file);
        json.className = className;
        return json;
      })
    .flatMap(function (json) {
      return Rx.Observable.from(json.results)
        .doOnNext(function (from) {
          delete from.this;
          delete from.ACL;
          delete from.objectId;
          delete from.createdAt;
          delete from.updatedAt;
        })
      .doOnNext(function (from) {
        from.className = json.className;
      });
    })
    .flatMap(function (from) {
      return Parses.save(Parse.Object.fromJSON(from));
    });
  }
  RxParse.importJson = importJson;

  return RxParse;
}));

/* vim: set sw=2: */
