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
    root.readline = factory(root, {});
  }
}.call(this, function (root, exp, undefined) {
  root.readline = exp.readline = function (file) {
    var Rx = require('rx');
    return Rx.Observable.create(function (sub) {
      require('readline').createInterface({
        input: require('fs').createReadStream(file),
        terminal: false
      }).on('line', function (line) {
        sub.onNext(line);
      }).on('close', function () {
        sub.onCompleted();
      });
    });
  };
}));
/* vim: set sw=2: */
