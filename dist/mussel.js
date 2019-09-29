(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.mussel = {}));
}(this, function (exports) { 'use strict';

  function styleInject(css, ref) {
    if (ref === void 0) ref = {};
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') {
      return;
    }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css = "* {\r\n  box-sizing: border-box;\r\n}\r\nhtml {\r\n  color: #1a1a1a;\r\n  font-size: 14px;\r\n  font-weight: 400;\r\n}\r\nbody {\r\n  font-size: 100%;\r\n}\r\nbutton,\r\nhtml {\r\n  font-family: -apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Hiragino Sans GB\",\"Microsoft YaHei\",\"Helvetica Neue\",Helvetica,Arial,sans-serif;\r\n}";
  styleInject(css);

  var css$1 = ".mu-text-ellipsis {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}";
  styleInject(css$1);

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var O = 'object';
  var check = function (it) {
    return it && it.Math == Math && it;
  };

  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global_1 =
    // eslint-disable-next-line no-undef
    check(typeof globalThis == O && globalThis) ||
    check(typeof window == O && window) ||
    check(typeof self == O && self) ||
    check(typeof commonjsGlobal == O && commonjsGlobal) ||
    // eslint-disable-next-line no-new-func
    Function('return this')();

  var fails = function (exec) {
    try {
      return !!exec();
    } catch (error) {
      return true;
    }
  };

  // Thank's IE8 for his funny defineProperty
  var descriptors = !fails(function () {
    return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
  });

  var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // Nashorn ~ JDK8 bug
  var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

  // `Object.prototype.propertyIsEnumerable` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
  var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
    var descriptor = getOwnPropertyDescriptor(this, V);
    return !!descriptor && descriptor.enumerable;
  } : nativePropertyIsEnumerable;

  var objectPropertyIsEnumerable = {
  	f: f
  };

  var createPropertyDescriptor = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };

  var toString = {}.toString;

  var classofRaw = function (it) {
    return toString.call(it).slice(8, -1);
  };

  var split = ''.split;

  // fallback for non-array-like ES3 and non-enumerable old V8 strings
  var indexedObject = fails(function () {
    // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
    // eslint-disable-next-line no-prototype-builtins
    return !Object('z').propertyIsEnumerable(0);
  }) ? function (it) {
    return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
  } : Object;

  // `RequireObjectCoercible` abstract operation
  // https://tc39.github.io/ecma262/#sec-requireobjectcoercible
  var requireObjectCoercible = function (it) {
    if (it == undefined) throw TypeError("Can't call method on " + it);
    return it;
  };

  // toObject with fallback for non-array-like ES3 strings



  var toIndexedObject = function (it) {
    return indexedObject(requireObjectCoercible(it));
  };

  var isObject = function (it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };

  // `ToPrimitive` abstract operation
  // https://tc39.github.io/ecma262/#sec-toprimitive
  // instead of the ES6 spec version, we didn't implement @@toPrimitive case
  // and the second argument - flag - preferred type is a string
  var toPrimitive = function (input, PREFERRED_STRING) {
    if (!isObject(input)) return input;
    var fn, val;
    if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
    if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    throw TypeError("Can't convert object to primitive value");
  };

  var hasOwnProperty = {}.hasOwnProperty;

  var has = function (it, key) {
    return hasOwnProperty.call(it, key);
  };

  var document$1 = global_1.document;
  // typeof document.createElement is 'object' in old IE
  var EXISTS = isObject(document$1) && isObject(document$1.createElement);

  var documentCreateElement = function (it) {
    return EXISTS ? document$1.createElement(it) : {};
  };

  // Thank's IE8 for his funny defineProperty
  var ie8DomDefine = !descriptors && !fails(function () {
    return Object.defineProperty(documentCreateElement('div'), 'a', {
      get: function () { return 7; }
    }).a != 7;
  });

  var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
  var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
    O = toIndexedObject(O);
    P = toPrimitive(P, true);
    if (ie8DomDefine) try {
      return nativeGetOwnPropertyDescriptor(O, P);
    } catch (error) { /* empty */ }
    if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
  };

  var objectGetOwnPropertyDescriptor = {
  	f: f$1
  };

  var anObject = function (it) {
    if (!isObject(it)) {
      throw TypeError(String(it) + ' is not an object');
    } return it;
  };

  var nativeDefineProperty = Object.defineProperty;

  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
    anObject(O);
    P = toPrimitive(P, true);
    anObject(Attributes);
    if (ie8DomDefine) try {
      return nativeDefineProperty(O, P, Attributes);
    } catch (error) { /* empty */ }
    if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
    if ('value' in Attributes) O[P] = Attributes.value;
    return O;
  };

  var objectDefineProperty = {
  	f: f$2
  };

  var hide = descriptors ? function (object, key, value) {
    return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };

  var setGlobal = function (key, value) {
    try {
      hide(global_1, key, value);
    } catch (error) {
      global_1[key] = value;
    } return value;
  };

  var shared = createCommonjsModule(function (module) {
  var SHARED = '__core-js_shared__';
  var store = global_1[SHARED] || setGlobal(SHARED, {});

  (module.exports = function (key, value) {
    return store[key] || (store[key] = value !== undefined ? value : {});
  })('versions', []).push({
    version: '3.2.1',
    mode:  'global',
    copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
  });
  });

  var functionToString = shared('native-function-to-string', Function.toString);

  var WeakMap = global_1.WeakMap;

  var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(functionToString.call(WeakMap));

  var id = 0;
  var postfix = Math.random();

  var uid = function (key) {
    return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
  };

  var keys = shared('keys');

  var sharedKey = function (key) {
    return keys[key] || (keys[key] = uid(key));
  };

  var hiddenKeys = {};

  var WeakMap$1 = global_1.WeakMap;
  var set, get, has$1;

  var enforce = function (it) {
    return has$1(it) ? get(it) : set(it, {});
  };

  var getterFor = function (TYPE) {
    return function (it) {
      var state;
      if (!isObject(it) || (state = get(it)).type !== TYPE) {
        throw TypeError('Incompatible receiver, ' + TYPE + ' required');
      } return state;
    };
  };

  if (nativeWeakMap) {
    var store = new WeakMap$1();
    var wmget = store.get;
    var wmhas = store.has;
    var wmset = store.set;
    set = function (it, metadata) {
      wmset.call(store, it, metadata);
      return metadata;
    };
    get = function (it) {
      return wmget.call(store, it) || {};
    };
    has$1 = function (it) {
      return wmhas.call(store, it);
    };
  } else {
    var STATE = sharedKey('state');
    hiddenKeys[STATE] = true;
    set = function (it, metadata) {
      hide(it, STATE, metadata);
      return metadata;
    };
    get = function (it) {
      return has(it, STATE) ? it[STATE] : {};
    };
    has$1 = function (it) {
      return has(it, STATE);
    };
  }

  var internalState = {
    set: set,
    get: get,
    has: has$1,
    enforce: enforce,
    getterFor: getterFor
  };

  var redefine = createCommonjsModule(function (module) {
  var getInternalState = internalState.get;
  var enforceInternalState = internalState.enforce;
  var TEMPLATE = String(functionToString).split('toString');

  shared('inspectSource', function (it) {
    return functionToString.call(it);
  });

  (module.exports = function (O, key, value, options) {
    var unsafe = options ? !!options.unsafe : false;
    var simple = options ? !!options.enumerable : false;
    var noTargetGet = options ? !!options.noTargetGet : false;
    if (typeof value == 'function') {
      if (typeof key == 'string' && !has(value, 'name')) hide(value, 'name', key);
      enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
    if (O === global_1) {
      if (simple) O[key] = value;
      else setGlobal(key, value);
      return;
    } else if (!unsafe) {
      delete O[key];
    } else if (!noTargetGet && O[key]) {
      simple = true;
    }
    if (simple) O[key] = value;
    else hide(O, key, value);
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
  })(Function.prototype, 'toString', function toString() {
    return typeof this == 'function' && getInternalState(this).source || functionToString.call(this);
  });
  });

  var path = global_1;

  var aFunction = function (variable) {
    return typeof variable == 'function' ? variable : undefined;
  };

  var getBuiltIn = function (namespace, method) {
    return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
      : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
  };

  var ceil = Math.ceil;
  var floor = Math.floor;

  // `ToInteger` abstract operation
  // https://tc39.github.io/ecma262/#sec-tointeger
  var toInteger = function (argument) {
    return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
  };

  var min = Math.min;

  // `ToLength` abstract operation
  // https://tc39.github.io/ecma262/#sec-tolength
  var toLength = function (argument) {
    return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
  };

  var max = Math.max;
  var min$1 = Math.min;

  // Helper for a popular repeating case of the spec:
  // Let integer be ? ToInteger(index).
  // If integer < 0, let result be max((length + integer), 0); else let result be min(length, length).
  var toAbsoluteIndex = function (index, length) {
    var integer = toInteger(index);
    return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
  };

  // `Array.prototype.{ indexOf, includes }` methods implementation
  var createMethod = function (IS_INCLUDES) {
    return function ($this, el, fromIndex) {
      var O = toIndexedObject($this);
      var length = toLength(O.length);
      var index = toAbsoluteIndex(fromIndex, length);
      var value;
      // Array#includes uses SameValueZero equality algorithm
      // eslint-disable-next-line no-self-compare
      if (IS_INCLUDES && el != el) while (length > index) {
        value = O[index++];
        // eslint-disable-next-line no-self-compare
        if (value != value) return true;
      // Array#indexOf ignores holes, Array#includes - not
      } else for (;length > index; index++) {
        if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
      } return !IS_INCLUDES && -1;
    };
  };

  var arrayIncludes = {
    // `Array.prototype.includes` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.includes
    includes: createMethod(true),
    // `Array.prototype.indexOf` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
    indexOf: createMethod(false)
  };

  var indexOf = arrayIncludes.indexOf;


  var objectKeysInternal = function (object, names) {
    var O = toIndexedObject(object);
    var i = 0;
    var result = [];
    var key;
    for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while (names.length > i) if (has(O, key = names[i++])) {
      ~indexOf(result, key) || result.push(key);
    }
    return result;
  };

  // IE8- don't enum bug keys
  var enumBugKeys = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf'
  ];

  var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
    return objectKeysInternal(O, hiddenKeys$1);
  };

  var objectGetOwnPropertyNames = {
  	f: f$3
  };

  var f$4 = Object.getOwnPropertySymbols;

  var objectGetOwnPropertySymbols = {
  	f: f$4
  };

  // all object keys, includes non-enumerable and symbols
  var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
    var keys = objectGetOwnPropertyNames.f(anObject(it));
    var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
  };

  var copyConstructorProperties = function (target, source) {
    var keys = ownKeys(source);
    var defineProperty = objectDefineProperty.f;
    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  };

  var replacement = /#|\.prototype\./;

  var isForced = function (feature, detection) {
    var value = data[normalize(feature)];
    return value == POLYFILL ? true
      : value == NATIVE ? false
      : typeof detection == 'function' ? fails(detection)
      : !!detection;
  };

  var normalize = isForced.normalize = function (string) {
    return String(string).replace(replacement, '.').toLowerCase();
  };

  var data = isForced.data = {};
  var NATIVE = isForced.NATIVE = 'N';
  var POLYFILL = isForced.POLYFILL = 'P';

  var isForced_1 = isForced;

  var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






  /*
    options.target      - name of the target object
    options.global      - target is the global object
    options.stat        - export as static methods of target
    options.proto       - export as prototype methods of target
    options.real        - real prototype method for the `pure` version
    options.forced      - export even if the native feature is available
    options.bind        - bind methods to the target, required for the `pure` version
    options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
    options.unsafe      - use the simple assignment of property instead of delete + defineProperty
    options.sham        - add a flag to not completely full polyfills
    options.enumerable  - export as enumerable property
    options.noTargetGet - prevent calling a getter on target
  */
  var _export = function (options, source) {
    var TARGET = options.target;
    var GLOBAL = options.global;
    var STATIC = options.stat;
    var FORCED, target, key, targetProperty, sourceProperty, descriptor;
    if (GLOBAL) {
      target = global_1;
    } else if (STATIC) {
      target = global_1[TARGET] || setGlobal(TARGET, {});
    } else {
      target = (global_1[TARGET] || {}).prototype;
    }
    if (target) for (key in source) {
      sourceProperty = source[key];
      if (options.noTargetGet) {
        descriptor = getOwnPropertyDescriptor$1(target, key);
        targetProperty = descriptor && descriptor.value;
      } else targetProperty = target[key];
      FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
      // contained in target
      if (!FORCED && targetProperty !== undefined) {
        if (typeof sourceProperty === typeof targetProperty) continue;
        copyConstructorProperties(sourceProperty, targetProperty);
      }
      // add a flag to not completely full polyfills
      if (options.sham || (targetProperty && targetProperty.sham)) {
        hide(sourceProperty, 'sham', true);
      }
      // extend global
      redefine(target, key, sourceProperty, options);
    }
  };

  var sloppyArrayMethod = function (METHOD_NAME, argument) {
    var method = [][METHOD_NAME];
    return !method || !fails(function () {
      // eslint-disable-next-line no-useless-call,no-throw-literal
      method.call(null, argument || function () { throw 1; }, 1);
    });
  };

  var $indexOf = arrayIncludes.indexOf;


  var nativeIndexOf = [].indexOf;

  var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
  var SLOPPY_METHOD = sloppyArrayMethod('indexOf');

  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  _export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || SLOPPY_METHOD }, {
    indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
      return NEGATIVE_ZERO
        // convert -0 to +0
        ? nativeIndexOf.apply(this, arguments) || 0
        : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var aPossiblePrototype = function (it) {
    if (!isObject(it) && it !== null) {
      throw TypeError("Can't set " + String(it) + ' as a prototype');
    } return it;
  };

  // `Object.setPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.setprototypeof
  // Works with __proto__ only. Old v8 can't work with null proto objects.
  /* eslint-disable no-proto */
  var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
    var CORRECT_SETTER = false;
    var test = {};
    var setter;
    try {
      setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
      setter.call(test, []);
      CORRECT_SETTER = test instanceof Array;
    } catch (error) { /* empty */ }
    return function setPrototypeOf(O, proto) {
      anObject(O);
      aPossiblePrototype(proto);
      if (CORRECT_SETTER) setter.call(O, proto);
      else O.__proto__ = proto;
      return O;
    };
  }() : undefined);

  // makes subclassing work correct for wrapped built-ins
  var inheritIfRequired = function ($this, dummy, Wrapper) {
    var NewTarget, NewTargetPrototype;
    if (
      // it can work only with native `setPrototypeOf`
      objectSetPrototypeOf &&
      // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
      typeof (NewTarget = dummy.constructor) == 'function' &&
      NewTarget !== Wrapper &&
      isObject(NewTargetPrototype = NewTarget.prototype) &&
      NewTargetPrototype !== Wrapper.prototype
    ) objectSetPrototypeOf($this, NewTargetPrototype);
    return $this;
  };

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  var objectKeys = Object.keys || function keys(O) {
    return objectKeysInternal(O, enumBugKeys);
  };

  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
    anObject(O);
    var keys = objectKeys(Properties);
    var length = keys.length;
    var index = 0;
    var key;
    while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
    return O;
  };

  var html = getBuiltIn('document', 'documentElement');

  var IE_PROTO = sharedKey('IE_PROTO');

  var PROTOTYPE = 'prototype';
  var Empty = function () { /* empty */ };

  // Create object with fake `null` prototype: use iframe Object with cleared prototype
  var createDict = function () {
    // Thrash, waste and sodomy: IE GC bug
    var iframe = documentCreateElement('iframe');
    var length = enumBugKeys.length;
    var lt = '<';
    var script = 'script';
    var gt = '>';
    var js = 'java' + script + ':';
    var iframeDocument;
    iframe.style.display = 'none';
    html.appendChild(iframe);
    iframe.src = String(js);
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(lt + script + gt + 'document.F=Object' + lt + '/' + script + gt);
    iframeDocument.close();
    createDict = iframeDocument.F;
    while (length--) delete createDict[PROTOTYPE][enumBugKeys[length]];
    return createDict();
  };

  // `Object.create` method
  // https://tc39.github.io/ecma262/#sec-object.create
  var objectCreate = Object.create || function create(O, Properties) {
    var result;
    if (O !== null) {
      Empty[PROTOTYPE] = anObject(O);
      result = new Empty();
      Empty[PROTOTYPE] = null;
      // add "__proto__" for Object.getPrototypeOf polyfill
      result[IE_PROTO] = O;
    } else result = createDict();
    return Properties === undefined ? result : objectDefineProperties(result, Properties);
  };

  hiddenKeys[IE_PROTO] = true;

  // a string of all valid unicode whitespaces
  // eslint-disable-next-line max-len
  var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

  var whitespace = '[' + whitespaces + ']';
  var ltrim = RegExp('^' + whitespace + whitespace + '*');
  var rtrim = RegExp(whitespace + whitespace + '*$');

  // `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
  var createMethod$1 = function (TYPE) {
    return function ($this) {
      var string = String(requireObjectCoercible($this));
      if (TYPE & 1) string = string.replace(ltrim, '');
      if (TYPE & 2) string = string.replace(rtrim, '');
      return string;
    };
  };

  var stringTrim = {
    // `String.prototype.{ trimLeft, trimStart }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
    start: createMethod$1(1),
    // `String.prototype.{ trimRight, trimEnd }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
    end: createMethod$1(2),
    // `String.prototype.trim` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.trim
    trim: createMethod$1(3)
  };

  var getOwnPropertyNames = objectGetOwnPropertyNames.f;
  var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;
  var defineProperty = objectDefineProperty.f;
  var trim = stringTrim.trim;

  var NUMBER = 'Number';
  var NativeNumber = global_1[NUMBER];
  var NumberPrototype = NativeNumber.prototype;

  // Opera ~12 has broken Object#toString
  var BROKEN_CLASSOF = classofRaw(objectCreate(NumberPrototype)) == NUMBER;

  // `ToNumber` abstract operation
  // https://tc39.github.io/ecma262/#sec-tonumber
  var toNumber = function (argument) {
    var it = toPrimitive(argument, false);
    var first, third, radix, maxCode, digits, length, index, code;
    if (typeof it == 'string' && it.length > 2) {
      it = trim(it);
      first = it.charCodeAt(0);
      if (first === 43 || first === 45) {
        third = it.charCodeAt(2);
        if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
      } else if (first === 48) {
        switch (it.charCodeAt(1)) {
          case 66: case 98: radix = 2; maxCode = 49; break; // fast equal of /^0b[01]+$/i
          case 79: case 111: radix = 8; maxCode = 55; break; // fast equal of /^0o[0-7]+$/i
          default: return +it;
        }
        digits = it.slice(2);
        length = digits.length;
        for (index = 0; index < length; index++) {
          code = digits.charCodeAt(index);
          // parseInt parses a string to a first unavailable symbol
          // but ToNumber should return NaN if a string contains unavailable symbols
          if (code < 48 || code > maxCode) return NaN;
        } return parseInt(digits, radix);
      }
    } return +it;
  };

  // `Number` constructor
  // https://tc39.github.io/ecma262/#sec-number-constructor
  if (isForced_1(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'))) {
    var NumberWrapper = function Number(value) {
      var it = arguments.length < 1 ? 0 : value;
      var dummy = this;
      return dummy instanceof NumberWrapper
        // check on 1..constructor(foo) case
        && (BROKEN_CLASSOF ? fails(function () { NumberPrototype.valueOf.call(dummy); }) : classofRaw(dummy) != NUMBER)
          ? inheritIfRequired(new NativeNumber(toNumber(it)), dummy, NumberWrapper) : toNumber(it);
    };
    for (var keys$1 = descriptors ? getOwnPropertyNames(NativeNumber) : (
      // ES3:
      'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
      // ES2015 (in case, if modules with ES2015 Number statics required before):
      'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
      'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
    ).split(','), j = 0, key; keys$1.length > j; j++) {
      if (has(NativeNumber, key = keys$1[j]) && !has(NumberWrapper, key)) {
        defineProperty(NumberWrapper, key, getOwnPropertyDescriptor$2(NativeNumber, key));
      }
    }
    NumberWrapper.prototype = NumberPrototype;
    NumberPrototype.constructor = NumberWrapper;
    redefine(global_1, NUMBER, NumberWrapper);
  }

  var BaseFlexItem = {
    name: 'MusselBaseFlexItem',
    inject: {
      parentDirection: {
        "default": 'row'
      }
    },
    props: {
      size: {
        type: [Number, String],
        validator: function validator(value) {
          return value === undefined || /^([1-8]|auto|([1-9]\d*(px|%)))$/.test(value);
        }
      },
      overflow: String
    },
    computed: {
      sizeUnit: function sizeUnit() {
        var s = String(this.size);
        return s.indexOf('%') > -1 ? '%' : s.indexOf('px') > -1 ? 'px' : null;
      },
      sizeAttr: function sizeAttr() {
        return this.sizeUnit ? undefined : this.size;
      },
      style: function style() {
        return this.sizeUnit ? this.parentDirection === 'row' ? {
          width: this.size
        } : {
          height: this.size
        } : undefined;
      }
    }
  };

  var script = {
    name: 'MusselFlexBox',
    mixins: [BaseFlexItem],
    provide: function provide() {
      return {
        parentDirection: this.flexDirection
      };
    },
    props: {
      direction: {
        type: String,
        "default": 'row',
        validator: function validator(value) {
          return ['row', 'column'].indexOf(value) !== -1;
        }
      }
    },
    computed: {
      flexDirection: function flexDirection() {
        return this.direction;
      }
    }
  };

  var css$2 = ".mu-flex-box {\r\n  position: relative;\r\n  display: flex;\r\n  align-items: stretch;\r\n}\r\n.mu-flex-box[direction=column] {\r\n  flex-direction: column;\r\n}\r\n.mu-flex-box[direction=column] > .mu-input,\r\n.mu-flex-box[direction=column] > .mu-input-box {\r\n  width: auto;\r\n}\r\n.mu-flex-box[inline] {\r\n  display: inline-flex;\r\n}\r\n.mu-flex-box[flex-wrap] {\r\n  flex-wrap: wrap;\r\n  align-content: flex-start;\r\n}\r\n.mu-flex-box[justify-content=center] {\r\n  justify-content: center;\r\n}\r\n.mu-flex-box[align-items=flex-start] {\r\n  align-items: flex-start;\r\n}\r\n.mu-flex-box[align-items=center] {\r\n  align-items: center;\r\n}\r\n.mu-flex-box[align-items=stretch] {\r\n  align-items: stretch;\r\n}\r\n.mu-flex-box[flex-center] {\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n.mu-flex-box[bordered] {\r\n  border: 1px solid #ddd;\r\n}\r\n.mu-flex-box[cellpadding],\r\n.mu-flex-box[itemspacing] {\r\n  padding: 8px;\r\n}\r\n.mu-flex-box [cellspacing],\r\n.mu-flex-box[itemspacing] > * {\r\n  margin: 8px;\r\n}\r\n.mu-flex-box > * {\r\n  position: relative;\r\n}\r\n.mu-flex-box > [flex-auto] {\r\n  flex: 1 1 auto!important;\r\n}\r\n.mu-flex-box > [flex-none] {\r\n  flex: 0 0 none!important;\r\n}\r\n.mu-flex-box[direction=column] > [size] {\r\n  height: 10px;\r\n}\r\n.mu-flex-box:not(direction=\"column\") > [size] {\r\n  width: 10px;\r\n}\r\n.mu-flex-box > [size=auto] {\r\n  flex-grow: 1;\r\n}\r\n.mu-flex-box > [size=\"1\"] {\r\n  flex-grow: 1;\r\n}\r\n.mu-flex-box > [size=\"2\"] {\r\n  flex-grow: 2;\r\n}\r\n.mu-flex-box > [size=\"3\"] {\r\n  flex-grow: 3;\r\n}\r\n.mu-flex-box > [size=\"4\"] {\r\n  flex-grow: 4;\r\n}\r\n.mu-flex-box > [size=\"5\"] {\r\n  flex-grow: 5;\r\n}\r\n.mu-flex-box > [size=\"6\"] {\r\n  flex-grow: 6;\r\n}\r\n.mu-flex-box > [size=\"7\"] {\r\n  flex-grow: 7;\r\n}\r\n.mu-flex-box > [size=\"8\"] {\r\n  flex-grow: 8;\r\n}";
  styleInject(css$2);

  // `IsArray` abstract operation
  // https://tc39.github.io/ecma262/#sec-isarray
  var isArray = Array.isArray || function isArray(arg) {
    return classofRaw(arg) == 'Array';
  };

  // `ToObject` abstract operation
  // https://tc39.github.io/ecma262/#sec-toobject
  var toObject = function (argument) {
    return Object(requireObjectCoercible(argument));
  };

  var createProperty = function (object, key, value) {
    var propertyKey = toPrimitive(key);
    if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
    else object[propertyKey] = value;
  };

  var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
    // Chrome 38 Symbol has incorrect toString conversion
    // eslint-disable-next-line no-undef
    return !String(Symbol());
  });

  var Symbol$1 = global_1.Symbol;
  var store$1 = shared('wks');

  var wellKnownSymbol = function (name) {
    return store$1[name] || (store$1[name] = nativeSymbol && Symbol$1[name]
      || (nativeSymbol ? Symbol$1 : uid)('Symbol.' + name));
  };

  var SPECIES = wellKnownSymbol('species');

  // `ArraySpeciesCreate` abstract operation
  // https://tc39.github.io/ecma262/#sec-arrayspeciescreate
  var arraySpeciesCreate = function (originalArray, length) {
    var C;
    if (isArray(originalArray)) {
      C = originalArray.constructor;
      // cross-realm fallback
      if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
      else if (isObject(C)) {
        C = C[SPECIES];
        if (C === null) C = undefined;
      }
    } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
  };

  var SPECIES$1 = wellKnownSymbol('species');

  var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
    return !fails(function () {
      var array = [];
      var constructor = array.constructor = {};
      constructor[SPECIES$1] = function () {
        return { foo: 1 };
      };
      return array[METHOD_NAME](Boolean).foo !== 1;
    });
  };

  var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
  var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

  var IS_CONCAT_SPREADABLE_SUPPORT = !fails(function () {
    var array = [];
    array[IS_CONCAT_SPREADABLE] = false;
    return array.concat()[0] !== array;
  });

  var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

  var isConcatSpreadable = function (O) {
    if (!isObject(O)) return false;
    var spreadable = O[IS_CONCAT_SPREADABLE];
    return spreadable !== undefined ? !!spreadable : isArray(O);
  };

  var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

  // `Array.prototype.concat` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.concat
  // with adding support of @@isConcatSpreadable and @@species
  _export({ target: 'Array', proto: true, forced: FORCED }, {
    concat: function concat(arg) { // eslint-disable-line no-unused-vars
      var O = toObject(this);
      var A = arraySpeciesCreate(O, 0);
      var n = 0;
      var i, k, length, len, E;
      for (i = -1, length = arguments.length; i < length; i++) {
        E = i === -1 ? O : arguments[i];
        if (isConcatSpreadable(E)) {
          len = toLength(E.length);
          if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
        } else {
          if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          createProperty(A, n++, E);
        }
      }
      A.length = n;
      return A;
    }
  });

  function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier
  /* server only */
  , shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
      createInjectorSSR = createInjector;
      createInjector = shadowMode;
      shadowMode = false;
    } // Vue.extend constructor export interop.


    var options = typeof script === 'function' ? script.options : script; // render functions

    if (template && template.render) {
      options.render = template.render;
      options.staticRenderFns = template.staticRenderFns;
      options._compiled = true; // functional template

      if (isFunctionalTemplate) {
        options.functional = true;
      }
    } // scopedId


    if (scopeId) {
      options._scopeId = scopeId;
    }

    var hook;

    if (moduleIdentifier) {
      // server build
      hook = function hook(context) {
        // 2.3 injection
        context = context || // cached call
        this.$vnode && this.$vnode.ssrContext || // stateful
        this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext; // functional
        // 2.2 with runInNewContext: true

        if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
          context = __VUE_SSR_CONTEXT__;
        } // inject component styles


        if (style) {
          style.call(this, createInjectorSSR(context));
        } // register component module identifier for async chunk inference


        if (context && context._registeredComponents) {
          context._registeredComponents.add(moduleIdentifier);
        }
      }; // used by ssr in case component is cached and beforeCreate
      // never gets called


      options._ssrRegister = hook;
    } else if (style) {
      hook = shadowMode ? function () {
        style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
      } : function (context) {
        style.call(this, createInjector(context));
      };
    }

    if (hook) {
      if (options.functional) {
        // register for functional component in vue file
        var originalRender = options.render;

        options.render = function renderWithStyleInjection(h, context) {
          hook.call(context);
          return originalRender(h, context);
        };
      } else {
        // inject component registration as beforeCreate hook
        var existing = options.beforeCreate;
        options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
      }
    }

    return script;
  }

  var normalizeComponent_1 = normalizeComponent;

  /* script */
  var __vue_script__ = script;
  /* template */

  var __vue_render__ = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-flex-box",
      style: _vm.style,
      attrs: {
        direction: _vm.flexDirection,
        size: _vm.sizeAttr
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__ = [];
  __vue_render__._withStripped = true;
  /* style */

  var __vue_inject_styles__ = undefined;
  /* scoped */

  var __vue_scope_id__ = undefined;
  /* module identifier */

  var __vue_module_identifier__ = undefined;
  /* functional template */

  var __vue_is_functional_template__ = false;
  /* style inject */

  /* style inject SSR */

  var FlexBox = normalizeComponent_1({
    render: __vue_render__,
    staticRenderFns: __vue_staticRenderFns__
  }, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, undefined, undefined);

  //
  var script$1 = {
    name: 'MusselFlexItem',
    "extends": BaseFlexItem
  };

  /* script */
  var __vue_script__$1 = script$1;
  /* template */

  var __vue_render__$1 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      style: _vm.style,
      attrs: {
        size: _vm.sizeAttr
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$1 = [];
  __vue_render__$1._withStripped = true;
  /* style */

  var __vue_inject_styles__$1 = undefined;
  /* scoped */

  var __vue_scope_id__$1 = undefined;
  /* module identifier */

  var __vue_module_identifier__$1 = undefined;
  /* functional template */

  var __vue_is_functional_template__$1 = false;
  /* style inject */

  /* style inject SSR */

  var FlexItem = normalizeComponent_1({
    render: __vue_render__$1,
    staticRenderFns: __vue_staticRenderFns__$1
  }, __vue_inject_styles__$1, __vue_script__$1, __vue_scope_id__$1, __vue_is_functional_template__$1, __vue_module_identifier__$1, undefined, undefined);

  var HBox = {
    name: 'MusselHBox',
    "extends": FlexBox,
    computed: {
      flexDirection: function flexDirection() {
        return 'row';
      }
    }
  };

  var VBox = {
    name: 'MusselVBox',
    "extends": FlexBox,
    computed: {
      flexDirection: function flexDirection() {
        return 'column';
      }
    }
  };

  var nativeGetOwnPropertyNames = objectGetOwnPropertyNames.f;

  var toString$1 = {}.toString;

  var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
    ? Object.getOwnPropertyNames(window) : [];

  var getWindowNames = function (it) {
    try {
      return nativeGetOwnPropertyNames(it);
    } catch (error) {
      return windowNames.slice();
    }
  };

  // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
  var f$5 = function getOwnPropertyNames(it) {
    return windowNames && toString$1.call(it) == '[object Window]'
      ? getWindowNames(it)
      : nativeGetOwnPropertyNames(toIndexedObject(it));
  };

  var objectGetOwnPropertyNamesExternal = {
  	f: f$5
  };

  var f$6 = wellKnownSymbol;

  var wrappedWellKnownSymbol = {
  	f: f$6
  };

  var defineProperty$1 = objectDefineProperty.f;

  var defineWellKnownSymbol = function (NAME) {
    var Symbol = path.Symbol || (path.Symbol = {});
    if (!has(Symbol, NAME)) defineProperty$1(Symbol, NAME, {
      value: wrappedWellKnownSymbol.f(NAME)
    });
  };

  var defineProperty$2 = objectDefineProperty.f;



  var TO_STRING_TAG = wellKnownSymbol('toStringTag');

  var setToStringTag = function (it, TAG, STATIC) {
    if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
      defineProperty$2(it, TO_STRING_TAG, { configurable: true, value: TAG });
    }
  };

  var aFunction$1 = function (it) {
    if (typeof it != 'function') {
      throw TypeError(String(it) + ' is not a function');
    } return it;
  };

  // optional / simple context binding
  var bindContext = function (fn, that, length) {
    aFunction$1(fn);
    if (that === undefined) return fn;
    switch (length) {
      case 0: return function () {
        return fn.call(that);
      };
      case 1: return function (a) {
        return fn.call(that, a);
      };
      case 2: return function (a, b) {
        return fn.call(that, a, b);
      };
      case 3: return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
    }
    return function (/* ...args */) {
      return fn.apply(that, arguments);
    };
  };

  var push = [].push;

  // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
  var createMethod$2 = function (TYPE) {
    var IS_MAP = TYPE == 1;
    var IS_FILTER = TYPE == 2;
    var IS_SOME = TYPE == 3;
    var IS_EVERY = TYPE == 4;
    var IS_FIND_INDEX = TYPE == 6;
    var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
    return function ($this, callbackfn, that, specificCreate) {
      var O = toObject($this);
      var self = indexedObject(O);
      var boundFunction = bindContext(callbackfn, that, 3);
      var length = toLength(self.length);
      var index = 0;
      var create = specificCreate || arraySpeciesCreate;
      var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
      var value, result;
      for (;length > index; index++) if (NO_HOLES || index in self) {
        value = self[index];
        result = boundFunction(value, index, O);
        if (TYPE) {
          if (IS_MAP) target[index] = result; // map
          else if (result) switch (TYPE) {
            case 3: return true;              // some
            case 5: return value;             // find
            case 6: return index;             // findIndex
            case 2: push.call(target, value); // filter
          } else if (IS_EVERY) return false;  // every
        }
      }
      return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
    };
  };

  var arrayIteration = {
    // `Array.prototype.forEach` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
    forEach: createMethod$2(0),
    // `Array.prototype.map` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.map
    map: createMethod$2(1),
    // `Array.prototype.filter` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.filter
    filter: createMethod$2(2),
    // `Array.prototype.some` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.some
    some: createMethod$2(3),
    // `Array.prototype.every` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.every
    every: createMethod$2(4),
    // `Array.prototype.find` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    find: createMethod$2(5),
    // `Array.prototype.findIndex` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
    findIndex: createMethod$2(6)
  };

  var $forEach = arrayIteration.forEach;

  var HIDDEN = sharedKey('hidden');
  var SYMBOL = 'Symbol';
  var PROTOTYPE$1 = 'prototype';
  var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
  var setInternalState = internalState.set;
  var getInternalState = internalState.getterFor(SYMBOL);
  var ObjectPrototype = Object[PROTOTYPE$1];
  var $Symbol = global_1.Symbol;
  var JSON = global_1.JSON;
  var nativeJSONStringify = JSON && JSON.stringify;
  var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;
  var nativeDefineProperty$1 = objectDefineProperty.f;
  var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f;
  var nativePropertyIsEnumerable$1 = objectPropertyIsEnumerable.f;
  var AllSymbols = shared('symbols');
  var ObjectPrototypeSymbols = shared('op-symbols');
  var StringToSymbolRegistry = shared('string-to-symbol-registry');
  var SymbolToStringRegistry = shared('symbol-to-string-registry');
  var WellKnownSymbolsStore = shared('wks');
  var QObject = global_1.QObject;
  // Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
  var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild;

  // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
  var setSymbolDescriptor = descriptors && fails(function () {
    return objectCreate(nativeDefineProperty$1({}, 'a', {
      get: function () { return nativeDefineProperty$1(this, 'a', { value: 7 }).a; }
    })).a != 7;
  }) ? function (O, P, Attributes) {
    var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1(ObjectPrototype, P);
    if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
    nativeDefineProperty$1(O, P, Attributes);
    if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
      nativeDefineProperty$1(ObjectPrototype, P, ObjectPrototypeDescriptor);
    }
  } : nativeDefineProperty$1;

  var wrap = function (tag, description) {
    var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
    setInternalState(symbol, {
      type: SYMBOL,
      tag: tag,
      description: description
    });
    if (!descriptors) symbol.description = description;
    return symbol;
  };

  var isSymbol = nativeSymbol && typeof $Symbol.iterator == 'symbol' ? function (it) {
    return typeof it == 'symbol';
  } : function (it) {
    return Object(it) instanceof $Symbol;
  };

  var $defineProperty = function defineProperty(O, P, Attributes) {
    if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
    anObject(O);
    var key = toPrimitive(P, true);
    anObject(Attributes);
    if (has(AllSymbols, key)) {
      if (!Attributes.enumerable) {
        if (!has(O, HIDDEN)) nativeDefineProperty$1(O, HIDDEN, createPropertyDescriptor(1, {}));
        O[HIDDEN][key] = true;
      } else {
        if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
        Attributes = objectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
      } return setSymbolDescriptor(O, key, Attributes);
    } return nativeDefineProperty$1(O, key, Attributes);
  };

  var $defineProperties = function defineProperties(O, Properties) {
    anObject(O);
    var properties = toIndexedObject(Properties);
    var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
    $forEach(keys, function (key) {
      if (!descriptors || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
    });
    return O;
  };

  var $create = function create(O, Properties) {
    return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
  };

  var $propertyIsEnumerable = function propertyIsEnumerable(V) {
    var P = toPrimitive(V, true);
    var enumerable = nativePropertyIsEnumerable$1.call(this, P);
    if (this === ObjectPrototype && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
    return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
  };

  var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
    var it = toIndexedObject(O);
    var key = toPrimitive(P, true);
    if (it === ObjectPrototype && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
    var descriptor = nativeGetOwnPropertyDescriptor$1(it, key);
    if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
      descriptor.enumerable = true;
    }
    return descriptor;
  };

  var $getOwnPropertyNames = function getOwnPropertyNames(O) {
    var names = nativeGetOwnPropertyNames$1(toIndexedObject(O));
    var result = [];
    $forEach(names, function (key) {
      if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
    });
    return result;
  };

  var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
    var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
    var names = nativeGetOwnPropertyNames$1(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
    var result = [];
    $forEach(names, function (key) {
      if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))) {
        result.push(AllSymbols[key]);
      }
    });
    return result;
  };

  // `Symbol` constructor
  // https://tc39.github.io/ecma262/#sec-symbol-constructor
  if (!nativeSymbol) {
    $Symbol = function Symbol() {
      if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
      var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
      var tag = uid(description);
      var setter = function (value) {
        if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
        if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
        setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
      };
      if (descriptors && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
      return wrap(tag, description);
    };

    redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
      return getInternalState(this).tag;
    });

    objectPropertyIsEnumerable.f = $propertyIsEnumerable;
    objectDefineProperty.f = $defineProperty;
    objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor;
    objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames;
    objectGetOwnPropertySymbols.f = $getOwnPropertySymbols;

    if (descriptors) {
      // https://github.com/tc39/proposal-Symbol-description
      nativeDefineProperty$1($Symbol[PROTOTYPE$1], 'description', {
        configurable: true,
        get: function description() {
          return getInternalState(this).description;
        }
      });
      {
        redefine(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
      }
    }

    wrappedWellKnownSymbol.f = function (name) {
      return wrap(wellKnownSymbol(name), name);
    };
  }

  _export({ global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol }, {
    Symbol: $Symbol
  });

  $forEach(objectKeys(WellKnownSymbolsStore), function (name) {
    defineWellKnownSymbol(name);
  });

  _export({ target: SYMBOL, stat: true, forced: !nativeSymbol }, {
    // `Symbol.for` method
    // https://tc39.github.io/ecma262/#sec-symbol.for
    'for': function (key) {
      var string = String(key);
      if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
      var symbol = $Symbol(string);
      StringToSymbolRegistry[string] = symbol;
      SymbolToStringRegistry[symbol] = string;
      return symbol;
    },
    // `Symbol.keyFor` method
    // https://tc39.github.io/ecma262/#sec-symbol.keyfor
    keyFor: function keyFor(sym) {
      if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
      if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
    },
    useSetter: function () { USE_SETTER = true; },
    useSimple: function () { USE_SETTER = false; }
  });

  _export({ target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors }, {
    // `Object.create` method
    // https://tc39.github.io/ecma262/#sec-object.create
    create: $create,
    // `Object.defineProperty` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperty
    defineProperty: $defineProperty,
    // `Object.defineProperties` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperties
    defineProperties: $defineProperties,
    // `Object.getOwnPropertyDescriptor` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
    getOwnPropertyDescriptor: $getOwnPropertyDescriptor
  });

  _export({ target: 'Object', stat: true, forced: !nativeSymbol }, {
    // `Object.getOwnPropertyNames` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
    getOwnPropertyNames: $getOwnPropertyNames,
    // `Object.getOwnPropertySymbols` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
    getOwnPropertySymbols: $getOwnPropertySymbols
  });

  // Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
  // https://bugs.chromium.org/p/v8/issues/detail?id=3443
  _export({ target: 'Object', stat: true, forced: fails(function () { objectGetOwnPropertySymbols.f(1); }) }, {
    getOwnPropertySymbols: function getOwnPropertySymbols(it) {
      return objectGetOwnPropertySymbols.f(toObject(it));
    }
  });

  // `JSON.stringify` method behavior with symbols
  // https://tc39.github.io/ecma262/#sec-json.stringify
  JSON && _export({ target: 'JSON', stat: true, forced: !nativeSymbol || fails(function () {
    var symbol = $Symbol();
    // MS Edge converts symbol values to JSON as {}
    return nativeJSONStringify([symbol]) != '[null]'
      // WebKit converts symbol values to JSON as null
      || nativeJSONStringify({ a: symbol }) != '{}'
      // V8 throws on boxed symbols
      || nativeJSONStringify(Object(symbol)) != '{}';
  }) }, {
    stringify: function stringify(it) {
      var args = [it];
      var index = 1;
      var replacer, $replacer;
      while (arguments.length > index) args.push(arguments[index++]);
      $replacer = replacer = args[1];
      if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
      if (!isArray(replacer)) replacer = function (key, value) {
        if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
        if (!isSymbol(value)) return value;
      };
      args[1] = replacer;
      return nativeJSONStringify.apply(JSON, args);
    }
  });

  // `Symbol.prototype[@@toPrimitive]` method
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
  if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) hide($Symbol[PROTOTYPE$1], TO_PRIMITIVE, $Symbol[PROTOTYPE$1].valueOf);
  // `Symbol.prototype[@@toStringTag]` property
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
  setToStringTag($Symbol, SYMBOL);

  hiddenKeys[HIDDEN] = true;

  var $filter = arrayIteration.filter;


  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('filter') }, {
    filter: function filter(callbackfn /* , thisArg */) {
      return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var $forEach$1 = arrayIteration.forEach;


  // `Array.prototype.forEach` method implementation
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  var arrayForEach = sloppyArrayMethod('forEach') ? function forEach(callbackfn /* , thisArg */) {
    return $forEach$1(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  } : [].forEach;

  // `Array.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  _export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
    forEach: arrayForEach
  });

  var nativeReverse = [].reverse;
  var test = [1, 2];

  // `Array.prototype.reverse` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reverse
  // fix for Safari 12.0 bug
  // https://bugs.webkit.org/show_bug.cgi?id=188794
  _export({ target: 'Array', proto: true, forced: String(test) === String(test.reverse()) }, {
    reverse: function reverse() {
      if (isArray(this)) this.length = this.length;
      return nativeReverse.call(this);
    }
  });

  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  _export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
    defineProperties: objectDefineProperties
  });

  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  _export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
    defineProperty: objectDefineProperty.f
  });

  var nativeGetOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;


  var FAILS_ON_PRIMITIVES = fails(function () { nativeGetOwnPropertyDescriptor$2(1); });
  var FORCED$1 = !descriptors || FAILS_ON_PRIMITIVES;

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
  _export({ target: 'Object', stat: true, forced: FORCED$1, sham: !descriptors }, {
    getOwnPropertyDescriptor: function getOwnPropertyDescriptor(it, key) {
      return nativeGetOwnPropertyDescriptor$2(toIndexedObject(it), key);
    }
  });

  // `Object.getOwnPropertyDescriptors` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
  _export({ target: 'Object', stat: true, sham: !descriptors }, {
    getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object) {
      var O = toIndexedObject(object);
      var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
      var keys = ownKeys(O);
      var result = {};
      var index = 0;
      var key, descriptor;
      while (keys.length > index) {
        descriptor = getOwnPropertyDescriptor(O, key = keys[index++]);
        if (descriptor !== undefined) createProperty(result, key, descriptor);
      }
      return result;
    }
  });

  var FAILS_ON_PRIMITIVES$1 = fails(function () { objectKeys(1); });

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  _export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES$1 }, {
    keys: function keys(it) {
      return objectKeys(toObject(it));
    }
  });

  // iterable DOM collections
  // flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
  var domIterables = {
    CSSRuleList: 0,
    CSSStyleDeclaration: 0,
    CSSValueList: 0,
    ClientRectList: 0,
    DOMRectList: 0,
    DOMStringList: 0,
    DOMTokenList: 1,
    DataTransferItemList: 0,
    FileList: 0,
    HTMLAllCollection: 0,
    HTMLCollection: 0,
    HTMLFormElement: 0,
    HTMLSelectElement: 0,
    MediaList: 0,
    MimeTypeArray: 0,
    NamedNodeMap: 0,
    NodeList: 1,
    PaintRequestList: 0,
    Plugin: 0,
    PluginArray: 0,
    SVGLengthList: 0,
    SVGNumberList: 0,
    SVGPathSegList: 0,
    SVGPointList: 0,
    SVGStringList: 0,
    SVGTransformList: 0,
    SourceBufferList: 0,
    StyleSheetList: 0,
    TextTrackCueList: 0,
    TextTrackList: 0,
    TouchList: 0
  };

  for (var COLLECTION_NAME in domIterables) {
    var Collection = global_1[COLLECTION_NAME];
    var CollectionPrototype = Collection && Collection.prototype;
    // some Chrome versions have non-configurable methods on DOMTokenList
    if (CollectionPrototype && CollectionPrototype.forEach !== arrayForEach) try {
      hide(CollectionPrototype, 'forEach', arrayForEach);
    } catch (error) {
      CollectionPrototype.forEach = arrayForEach;
    }
  }

  function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  //
  //
  //
  //
  function getOnlyResizableElement(prevEl, nextEl) {
    return prevEl && !prevEl.getAttribute('size') ? prevEl : nextEl && !nextEl.getAttribute('size') ? nextEl : null;
  }

  function getMaxSize(prevEl, nextEl) {
    var _Object = Object(prevEl),
        _Object$offsetWidth = _Object.offsetWidth,
        pw = _Object$offsetWidth === void 0 ? 0 : _Object$offsetWidth,
        _Object$offsetHeight = _Object.offsetHeight,
        ph = _Object$offsetHeight === void 0 ? 0 : _Object$offsetHeight;

    var _Object2 = Object(nextEl),
        _Object2$offsetWidth = _Object2.offsetWidth,
        nw = _Object2$offsetWidth === void 0 ? 0 : _Object2$offsetWidth,
        _Object2$offsetHeight = _Object2.offsetHeight,
        nh = _Object2$offsetHeight === void 0 ? 0 : _Object2$offsetHeight;

    return {
      maxWidth: pw + nw,
      maxHeight: ph + nh
    };
  }

  function getInitialState(prevEl, nextEl) {
    var el = getOnlyResizableElement(prevEl, nextEl);
    return el ? _objectSpread({
      el: el,
      reverse: el === nextEl,
      startWidth: el.offsetWidth,
      startHeight: el.offsetHeight
    }, getMaxSize(prevEl, nextEl)) : null;
  }

  function resizeElement(_ref) {
    var el = _ref.el,
        direction = _ref.direction,
        reverse = _ref.reverse,
        startWidth = _ref.startWidth,
        startHeight = _ref.startHeight,
        maxWidth = _ref.maxWidth,
        maxHeight = _ref.maxHeight,
        startX = _ref.startX,
        startY = _ref.startY,
        x = _ref.x,
        y = _ref.y;

    if (direction === 'row') {
      var w = startWidth + (reverse ? startX - x : x - startX);

      if (w >= 50 && w < maxWidth - 100) {
        el.style.width = w + 'px';
        return true;
      }
    } else {
      var h = startHeight + (reverse ? startY - y : y - startY);

      if (h >= 50 && h < maxHeight - 100) {
        el.style.height = h + 'px';
        return true;
      }
    }
  }

  var script$2 = {
    name: 'MusselSplitter',
    computed: {
      parentDirection: function parentDirection() {
        return this.$parent.flexDirection || 'row';
      }
    },
    created: function created() {
      var _this = this;

      window.addEventListener('mouseup', function () {
        delete _this.startPosition;
      });
    },
    methods: {
      onDragStart: function onDragStart(event) {
        var state = getInitialState(this.$el.previousElementSibling, this.$el.nextElementSibling);
        if (!state) return;
        this.initialState = _objectSpread({
          direction: this.parentDirection,
          startX: event.pageX,
          startY: event.pageY
        }, state);
        window.addEventListener('mousemove', this.onDragMove);
        window.addEventListener('mouseup', this.onDragEnd);
        if (this.initialState.resized) this.$emit('resizestart');
      },
      onDragMove: function onDragMove(event) {
        if (resizeElement(_objectSpread({}, this.initialState, {
          x: event.pageX,
          y: event.pageY
        }))) {
          this.initialState.resized = true;
          this.$emit('resize');
        }
      },
      onDragEnd: function onDragEnd(event) {
        window.removeEventListener('mousemove', this.onDragMove);
        window.removeEventListener('mouseup', this.onDragEnd);
        if (this.initialState.resized) this.$emit('resizeend');
      }
    }
  };

  var css$3 = ".mu-splitter {\r\n  background: rgba(0,0,0,.1);\r\n  border-radius: 4px;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n.mu-splitter:hover {\r\n  background: rgba(0,0,0,.2);\r\n}\r\n.mu-splitter:first-child,\r\n.mu-splitter:last-child {\r\n  display: none;\r\n}\r\n[cellpadding] > .mu-splitter,\r\n[item-spacing] > .mu-splitter {\r\n  margin: 8px;\r\n}\r\n[direction=row] > .mu-splitter {\r\n  width: 4px;\r\n  margin-left: 0;\r\n  margin-right: 0;\r\n  cursor: col-resize;\r\n}\r\n[direction=column] > .mu-splitter {\r\n  height: 4px;\r\n  margin-top: 0;\r\n  margin-bottom: 0;\r\n  cursor: row-resize;\r\n}";
  styleInject(css$3);

  /* script */
  var __vue_script__$2 = script$2;
  /* template */

  var __vue_render__$2 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-splitter",
      on: {
        mousedown: _vm.onDragStart
      }
    });
  };

  var __vue_staticRenderFns__$2 = [];
  __vue_render__$2._withStripped = true;
  /* style */

  var __vue_inject_styles__$2 = undefined;
  /* scoped */

  var __vue_scope_id__$2 = undefined;
  /* module identifier */

  var __vue_module_identifier__$2 = undefined;
  /* functional template */

  var __vue_is_functional_template__$2 = false;
  /* style inject */

  /* style inject SSR */

  var Splitter = normalizeComponent_1({
    render: __vue_render__$2,
    staticRenderFns: __vue_staticRenderFns__$2
  }, __vue_inject_styles__$2, __vue_script__$2, __vue_scope_id__$2, __vue_is_functional_template__$2, __vue_module_identifier__$2, undefined, undefined);

  var ok = 'M351.81165742 729.48242963L134.32922778 512 61.83508498 584.49414281 351.81165742 874.47071645 973.19002778 253.09234608 900.69588498 180.59820206Z';
  var close = 'M951.90520135 160.07583979L863.92416021 72.09479865 512 424.01896032 160.07583979 72.09479865 72.09479865 160.07583979 424.01896032 512 72.09479865 863.92416021 160.07583979 951.90520135 512 599.98103968 863.92416021 951.90520135 951.90520135 863.92416021 599.98103968 512Z';
  var keyDown = 'M240.98697401 294.01126208L512 565.02428806 783.01302599 294.01126208 865.4952507 376.49348677 512 729.98873747 158.5047493 376.49348677Z';
  var keyLeft = 'M733.64730918 774.88842085L462.6342832 503.87539624 733.64730918 232.86237024 651.1650831 150.38014552 297.6698324 503.87539624 651.1650831 857.37064693Z';
  var keyRight = 'M290.35269082 765.33826345L561.3657168 500.21682544 290.35269082 229.20379943 372.8349169 146.72157474 726.3301676 500.21682544 372.8349169 853.71207613Z';
  var keyUp = 'M240.98697401 733.64730918L512 462.6342832 783.01302599 733.64730918 865.4952507 651.1650831 512 297.6698324 158.5047493 651.1650831Z';
  var search = 'M1021.184 925.696l-91.904 91.584-202.752-201.92c-75.904 56.64-169.216 91.392-271.424 91.392C203.712 906.688 0 703.744 0 453.376 0 202.944 203.712 0 455.168 0c251.328 0 455.04 202.944 455.04 453.376 0 101.76-34.88 194.752-91.712 270.336L1021.184 925.696 1021.184 925.696zM455.168 129.6c-179.584 0-325.056 144.96-325.056 323.84 0 178.816 145.472 323.84 325.056 323.84 179.456 0 325.056-145.024 325.056-323.84C780.224 274.496 634.624 129.6 455.168 129.6L455.168 129.6z';
  var expandAll = 'M768 341.333333H341.333333v426.666667H256V341.333333c0-46.933333 38.4-85.333333 85.333333-85.333333h426.666667v85.333333z m-170.666667-256H170.666667c-46.933333 0-85.333333 38.4-85.333334 85.333334v426.666666h85.333334V170.666667h426.666666V85.333333z m341.333334 426.666667v341.333333c0 46.933333-38.4 85.333333-85.333334 85.333334h-341.333333c-46.933333 0-85.333333-38.4-85.333333-85.333334v-341.333333c0-46.933333 38.4-85.333333 85.333333-85.333333h341.333333c46.933333 0 85.333333 38.4 85.333334 85.333333z m-85.333334 128h-128v-128h-85.333333v128h-128v85.333333h128v128h85.333333v-128h128v-85.333333z';
  var collapseAll = 'M597.333333 170.666667H170.666667v426.666666H85.333333V170.666667c0-46.933333 38.4-85.333333 85.333334-85.333334h426.666666v85.333334z m170.666667 85.333333H341.333333c-46.933333 0-85.333333 38.4-85.333333 85.333333v426.666667h85.333333V341.333333h426.666667V256z m170.666667 256v341.333333c0 46.933333-38.4 85.333333-85.333334 85.333334h-341.333333c-46.933333 0-85.333333-38.4-85.333333-85.333334v-341.333333c0-46.933333 38.4-85.333333 85.333333-85.333333h341.333333c46.933333 0 85.333333 38.4 85.333334 85.333333z m-85.333334 128h-341.333333v85.333333h341.333333v-85.333333z';
  var _d = {
    ok: ok,
    close: close,
    search: search,
    'key-down': keyDown,
    'key-left': keyLeft,
    'key-right': keyRight,
    'key-up': keyUp,
    'expand-all': expandAll,
    'collapse-all': collapseAll
  };

  var css$4 = ".mu-icon[trigger-type] {\r\n  color: rgba(0,0,0,.35);\r\n  fill: rgba(0,0,0,.35);\r\n  cursor: pointer;\r\n}\r\n.mu-icon[trigger-type]:hover {\r\n  fill: #40a9ff;\r\n  color: #40a9ff;\r\n}\r\n.mu-icon[trigger-type=expander] {\r\n  transition: transform .2s ease-in-out;\r\n}\r\n.mu-icon[trigger-type=expander][trigger-on] {\r\n  transform: rotate(-180deg);\r\n}\r\n.mu-icon[trigger-type=close]:hover {\r\n  fill: #ff7a45;\r\n  color: #ff7a45;\r\n}";
  styleInject(css$4);

  //
  var triggerIcons = {
    close: 'close',
    expander: 'key-down'
  };
  var script$3 = {
    name: 'MusselIcon',
    props: {
      icon: String,
      iconClass: String,
      triggerType: String,
      triggerOn: Boolean,
      clickable: Boolean,
      size: {
        type: String,
        "default": '1em'
      }
    },
    computed: {
      className: function className() {
        return undefined;
      },
      iconName: function iconName() {
        var icon = this.icon,
            iconClass = this.iconClass,
            triggerType = this.triggerType;
        return icon || (iconClass || !triggerType ? undefined : triggerIcons[triggerType]);
      },
      d: function d() {
        return _d[this.iconName];
      }
    },
    methods: {
      onClick: function onClick() {
        this.$emit('click');
      }
    }
  };

  var css$5 = ".mu-icon > svg {\r\n  vertical-align: -.15em;\r\n}";
  styleInject(css$5);

  /* script */
  var __vue_script__$3 = script$3;
  /* template */

  var __vue_render__$3 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("span", {
      staticClass: "mu-icon",
      "class": [_vm.className, _vm.iconClass],
      attrs: {
        icon: _vm.icon,
        clickable: _vm.clickable,
        "trigger-type": _vm.triggerType,
        "trigger-on": _vm.triggerOn
      },
      on: {
        click: _vm.onClick
      }
    }, [_vm.iconName ? _c("svg", {
      attrs: {
        icon: _vm.icon,
        viewBox: "0 0 1024 1024",
        width: _vm.size,
        height: _vm.size
      }
    }, [_c("path", {
      attrs: {
        d: _vm.d
      }
    })]) : _vm._e()]);
  };

  var __vue_staticRenderFns__$3 = [];
  __vue_render__$3._withStripped = true;
  /* style */

  var __vue_inject_styles__$3 = undefined;
  /* scoped */

  var __vue_scope_id__$3 = undefined;
  /* module identifier */

  var __vue_module_identifier__$3 = undefined;
  /* functional template */

  var __vue_is_functional_template__$3 = false;
  /* style inject */

  /* style inject SSR */

  var Icon = normalizeComponent_1({
    render: __vue_render__$3,
    staticRenderFns: __vue_staticRenderFns__$3
  }, __vue_inject_styles__$3, __vue_script__$3, __vue_scope_id__$3, __vue_is_functional_template__$3, __vue_module_identifier__$3, undefined, undefined);

  var css$6 = ".mu-button {\r\n  position: relative;\r\n  display: inline-block;\r\n  height: 32px;\r\n  min-width: 65px;\r\n  padding: 5px 10px;\r\n  outline: 0;\r\n  border: 1px solid #666;\r\n  border-radius: 2px;\r\n  background: #fff;\r\n  line-height: 20px;\r\n  text-decoration: none;\r\n  text-align: center;\r\n  font-size: 1rem;\r\n  color: #666;\r\n  fill: #666;\r\n  cursor: pointer;\r\n}\r\n.mu-button::before {\r\n  display: inline-block;\r\n  width: 0;\r\n  content: '\\00a0';\r\n}\r\n.mu-button:not([button-type]),\r\n.mu-button[button-type=normal] {\r\n  box-shadow: none;\r\n}\r\n.mu-button:not([button-type])[button-style=link]:hover,\r\n.mu-button[button-type=normal][button-style=link]:hover {\r\n  color: #8c8c8c;\r\n  fill: #8c8c8c;\r\n}\r\n.mu-button:not([button-type])[active],\r\n.mu-button[button-type=normal][active] {\r\n  background: #404040;\r\n}\r\n.mu-button:not([button-type]):hover,\r\n.mu-button[button-type=normal]:hover {\r\n  background: #8c8c8c;\r\n  border-color: #8c8c8c;\r\n  box-shadow: 0 0 0 .2rem #d9d9d9;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.mu-button:not([button-type])[disabled][button-style=link],\r\n.mu-button[button-type=normal][disabled][button-style=link] {\r\n  color: #bfbfbf;\r\n  fill: #bfbfbf;\r\n}\r\n.mu-button:not([button-type])[disabled]:not([button-style=link]),\r\n.mu-button[button-type=normal][disabled]:not([button-style=link]) {\r\n  background: #bfbfbf;\r\n  border-color: #bfbfbf;\r\n}\r\n.mu-button[button-style=text] {\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-style=link],\r\n.mu-button[disabled] {\r\n  box-shadow: none!important;\r\n}\r\n.mu-button[button-type=primary] {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #1890ff;\r\n  border-color: #1890ff;\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-type=primary][button-style=link] {\r\n  color: #1890ff;\r\n  fill: #1890ff;\r\n}\r\n.mu-button[button-type=primary][button-style=link]:hover {\r\n  color: #40a9ff;\r\n  fill: #40a9ff;\r\n}\r\n.mu-button[button-type=primary][button-style=outline],\r\n.mu-button[button-type=primary][button-style=text] {\r\n  color: #1890ff;\r\n  fill: #1890ff;\r\n}\r\n.mu-button[button-type=primary][active] {\r\n  background: #096dd9;\r\n  border-color: #096dd9;\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-type=primary]:hover {\r\n  background: #40a9ff;\r\n  border-color: #40a9ff;\r\n  box-shadow: 0 0 0 .2rem #91d5ff;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.mu-button[button-type=primary][disabled][button-style=link] {\r\n  color: #91d5ff;\r\n  fill: #91d5ff;\r\n}\r\n.mu-button[button-type=primary][disabled]:not([button-style=link]) {\r\n  background: #91d5ff;\r\n  border-color: #91d5ff;\r\n}\r\n.mu-button[button-type=submit] {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #52c41a;\r\n  border-color: #52c41a;\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-type=submit][button-style=link] {\r\n  color: #52c41a;\r\n  fill: #52c41a;\r\n}\r\n.mu-button[button-type=submit][button-style=link]:hover {\r\n  color: #73d13d;\r\n  fill: #73d13d;\r\n}\r\n.mu-button[button-type=submit][button-style=outline],\r\n.mu-button[button-type=submit][button-style=text] {\r\n  color: #52c41a;\r\n  fill: #52c41a;\r\n}\r\n.mu-button[button-type=submit][active] {\r\n  background: #389e0d;\r\n  border-color: #389e0d;\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-type=submit]:hover {\r\n  background: #73d13d;\r\n  border-color: #73d13d;\r\n  box-shadow: 0 0 0 .2rem #b7eb8f;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.mu-button[button-type=submit][disabled][button-style=link] {\r\n  color: #b7eb8f;\r\n  fill: #b7eb8f;\r\n}\r\n.mu-button[button-type=submit][disabled]:not([button-style=link]) {\r\n  background: #b7eb8f;\r\n  border-color: #b7eb8f;\r\n}\r\n.mu-button[button-type=danger] {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #fa541c;\r\n  border-color: #fa541c;\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-type=danger][button-style=link] {\r\n  color: #fa541c;\r\n  fill: #fa541c;\r\n}\r\n.mu-button[button-type=danger][button-style=link]:hover {\r\n  color: #ff7a45;\r\n  fill: #ff7a45;\r\n}\r\n.mu-button[button-type=danger][button-style=outline],\r\n.mu-button[button-type=danger][button-style=text] {\r\n  color: #fa541c;\r\n  fill: #fa541c;\r\n}\r\n.mu-button[button-type=danger][active] {\r\n  background: #d4380d;\r\n  border-color: #d4380d;\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-type=danger]:hover {\r\n  background: #ff7a45;\r\n  border-color: #ff7a45;\r\n  box-shadow: 0 0 0 .2rem #ffbb96;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.mu-button[button-type=danger][disabled][button-style=link] {\r\n  color: #ffbb96;\r\n  fill: #ffbb96;\r\n}\r\n.mu-button[button-type=danger][disabled]:not([button-style=link]) {\r\n  background: #ffbb96;\r\n  border-color: #ffbb96;\r\n}\r\n.mu-button[button-style=link],\r\n.mu-button[button-style=link]:hover,\r\n.mu-button[button-style=link][active],\r\n.mu-button[button-style=text] {\r\n  background: 0 0;\r\n  border-color: transparent;\r\n  box-shadow: none;\r\n}\r\n.mu-button[button-style=outline] {\r\n  background: #fff;\r\n}\r\n.mu-button[button-style=link]:not([disabled]):hover {\r\n  text-decoration: underline;\r\n}\r\n.mu-button[active] {\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.mu-button[disabled] {\r\n  cursor: default;\r\n}\r\n.mu-button[disabled]:not([button-style=link]) {\r\n  color: rgba(255,255,255,.7);\r\n  fill: rgba(255,255,255,.7);\r\n}\r\n.mu-button:empty,\r\n.mu-button[icon-only] {\r\n  width: 32px;\r\n  min-width: 0;\r\n  padding-left: 0;\r\n  padding-right: 0;\r\n}";
  styleInject(css$6);

  var Button = {
    name: 'MusselButton',
    components: {
      Icon: Icon
    },
    props: {
      buttonType: {
        type: String,
        "default": 'normal',
        validator: function validator(value) {
          return ['normal', 'primary', 'submit', 'danger'].indexOf(value) !== -1;
        }
      },
      buttonStyle: {
        type: String,
        "default": 'normal',
        validator: function validator(value) {
          return ['normal', 'outline', 'text', 'link'].indexOf(value) !== -1;
        }
      },
      buttonShape: {
        type: String,
        "default": 'normal',
        validator: function validator(value) {
          return ['normal', 'round'].indexOf(value) !== -1;
        }
      },
      icon: String,
      iconClass: String,
      iconOnly: Boolean,
      caption: String
    },
    computed: {
      isIconOnly: function isIconOnly() {
        return this.iconOnly || !this.$slots["default"] && !this.caption && (this.icon || this.iconClass);
      }
    },
    methods: {
      onClick: function onClick() {
        this.$emit('click');
      }
    },
    render: function render(h) {
      return h("button", {
        "class": "mu-button",
        "attrs": {
          "icon-only": this.isIconOnly,
          "button-type": this.buttonType === 'normal' ? undefined : this.buttonType,
          "button-style": this.buttonStyle === 'normal' ? undefined : this.buttonStyle,
          "button-shape": this.buttonShape === 'normal' ? undefined : this.buttonShape
        },
        "on": {
          "click": this.onClick
        }
      }, [this.icon || this.iconClass ? h("icon", {
        "attrs": {
          "icon": this.icon,
          "icon-class": this.iconClass
        }
      }) : undefined, this.$slots["default"] ? this.icon || this.iconClass ? h("span", [this.$slots["default"]]) : this.$slots["default"] : this.caption ? h("span", [this.caption]) : undefined]);
    }
  };

  var IconButton = {
    name: 'MusselIconButton',
    "extends": Button,
    computed: {
      isIconOnly: function isIconOnly() {
        return true;
      }
    }
  };

  var script$4 = {
    name: 'MusselCloseButton',
    "extends": Icon,
    props: {
      triggerType: {
        type: String,
        "default": 'close'
      }
    }
  };

  var css$7 = ".mu-close-button {\r\n  cursor: pointer;\r\n}\r\n.mu-close-button.window-close-button {\r\n  position: absolute;\r\n  top: 8px;\r\n  right: 8px;\r\n  z-index: 1;\r\n}";
  styleInject(css$7);

  /* script */
  var __vue_script__$4 = script$4;
  /* template */

  /* style */

  var __vue_inject_styles__$4 = undefined;
  /* scoped */

  var __vue_scope_id__$4 = undefined;
  /* module identifier */

  var __vue_module_identifier__$4 = undefined;
  /* functional template */

  var __vue_is_functional_template__$4 = undefined;
  /* style inject */

  /* style inject SSR */

  var CloseButton = normalizeComponent_1({}, __vue_inject_styles__$4, __vue_script__$4, __vue_scope_id__$4, __vue_is_functional_template__$4, __vue_module_identifier__$4, undefined, undefined);

  //
  //
  //
  //
  //
  //
  var script$5 = {
    name: 'MusselButtonGroup'
  };

  var css$8 = ".mu-button-group {\r\n  position: relative;\r\n  display: inline-block;\r\n  border-radius: 2px;\r\n}\r\n.mu-button-group > .mu-button {\r\n  float: left;\r\n  box-shadow: none;\r\n  z-index: 0;\r\n}\r\n.mu-button-group > .mu-button:hover:not([disabled]) {\r\n  z-index: 1;\r\n}\r\n.mu-button-group > .mu-button:not(:first-child) {\r\n  border-top-left-radius: 0;\r\n  border-bottom-left-radius: 0;\r\n}\r\n.mu-button-group > .mu-button:not(:first-child)[button-type]:not([button-type=normal]):not(:hover):not([active]):not([button-style]),\r\n.mu-button-group > .mu-button:not(:first-child)[button-type]:not([button-type=normal]):not(:hover):not([active])[button-style=normal] {\r\n  border-left-color: rgba(255,255,255,.5);\r\n}\r\n.mu-button-group > .mu-button:not(:last-child) {\r\n  margin-right: -1px;\r\n  border-top-right-radius: 0;\r\n  border-bottom-right-radius: 0;\r\n}\r\n[button-shape=round],\r\n[button-shape=round] > .mu-button {\r\n  border-radius: 16px;\r\n}";
  styleInject(css$8);

  /* script */
  var __vue_script__$5 = script$5;
  /* template */

  var __vue_render__$4 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-button-group"
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$4 = [];
  __vue_render__$4._withStripped = true;
  /* style */

  var __vue_inject_styles__$5 = undefined;
  /* scoped */

  var __vue_scope_id__$5 = undefined;
  /* module identifier */

  var __vue_module_identifier__$5 = undefined;
  /* functional template */

  var __vue_is_functional_template__$5 = false;
  /* style inject */

  /* style inject SSR */

  var ButtonGroup = normalizeComponent_1({
    render: __vue_render__$4,
    staticRenderFns: __vue_staticRenderFns__$4
  }, __vue_inject_styles__$5, __vue_script__$5, __vue_scope_id__$5, __vue_is_functional_template__$5, __vue_module_identifier__$5, undefined, undefined);

  var css$9 = ".mu-input {\r\n  position: relative;\r\n  z-index: 1;\r\n  width: 200px;\r\n  border: 1px solid #b2b2b2;\r\n  border-radius: 2px;\r\n  outline: 0;\r\n  background-color: #fff;\r\n  color: #404040;\r\n  line-height: 20px;\r\n  font-size: 1rem;\r\n}\r\n.mu-input:focus,\r\n.mu-input:hover,\r\n.mu-input[focus] {\r\n  border-color: #1890ff;\r\n}\r\n.mu-input:focus,\r\n.mu-input[focus] {\r\n  z-index: 2;\r\n  text-align: left!important;\r\n  box-shadow: 0 0 0 .2rem #91d5ff;\r\n}\r\n.mu-input[readonly] {\r\n  background-color: #feffe6;\r\n}\r\n.mu-input[disabled] {\r\n  background-color: #e6e6e6;\r\n  border-color: #b2b2b2;\r\n  color: #8c8c8c;\r\n  box-shadow: none;\r\n}\r\n.mu-input::-ms-clear {\r\n  display: none;\r\n}\r\n.mu-input[invalid],\r\n[invalid] .mu-input {\r\n  color: #fa541c;\r\n  border-color: #fa541c;\r\n}\r\n.mu-input[invalid]:focus,\r\n.mu-input[invalid][focus],\r\n[invalid] .mu-input:focus,\r\n[invalid] .mu-input[focus] {\r\n  box-shadow: 0 0 0 .2rem #ffbb96;\r\n}\r\ninput.mu-input {\r\n  height: 32px;\r\n  padding-left: 10px;\r\n  padding-right: 10px;\r\n}\r\ntextarea.mu-input {\r\n  padding: 5px 10px;\r\n  min-height: 80px;\r\n  resize: none;\r\n}\r\n.mu-input[input-shape=round],\r\n[input-shape=round] > .mu-input {\r\n  border-radius: 16px;\r\n}";
  styleInject(css$9);

  var script$6 = {
    name: 'MusselInput',
    model: {
      prop: 'value',
      event: 'input'
    },
    props: {
      type: {
        type: String,
        "default": 'text'
      },
      value: [String, Number],
      icon: {
        type: String,
        "default": 'key-down'
      },
      disabled: {
        type: Boolean,
        "default": false
      },
      validator: Function
    },
    methods: {
      onInput: function onInput(event) {
        this.$emit('input', event.target.value);
      },
      onClick: function onClick() {
        if (!this.disabled) this.$emit('click');
      },
      validate: function validate() {}
    }
  };

  /* script */
  var __vue_script__$6 = script$6;
  /* template */

  var __vue_render__$5 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("input", {
      staticClass: "mu-input",
      attrs: {
        type: _vm.type,
        disabled: _vm.disabled
      },
      domProps: {
        value: _vm.value
      },
      on: {
        input: _vm.onInput,
        click: _vm.onClick
      }
    });
  };

  var __vue_staticRenderFns__$5 = [];
  __vue_render__$5._withStripped = true;
  /* style */

  var __vue_inject_styles__$6 = undefined;
  /* scoped */

  var __vue_scope_id__$6 = undefined;
  /* module identifier */

  var __vue_module_identifier__$6 = undefined;
  /* functional template */

  var __vue_is_functional_template__$6 = false;
  /* style inject */

  /* style inject SSR */

  var Input = normalizeComponent_1({
    render: __vue_render__$5,
    staticRenderFns: __vue_staticRenderFns__$5
  }, __vue_inject_styles__$6, __vue_script__$6, __vue_scope_id__$6, __vue_is_functional_template__$6, __vue_module_identifier__$6, undefined, undefined);

  var css$a = ".mu-input-box {\r\n  position: relative;\r\n  display: inline-block;\r\n  width: 200px;\r\n}\r\n.mu-input-box:hover > .mu-input {\r\n  border-color: #1890ff;\r\n}\r\n.mu-input-box > .mu-input[disabled],\r\n.mu-input-box[disabled] > .mu-input {\r\n  border-color: #b2b2b2;\r\n}\r\n.mu-input-box > .mu-input {\r\n  width: 100%;\r\n  vertical-align: middle;\r\n  padding-right: 30px;\r\n}\r\n.mu-input-box[buttons=\"0\"] > .mu-input {\r\n  padding-right: 10px;\r\n}\r\n.mu-input-box[buttons=\"2\"] > input {\r\n  padding-right: 60px;\r\n}\r\n.mu-input-box[buttons=\"2\"] > input + .mu-input-icon {\r\n  right: 30px;\r\n}\r\n.mu-input-box[buttons=\"2\"] > .mu-input-icon:first-child + .mu-input-icon {\r\n  left: 30px;\r\n  right: auto;\r\n}\r\n.mu-input-box[buttons=\"2\"] > .mu-input-icon:first-child ~ input {\r\n  padding-left: 60px;\r\n  padding-right: 10px;\r\n}\r\n.mu-input-box[buttons=\"2\"] > .mu-input-icon:first-child + input {\r\n  padding-left: 30px;\r\n  padding-right: 30px;\r\n}\r\n.mu-input-box[buttons=\"2\"] > .mu-input-icon:first-child + input + .mu-input-icon {\r\n  right: 1px;\r\n}\r\n.mu-input-box[disabled] > .mu-input,\r\n.mu-input-box[readonly] > .mu-input {\r\n  padding-left: 10px;\r\n  padding-right: 10px;\r\n}\r\n.mu-input-box[disabled] > .mu-input-icon,\r\n.mu-input-box[readonly] > .mu-input-icon {\r\n  display: none;\r\n}\r\n.mu-input-box > .mu-dropdown {\r\n  min-width: 100%;\r\n}\r\n.mu-input-icon {\r\n  position: absolute;\r\n  z-index: 3;\r\n  top: 1px;\r\n  bottom: 1px;\r\n  right: 1px;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: 30px;\r\n  color: rgba(0,0,0,.35);\r\n  fill: rgba(0,0,0,.35);\r\n}\r\n.mu-input-icon:first-child {\r\n  left: 1px;\r\n  right: auto;\r\n}\r\n.mu-input-icon:first-child + input {\r\n  padding-left: 30px;\r\n  padding-right: 10px;\r\n}\r\n.mu-input-icon[clickable] {\r\n  cursor: pointer;\r\n}\r\n.mu-input-icon[clickable]:hover {\r\n  fill: #40a9ff;\r\n  color: #40a9ff;\r\n  background: rgba(0,0,0,.05);\r\n}\r\n.mu-input-icon[trigger-type=close]:hover {\r\n  color: #fa541c;\r\n  fill: #fa541c;\r\n}\r\n.mu-input-box[invalid] > .mu-input,\r\n[invalid] .mu-input-box > .mu-input {\r\n  border-color: #fa541c;\r\n}\r\n.mu-input-box[invalid] > [clickable]:hover,\r\n[invalid] .mu-input-box > [clickable]:hover {\r\n  color: #fa541c;\r\n  fill: #fa541c;\r\n}";
  styleInject(css$a);

  var InputButton = {
    name: 'MusselInputButton',
    "extends": Icon,
    props: {
      clickable: Boolean
    },
    computed: {
      className: function className() {
        return 'mu-input-icon';
      }
    }
  };

  //
  var script$7 = {
    name: 'MusselInputBoxWrapper',
    components: {
      'mu-input': Input,
      'mu-input-button': InputButton
    },
    inject: ['inputBox', 'params'],
    computed: {
      clearable: function clearable() {
        var p = this.params;
        return p.clearable && (!!p.value || p.value === 0);
      },
      iconAlign: function iconAlign() {
        var p = this.params;
        return p.icon || p.iconClass || p.triggerType ? p.iconAlign || 'right' : null;
      },
      buttons: function buttons() {
        return 0 + (this.clearable ? 1 : 0) + (this.iconAlign ? 1 : 0);
      },
      iconParams: function iconParams() {
        var p = this.params;
        return this.iconAlign ? {
          icon: p.icon,
          iconClass: p.iconClass,
          clickable: p.iconClickable || !!p.triggerType,
          triggerType: p.triggerType,
          triggerOn: p.triggerOn
        } : null;
      },
      inputParams: function inputParams() {
        var p = this.params;
        return {
          type: p.type,
          value: p.value,
          focus: p.focus,
          readonly: p.readonly || !p.editable,
          disabled: p.disabled,
          placeholder: p.placeholder
        };
      }
    },
    methods: {
      onInput: function onInput(value) {
        this.inputBox.onInput(value);
      },
      onInputClick: function onInputClick() {
        this.inputBox.onInputClick();
      },
      onClearClick: function onClearClick() {
        this.inputBox.onClearClick();
      },
      onButtonClick: function onButtonClick() {
        this.inputBox.onButtonClick();
      },
      onKeyPress: function onKeyPress(event) {
        this.inputBox.onKeyPress(event);
      }
    }
  };

  /* script */
  var __vue_script__$7 = script$7;
  /* template */

  var __vue_render__$6 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-input-box",
      attrs: {
        buttons: _vm.buttons,
        readonly: _vm.params.readonly,
        disabled: _vm.params.disabled
      }
    }, [_vm.iconAlign === "left" ? _c("mu-input-button", _vm._b({
      on: {
        click: _vm.onButtonClick
      }
    }, "mu-input-button", _vm.iconParams, false)) : _vm._e(), _vm._v(" "), _c("mu-input", _vm._b({
      on: {
        input: _vm.onInput,
        click: _vm.onInputClick
      },
      nativeOn: {
        keypress: function keypress($event) {
          return _vm.onKeyPress($event);
        }
      }
    }, "mu-input", _vm.inputParams, false)), _vm._v(" "), _vm.clearable ? _c("mu-input-button", {
      attrs: {
        clickable: "",
        "trigger-type": "close"
      },
      on: {
        click: _vm.onClearClick
      }
    }) : _vm._e(), _vm._v(" "), _vm.iconAlign === "right" ? _c("mu-input-button", _vm._b({
      on: {
        click: _vm.onButtonClick
      }
    }, "mu-input-button", _vm.iconParams, false)) : _vm._e(), _vm._v(" "), _vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$6 = [];
  __vue_render__$6._withStripped = true;
  /* style */

  var __vue_inject_styles__$7 = undefined;
  /* scoped */

  var __vue_scope_id__$7 = undefined;
  /* module identifier */

  var __vue_module_identifier__$7 = undefined;
  /* functional template */

  var __vue_is_functional_template__$7 = false;
  /* style inject */

  /* style inject SSR */

  var InputBoxWrapper = normalizeComponent_1({
    render: __vue_render__$6,
    staticRenderFns: __vue_staticRenderFns__$6
  }, __vue_inject_styles__$7, __vue_script__$7, __vue_scope_id__$7, __vue_is_functional_template__$7, __vue_module_identifier__$7, undefined, undefined);

  var BaseInputBox = {
    name: 'MusselBaseInputBox',
    components: {
      'mu-input-box-wrapper': InputBoxWrapper
    },
    provide: function provide() {
      return {
        inputBox: this,
        params: this.params
      };
    },
    data: function data() {
      var p = this;
      return {
        params: {
          type: p.type,
          value: p.value,
          icon: p.icon,
          iconClass: p.iconClass,
          iconAlign: p.iconAlign,
          iconClickable: p.iconClickable,
          triggerType: p.triggerType,
          triggerOn: p.triggerOn,
          readonly: p.readonly,
          disabled: p.disabled,
          editable: p.editable,
          clearable: p.clearable,
          placeholder: p.placeholder
        }
      };
    },
    model: {
      prop: 'value',
      event: 'change'
    },
    props: {
      placeholder: String,
      readonly: Boolean,
      disabled: Boolean,
      type: {
        type: String,
        "default": 'text'
      },
      value: [String, Number],
      icon: String,
      iconClass: String,
      iconAlign: {
        type: String,
        "default": 'right',
        validator: function validator(value) {
          return ['left', 'right'].indexOf(value) !== -1;
        }
      },
      iconClickable: Boolean,
      editable: {
        type: Boolean,
        "default": true
      },
      clearable: {
        type: Boolean,
        "default": true
      },
      triggerType: String,
      triggerOn: Boolean
    },
    watch: {
      value: {
        handler: function handler(value) {
          this.setInputValue(value);
        },
        immediate: true
      },
      readonly: function readonly(value) {
        this.params.readonly = value;
      },
      disabled: function disabled(value) {
        this.params.disabled = value;
      },
      type: function type(value) {
        this.params.type = value;
      },
      icon: function icon(value) {
        this.params.icon = value;
      },
      iconClass: function iconClass(value) {
        this.params.iconClass = value;
      },
      iconAlign: function iconAlign(value) {
        this.params.iconAlign = value;
      },
      triggerType: function triggerType(value) {
        this.params.triggerType = value;
      },
      triggerOn: function triggerOn(value) {
        this.params.triggerOn = value;
      },
      iconClickable: function iconClickable(value) {
        this.params.iconClickable = value || !!this.triggerType;
      },
      editable: function editable(value) {
        this.editable = value;
      },
      clearable: function clearable(value) {
        this.params.clearable = value;
      },
      placeholder: function placeholder(value) {
        this.params.placeholder = value;
      }
    },
    methods: {
      setInputValue: function setInputValue(value) {
        this.params.value = value;
      },
      onInput: function onInput(value) {
        this.setInputValue(value);
        this.$emit('change', value);
      },
      onInputClick: function onInputClick() {
        this.$emit('inputclick');
      },
      onClearClick: function onClearClick() {
        this.params.value = '';
        this.$emit('change', '');
        this.$emit('clear', '');
      },
      onButtonClick: function onButtonClick() {
        this.$el.querySelector('.mu-input').focus();
        if (this.iconClickable) this.$emit('buttonclick');
      },
      onKeyPress: function onKeyPress(event) {
        this.$emit('keypress', event);
      }
    }
  };

  //
  var script$8 = {
    name: 'MusselInputBox',
    "extends": BaseInputBox
  };

  /* script */
  var __vue_script__$8 = script$8;
  /* template */

  var __vue_render__$7 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-input-box-wrapper");
  };

  var __vue_staticRenderFns__$7 = [];
  __vue_render__$7._withStripped = true;
  /* style */

  var __vue_inject_styles__$8 = undefined;
  /* scoped */

  var __vue_scope_id__$8 = undefined;
  /* module identifier */

  var __vue_module_identifier__$8 = undefined;
  /* functional template */

  var __vue_is_functional_template__$8 = false;
  /* style inject */

  /* style inject SSR */

  var InputBox = normalizeComponent_1({
    render: __vue_render__$7,
    staticRenderFns: __vue_staticRenderFns__$7
  }, __vue_inject_styles__$8, __vue_script__$8, __vue_scope_id__$8, __vue_is_functional_template__$8, __vue_module_identifier__$8, undefined, undefined);

  var nativeAssign = Object.assign;

  // `Object.assign` method
  // https://tc39.github.io/ecma262/#sec-object.assign
  // should work with symbols and should have deterministic property order (V8 bug)
  var objectAssign = !nativeAssign || fails(function () {
    var A = {};
    var B = {};
    // eslint-disable-next-line no-undef
    var symbol = Symbol();
    var alphabet = 'abcdefghijklmnopqrst';
    A[symbol] = 7;
    alphabet.split('').forEach(function (chr) { B[chr] = chr; });
    return nativeAssign({}, A)[symbol] != 7 || objectKeys(nativeAssign({}, B)).join('') != alphabet;
  }) ? function assign(target, source) { // eslint-disable-line no-unused-vars
    var T = toObject(target);
    var argumentsLength = arguments.length;
    var index = 1;
    var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    var propertyIsEnumerable = objectPropertyIsEnumerable.f;
    while (argumentsLength > index) {
      var S = indexedObject(arguments[index++]);
      var keys = getOwnPropertySymbols ? objectKeys(S).concat(getOwnPropertySymbols(S)) : objectKeys(S);
      var length = keys.length;
      var j = 0;
      var key;
      while (length > j) {
        key = keys[j++];
        if (!descriptors || propertyIsEnumerable.call(S, key)) T[key] = S[key];
      }
    } return T;
  } : nativeAssign;

  // `Object.assign` method
  // https://tc39.github.io/ecma262/#sec-object.assign
  _export({ target: 'Object', stat: true, forced: Object.assign !== objectAssign }, {
    assign: objectAssign
  });

  var RenderToBodyMixin = {
    props: {
      renderToBody: {
        type: Boolean,
        "default": true
      }
    },
    mounted: function mounted() {
      if (this.renderToBody) {
        document.body.appendChild(this.$el);
      }
    },
    beforeDestroy: function beforeDestroy() {
      this.deactivate();
      var pEl = this.$el.parentNode;

      if (this.$el && pEl && pEl !== Object(this.$parent).$el) {
        pEl.removeChild(this.$el);
      }
    }
  };

  var PopupVisibleMixin = {
    model: {
      prop: 'visible',
      event: 'change'
    },
    props: {
      visible: Boolean
    },
    data: function data() {
      return {
        popupVisible: false
      };
    },
    watch: {
      visible: {
        handler: function handler(value) {
          if (value === !this.popupVisible) {
            this.$nextTick(value ? this.show : this.hide);
          }
        },
        immediate: true
      }
    },
    methods: {
      show: function show() {
        this.popupVisible = true;
        this.$emit('show');
        this.$emit('change', true);
      },
      hide: function hide() {
        this.popupVisible = false;
        this.$emit('hide');
        this.$emit('change', false);
      }
    }
  };

  function getClientRect(el) {
    var _el$getBoundingClient = el.getBoundingClientRect(),
        top = _el$getBoundingClient.top,
        bottom = _el$getBoundingClient.bottom,
        left = _el$getBoundingClient.left,
        right = _el$getBoundingClient.right,
        w = _el$getBoundingClient.width,
        h = _el$getBoundingClient.height;

    return {
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      width: w || right - left,
      height: h || bottom - top
    };
  }

  function isParentElement(element, parentElement) {
    while (Object(element.parentNode).nodeType === 1) {
      element = element.parentNode;
      if (element === parentElement) return true;
    }

    return false;
  }

  function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(source, true).forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function popOnTop(parentRect, height) {
    return parentRect.bottom + 4 + height > window.innerHeight && parentRect.top - height - 4 >= 0;
  }

  function popOnRight(parentRect, width) {
    return parentRect.right + width > window.innerWidth && parentRect.left - width >= 0;
  }

  function getAbsolutePosition(isOnTop, isOnRight, parentRect, height, width) {
    var top = parentRect.top,
        bottom = parentRect.bottom,
        left = parentRect.left,
        right = parentRect.right;
    return {
      top: "".concat(isOnTop ? top - height - 4 : bottom + 4, "px"),
      left: "".concat(isOnRight ? right - width : left, "px")
    };
  }

  function getRelativePosition(isOnTop, isOnRight, parentRect, settingWidth) {
    return {
      top: isOnTop ? undefined : "".concat(parentRect.height + 4, "px"),
      bottom: isOnTop ? "".concat(parentRect.height + 4, "px") : undefined,
      left: isOnRight ? undefined : '0',
      right: isOnRight || !settingWidth ? '0' : undefined
    };
  }

  var script$9 = {
    name: 'MusselDropdown',
    mixins: [RenderToBodyMixin, PopupVisibleMixin],
    provide: function provide() {
      return {
        keepIconIndent: this.keepIconIndent
      };
    },
    props: {
      width: String,
      height: String,
      className: String,
      keepIconIndent: Boolean
    },
    data: function data() {
      return {
        style: {
          visibility: 'hidden',
          opacity: 0,
          top: undefined,
          left: undefined,
          right: undefined,
          bottom: undefined,
          width: undefined,
          height: undefined
        }
      };
    },
    computed: {
      dropdownStyle: function dropdownStyle() {
        var s = _objectSpread$1({}, this.style);

        if (this.width) s.width = this.width;
        if (this.height) s.height = this.height;
        return s;
      }
    },
    methods: {
      deactivate: function deactivate() {
        if (window.__mussel_dropdown === this) window.__mussel_dropdown = null;
      },
      show: function show() {
        window.__mussel_dropdown = this;
        this.popupVisible = true;
        this.$nextTick(this.setPosition);
        this.$emit('show');
        this.$emit('change', true);
      },
      hide: function hide() {
        this.deactivate();
        this.style.opacity = 0;
        this.style.visibility = 'hidden';
        this.popupVisible = false;
        this.$emit('hide');
        this.$emit('change', false);
      },
      hideIf: function hideIf(triggerEl) {
        if (!isParentElement(triggerEl, this.$parent.$el) && (!this.renderToBody || !isParentElement(triggerEl, this.$el))) {
          this.hide();
        }
      },
      setPosition: function setPosition() {
        if (!this.popupVisible) return;
        var _this$$el = this.$el,
            height = _this$$el.offsetHeight,
            width = _this$$el.offsetWidth;
        var pRect = getClientRect(this.$parent.$el);
        var isOnTop = popOnTop(pRect, height);
        var isOnRight = !!this.width && popOnRight(pRect, width);
        Object.assign(this.style, this.renderToBody && !this.width ? {
          width: "".concat(pRect.width, "px")
        } : {}, this.renderToBody ? getAbsolutePosition(isOnTop, isOnRight, pRect, height, width) : getRelativePosition(isOnTop, isOnRight, pRect, this.width), {
          visibility: 'visible',
          opacity: 1
        });
      }
    }
  };

  var css$b = ".mu-dropdown {\r\n  position: absolute;\r\n  z-index: 110;\r\n  display: none;\r\n  background: #fff;\r\n  border: 1px solid #ccc;\r\n  box-shadow: none;\r\n  overflow: auto;\r\n  transition: opacity .2s ease-in-out;\r\n}\r\n.mu-dropdown[visible] {\r\n  display: block;\r\n}\r\nbody > .mu-dropdown {\r\n  position: fixed;\r\n}\r\n.mu-dropdown-list,\r\n.mu-dropdown-menu {\r\n  padding: 4px 0;\r\n}";
  styleInject(css$b);

  /* script */
  var __vue_script__$9 = script$9;
  /* template */

  var __vue_render__$8 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-dropdown",
      "class": _vm.className,
      style: _vm.dropdownStyle,
      attrs: {
        visible: _vm.popupVisible
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$8 = [];
  __vue_render__$8._withStripped = true;
  /* style */

  var __vue_inject_styles__$9 = undefined;
  /* scoped */

  var __vue_scope_id__$9 = undefined;
  /* module identifier */

  var __vue_module_identifier__$9 = undefined;
  /* functional template */

  var __vue_is_functional_template__$9 = false;
  /* style inject */

  /* style inject SSR */

  var Dropdown = normalizeComponent_1({
    render: __vue_render__$8,
    staticRenderFns: __vue_staticRenderFns__$8
  }, __vue_inject_styles__$9, __vue_script__$9, __vue_scope_id__$9, __vue_is_functional_template__$9, __vue_module_identifier__$9, undefined, undefined);

  //
  var script$a = {
    name: 'MusselPopupBoxWrapper',
    inject: ['inputBox', 'params'],
    components: {
      'mu-input-box-wrapper': InputBoxWrapper,
      'mu-dropdown': Dropdown
    },
    computed: {
      dropdownParams: function dropdownParams() {
        var p = this.params;
        return {
          width: p.popupWidth,
          height: p.popupHeight,
          visible: p.popupVisible,
          className: p.popupClassName,
          renderToBody: p.popupRenderToBody,
          keepIconIndent: p.popupKeepIconIndent
        };
      }
    },
    methods: {
      setPopupVisible: function setPopupVisible(value) {
        this.inputBox.setPopupVisible(value);
      }
    }
  };

  /* script */
  var __vue_script__$a = script$a;
  /* template */

  var __vue_render__$9 = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-input-box-wrapper", [!_vm.params.disabled ? _c("mu-dropdown", _vm._b({
      on: {
        change: _vm.setPopupVisible
      }
    }, "mu-dropdown", _vm.dropdownParams, false), [_vm._t("default")], 2) : _vm._e()], 1);
  };

  var __vue_staticRenderFns__$9 = [];
  __vue_render__$9._withStripped = true;
  /* style */

  var __vue_inject_styles__$a = undefined;
  /* scoped */

  var __vue_scope_id__$a = undefined;
  /* module identifier */

  var __vue_module_identifier__$a = undefined;
  /* functional template */

  var __vue_is_functional_template__$a = false;
  /* style inject */

  /* style inject SSR */

  var PopupBoxWrapper = normalizeComponent_1({
    render: __vue_render__$9,
    staticRenderFns: __vue_staticRenderFns__$9
  }, __vue_inject_styles__$a, __vue_script__$a, __vue_scope_id__$a, __vue_is_functional_template__$a, __vue_module_identifier__$a, undefined, undefined);

  var BasePopupBox = {
    name: 'MusselBasePopupBox',
    components: {
      'mu-popup-box-wrapper': PopupBoxWrapper
    },
    "extends": BaseInputBox,
    data: function data() {
      var p = this;
      return {
        params: {
          type: p.type,
          value: p.value,
          icon: p.icon,
          iconClass: p.iconClass,
          iconAlign: p.iconAlign,
          iconClickable: p.iconClickable,
          triggerType: p.triggerType,
          triggerOn: p.triggerOn,
          readonly: p.readonly,
          disabled: p.disabled,
          editable: p.editable,
          clearable: p.clearable,
          placeholder: p.placeholder,
          popupVisible: false,
          popupWidth: p.popupWidth,
          popupHeight: p.popupHeight,
          popupClassName: p.popupClassName,
          popupRenderToBody: p.popupRenderToBody,
          popupKeepIconIndent: p.popupKeepIconIndent,
          focus: false
        }
      };
    },
    props: {
      triggerType: {
        type: String,
        "default": 'expander'
      },
      popupWidth: String,
      popupHeight: String,
      popupClassName: String,
      popupRenderToBody: Boolean,
      popupKeepIconIndent: Boolean
    },
    watch: {
      popupWidth: function popupWidth(value) {
        this.params.popupWidth = value;
      },
      popupHeight: function popupHeight(value) {
        this.params.popupHeight = value;
      },
      popupRenderToBody: function popupRenderToBody(value) {
        this.params.popupRenderToBody = value;
      },
      popupKeepIconIndent: function popupKeepIconIndent(value) {
        this.params.popupKeepIconIndent = value;
      }
    },
    methods: {
      setPopupVisible: function setPopupVisible(value) {
        this.params.popupVisible = value;
        this.params.focus = value;
      },
      togglePopupVisible: function togglePopupVisible() {
        this.setPopupVisible(!this.params.popupVisible);
      },
      onInput: function onInput(value) {
        this.setInputValue(value);
        this.$emit('change', value);
      },
      onInputClick: function onInputClick() {
        if (!this.readonly && !this.params.editable) {
          this.togglePopupVisible();
        }

        this.$emit('inputclick');
      },
      onButtonClick: function onButtonClick() {
        this.$el.querySelector('.mu-input').focus();
        this.togglePopupVisible();
        if (this.iconClickable) this.$emit('buttonclick');
      },
      onClearClick: function onClearClick() {
        this.params.value = '';
        this.setPopupVisible(false);
        this.$emit('change', '');
        this.$emit('clear', '');
      }
    }
  };

  //
  var script$b = {
    name: 'MusselPopupBox',
    "extends": BasePopupBox
  };

  /* script */
  var __vue_script__$b = script$b;
  /* template */

  var __vue_render__$a = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-popup-box-wrapper", [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$a = [];
  __vue_render__$a._withStripped = true;
  /* style */

  var __vue_inject_styles__$b = undefined;
  /* scoped */

  var __vue_scope_id__$b = undefined;
  /* module identifier */

  var __vue_module_identifier__$b = undefined;
  /* functional template */

  var __vue_is_functional_template__$b = false;
  /* style inject */

  /* style inject SSR */

  var PopupBox = normalizeComponent_1({
    render: __vue_render__$a,
    staticRenderFns: __vue_staticRenderFns__$a
  }, __vue_inject_styles__$b, __vue_script__$b, __vue_scope_id__$b, __vue_is_functional_template__$b, __vue_module_identifier__$b, undefined, undefined);

  var UNSCOPABLES = wellKnownSymbol('unscopables');
  var ArrayPrototype = Array.prototype;

  // Array.prototype[@@unscopables]
  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  if (ArrayPrototype[UNSCOPABLES] == undefined) {
    hide(ArrayPrototype, UNSCOPABLES, objectCreate(null));
  }

  // add a key to Array.prototype[@@unscopables]
  var addToUnscopables = function (key) {
    ArrayPrototype[UNSCOPABLES][key] = true;
  };

  var $find = arrayIteration.find;


  var FIND = 'find';
  var SKIPS_HOLES = true;

  // Shouldn't skip holes
  if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  _export({ target: 'Array', proto: true, forced: SKIPS_HOLES }, {
    find: function find(callbackfn /* , that = undefined */) {
      return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables(FIND);

  var $findIndex = arrayIteration.findIndex;


  var FIND_INDEX = 'findIndex';
  var SKIPS_HOLES$1 = true;

  // Shouldn't skip holes
  if (FIND_INDEX in []) Array(1)[FIND_INDEX](function () { SKIPS_HOLES$1 = false; });

  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findindex
  _export({ target: 'Array', proto: true, forced: SKIPS_HOLES$1 }, {
    findIndex: function findIndex(callbackfn /* , that = undefined */) {
      return $findIndex(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables(FIND_INDEX);

  var nativeJoin = [].join;

  var ES3_STRINGS = indexedObject != Object;
  var SLOPPY_METHOD$1 = sloppyArrayMethod('join', ',');

  // `Array.prototype.join` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.join
  _export({ target: 'Array', proto: true, forced: ES3_STRINGS || SLOPPY_METHOD$1 }, {
    join: function join(separator) {
      return nativeJoin.call(toIndexedObject(this), separator === undefined ? ',' : separator);
    }
  });

  var $map = arrayIteration.map;


  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('map') }, {
    map: function map(callbackfn /* , thisArg */) {
      return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var max$1 = Math.max;
  var min$2 = Math.min;
  var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

  // `Array.prototype.splice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.splice
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('splice') }, {
    splice: function splice(start, deleteCount /* , ...items */) {
      var O = toObject(this);
      var len = toLength(O.length);
      var actualStart = toAbsoluteIndex(start, len);
      var argumentsLength = arguments.length;
      var insertCount, actualDeleteCount, A, k, from, to;
      if (argumentsLength === 0) {
        insertCount = actualDeleteCount = 0;
      } else if (argumentsLength === 1) {
        insertCount = 0;
        actualDeleteCount = len - actualStart;
      } else {
        insertCount = argumentsLength - 2;
        actualDeleteCount = min$2(max$1(toInteger(deleteCount), 0), len - actualStart);
      }
      if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER$1) {
        throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
      }
      A = arraySpeciesCreate(O, actualDeleteCount);
      for (k = 0; k < actualDeleteCount; k++) {
        from = actualStart + k;
        if (from in O) createProperty(A, k, O[from]);
      }
      A.length = actualDeleteCount;
      if (insertCount < actualDeleteCount) {
        for (k = actualStart; k < len - actualDeleteCount; k++) {
          from = k + actualDeleteCount;
          to = k + insertCount;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
        for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
      } else if (insertCount > actualDeleteCount) {
        for (k = len - actualDeleteCount; k > actualStart; k--) {
          from = k + actualDeleteCount - 1;
          to = k + insertCount - 1;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
      }
      for (k = 0; k < insertCount; k++) {
        O[k + actualStart] = arguments[k + 2];
      }
      O.length = len - actualDeleteCount + insertCount;
      return A;
    }
  });

  var userAgent = getBuiltIn('navigator', 'userAgent') || '';

  var slice = [].slice;
  var MSIE = /MSIE .\./.test(userAgent); // <- dirty ie9- check

  var wrap$1 = function (scheduler) {
    return function (handler, timeout /* , ...arguments */) {
      var boundArgs = arguments.length > 2;
      var args = boundArgs ? slice.call(arguments, 2) : undefined;
      return scheduler(boundArgs ? function () {
        // eslint-disable-next-line no-new-func
        (typeof handler == 'function' ? handler : Function(handler)).apply(this, args);
      } : handler, timeout);
    };
  };

  // ie9- setTimeout & setInterval additional parameters fix
  // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
  _export({ global: true, bind: true, forced: MSIE }, {
    // `setTimeout` method
    // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
    setTimeout: wrap$1(global_1.setTimeout),
    // `setInterval` method
    // https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
    setInterval: wrap$1(global_1.setInterval)
  });

  //
  var script$c = {
    name: 'MusselListItem',
    components: {
      'mu-icon': Icon
    },
    inject: {
      keepIconIndent: {
        "default": false
      }
    },
    props: {
      className: String,
      iconClass: String,
      icon: String,
      label: String,
      active: Boolean,
      disabled: Boolean,
      triggerIcon: String
    },
    computed: {
      actualLabel: function actualLabel() {
        return this.label;
      },
      actualIcon: function actualIcon() {
        return this.icon;
      },
      actualIconClass: function actualIconClass() {
        return this.iconClass;
      },
      actualActive: function actualActive() {
        return this.active;
      },
      actualSelected: function actualSelected() {
        return this.selected;
      },
      actualTriggerIcon: function actualTriggerIcon() {
        return this.triggerIcon;
      }
    },
    methods: {
      onClick: function onClick() {
        if (!this.disabled) this.$emit('click');
      },
      onButtonClick: function onButtonClick() {
        if (!this.disabled) this.$emit('buttonclick');
      }
    }
  };

  var css$c = ".mu-list-item {\r\n  position: relative;\r\n  line-height: 20px;\r\n  padding: 10px 10px;\r\n  overflow: hidden;\r\n}\r\n.mu-list-item[selected] {\r\n  color: #1890ff;\r\n  fill: #1890ff;\r\n  font-weight: 700;\r\n}\r\n.mu-list-item:hover {\r\n  color: #1890ff;\r\n  fill: #1890ff;\r\n  background: rgba(0,0,0,.05);\r\n}\r\n.mu-list-item[active] {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #1890ff;\r\n}\r\n.mu-list-item > .mu-icon:first-child {\r\n  display: inline-block;\r\n  width: 20px;\r\n}\r\n.mu-list-item:not([multi-lines]) {\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  cursor: default;\r\n}\r\n.mu-dropdown > .mu-list-item {\r\n  padding: 5px 10px;\r\n  cursor: pointer;\r\n}\r\n.mu-dropdown-menu > .mu-list-item:hover {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #1890ff;\r\n}";
  styleInject(css$c);

  /* script */
  var __vue_script__$c = script$c;
  /* template */

  var __vue_render__$b = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-list-item",
      "class": _vm.className,
      attrs: {
        active: _vm.actualActive,
        selected: _vm.actualSelected
      },
      on: {
        click: _vm.onClick
      }
    }, [_vm.actualIcon || _vm.actualIconClass || _vm.keepIconIndent ? _c("mu-icon", {
      attrs: {
        icon: _vm.actualIcon,
        "icon-class": _vm.actualIconClass
      },
      on: {
        click: _vm.onButtonClick
      }
    }) : _vm._e(), _vm._v(" "), _vm._t("default", [_vm._v(_vm._s(_vm.actualLabel))])], 2);
  };

  var __vue_staticRenderFns__$b = [];
  __vue_render__$b._withStripped = true;
  /* style */

  var __vue_inject_styles__$c = undefined;
  /* scoped */

  var __vue_scope_id__$c = undefined;
  /* module identifier */

  var __vue_module_identifier__$c = undefined;
  /* functional template */

  var __vue_is_functional_template__$c = false;
  /* style inject */

  /* style inject SSR */

  var ListItem = normalizeComponent_1({
    render: __vue_render__$b,
    staticRenderFns: __vue_staticRenderFns__$b
  }, __vue_inject_styles__$c, __vue_script__$c, __vue_scope_id__$c, __vue_is_functional_template__$c, __vue_module_identifier__$c, undefined, undefined);

  var Option = {
    name: 'MusselOption',
    "extends": ListItem,
    inject: {
      inputBox: {
        "default": null
      },
      multiple: {
        "default": false
      }
    },
    props: {
      value: String,
      fields: Array,
      option: [String, Number, Object]
    },
    computed: {
      valueField: function valueField() {
        return Object(this.fields).value || 'value';
      },
      labelField: function labelField() {
        return Object(this.fields).label || 'label';
      },
      actualValue: function actualValue() {
        var v = this.value === undefined ? Object(this.option)[this.valueField] : this.value;
        return v === undefined ? this.option : v;
      },
      actualLabel: function actualLabel() {
        var label = this.label === undefined ? Object(this.option)[this.labelField] : this.label;
        return label || this.actualValue;
      },
      actualIcon: function actualIcon() {
        return this.multiple ? this.actualSelected ? 'ok' : '_' : this.icon;
      },
      actualSelected: function actualSelected() {
        var _this = this;

        var selected = this.inputBox.selectedValue;
        return this.multiple ? !!selected.find(function (value) {
          return value === _this.actualValue;
        }) : selected === this.actualValue;
      }
    },
    created: function created() {
      this.inputBox.mountOption({
        value: this.actualValue,
        label: this.actualLabel
      });
    },
    beforeDestroy: function beforeDestroy() {
      this.inputBox.unmountOption({
        value: this.actualValue,
        label: this.actualLabel
      });
    },
    methods: {
      onClick: function onClick() {
        if (this.disabled) return;

        if (this.inputBox) {
          this.inputBox.toggleSelection(this.actualValue, this.option);
        }

        this.$emit('click');
      }
    }
  };

  var script$d = {
    name: 'MusselComboBox',
    components: {
      'mu-option': Option
    },
    "extends": BasePopupBox,
    provide: function provide() {
      return {
        multiple: this.multiple
      };
    },
    props: {
      fields: Object,
      options: Array,
      multiple: Boolean,
      popupClassName: {
        type: String,
        "default": 'mu-dropdown-list'
      },
      value: [String, Number, Array]
    },
    data: function data() {
      return {
        selectedValue: null,
        mountedOptions: []
      };
    },
    computed: {
      valueField: function valueField() {
        return Object(this.fields).value || 'value';
      }
    },
    watch: {
      multiple: {
        handler: function handler(value) {
          this.params.editable = this.editable && !value;
        },
        immediate: true
      }
    },
    methods: {
      setInputValue: function setInputValue() {// do nothing, juest overwrite InputBox's setInputValue()
      },
      setInputValueImmediately: function setInputValueImmediately() {
        var selectedValue = this.selectedValue,
            multiple = this.multiple,
            options = this.mountedOptions;

        if (!this.params.editable) {
          this.params.value = selectedValue;
        }

        this.params.value = !selectedValue && selectedValue !== 0 ? '' : this.params.editable ? selectedValue : (multiple ? selectedValue : [selectedValue]).map(function (value) {
          return Object(options.find(function (item) {
            return item.value === value;
          })).label || '';
        }).join(',');
      },
      refreshInputValue: function refreshInputValue() {
        var immediate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        if (this.rivTimer) {
          clearTimeout(this.rivTimer);
          this.rivTimer = null;
        }

        if (this.params.editable || immediate) {
          this.setInputValueImmediately();
        } else {
          this.rivTimer = setTimeout(this.setInputValueImmediately, 50);
        }
      },
      onInput: function onInput(value) {
        this.params.value = value;
        this.selectedValue = value;
        this.$emit('input', value);
        this.$emit('change', value);
      },
      mountOption: function mountOption(option) {
        var options = this.mountedOptions;

        if (!options.find(function (item) {
          return option.value === item.value;
        })) {
          options.push(option);
          if (!this.params.editable) this.refreshInputValue();
        }
      },
      unmountOption: function unmountOption(option) {
        var options = this.mountedOptions;
        var idx = options.findIndex(function (item) {
          return option.value === item.value;
        });

        if (idx !== -1) {
          options.splice(idx, 1); // if (!this.inputReadonly) this.refreshInputValue()
        }
      },
      toggleSelection: function toggleSelection(value, option) {
        var hidePopup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        if (this.multiple) {
          var values = this.selectedValue;
          var idx = values.indexOf(value);

          if (idx !== -1) {
            values.splice(idx, 1);
          } else {
            values.push(value);
          }

          this.$emit('change', values);
        } else {
          this.selectedValue = value;
          this.$emit('change', value);
        }

        this.refreshInputValue(true);
        if (hidePopup) this.params.popupVisible = false;
        this.$emit('optionclick', value, option);
      },
      onClearClick: function onClearClick() {
        this.selectedValue = this.multiple ? [] : null;
        this.params.value = '';
        this.$emit('change', this.selectedValue);
        this.$emit('clear', '');
      }
    }
  };

  /* script */
  var __vue_script__$d = script$d;
  /* template */

  var __vue_render__$c = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-popup-box-wrapper", [!_vm.options ? _vm._t("default") : _vm._l(_vm.options, function (option) {
      return _c("mu-option", {
        key: Object(option)[_vm.valueField] || option,
        attrs: {
          option: option,
          fields: _vm.fields
        }
      });
    })], 2);
  };

  var __vue_staticRenderFns__$c = [];
  __vue_render__$c._withStripped = true;
  /* style */

  var __vue_inject_styles__$d = undefined;
  /* scoped */

  var __vue_scope_id__$d = undefined;
  /* module identifier */

  var __vue_module_identifier__$d = undefined;
  /* functional template */

  var __vue_is_functional_template__$d = false;
  /* style inject */

  /* style inject SSR */

  var ComboBox = normalizeComponent_1({
    render: __vue_render__$c,
    staticRenderFns: __vue_staticRenderFns__$c
  }, __vue_inject_styles__$d, __vue_script__$d, __vue_scope_id__$d, __vue_is_functional_template__$d, __vue_module_identifier__$d, undefined, undefined);

  //
  //
  //
  //
  var script$e = {
    name: 'MusselListDivider'
  };

  var css$d = ".mu-list-divider {\r\n  display: block;\r\n  margin-top: 4px;\r\n  margin-bottom: 4px;\r\n  height: 1px;\r\n  border-bottom: 1px solid rgba(0,0,0,.1);\r\n}\r\n.mu-list-divider:first-child,\r\n.mu-list-divider:last-child {\r\n  display: none;\r\n}";
  styleInject(css$d);

  /* script */
  var __vue_script__$e = script$e;
  /* template */

  var __vue_render__$d = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-list-divider"
    });
  };

  var __vue_staticRenderFns__$d = [];
  __vue_render__$d._withStripped = true;
  /* style */

  var __vue_inject_styles__$e = undefined;
  /* scoped */

  var __vue_scope_id__$e = undefined;
  /* module identifier */

  var __vue_module_identifier__$e = undefined;
  /* functional template */

  var __vue_is_functional_template__$e = false;
  /* style inject */

  /* style inject SSR */

  var ListDivider = normalizeComponent_1({
    render: __vue_render__$d,
    staticRenderFns: __vue_staticRenderFns__$d
  }, __vue_inject_styles__$e, __vue_script__$e, __vue_scope_id__$e, __vue_is_functional_template__$e, __vue_module_identifier__$e, undefined, undefined);

  function callbackIf(name, handler) {
    var popup = window['__mussel_' + name];
    if (popup) handler(popup);
    return popup;
  }

  function hideIf(name, force) {
    return name === 'dropdown' ? callbackIf('dropdown', function (dropdown) {
      return dropdown.hide();
    }) : name === 'modal' ? callbackIf('modal', function (modal) {
      return (modal.$options.maskAction || modal.maskAction) === 'close' && modal.hide(force);
    }) : undefined;
  }

  function setPositionIf() {
    callbackIf('dropdown', function (dropdown) {
      return dropdown.setPosition();
    });
  }

  window.addEventListener('blur', function () {
    return hideIf('dropdown');
  });
  window.addEventListener('keyup', function (event) {
    return event.keyCode === 27 && (hideIf('dropdown') || hideIf('modal'));
  });
  window.addEventListener('mousedown', function (event) {
    return callbackIf('dropdown', function (dropdown) {
      return dropdown.hideIf(event.target);
    });
  });
  window.addEventListener('popstate', function () {
    hideIf('dropdown');
    hideIf('modal', true);
  });
  window.addEventListener('resize', setPositionIf);
  window.addEventListener('scroll', setPositionIf);

  var script$f = {
    name: 'MusselBaseModal',
    mixins: [RenderToBodyMixin, PopupVisibleMixin],
    props: {
      maskAction: {
        type: String,
        "default": 'close',
        validator: function validator(value) {
          return ['none', 'close'].indexOf(value) !== -1;
        }
      }
    },
    methods: {
      deactivate: function deactivate() {
        if (window.__mussel_modal === this) window.__mussel_modal = null;
      },
      onMaskClick: function onMaskClick(event) {
        if (event.target === this.$el) {
          var action = this.$options.maskAction || this.maskAction;
          if (action === 'close') this.hide();
          this.$emit('maskclick');
        }
      },
      show: function show() {
        window.__mussel_modal = this;
        this.popupVisible = true;
        this.$emit('show');
        this.$emit('change', true);
      },
      hide: function hide() {
        this.deactivate();
        this.popupVisible = false;
        this.$emit('hide');
        this.$emit('change', false);
      }
    }
  };

  var css$e = ".mu-modal-mask {\r\n  position: absolute;\r\n  z-index: 100;\r\n  top: 0;\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  display: none;\r\n  background: rgba(0,0,0,.17);\r\n}\r\n.mu-modal-mask[visible] {\r\n  display: block;\r\n}\r\n.mu-modal-mask.mu-flex-box[visible] {\r\n  display: flex;\r\n}\r\nbody > .mu-modal-mask {\r\n  position: fixed;\r\n}";
  styleInject(css$e);

  /* script */
  var __vue_script__$f = script$f;
  /* template */

  /* style */

  var __vue_inject_styles__$f = undefined;
  /* scoped */

  var __vue_scope_id__$f = undefined;
  /* module identifier */

  var __vue_module_identifier__$f = undefined;
  /* functional template */

  var __vue_is_functional_template__$f = undefined;
  /* style inject */

  /* style inject SSR */

  var BaseModal = normalizeComponent_1({}, __vue_inject_styles__$f, __vue_script__$f, __vue_scope_id__$f, __vue_is_functional_template__$f, __vue_module_identifier__$f, undefined, undefined);

  // `Array.isArray` method
  // https://tc39.github.io/ecma262/#sec-array.isarray
  _export({ target: 'Array', stat: true }, {
    isArray: isArray
  });

  var defineProperty$3 = objectDefineProperty.f;


  var NativeSymbol = global_1.Symbol;

  if (descriptors && typeof NativeSymbol == 'function' && (!('description' in NativeSymbol.prototype) ||
    // Safari 12 bug
    NativeSymbol().description !== undefined
  )) {
    var EmptyStringDescriptionStore = {};
    // wrap Symbol constructor for correct work with undefined description
    var SymbolWrapper = function Symbol() {
      var description = arguments.length < 1 || arguments[0] === undefined ? undefined : String(arguments[0]);
      var result = this instanceof SymbolWrapper
        ? new NativeSymbol(description)
        // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
        : description === undefined ? NativeSymbol() : NativeSymbol(description);
      if (description === '') EmptyStringDescriptionStore[result] = true;
      return result;
    };
    copyConstructorProperties(SymbolWrapper, NativeSymbol);
    var symbolPrototype = SymbolWrapper.prototype = NativeSymbol.prototype;
    symbolPrototype.constructor = SymbolWrapper;

    var symbolToString = symbolPrototype.toString;
    var native = String(NativeSymbol('test')) == 'Symbol(test)';
    var regexp = /^Symbol\((.*)\)[^)]+$/;
    defineProperty$3(symbolPrototype, 'description', {
      configurable: true,
      get: function description() {
        var symbol = isObject(this) ? this.valueOf() : this;
        var string = symbolToString.call(symbol);
        if (has(EmptyStringDescriptionStore, symbol)) return '';
        var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1');
        return desc === '' ? undefined : desc;
      }
    });

    _export({ global: true, forced: true }, {
      Symbol: SymbolWrapper
    });
  }

  // `Symbol.iterator` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.iterator
  defineWellKnownSymbol('iterator');

  var correctPrototypeGetter = !fails(function () {
    function F() { /* empty */ }
    F.prototype.constructor = null;
    return Object.getPrototypeOf(new F()) !== F.prototype;
  });

  var IE_PROTO$1 = sharedKey('IE_PROTO');
  var ObjectPrototype$1 = Object.prototype;

  // `Object.getPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.getprototypeof
  var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
    O = toObject(O);
    if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];
    if (typeof O.constructor == 'function' && O instanceof O.constructor) {
      return O.constructor.prototype;
    } return O instanceof Object ? ObjectPrototype$1 : null;
  };

  var ITERATOR = wellKnownSymbol('iterator');
  var BUGGY_SAFARI_ITERATORS = false;

  var returnThis = function () { return this; };

  // `%IteratorPrototype%` object
  // https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
  var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

  if ([].keys) {
    arrayIterator = [].keys();
    // Safari 8 has buggy iterators w/o `next`
    if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
    else {
      PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
      if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
    }
  }

  if (IteratorPrototype == undefined) IteratorPrototype = {};

  // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
  if ( !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);

  var iteratorsCore = {
    IteratorPrototype: IteratorPrototype,
    BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
  };

  var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;

  var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
    var TO_STRING_TAG = NAME + ' Iterator';
    IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
    setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
    return IteratorConstructor;
  };

  var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
  var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
  var ITERATOR$1 = wellKnownSymbol('iterator');
  var KEYS = 'keys';
  var VALUES = 'values';
  var ENTRIES = 'entries';

  var returnThis$1 = function () { return this; };

  var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
    createIteratorConstructor(IteratorConstructor, NAME, next);

    var getIterationMethod = function (KIND) {
      if (KIND === DEFAULT && defaultIterator) return defaultIterator;
      if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
      switch (KIND) {
        case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
        case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
        case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
      } return function () { return new IteratorConstructor(this); };
    };

    var TO_STRING_TAG = NAME + ' Iterator';
    var INCORRECT_VALUES_NAME = false;
    var IterablePrototype = Iterable.prototype;
    var nativeIterator = IterablePrototype[ITERATOR$1]
      || IterablePrototype['@@iterator']
      || DEFAULT && IterablePrototype[DEFAULT];
    var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
    var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
    var CurrentIteratorPrototype, methods, KEY;

    // fix native
    if (anyNativeIterator) {
      CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
      if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
        if ( objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2) {
          if (objectSetPrototypeOf) {
            objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
          } else if (typeof CurrentIteratorPrototype[ITERATOR$1] != 'function') {
            hide(CurrentIteratorPrototype, ITERATOR$1, returnThis$1);
          }
        }
        // Set @@toStringTag to native iterators
        setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
      }
    }

    // fix Array#{values, @@iterator}.name in V8 / FF
    if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
      INCORRECT_VALUES_NAME = true;
      defaultIterator = function values() { return nativeIterator.call(this); };
    }

    // define iterator
    if ( IterablePrototype[ITERATOR$1] !== defaultIterator) {
      hide(IterablePrototype, ITERATOR$1, defaultIterator);
    }

    // export additional methods
    if (DEFAULT) {
      methods = {
        values: getIterationMethod(VALUES),
        keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
        entries: getIterationMethod(ENTRIES)
      };
      if (FORCED) for (KEY in methods) {
        if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
          redefine(IterablePrototype, KEY, methods[KEY]);
        }
      } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
    }

    return methods;
  };

  var ARRAY_ITERATOR = 'Array Iterator';
  var setInternalState$1 = internalState.set;
  var getInternalState$1 = internalState.getterFor(ARRAY_ITERATOR);

  // `Array.prototype.entries` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.entries
  // `Array.prototype.keys` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.keys
  // `Array.prototype.values` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.values
  // `Array.prototype[@@iterator]` method
  // https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
  // `CreateArrayIterator` internal method
  // https://tc39.github.io/ecma262/#sec-createarrayiterator
  var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
    setInternalState$1(this, {
      type: ARRAY_ITERATOR,
      target: toIndexedObject(iterated), // target
      index: 0,                          // next index
      kind: kind                         // kind
    });
  // `%ArrayIteratorPrototype%.next` method
  // https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
  }, function () {
    var state = getInternalState$1(this);
    var target = state.target;
    var kind = state.kind;
    var index = state.index++;
    if (!target || index >= target.length) {
      state.target = undefined;
      return { value: undefined, done: true };
    }
    if (kind == 'keys') return { value: index, done: false };
    if (kind == 'values') return { value: target[index], done: false };
    return { value: [index, target[index]], done: false };
  }, 'values');

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables('keys');
  addToUnscopables('values');
  addToUnscopables('entries');

  var DatePrototype = Date.prototype;
  var INVALID_DATE = 'Invalid Date';
  var TO_STRING = 'toString';
  var nativeDateToString = DatePrototype[TO_STRING];
  var getTime = DatePrototype.getTime;

  // `Date.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.tostring
  if (new Date(NaN) + '' != INVALID_DATE) {
    redefine(DatePrototype, TO_STRING, function toString() {
      var value = getTime.call(this);
      // eslint-disable-next-line no-self-compare
      return value === value ? nativeDateToString.call(this) : INVALID_DATE;
    });
  }

  var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
  // ES3 wrong here
  var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

  // fallback for IE11 Script Access Denied error
  var tryGet = function (it, key) {
    try {
      return it[key];
    } catch (error) { /* empty */ }
  };

  // getting tag from ES6+ `Object.prototype.toString`
  var classof = function (it) {
    var O, tag, result;
    return it === undefined ? 'Undefined' : it === null ? 'Null'
      // @@toStringTag case
      : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$1)) == 'string' ? tag
      // builtinTag case
      : CORRECT_ARGUMENTS ? classofRaw(O)
      // ES3 arguments fallback
      : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
  };

  var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');
  var test$1 = {};

  test$1[TO_STRING_TAG$2] = 'z';

  // `Object.prototype.toString` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  var objectToString = String(test$1) !== '[object z]' ? function toString() {
    return '[object ' + classof(this) + ']';
  } : test$1.toString;

  var ObjectPrototype$2 = Object.prototype;

  // `Object.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  if (objectToString !== ObjectPrototype$2.toString) {
    redefine(ObjectPrototype$2, 'toString', objectToString, { unsafe: true });
  }

  // `RegExp.prototype.flags` getter implementation
  // https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
  var regexpFlags = function () {
    var that = anObject(this);
    var result = '';
    if (that.global) result += 'g';
    if (that.ignoreCase) result += 'i';
    if (that.multiline) result += 'm';
    if (that.dotAll) result += 's';
    if (that.unicode) result += 'u';
    if (that.sticky) result += 'y';
    return result;
  };

  var TO_STRING$1 = 'toString';
  var RegExpPrototype = RegExp.prototype;
  var nativeToString = RegExpPrototype[TO_STRING$1];

  var NOT_GENERIC = fails(function () { return nativeToString.call({ source: 'a', flags: 'b' }) != '/a/b'; });
  // FF44- RegExp#toString has a wrong name
  var INCORRECT_NAME = nativeToString.name != TO_STRING$1;

  // `RegExp.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
  if (NOT_GENERIC || INCORRECT_NAME) {
    redefine(RegExp.prototype, TO_STRING$1, function toString() {
      var R = anObject(this);
      var p = String(R.source);
      var rf = R.flags;
      var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype) ? regexpFlags.call(R) : rf);
      return '/' + p + '/' + f;
    }, { unsafe: true });
  }

  // `String.prototype.{ codePointAt, at }` methods implementation
  var createMethod$3 = function (CONVERT_TO_STRING) {
    return function ($this, pos) {
      var S = String(requireObjectCoercible($this));
      var position = toInteger(pos);
      var size = S.length;
      var first, second;
      if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
      first = S.charCodeAt(position);
      return first < 0xD800 || first > 0xDBFF || position + 1 === size
        || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
          ? CONVERT_TO_STRING ? S.charAt(position) : first
          : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
    };
  };

  var stringMultibyte = {
    // `String.prototype.codePointAt` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
    codeAt: createMethod$3(false),
    // `String.prototype.at` method
    // https://github.com/mathiasbynens/String.prototype.at
    charAt: createMethod$3(true)
  };

  var charAt = stringMultibyte.charAt;



  var STRING_ITERATOR = 'String Iterator';
  var setInternalState$2 = internalState.set;
  var getInternalState$2 = internalState.getterFor(STRING_ITERATOR);

  // `String.prototype[@@iterator]` method
  // https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
  defineIterator(String, 'String', function (iterated) {
    setInternalState$2(this, {
      type: STRING_ITERATOR,
      string: String(iterated),
      index: 0
    });
  // `%StringIteratorPrototype%.next` method
  // https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
  }, function next() {
    var state = getInternalState$2(this);
    var string = state.string;
    var index = state.index;
    var point;
    if (index >= string.length) return { value: undefined, done: true };
    point = charAt(string, index);
    state.index += point.length;
    return { value: point, done: false };
  });

  var ITERATOR$2 = wellKnownSymbol('iterator');
  var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');
  var ArrayValues = es_array_iterator.values;

  for (var COLLECTION_NAME$1 in domIterables) {
    var Collection$1 = global_1[COLLECTION_NAME$1];
    var CollectionPrototype$1 = Collection$1 && Collection$1.prototype;
    if (CollectionPrototype$1) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype$1[ITERATOR$2] !== ArrayValues) try {
        hide(CollectionPrototype$1, ITERATOR$2, ArrayValues);
      } catch (error) {
        CollectionPrototype$1[ITERATOR$2] = ArrayValues;
      }
      if (!CollectionPrototype$1[TO_STRING_TAG$3]) hide(CollectionPrototype$1, TO_STRING_TAG$3, COLLECTION_NAME$1);
      if (domIterables[COLLECTION_NAME$1]) for (var METHOD_NAME in es_array_iterator) {
        // some Chrome versions have non-configurable methods on DOMTokenList
        if (CollectionPrototype$1[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
          hide(CollectionPrototype$1, METHOD_NAME, es_array_iterator[METHOD_NAME]);
        } catch (error) {
          CollectionPrototype$1[METHOD_NAME] = es_array_iterator[METHOD_NAME];
        }
      }
    }
  }

  function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

  /**
   * lodash 4.0.1 (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Available under MIT license <https://lodash.com/license>
   */

  /** `Object#toString` result references. */
  var stringTag = '[object String]';
  /** Used for built-in method references. */

  var objectProto = Object.prototype;
  /**
   * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
   * of values.
   */

  var objectToString$1 = objectProto.toString;
  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @type Function
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */

  var isArray$1 = Array.isArray;
  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */

  function isObjectLike(value) {
    return !!value && _typeof(value) == 'object';
  }
  /**
   * Checks if `value` is classified as a `String` primitive or object.
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   * @example
   *
   * _.isString('abc');
   * // => true
   *
   * _.isString(1);
   * // => false
   */


  function isString(value) {
    return typeof value == 'string' || !isArray$1(value) && isObjectLike(value) && objectToString$1.call(value) == stringTag;
  }

  var lodash_isstring = isString;

  //
  var script$g = {
    name: 'MusselDialogWrapper',
    components: {
      'mu-v-box': VBox,
      'mu-close-button': CloseButton
    },
    inject: ['dialog', 'params'],
    computed: {
      style: function style() {
        return {
          width: this.params.width,
          height: this.params.height
        };
      }
    },
    methods: {
      onMaskClick: function onMaskClick(event) {
        this.dialog.onMaskClick(event);
      },
      hide: function hide() {
        this.dialog.hide();
      },
      onButtonClick: function onButtonClick(btn) {
        this.dialog.onButtonClick(btn);
      }
    }
  };

  var css$f = ".mu-dialog {\r\n  position: relative;\r\n  min-width: 200px;\r\n  min-height: 100px;\r\n  background: rgba(255,255,255,.95);\r\n  opacity: 0;\r\n  box-shadow: 0 6px 12px rgba(0,0,0,.23),0 10px 40px rgba(0,0,0,.19);\r\n  transform: translateY(200px);\r\n  transition: all .2s ease-in-out;\r\n}\r\n.mu-dialog[visible] {\r\n  opacity: 1;\r\n  transform: translateY(0);\r\n}\r\n.mu-dialog[danger] > .mu-dialog-header {\r\n  border-bottom-color: #fa541c;\r\n}\r\n.mu-dialog-header {\r\n  height: 50px;\r\n  padding: 16px;\r\n  background: 0 0;\r\n  border-bottom: 2px solid #1890ff;\r\n}\r\n.mu-dialog-header > .mu-dialog-title {\r\n  font-size: 1rem;\r\n  font-weight: 600;\r\n}\r\n.mu-dialog-footer {\r\n  margin-top: auto;\r\n  height: 50px;\r\n  background: rgba(0,0,0,.05);\r\n  padding: 0 16px;\r\n}\r\n.mu-dialog-footer > .mu-button {\r\n  margin-left: 8px;\r\n}\r\n.mu-dialog-body {\r\n  padding: 16px;\r\n}";
  styleInject(css$f);

  /* script */
  var __vue_script__$g = script$g;
  /* template */

  var __vue_render__$e = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-v-box", {
      staticClass: "mu-modal-mask",
      attrs: {
        "flex-center": "",
        visible: _vm.params.modalVisible
      },
      nativeOn: {
        click: function click($event) {
          return _vm.onMaskClick($event);
        }
      }
    }, [_vm.params.modalVisible ? _c("mu-v-box", {
      staticClass: "mu-dialog",
      style: _vm.style,
      attrs: {
        danger: _vm.params.danger,
        visible: _vm.params.dialogVisible
      }
    }, [_c("mu-h-box", {
      staticClass: "mu-dialog-header"
    }, [_c("mu-flex-item", {
      staticClass: "mu-dialog-title mu-text-ellipsis",
      attrs: {
        size: "auto"
      }
    }, [_vm._v("\n        " + _vm._s(_vm.params.title) + "\n      ")]), _vm._v(" "), _c("mu-close-button", {
      on: {
        click: _vm.hide
      }
    })], 1), _vm._v(" "), _c("mu-flex-item", {
      staticClass: "mu-dialog-body",
      attrs: {
        size: _vm.params.height ? "auto" : undefined
      }
    }, [_vm._t("default")], 2), _vm._v(" "), _vm._t("footer", [_vm.params.buttons ? _c("mu-h-box", {
      staticClass: "mu-dialog-footer",
      attrs: {
        "align-items": "center"
      }
    }, [_c("div", {
      staticStyle: {
        "margin-right": "auto"
      }
    }), _vm._v(" "), _vm._l(_vm.params.buttons, function (btn) {
      return _c("mu-button", _vm._b({
        key: btn.caption || btn.icon || btn.iconClass,
        on: {
          click: function click($event) {
            return _vm.onButtonClick(btn);
          }
        }
      }, "mu-button", btn, false));
    })], 2) : _vm._e()])], 2) : _vm._e()], 1);
  };

  var __vue_staticRenderFns__$e = [];
  __vue_render__$e._withStripped = true;
  /* style */

  var __vue_inject_styles__$g = undefined;
  /* scoped */

  var __vue_scope_id__$g = undefined;
  /* module identifier */

  var __vue_module_identifier__$g = undefined;
  /* functional template */

  var __vue_is_functional_template__$g = false;
  /* style inject */

  /* style inject SSR */

  var DialogWrapper = normalizeComponent_1({
    render: __vue_render__$e,
    staticRenderFns: __vue_staticRenderFns__$e
  }, __vue_inject_styles__$g, __vue_script__$g, __vue_scope_id__$g, __vue_is_functional_template__$g, __vue_module_identifier__$g, undefined, undefined);

  function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(source, true).forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

  function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
  var script$h = {
    name: 'MusselBaseDialog',
    components: {
      'mu-dialog-wrapper': DialogWrapper
    },
    "extends": BaseModal,
    provide: function provide() {
      return {
        dialog: this,
        params: this.params
      };
    },
    props: {
      title: String,
      width: String,
      height: String,
      buttons: Array,
      danger: Boolean,
      primaryButton: String
    },
    data: function data() {
      var o = this.$options;
      return {
        params: {
          modalVisible: false,
          dialogVisible: false,
          width: this.width || o.width,
          height: this.height || o.height,
          danger: this.danger || o.danger,
          title: this.title || o.title,
          primaryButton: this.primaryButton || o.primaryButton,
          btns: this.btns
        }
      };
    },
    computed: {
      btns: function btns() {
        var _this = this;

        var buttons = this.buttons || this.$options.buttons;
        return Array.isArray(buttons) ? buttons.map(function (button) {
          var btn = lodash_isstring(button) ? {
            caption: button,
            _rawData: button
          } : _objectSpread$2({}, button);

          if (_this.params.primaryButton === btn.caption) {
            btn.buttonType = _this.params.danger ? 'danger' : 'primary';
          }

          return btn;
        }) : null;
      }
    },
    watch: {
      popupVisible: function popupVisible(value) {
        this.params.modalVisible = value;
      },
      buttons: {
        handler: function handler() {
          this.params.buttons = this.btns;
        },
        immediate: true
      },
      title: function title(value) {
        this.setTitle(value);
      },
      width: function width(value) {
        this.setWidth(value);
      },
      height: function height(value) {
        this.setHeight(value);
      },
      danger: function danger(value) {
        this.setDanger(value);
      },
      primaryButton: function primaryButton(value) {
        this.setPrimaryButton(value);
      }
    },
    methods: {
      setTitle: function setTitle(value) {
        this.params.title = value;
      },
      setWidth: function setWidth(value) {
        this.params.width = value;
      },
      setHeight: function setHeight(value) {
        this.params.height = value;
      },
      setDanger: function setDanger(value) {
        this.params.danger = value;
        this.params.buttons = this.btns;
      },
      setPrimaryButton: function setPrimaryButton(value) {
        this.params.primaryButton = value;
        this.params.buttons = this.btns;
      },
      clearHideTimer: function clearHideTimer() {
        if (this.hideTimer) {
          clearTimeout(this.hideTimer);
          this.hideTimer = null;
        }
      },
      show: function show(callbackOnce) {
        var _this2 = this;

        window.__mussel_modal = this;
        this.callbackOnce = callbackOnce;

        if (!this.$el) {
          this.$mount();
          document.body.appendChild(this.$el);
        }

        this.clearHideTimer();
        this.popupVisible = true;
        setTimeout(function () {
          _this2.params.dialogVisible = true;
        }, 10);
        this.$emit('show');
        this.$emit('change', true);
      },
      actualHide: function actualHide() {
        var _this3 = this;

        this.callbackOnce = null;
        this.deactivate();
        this.params.dialogVisible = false;
        this.clearHideTimer();
        this.$hideTimer = setTimeout(function () {
          _this3.popupVisible = false;
        }, 200);
        this.$emit('hide');
        this.$emit('change', false);
      },
      hide: function hide(force, button) {
        if (!force && this.$options.beforeClose) {
          this.$options.beforeClose(this.actualHide, button);
        } else {
          this.actualHide();
        }
      },
      onButtonClick: function onButtonClick(btn) {
        var _Object = Object(btn),
            action = _Object.action,
            _rawData = _Object._rawData;

        var button = _rawData || btn;

        if (['hide', 'close'].indexOf(action) !== -1) {
          this.hide(false, button);
        }

        this.$emit('buttonclick', button, this);
      }
    }
  };

  /* script */
  var __vue_script__$h = script$h;
  /* template */

  /* style */

  var __vue_inject_styles__$h = undefined;
  /* scoped */

  var __vue_scope_id__$h = undefined;
  /* module identifier */

  var __vue_module_identifier__$h = undefined;
  /* functional template */

  var __vue_is_functional_template__$h = undefined;
  /* style inject */

  /* style inject SSR */

  var BaseDialog = normalizeComponent_1({}, __vue_inject_styles__$h, __vue_script__$h, __vue_scope_id__$h, __vue_is_functional_template__$h, __vue_module_identifier__$h, undefined, undefined);

  //
  var script$i = {
    name: 'MusselModal',
    "extends": BaseModal
  };

  /* script */
  var __vue_script__$i = script$i;
  /* template */

  var __vue_render__$f = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("div", {
      staticClass: "mu-modal-mask",
      attrs: {
        visible: _vm.popupVisible
      },
      on: {
        click: _vm.onMaskClick
      }
    }, [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$f = [];
  __vue_render__$f._withStripped = true;
  /* style */

  var __vue_inject_styles__$i = undefined;
  /* scoped */

  var __vue_scope_id__$i = undefined;
  /* module identifier */

  var __vue_module_identifier__$i = undefined;
  /* functional template */

  var __vue_is_functional_template__$i = false;
  /* style inject */

  /* style inject SSR */

  var Modal = normalizeComponent_1({
    render: __vue_render__$f,
    staticRenderFns: __vue_staticRenderFns__$f
  }, __vue_inject_styles__$i, __vue_script__$i, __vue_scope_id__$i, __vue_is_functional_template__$i, __vue_module_identifier__$i, undefined, undefined);

  //
  var script$j = {
    name: 'MusselDialog',
    "extends": BaseDialog
  };

  /* script */
  var __vue_script__$j = script$j;
  /* template */

  var __vue_render__$g = function __vue_render__() {
    var _vm = this;

    var _h = _vm.$createElement;

    var _c = _vm._self._c || _h;

    return _c("mu-dialog-wrapper", [_vm._t("default")], 2);
  };

  var __vue_staticRenderFns__$g = [];
  __vue_render__$g._withStripped = true;
  /* style */

  var __vue_inject_styles__$j = undefined;
  /* scoped */

  var __vue_scope_id__$j = undefined;
  /* module identifier */

  var __vue_module_identifier__$j = undefined;
  /* functional template */

  var __vue_is_functional_template__$j = false;
  /* style inject */

  /* style inject SSR */

  var Dialog = normalizeComponent_1({
    render: __vue_render__$g,
    staticRenderFns: __vue_staticRenderFns__$g
  }, __vue_inject_styles__$j, __vue_script__$j, __vue_scope_id__$j, __vue_is_functional_template__$j, __vue_module_identifier__$j, undefined, undefined);

  /* GLOBAL STYLE */

  function install(Vue) {
    Vue.component('mu-flex-box', FlexBox);
    Vue.component('mu-flex-item', FlexItem);
    Vue.component('mu-h-box', HBox);
    Vue.component('mu-v-box', VBox);
    Vue.component('mu-splitter', Splitter);
    Vue.component('mu-icon', Icon);
    Vue.component('mu-button', Button);
    Vue.component('mu-icon-button', IconButton);
    Vue.component('mu-close-button', CloseButton);
    Vue.component('mu-button-group', ButtonGroup);
    Vue.component('mu-input', Input);
    Vue.component('mu-input-box', InputBox);
    Vue.component('mu-popup-box', PopupBox);
    Vue.component('mu-combo-box', ComboBox);
    Vue.component('mu-option', Option);
    Vue.component('mu-list-item', ListItem);
    Vue.component('mu-list-divider', ListDivider);
    Vue.component('mu-modal', Modal);
    Vue.component('mu-dialog', Dialog);
    Vue.component('mu-dialog-wrapper', DialogWrapper);
  }

  if (window.Vue) install(window.Vue);

  exports.BaseDialog = BaseDialog;
  exports.BaseModal = BaseModal;
  exports.Button = Button;
  exports.ButtonGroup = ButtonGroup;
  exports.CloseButton = CloseButton;
  exports.ComboBox = ComboBox;
  exports.Dialog = Dialog;
  exports.DialogWrapper = DialogWrapper;
  exports.FlexBox = FlexBox;
  exports.FlexItem = FlexItem;
  exports.HBox = HBox;
  exports.Icon = Icon;
  exports.IconButton = IconButton;
  exports.Input = Input;
  exports.InputBox = InputBox;
  exports.ListDivider = ListDivider;
  exports.ListItem = ListItem;
  exports.Modal = Modal;
  exports.Option = Option;
  exports.PopupBox = PopupBox;
  exports.Splitter = Splitter;
  exports.VBox = VBox;
  exports.install = install;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
