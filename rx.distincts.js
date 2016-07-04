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
    define(['rx'], function (Rx, exports) {
      return factory(root, exports, Rx);
    });
  } else if (typeof module === 'object' && module && module.exports === freeExports) {
    module.exports = factory(root, module.exports, require('rx'));
  } else {
    root.Rx = factory(root, {}, root.Rx);
  }
}.call(this, function (root, exp, Rx, undefined) {

  // References
  var Observable = Rx.Observable,
    observableProto = Observable.prototype,
    BinaryDisposable = Rx.BinaryDisposable,
    AnonymousObservable = Rx.AnonymousObservable,
    AbstractObserver = Rx.internals.AbstractObserver,
    disposableEmpty = Rx.Disposable.empty,
    helpers = Rx.helpers,
    defaultComparer = helpers.defaultComparer,
    identity = helpers.identity,
    defaultSubComparer = helpers.defaultSubComparer,
    isFunction = helpers.isFunction,
    isPromise = helpers.isPromise,
    isArrayLike = helpers.isArrayLike,
    isIterable = helpers.isIterable,
    inherits = Rx.internals.inherits,
    observableFromPromise = Observable.fromPromise,
    observableFrom = Observable.from,
    bindCallback = Rx.internals.bindCallback,
    EmptyError = Rx.EmptyError,
    ObservableBase = Rx.ObservableBase,
    ArgumentOutOfRangeError = Rx.ArgumentOutOfRangeError;

  var errorObj = {e: {}};

  function tryCatcherGen(tryCatchTarget) {
    return function tryCatcher() {
      try {
        return tryCatchTarget.apply(this, arguments);
      } catch (e) {
        errorObj.e = e;
        return errorObj;
      }
    };
  }

  var tryCatch = Rx.internals.tryCatch = function tryCatch(fn) {
    if (!isFunction(fn)) { throw new TypeError('fn must be a function'); }
    return tryCatcherGen(fn);
  };

  function thrower(e) {
    throw e;
  }

  // rx.distincts.js Main

  // Swap out for Array.findIndex
  function arrayIndexOfComparer(array, item, comparer) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (comparer(array[i], item)) { return i; }
    }
    return -1;
  }

  function HashSet(comparer) {
    this.comparer = comparer;
    this.set = [];
  }
  HashSet.prototype.push = function(value) {
    var retValue = arrayIndexOfComparer(this.set, value, this.comparer) === -1;
    retValue && this.set.push(value);
    return retValue;
  };

  var DistinctsObservable = (function (__super__) {
    inherits(DistinctsObservable, __super__);
    function DistinctsObservable(source, keyFn, cmpFn, onDistFn) {
      this.source = source;
      this._keyFn = keyFn;
      this._cmpFn = cmpFn;
      this._onDistFn = onDistFn;
      __super__.call(this);
    }

    DistinctsObservable.prototype.subscribeCore = function (o) {
      return this.source.subscribe(new DistinctsObserver(o, this._keyFn, this._cmpFn, this._onDistFn));
    };

    return DistinctsObservable;
  }(ObservableBase));

  var DistinctsObserver = (function (__super__) {
    inherits(DistinctsObserver, __super__);
    function DistinctsObserver(o, keyFn, cmpFn, onDistFn) {
      this._o = o;
      this._keyFn = keyFn;
      this._h = new HashSet(cmpFn);
      this._onDistFn = onDistFn;
      __super__.call(this);
    }

    DistinctsObserver.prototype.next = function (x) {
      var key = x;
      if (isFunction(this._keyFn)) {
        key = tryCatch(this._keyFn)(x);
        if (key === errorObj) { return this._o.onError(key.e); }
      }
      var indist = this._h.push(key);
      if (indist) {
        this._o.onNext(x);
      } else {
        if (this._onDistFn) {
          this._onDistFn(x);
        }
      }
    };

    DistinctsObserver.prototype.error = function (e) { this._o.onError(e); };
    DistinctsObserver.prototype.completed = function () { this._o.onCompleted(); };

    return DistinctsObserver;
  }(AbstractObserver));

  /**
   *  Returns an observable sequence that contains only distinct elements according to the keySelector and the comparer.
   *  Usage of this operator should be considered carefully due to the maintenance of an internal lookup structure which can grow large.
   *
   * @example
   *  var res = obs = xs.distinct();
   *  2 - obs = xs.distinct(function (x) { return x.id; });
   *  2 - obs = xs.distinct(function (x) { return x.id; }, function (a,b) { return a === b; });
   * @param {Function} [keySelector]  A function to compute the comparison key for each element.
   * @param {Function} [comparer]  Used to compare items in the collection.
   * @returns {Observable} An observable sequence only containing the distinct elements, based on a computed key value, from the source sequence.
   */
  observableProto.distincts = function (keySelector, comparer, onDistinctor) {
    comparer || (comparer = defaultComparer);
    onDistinctor || (onDistinctor = function (x) {});
    return new DistinctsObservable(this, keySelector, comparer, onDistinctor);
  };

  return Rx;
}));
