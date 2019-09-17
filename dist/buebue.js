(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.Bue = {}));
}(this, function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

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

	// `Object.keys` method
	// https://tc39.github.io/ecma262/#sec-object.keys
	var objectKeys = Object.keys || function keys(O) {
	  return objectKeysInternal(O, enumBugKeys);
	};

	// `ToObject` abstract operation
	// https://tc39.github.io/ecma262/#sec-toobject
	var toObject = function (argument) {
	  return Object(requireObjectCoercible(argument));
	};

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

	// `Object.defineProperties` method
	// https://tc39.github.io/ecma262/#sec-object.defineproperties
	_export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
	  defineProperties: objectDefineProperties
	});

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

	// `IsArray` abstract operation
	// https://tc39.github.io/ecma262/#sec-isarray
	var isArray = Array.isArray || function isArray(arg) {
	  return classofRaw(arg) == 'Array';
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

	var push = [].push;

	// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
	var createMethod$1 = function (TYPE) {
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
	  forEach: createMethod$1(0),
	  // `Array.prototype.map` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.map
	  map: createMethod$1(1),
	  // `Array.prototype.filter` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
	  filter: createMethod$1(2),
	  // `Array.prototype.some` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.some
	  some: createMethod$1(3),
	  // `Array.prototype.every` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.every
	  every: createMethod$1(4),
	  // `Array.prototype.find` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.find
	  find: createMethod$1(5),
	  // `Array.prototype.findIndex` method
	  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
	  findIndex: createMethod$1(6)
	};

	var sloppyArrayMethod = function (METHOD_NAME, argument) {
	  var method = [][METHOD_NAME];
	  return !method || !fails(function () {
	    // eslint-disable-next-line no-useless-call,no-throw-literal
	    method.call(null, argument || function () { throw 1; }, 1);
	  });
	};

	var $forEach = arrayIteration.forEach;


	// `Array.prototype.forEach` method implementation
	// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
	var arrayForEach = sloppyArrayMethod('forEach') ? function forEach(callbackfn /* , thisArg */) {
	  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	} : [].forEach;

	// `Array.prototype.forEach` method
	// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
	_export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
	  forEach: arrayForEach
	});

	// `Object.defineProperty` method
	// https://tc39.github.io/ecma262/#sec-object.defineproperty
	_export({ target: 'Object', stat: true, forced: !descriptors, sham: !descriptors }, {
	  defineProperty: objectDefineProperty.f
	});

	var FAILS_ON_PRIMITIVES = fails(function () { objectKeys(1); });

	// `Object.keys` method
	// https://tc39.github.io/ecma262/#sec-object.keys
	_export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES }, {
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

	var defineProperty = objectDefineProperty.f;

	var defineWellKnownSymbol = function (NAME) {
	  var Symbol = path.Symbol || (path.Symbol = {});
	  if (!has(Symbol, NAME)) defineProperty(Symbol, NAME, {
	    value: wrappedWellKnownSymbol.f(NAME)
	  });
	};

	var defineProperty$1 = objectDefineProperty.f;



	var TO_STRING_TAG = wellKnownSymbol('toStringTag');

	var setToStringTag = function (it, TAG, STATIC) {
	  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
	    defineProperty$1(it, TO_STRING_TAG, { configurable: true, value: TAG });
	  }
	};

	var $forEach$1 = arrayIteration.forEach;

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
	  $forEach$1(keys, function (key) {
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
	  $forEach$1(names, function (key) {
	    if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
	  });
	  return result;
	};

	var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
	  var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
	  var names = nativeGetOwnPropertyNames$1(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
	  var result = [];
	  $forEach$1(names, function (key) {
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

	$forEach$1(objectKeys(WellKnownSymbolsStore), function (name) {
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

	var defineProperty$2 = objectDefineProperty.f;


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
	  defineProperty$2(symbolPrototype, 'description', {
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

	var createProperty = function (object, key, value) {
	  var propertyKey = toPrimitive(key);
	  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
	  else object[propertyKey] = value;
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

	var SPECIES$2 = wellKnownSymbol('species');
	var nativeSlice = [].slice;
	var max$1 = Math.max;

	// `Array.prototype.slice` method
	// https://tc39.github.io/ecma262/#sec-array.prototype.slice
	// fallback for not array-like ES3 strings and DOM objects
	_export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('slice') }, {
	  slice: function slice(start, end) {
	    var O = toIndexedObject(this);
	    var length = toLength(O.length);
	    var k = toAbsoluteIndex(start, length);
	    var fin = toAbsoluteIndex(end === undefined ? length : end, length);
	    // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
	    var Constructor, result, n;
	    if (isArray(O)) {
	      Constructor = O.constructor;
	      // cross-realm fallback
	      if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
	        Constructor = undefined;
	      } else if (isObject(Constructor)) {
	        Constructor = Constructor[SPECIES$2];
	        if (Constructor === null) Constructor = undefined;
	      }
	      if (Constructor === Array || Constructor === undefined) {
	        return nativeSlice.call(O, k, fin);
	      }
	    }
	    result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));
	    for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
	    result.length = n;
	    return result;
	  }
	});

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
	var test = {};

	test[TO_STRING_TAG$2] = 'z';

	// `Object.prototype.toString` method implementation
	// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
	var objectToString = String(test) !== '[object z]' ? function toString() {
	  return '[object ' + classof(this) + ']';
	} : test.toString;

	var ObjectPrototype$2 = Object.prototype;

	// `Object.prototype.toString` method
	// https://tc39.github.io/ecma262/#sec-object.prototype.tostring
	if (objectToString !== ObjectPrototype$2.toString) {
	  redefine(ObjectPrototype$2, 'toString', objectToString, { unsafe: true });
	}

	// a string of all valid unicode whitespaces
	// eslint-disable-next-line max-len
	var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

	var whitespace = '[' + whitespaces + ']';
	var ltrim = RegExp('^' + whitespace + whitespace + '*');
	var rtrim = RegExp(whitespace + whitespace + '*$');

	// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
	var createMethod$2 = function (TYPE) {
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
	  start: createMethod$2(1),
	  // `String.prototype.{ trimRight, trimEnd }` methods
	  // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
	  end: createMethod$2(2),
	  // `String.prototype.trim` method
	  // https://tc39.github.io/ecma262/#sec-string.prototype.trim
	  trim: createMethod$2(3)
	};

	var trim = stringTrim.trim;


	var nativeParseFloat = global_1.parseFloat;
	var FORCED$1 = 1 / nativeParseFloat(whitespaces + '-0') !== -Infinity;

	// `parseFloat` method
	// https://tc39.github.io/ecma262/#sec-parsefloat-string
	var _parseFloat = FORCED$1 ? function parseFloat(string) {
	  var trimmedString = trim(String(string));
	  var result = nativeParseFloat(trimmedString);
	  return result === 0 && trimmedString.charAt(0) == '-' ? -0 : result;
	} : nativeParseFloat;

	// `parseFloat` method
	// https://tc39.github.io/ecma262/#sec-parsefloat-string
	_export({ global: true, forced: parseFloat != _parseFloat }, {
	  parseFloat: _parseFloat
	});

	var trim$1 = stringTrim.trim;


	var nativeParseInt = global_1.parseInt;
	var hex = /^[+-]?0[Xx]/;
	var FORCED$2 = nativeParseInt(whitespaces + '08') !== 8 || nativeParseInt(whitespaces + '0x16') !== 22;

	// `parseInt` method
	// https://tc39.github.io/ecma262/#sec-parseint-string-radix
	var _parseInt = FORCED$2 ? function parseInt(string, radix) {
	  var S = trim$1(String(string));
	  return nativeParseInt(S, (radix >>> 0) || (hex.test(S) ? 16 : 10));
	} : nativeParseInt;

	// `parseInt` method
	// https://tc39.github.io/ecma262/#sec-parseint-string-radix
	_export({ global: true, forced: parseInt != _parseInt }, {
	  parseInt: _parseInt
	});

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

	var MATCH = wellKnownSymbol('match');

	// `IsRegExp` abstract operation
	// https://tc39.github.io/ecma262/#sec-isregexp
	var isRegexp = function (it) {
	  var isRegExp;
	  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classofRaw(it) == 'RegExp');
	};

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

	var SPECIES$3 = wellKnownSymbol('species');

	var setSpecies = function (CONSTRUCTOR_NAME) {
	  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
	  var defineProperty = objectDefineProperty.f;

	  if (descriptors && Constructor && !Constructor[SPECIES$3]) {
	    defineProperty(Constructor, SPECIES$3, {
	      configurable: true,
	      get: function () { return this; }
	    });
	  }
	};

	var defineProperty$3 = objectDefineProperty.f;
	var getOwnPropertyNames = objectGetOwnPropertyNames.f;







	var MATCH$1 = wellKnownSymbol('match');
	var NativeRegExp = global_1.RegExp;
	var RegExpPrototype = NativeRegExp.prototype;
	var re1 = /a/g;
	var re2 = /a/g;

	// "new" should create a new object, old webkit bug
	var CORRECT_NEW = new NativeRegExp(re1) !== re1;

	var FORCED$3 = descriptors && isForced_1('RegExp', (!CORRECT_NEW || fails(function () {
	  re2[MATCH$1] = false;
	  // RegExp constructor can alter flags and IsRegExp works correct with @@match
	  return NativeRegExp(re1) != re1 || NativeRegExp(re2) == re2 || NativeRegExp(re1, 'i') != '/a/i';
	})));

	// `RegExp` constructor
	// https://tc39.github.io/ecma262/#sec-regexp-constructor
	if (FORCED$3) {
	  var RegExpWrapper = function RegExp(pattern, flags) {
	    var thisIsRegExp = this instanceof RegExpWrapper;
	    var patternIsRegExp = isRegexp(pattern);
	    var flagsAreUndefined = flags === undefined;
	    return !thisIsRegExp && patternIsRegExp && pattern.constructor === RegExpWrapper && flagsAreUndefined ? pattern
	      : inheritIfRequired(CORRECT_NEW
	        ? new NativeRegExp(patternIsRegExp && !flagsAreUndefined ? pattern.source : pattern, flags)
	        : NativeRegExp((patternIsRegExp = pattern instanceof RegExpWrapper)
	          ? pattern.source
	          : pattern, patternIsRegExp && flagsAreUndefined ? regexpFlags.call(pattern) : flags)
	      , thisIsRegExp ? this : RegExpPrototype, RegExpWrapper);
	  };
	  var proxy = function (key) {
	    key in RegExpWrapper || defineProperty$3(RegExpWrapper, key, {
	      configurable: true,
	      get: function () { return NativeRegExp[key]; },
	      set: function (it) { NativeRegExp[key] = it; }
	    });
	  };
	  var keys$1 = getOwnPropertyNames(NativeRegExp);
	  var index = 0;
	  while (keys$1.length > index) proxy(keys$1[index++]);
	  RegExpPrototype.constructor = RegExpWrapper;
	  RegExpWrapper.prototype = RegExpPrototype;
	  redefine(global_1, 'RegExp', RegExpWrapper);
	}

	// https://tc39.github.io/ecma262/#sec-get-regexp-@@species
	setSpecies('RegExp');

	var nativeExec = RegExp.prototype.exec;
	// This always refers to the native implementation, because the
	// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
	// which loads this file before patching the method.
	var nativeReplace = String.prototype.replace;

	var patchedExec = nativeExec;

	var UPDATES_LAST_INDEX_WRONG = (function () {
	  var re1 = /a/;
	  var re2 = /b*/g;
	  nativeExec.call(re1, 'a');
	  nativeExec.call(re2, 'a');
	  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
	})();

	// nonparticipating capturing group, copied from es5-shim's String#split patch.
	var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

	var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED;

	if (PATCH) {
	  patchedExec = function exec(str) {
	    var re = this;
	    var lastIndex, reCopy, match, i;

	    if (NPCG_INCLUDED) {
	      reCopy = new RegExp('^' + re.source + '$(?!\\s)', regexpFlags.call(re));
	    }
	    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

	    match = nativeExec.call(re, str);

	    if (UPDATES_LAST_INDEX_WRONG && match) {
	      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
	    }
	    if (NPCG_INCLUDED && match && match.length > 1) {
	      // Fix browsers whose `exec` methods don't consistently return `undefined`
	      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
	      nativeReplace.call(match[0], reCopy, function () {
	        for (i = 1; i < arguments.length - 2; i++) {
	          if (arguments[i] === undefined) match[i] = undefined;
	        }
	      });
	    }

	    return match;
	  };
	}

	var regexpExec = patchedExec;

	_export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
	  exec: regexpExec
	});

	var TO_STRING$1 = 'toString';
	var RegExpPrototype$1 = RegExp.prototype;
	var nativeToString = RegExpPrototype$1[TO_STRING$1];

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
	    var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype$1) ? regexpFlags.call(R) : rf);
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

	var SPECIES$4 = wellKnownSymbol('species');

	var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
	  // #replace needs built-in support for named groups.
	  // #match works fine because it just return the exec results, even if it has
	  // a "grops" property.
	  var re = /./;
	  re.exec = function () {
	    var result = [];
	    result.groups = { a: '7' };
	    return result;
	  };
	  return ''.replace(re, '$<a>') !== '7';
	});

	// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
	// Weex JS has frozen built-in prototypes, so use try / catch wrapper
	var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
	  var re = /(?:)/;
	  var originalExec = re.exec;
	  re.exec = function () { return originalExec.apply(this, arguments); };
	  var result = 'ab'.split(re);
	  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
	});

	var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
	  var SYMBOL = wellKnownSymbol(KEY);

	  var DELEGATES_TO_SYMBOL = !fails(function () {
	    // String methods call symbol-named RegEp methods
	    var O = {};
	    O[SYMBOL] = function () { return 7; };
	    return ''[KEY](O) != 7;
	  });

	  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
	    // Symbol-named RegExp methods call .exec
	    var execCalled = false;
	    var re = /a/;
	    re.exec = function () { execCalled = true; return null; };

	    if (KEY === 'split') {
	      // RegExp[@@split] doesn't call the regex's exec method, but first creates
	      // a new one. We need to return the patched regex when creating the new one.
	      re.constructor = {};
	      re.constructor[SPECIES$4] = function () { return re; };
	    }

	    re[SYMBOL]('');
	    return !execCalled;
	  });

	  if (
	    !DELEGATES_TO_SYMBOL ||
	    !DELEGATES_TO_EXEC ||
	    (KEY === 'replace' && !REPLACE_SUPPORTS_NAMED_GROUPS) ||
	    (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
	  ) {
	    var nativeRegExpMethod = /./[SYMBOL];
	    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
	      if (regexp.exec === regexpExec) {
	        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
	          // The native String method already delegates to @@method (this
	          // polyfilled function), leasing to infinite recursion.
	          // We avoid it by directly calling the native @@method method.
	          return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
	        }
	        return { done: true, value: nativeMethod.call(str, regexp, arg2) };
	      }
	      return { done: false };
	    });
	    var stringMethod = methods[0];
	    var regexMethod = methods[1];

	    redefine(String.prototype, KEY, stringMethod);
	    redefine(RegExp.prototype, SYMBOL, length == 2
	      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
	      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
	      ? function (string, arg) { return regexMethod.call(string, this, arg); }
	      // 21.2.5.6 RegExp.prototype[@@match](string)
	      // 21.2.5.9 RegExp.prototype[@@search](string)
	      : function (string) { return regexMethod.call(string, this); }
	    );
	    if (sham) hide(RegExp.prototype[SYMBOL], 'sham', true);
	  }
	};

	var charAt$1 = stringMultibyte.charAt;

	// `AdvanceStringIndex` abstract operation
	// https://tc39.github.io/ecma262/#sec-advancestringindex
	var advanceStringIndex = function (S, index, unicode) {
	  return index + (unicode ? charAt$1(S, index).length : 1);
	};

	// `RegExpExec` abstract operation
	// https://tc39.github.io/ecma262/#sec-regexpexec
	var regexpExecAbstract = function (R, S) {
	  var exec = R.exec;
	  if (typeof exec === 'function') {
	    var result = exec.call(R, S);
	    if (typeof result !== 'object') {
	      throw TypeError('RegExp exec method returned something other than an Object or null');
	    }
	    return result;
	  }

	  if (classofRaw(R) !== 'RegExp') {
	    throw TypeError('RegExp#exec called on incompatible receiver');
	  }

	  return regexpExec.call(R, S);
	};

	var max$2 = Math.max;
	var min$2 = Math.min;
	var floor$1 = Math.floor;
	var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
	var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

	var maybeToString = function (it) {
	  return it === undefined ? it : String(it);
	};

	// @@replace logic
	fixRegexpWellKnownSymbolLogic('replace', 2, function (REPLACE, nativeReplace, maybeCallNative) {
	  return [
	    // `String.prototype.replace` method
	    // https://tc39.github.io/ecma262/#sec-string.prototype.replace
	    function replace(searchValue, replaceValue) {
	      var O = requireObjectCoercible(this);
	      var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
	      return replacer !== undefined
	        ? replacer.call(searchValue, O, replaceValue)
	        : nativeReplace.call(String(O), searchValue, replaceValue);
	    },
	    // `RegExp.prototype[@@replace]` method
	    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
	    function (regexp, replaceValue) {
	      var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
	      if (res.done) return res.value;

	      var rx = anObject(regexp);
	      var S = String(this);

	      var functionalReplace = typeof replaceValue === 'function';
	      if (!functionalReplace) replaceValue = String(replaceValue);

	      var global = rx.global;
	      if (global) {
	        var fullUnicode = rx.unicode;
	        rx.lastIndex = 0;
	      }
	      var results = [];
	      while (true) {
	        var result = regexpExecAbstract(rx, S);
	        if (result === null) break;

	        results.push(result);
	        if (!global) break;

	        var matchStr = String(result[0]);
	        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
	      }

	      var accumulatedResult = '';
	      var nextSourcePosition = 0;
	      for (var i = 0; i < results.length; i++) {
	        result = results[i];

	        var matched = String(result[0]);
	        var position = max$2(min$2(toInteger(result.index), S.length), 0);
	        var captures = [];
	        // NOTE: This is equivalent to
	        //   captures = result.slice(1).map(maybeToString)
	        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
	        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
	        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
	        for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
	        var namedCaptures = result.groups;
	        if (functionalReplace) {
	          var replacerArgs = [matched].concat(captures, position, S);
	          if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
	          var replacement = String(replaceValue.apply(undefined, replacerArgs));
	        } else {
	          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
	        }
	        if (position >= nextSourcePosition) {
	          accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
	          nextSourcePosition = position + matched.length;
	        }
	      }
	      return accumulatedResult + S.slice(nextSourcePosition);
	    }
	  ];

	  // https://tc39.github.io/ecma262/#sec-getsubstitution
	  function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
	    var tailPos = position + matched.length;
	    var m = captures.length;
	    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
	    if (namedCaptures !== undefined) {
	      namedCaptures = toObject(namedCaptures);
	      symbols = SUBSTITUTION_SYMBOLS;
	    }
	    return nativeReplace.call(replacement, symbols, function (match, ch) {
	      var capture;
	      switch (ch.charAt(0)) {
	        case '$': return '$';
	        case '&': return matched;
	        case '`': return str.slice(0, position);
	        case "'": return str.slice(tailPos);
	        case '<':
	          capture = namedCaptures[ch.slice(1, -1)];
	          break;
	        default: // \d\d?
	          var n = +ch;
	          if (n === 0) return match;
	          if (n > m) {
	            var f = floor$1(n / 10);
	            if (f === 0) return match;
	            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
	            return match;
	          }
	          capture = captures[n - 1];
	      }
	      return capture === undefined ? '' : capture;
	    });
	  }
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
	var tinycolor = createCommonjsModule(function (module) {
	  // TinyColor v1.4.1
	  // https://github.com/bgrins/TinyColor
	  // Brian Grinstead, MIT License
	  (function (Math) {
	    var trimLeft = /^\s+/,
	        trimRight = /\s+$/,
	        tinyCounter = 0,
	        mathRound = Math.round,
	        mathMin = Math.min,
	        mathMax = Math.max,
	        mathRandom = Math.random;

	    function tinycolor(color, opts) {
	      color = color ? color : '';
	      opts = opts || {}; // If input is already a tinycolor, return itself

	      if (color instanceof tinycolor) {
	        return color;
	      } // If we are called as a function, call using new instead


	      if (!(this instanceof tinycolor)) {
	        return new tinycolor(color, opts);
	      }

	      var rgb = inputToRGB(color);
	      this._originalInput = color, this._r = rgb.r, this._g = rgb.g, this._b = rgb.b, this._a = rgb.a, this._roundA = mathRound(100 * this._a) / 100, this._format = opts.format || rgb.format;
	      this._gradientType = opts.gradientType; // Don't let the range of [0,255] come back in [0,1].
	      // Potentially lose a little bit of precision here, but will fix issues where
	      // .5 gets interpreted as half of the total, instead of half of 1
	      // If it was supposed to be 128, this was already taken care of by `inputToRgb`

	      if (this._r < 1) {
	        this._r = mathRound(this._r);
	      }

	      if (this._g < 1) {
	        this._g = mathRound(this._g);
	      }

	      if (this._b < 1) {
	        this._b = mathRound(this._b);
	      }

	      this._ok = rgb.ok;
	      this._tc_id = tinyCounter++;
	    }

	    tinycolor.prototype = {
	      isDark: function isDark() {
	        return this.getBrightness() < 128;
	      },
	      isLight: function isLight() {
	        return !this.isDark();
	      },
	      isValid: function isValid() {
	        return this._ok;
	      },
	      getOriginalInput: function getOriginalInput() {
	        return this._originalInput;
	      },
	      getFormat: function getFormat() {
	        return this._format;
	      },
	      getAlpha: function getAlpha() {
	        return this._a;
	      },
	      getBrightness: function getBrightness() {
	        //http://www.w3.org/TR/AERT#color-contrast
	        var rgb = this.toRgb();
	        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
	      },
	      getLuminance: function getLuminance() {
	        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
	        var rgb = this.toRgb();
	        var RsRGB, GsRGB, BsRGB, R, G, B;
	        RsRGB = rgb.r / 255;
	        GsRGB = rgb.g / 255;
	        BsRGB = rgb.b / 255;

	        if (RsRGB <= 0.03928) {
	          R = RsRGB / 12.92;
	        } else {
	          R = Math.pow((RsRGB + 0.055) / 1.055, 2.4);
	        }

	        if (GsRGB <= 0.03928) {
	          G = GsRGB / 12.92;
	        } else {
	          G = Math.pow((GsRGB + 0.055) / 1.055, 2.4);
	        }

	        if (BsRGB <= 0.03928) {
	          B = BsRGB / 12.92;
	        } else {
	          B = Math.pow((BsRGB + 0.055) / 1.055, 2.4);
	        }

	        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
	      },
	      setAlpha: function setAlpha(value) {
	        this._a = boundAlpha(value);
	        this._roundA = mathRound(100 * this._a) / 100;
	        return this;
	      },
	      toHsv: function toHsv() {
	        var hsv = rgbToHsv(this._r, this._g, this._b);
	        return {
	          h: hsv.h * 360,
	          s: hsv.s,
	          v: hsv.v,
	          a: this._a
	        };
	      },
	      toHsvString: function toHsvString() {
	        var hsv = rgbToHsv(this._r, this._g, this._b);
	        var h = mathRound(hsv.h * 360),
	            s = mathRound(hsv.s * 100),
	            v = mathRound(hsv.v * 100);
	        return this._a == 1 ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")";
	      },
	      toHsl: function toHsl() {
	        var hsl = rgbToHsl(this._r, this._g, this._b);
	        return {
	          h: hsl.h * 360,
	          s: hsl.s,
	          l: hsl.l,
	          a: this._a
	        };
	      },
	      toHslString: function toHslString() {
	        var hsl = rgbToHsl(this._r, this._g, this._b);
	        var h = mathRound(hsl.h * 360),
	            s = mathRound(hsl.s * 100),
	            l = mathRound(hsl.l * 100);
	        return this._a == 1 ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")";
	      },
	      toHex: function toHex(allow3Char) {
	        return rgbToHex(this._r, this._g, this._b, allow3Char);
	      },
	      toHexString: function toHexString(allow3Char) {
	        return '#' + this.toHex(allow3Char);
	      },
	      toHex8: function toHex8(allow4Char) {
	        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
	      },
	      toHex8String: function toHex8String(allow4Char) {
	        return '#' + this.toHex8(allow4Char);
	      },
	      toRgb: function toRgb() {
	        return {
	          r: mathRound(this._r),
	          g: mathRound(this._g),
	          b: mathRound(this._b),
	          a: this._a
	        };
	      },
	      toRgbString: function toRgbString() {
	        return this._a == 1 ? "rgb(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" : "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
	      },
	      toPercentageRgb: function toPercentageRgb() {
	        return {
	          r: mathRound(bound01(this._r, 255) * 100) + "%",
	          g: mathRound(bound01(this._g, 255) * 100) + "%",
	          b: mathRound(bound01(this._b, 255) * 100) + "%",
	          a: this._a
	        };
	      },
	      toPercentageRgbString: function toPercentageRgbString() {
	        return this._a == 1 ? "rgb(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" : "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
	      },
	      toName: function toName() {
	        if (this._a === 0) {
	          return "transparent";
	        }

	        if (this._a < 1) {
	          return false;
	        }

	        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
	      },
	      toFilter: function toFilter(secondColor) {
	        var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
	        var secondHex8String = hex8String;
	        var gradientType = this._gradientType ? "GradientType = 1, " : "";

	        if (secondColor) {
	          var s = tinycolor(secondColor);
	          secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
	        }

	        return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")";
	      },
	      toString: function toString(format) {
	        var formatSet = !!format;
	        format = format || this._format;
	        var formattedString = false;
	        var hasAlpha = this._a < 1 && this._a >= 0;
	        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

	        if (needsAlphaFormat) {
	          // Special case for "transparent", all other non-alpha formats
	          // will return rgba when there is transparency.
	          if (format === "name" && this._a === 0) {
	            return this.toName();
	          }

	          return this.toRgbString();
	        }

	        if (format === "rgb") {
	          formattedString = this.toRgbString();
	        }

	        if (format === "prgb") {
	          formattedString = this.toPercentageRgbString();
	        }

	        if (format === "hex" || format === "hex6") {
	          formattedString = this.toHexString();
	        }

	        if (format === "hex3") {
	          formattedString = this.toHexString(true);
	        }

	        if (format === "hex4") {
	          formattedString = this.toHex8String(true);
	        }

	        if (format === "hex8") {
	          formattedString = this.toHex8String();
	        }

	        if (format === "name") {
	          formattedString = this.toName();
	        }

	        if (format === "hsl") {
	          formattedString = this.toHslString();
	        }

	        if (format === "hsv") {
	          formattedString = this.toHsvString();
	        }

	        return formattedString || this.toHexString();
	      },
	      clone: function clone() {
	        return tinycolor(this.toString());
	      },
	      _applyModification: function _applyModification(fn, args) {
	        var color = fn.apply(null, [this].concat([].slice.call(args)));
	        this._r = color._r;
	        this._g = color._g;
	        this._b = color._b;
	        this.setAlpha(color._a);
	        return this;
	      },
	      lighten: function lighten() {
	        return this._applyModification(_lighten, arguments);
	      },
	      brighten: function brighten() {
	        return this._applyModification(_brighten, arguments);
	      },
	      darken: function darken() {
	        return this._applyModification(_darken, arguments);
	      },
	      desaturate: function desaturate() {
	        return this._applyModification(_desaturate, arguments);
	      },
	      saturate: function saturate() {
	        return this._applyModification(_saturate, arguments);
	      },
	      greyscale: function greyscale() {
	        return this._applyModification(_greyscale, arguments);
	      },
	      spin: function spin() {
	        return this._applyModification(_spin, arguments);
	      },
	      _applyCombination: function _applyCombination(fn, args) {
	        return fn.apply(null, [this].concat([].slice.call(args)));
	      },
	      analogous: function analogous() {
	        return this._applyCombination(_analogous, arguments);
	      },
	      complement: function complement() {
	        return this._applyCombination(_complement, arguments);
	      },
	      monochromatic: function monochromatic() {
	        return this._applyCombination(_monochromatic, arguments);
	      },
	      splitcomplement: function splitcomplement() {
	        return this._applyCombination(_splitcomplement, arguments);
	      },
	      triad: function triad() {
	        return this._applyCombination(_triad, arguments);
	      },
	      tetrad: function tetrad() {
	        return this._applyCombination(_tetrad, arguments);
	      }
	    }; // If input is an object, force 1 into "1.0" to handle ratios properly
	    // String input requires "1.0" as input, so 1 will be treated as 1

	    tinycolor.fromRatio = function (color, opts) {
	      if (_typeof(color) == "object") {
	        var newColor = {};

	        for (var i in color) {
	          if (color.hasOwnProperty(i)) {
	            if (i === "a") {
	              newColor[i] = color[i];
	            } else {
	              newColor[i] = convertToPercentage(color[i]);
	            }
	          }
	        }

	        color = newColor;
	      }

	      return tinycolor(color, opts);
	    }; // Given a string or object, convert that input to RGB
	    // Possible string inputs:
	    //
	    //     "red"
	    //     "#f00" or "f00"
	    //     "#ff0000" or "ff0000"
	    //     "#ff000000" or "ff000000"
	    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
	    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
	    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
	    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
	    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
	    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
	    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
	    //


	    function inputToRGB(color) {
	      var rgb = {
	        r: 0,
	        g: 0,
	        b: 0
	      };
	      var a = 1;
	      var s = null;
	      var v = null;
	      var l = null;
	      var ok = false;
	      var format = false;

	      if (typeof color == "string") {
	        color = stringInputToObject(color);
	      }

	      if (_typeof(color) == "object") {
	        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
	          rgb = rgbToRgb(color.r, color.g, color.b);
	          ok = true;
	          format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
	        } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
	          s = convertToPercentage(color.s);
	          v = convertToPercentage(color.v);
	          rgb = hsvToRgb(color.h, s, v);
	          ok = true;
	          format = "hsv";
	        } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
	          s = convertToPercentage(color.s);
	          l = convertToPercentage(color.l);
	          rgb = hslToRgb(color.h, s, l);
	          ok = true;
	          format = "hsl";
	        }

	        if (color.hasOwnProperty("a")) {
	          a = color.a;
	        }
	      }

	      a = boundAlpha(a);
	      return {
	        ok: ok,
	        format: color.format || format,
	        r: mathMin(255, mathMax(rgb.r, 0)),
	        g: mathMin(255, mathMax(rgb.g, 0)),
	        b: mathMin(255, mathMax(rgb.b, 0)),
	        a: a
	      };
	    } // Conversion Functions
	    // --------------------
	    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
	    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>
	    // `rgbToRgb`
	    // Handle bounds / percentage checking to conform to CSS color spec
	    // <http://www.w3.org/TR/css3-color/>
	    // *Assumes:* r, g, b in [0, 255] or [0, 1]
	    // *Returns:* { r, g, b } in [0, 255]


	    function rgbToRgb(r, g, b) {
	      return {
	        r: bound01(r, 255) * 255,
	        g: bound01(g, 255) * 255,
	        b: bound01(b, 255) * 255
	      };
	    } // `rgbToHsl`
	    // Converts an RGB color value to HSL.
	    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
	    // *Returns:* { h, s, l } in [0,1]


	    function rgbToHsl(r, g, b) {
	      r = bound01(r, 255);
	      g = bound01(g, 255);
	      b = bound01(b, 255);
	      var max = mathMax(r, g, b),
	          min = mathMin(r, g, b);
	      var h,
	          s,
	          l = (max + min) / 2;

	      if (max == min) {
	        h = s = 0; // achromatic
	      } else {
	        var d = max - min;
	        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	        switch (max) {
	          case r:
	            h = (g - b) / d + (g < b ? 6 : 0);
	            break;

	          case g:
	            h = (b - r) / d + 2;
	            break;

	          case b:
	            h = (r - g) / d + 4;
	            break;
	        }

	        h /= 6;
	      }

	      return {
	        h: h,
	        s: s,
	        l: l
	      };
	    } // `hslToRgb`
	    // Converts an HSL color value to RGB.
	    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
	    // *Returns:* { r, g, b } in the set [0, 255]


	    function hslToRgb(h, s, l) {
	      var r, g, b;
	      h = bound01(h, 360);
	      s = bound01(s, 100);
	      l = bound01(l, 100);

	      function hue2rgb(p, q, t) {
	        if (t < 0) t += 1;
	        if (t > 1) t -= 1;
	        if (t < 1 / 6) return p + (q - p) * 6 * t;
	        if (t < 1 / 2) return q;
	        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	        return p;
	      }

	      if (s === 0) {
	        r = g = b = l; // achromatic
	      } else {
	        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	        var p = 2 * l - q;
	        r = hue2rgb(p, q, h + 1 / 3);
	        g = hue2rgb(p, q, h);
	        b = hue2rgb(p, q, h - 1 / 3);
	      }

	      return {
	        r: r * 255,
	        g: g * 255,
	        b: b * 255
	      };
	    } // `rgbToHsv`
	    // Converts an RGB color value to HSV
	    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
	    // *Returns:* { h, s, v } in [0,1]


	    function rgbToHsv(r, g, b) {
	      r = bound01(r, 255);
	      g = bound01(g, 255);
	      b = bound01(b, 255);
	      var max = mathMax(r, g, b),
	          min = mathMin(r, g, b);
	      var h,
	          s,
	          v = max;
	      var d = max - min;
	      s = max === 0 ? 0 : d / max;

	      if (max == min) {
	        h = 0; // achromatic
	      } else {
	        switch (max) {
	          case r:
	            h = (g - b) / d + (g < b ? 6 : 0);
	            break;

	          case g:
	            h = (b - r) / d + 2;
	            break;

	          case b:
	            h = (r - g) / d + 4;
	            break;
	        }

	        h /= 6;
	      }

	      return {
	        h: h,
	        s: s,
	        v: v
	      };
	    } // `hsvToRgb`
	    // Converts an HSV color value to RGB.
	    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
	    // *Returns:* { r, g, b } in the set [0, 255]


	    function hsvToRgb(h, s, v) {
	      h = bound01(h, 360) * 6;
	      s = bound01(s, 100);
	      v = bound01(v, 100);
	      var i = Math.floor(h),
	          f = h - i,
	          p = v * (1 - s),
	          q = v * (1 - f * s),
	          t = v * (1 - (1 - f) * s),
	          mod = i % 6,
	          r = [v, q, p, p, t, v][mod],
	          g = [t, v, v, q, p, p][mod],
	          b = [p, p, t, v, v, q][mod];
	      return {
	        r: r * 255,
	        g: g * 255,
	        b: b * 255
	      };
	    } // `rgbToHex`
	    // Converts an RGB color to hex
	    // Assumes r, g, and b are contained in the set [0, 255]
	    // Returns a 3 or 6 character hex


	    function rgbToHex(r, g, b, allow3Char) {
	      var hex = [pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16))]; // Return a 3 character hex if possible

	      if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
	      }

	      return hex.join("");
	    } // `rgbaToHex`
	    // Converts an RGBA color plus alpha transparency to hex
	    // Assumes r, g, b are contained in the set [0, 255] and
	    // a in [0, 1]. Returns a 4 or 8 character rgba hex


	    function rgbaToHex(r, g, b, a, allow4Char) {
	      var hex = [pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16)), pad2(convertDecimalToHex(a))]; // Return a 4 character hex if possible

	      if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
	      }

	      return hex.join("");
	    } // `rgbaToArgbHex`
	    // Converts an RGBA color to an ARGB Hex8 string
	    // Rarely used, but required for "toFilter()"


	    function rgbaToArgbHex(r, g, b, a) {
	      var hex = [pad2(convertDecimalToHex(a)), pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16))];
	      return hex.join("");
	    } // `equals`
	    // Can be called with any tinycolor input


	    tinycolor.equals = function (color1, color2) {
	      if (!color1 || !color2) {
	        return false;
	      }

	      return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
	    };

	    tinycolor.random = function () {
	      return tinycolor.fromRatio({
	        r: mathRandom(),
	        g: mathRandom(),
	        b: mathRandom()
	      });
	    }; // Modification Functions
	    // ----------------------
	    // Thanks to less.js for some of the basics here
	    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>


	    function _desaturate(color, amount) {
	      amount = amount === 0 ? 0 : amount || 10;
	      var hsl = tinycolor(color).toHsl();
	      hsl.s -= amount / 100;
	      hsl.s = clamp01(hsl.s);
	      return tinycolor(hsl);
	    }

	    function _saturate(color, amount) {
	      amount = amount === 0 ? 0 : amount || 10;
	      var hsl = tinycolor(color).toHsl();
	      hsl.s += amount / 100;
	      hsl.s = clamp01(hsl.s);
	      return tinycolor(hsl);
	    }

	    function _greyscale(color) {
	      return tinycolor(color).desaturate(100);
	    }

	    function _lighten(color, amount) {
	      amount = amount === 0 ? 0 : amount || 10;
	      var hsl = tinycolor(color).toHsl();
	      hsl.l += amount / 100;
	      hsl.l = clamp01(hsl.l);
	      return tinycolor(hsl);
	    }

	    function _brighten(color, amount) {
	      amount = amount === 0 ? 0 : amount || 10;
	      var rgb = tinycolor(color).toRgb();
	      rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * -(amount / 100))));
	      rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * -(amount / 100))));
	      rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * -(amount / 100))));
	      return tinycolor(rgb);
	    }

	    function _darken(color, amount) {
	      amount = amount === 0 ? 0 : amount || 10;
	      var hsl = tinycolor(color).toHsl();
	      hsl.l -= amount / 100;
	      hsl.l = clamp01(hsl.l);
	      return tinycolor(hsl);
	    } // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
	    // Values outside of this range will be wrapped into this range.


	    function _spin(color, amount) {
	      var hsl = tinycolor(color).toHsl();
	      var hue = (hsl.h + amount) % 360;
	      hsl.h = hue < 0 ? 360 + hue : hue;
	      return tinycolor(hsl);
	    } // Combination Functions
	    // ---------------------
	    // Thanks to jQuery xColor for some of the ideas behind these
	    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>


	    function _complement(color) {
	      var hsl = tinycolor(color).toHsl();
	      hsl.h = (hsl.h + 180) % 360;
	      return tinycolor(hsl);
	    }

	    function _triad(color) {
	      var hsl = tinycolor(color).toHsl();
	      var h = hsl.h;
	      return [tinycolor(color), tinycolor({
	        h: (h + 120) % 360,
	        s: hsl.s,
	        l: hsl.l
	      }), tinycolor({
	        h: (h + 240) % 360,
	        s: hsl.s,
	        l: hsl.l
	      })];
	    }

	    function _tetrad(color) {
	      var hsl = tinycolor(color).toHsl();
	      var h = hsl.h;
	      return [tinycolor(color), tinycolor({
	        h: (h + 90) % 360,
	        s: hsl.s,
	        l: hsl.l
	      }), tinycolor({
	        h: (h + 180) % 360,
	        s: hsl.s,
	        l: hsl.l
	      }), tinycolor({
	        h: (h + 270) % 360,
	        s: hsl.s,
	        l: hsl.l
	      })];
	    }

	    function _splitcomplement(color) {
	      var hsl = tinycolor(color).toHsl();
	      var h = hsl.h;
	      return [tinycolor(color), tinycolor({
	        h: (h + 72) % 360,
	        s: hsl.s,
	        l: hsl.l
	      }), tinycolor({
	        h: (h + 216) % 360,
	        s: hsl.s,
	        l: hsl.l
	      })];
	    }

	    function _analogous(color, results, slices) {
	      results = results || 6;
	      slices = slices || 30;
	      var hsl = tinycolor(color).toHsl();
	      var part = 360 / slices;
	      var ret = [tinycolor(color)];

	      for (hsl.h = (hsl.h - (part * results >> 1) + 720) % 360; --results;) {
	        hsl.h = (hsl.h + part) % 360;
	        ret.push(tinycolor(hsl));
	      }

	      return ret;
	    }

	    function _monochromatic(color, results) {
	      results = results || 6;
	      var hsv = tinycolor(color).toHsv();
	      var h = hsv.h,
	          s = hsv.s,
	          v = hsv.v;
	      var ret = [];
	      var modification = 1 / results;

	      while (results--) {
	        ret.push(tinycolor({
	          h: h,
	          s: s,
	          v: v
	        }));
	        v = (v + modification) % 1;
	      }

	      return ret;
	    } // Utility Functions
	    // ---------------------


	    tinycolor.mix = function (color1, color2, amount) {
	      amount = amount === 0 ? 0 : amount || 50;
	      var rgb1 = tinycolor(color1).toRgb();
	      var rgb2 = tinycolor(color2).toRgb();
	      var p = amount / 100;
	      var rgba = {
	        r: (rgb2.r - rgb1.r) * p + rgb1.r,
	        g: (rgb2.g - rgb1.g) * p + rgb1.g,
	        b: (rgb2.b - rgb1.b) * p + rgb1.b,
	        a: (rgb2.a - rgb1.a) * p + rgb1.a
	      };
	      return tinycolor(rgba);
	    }; // Readability Functions
	    // ---------------------
	    // <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)
	    // `contrast`
	    // Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)


	    tinycolor.readability = function (color1, color2) {
	      var c1 = tinycolor(color1);
	      var c2 = tinycolor(color2);
	      return (Math.max(c1.getLuminance(), c2.getLuminance()) + 0.05) / (Math.min(c1.getLuminance(), c2.getLuminance()) + 0.05);
	    }; // `isReadable`
	    // Ensure that foreground and background color combinations meet WCAG2 guidelines.
	    // The third argument is an optional Object.
	    //      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
	    //      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
	    // If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.
	    // *Example*
	    //    tinycolor.isReadable("#000", "#111") => false
	    //    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false


	    tinycolor.isReadable = function (color1, color2, wcag2) {
	      var readability = tinycolor.readability(color1, color2);
	      var wcag2Parms, out;
	      out = false;
	      wcag2Parms = validateWCAG2Parms(wcag2);

	      switch (wcag2Parms.level + wcag2Parms.size) {
	        case "AAsmall":
	        case "AAAlarge":
	          out = readability >= 4.5;
	          break;

	        case "AAlarge":
	          out = readability >= 3;
	          break;

	        case "AAAsmall":
	          out = readability >= 7;
	          break;
	      }

	      return out;
	    }; // `mostReadable`
	    // Given a base color and a list of possible foreground or background
	    // colors for that base, returns the most readable color.
	    // Optionally returns Black or White if the most readable color is unreadable.
	    // *Example*
	    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
	    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
	    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
	    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"


	    tinycolor.mostReadable = function (baseColor, colorList, args) {
	      var bestColor = null;
	      var bestScore = 0;
	      var readability;
	      var includeFallbackColors, level, size;
	      args = args || {};
	      includeFallbackColors = args.includeFallbackColors;
	      level = args.level;
	      size = args.size;

	      for (var i = 0; i < colorList.length; i++) {
	        readability = tinycolor.readability(baseColor, colorList[i]);

	        if (readability > bestScore) {
	          bestScore = readability;
	          bestColor = tinycolor(colorList[i]);
	        }
	      }

	      if (tinycolor.isReadable(baseColor, bestColor, {
	        "level": level,
	        "size": size
	      }) || !includeFallbackColors) {
	        return bestColor;
	      } else {
	        args.includeFallbackColors = false;
	        return tinycolor.mostReadable(baseColor, ["#fff", "#000"], args);
	      }
	    }; // Big List of Colors
	    // ------------------
	    // <http://www.w3.org/TR/css3-color/#svg-color>


	    var names = tinycolor.names = {
	      aliceblue: "f0f8ff",
	      antiquewhite: "faebd7",
	      aqua: "0ff",
	      aquamarine: "7fffd4",
	      azure: "f0ffff",
	      beige: "f5f5dc",
	      bisque: "ffe4c4",
	      black: "000",
	      blanchedalmond: "ffebcd",
	      blue: "00f",
	      blueviolet: "8a2be2",
	      brown: "a52a2a",
	      burlywood: "deb887",
	      burntsienna: "ea7e5d",
	      cadetblue: "5f9ea0",
	      chartreuse: "7fff00",
	      chocolate: "d2691e",
	      coral: "ff7f50",
	      cornflowerblue: "6495ed",
	      cornsilk: "fff8dc",
	      crimson: "dc143c",
	      cyan: "0ff",
	      darkblue: "00008b",
	      darkcyan: "008b8b",
	      darkgoldenrod: "b8860b",
	      darkgray: "a9a9a9",
	      darkgreen: "006400",
	      darkgrey: "a9a9a9",
	      darkkhaki: "bdb76b",
	      darkmagenta: "8b008b",
	      darkolivegreen: "556b2f",
	      darkorange: "ff8c00",
	      darkorchid: "9932cc",
	      darkred: "8b0000",
	      darksalmon: "e9967a",
	      darkseagreen: "8fbc8f",
	      darkslateblue: "483d8b",
	      darkslategray: "2f4f4f",
	      darkslategrey: "2f4f4f",
	      darkturquoise: "00ced1",
	      darkviolet: "9400d3",
	      deeppink: "ff1493",
	      deepskyblue: "00bfff",
	      dimgray: "696969",
	      dimgrey: "696969",
	      dodgerblue: "1e90ff",
	      firebrick: "b22222",
	      floralwhite: "fffaf0",
	      forestgreen: "228b22",
	      fuchsia: "f0f",
	      gainsboro: "dcdcdc",
	      ghostwhite: "f8f8ff",
	      gold: "ffd700",
	      goldenrod: "daa520",
	      gray: "808080",
	      green: "008000",
	      greenyellow: "adff2f",
	      grey: "808080",
	      honeydew: "f0fff0",
	      hotpink: "ff69b4",
	      indianred: "cd5c5c",
	      indigo: "4b0082",
	      ivory: "fffff0",
	      khaki: "f0e68c",
	      lavender: "e6e6fa",
	      lavenderblush: "fff0f5",
	      lawngreen: "7cfc00",
	      lemonchiffon: "fffacd",
	      lightblue: "add8e6",
	      lightcoral: "f08080",
	      lightcyan: "e0ffff",
	      lightgoldenrodyellow: "fafad2",
	      lightgray: "d3d3d3",
	      lightgreen: "90ee90",
	      lightgrey: "d3d3d3",
	      lightpink: "ffb6c1",
	      lightsalmon: "ffa07a",
	      lightseagreen: "20b2aa",
	      lightskyblue: "87cefa",
	      lightslategray: "789",
	      lightslategrey: "789",
	      lightsteelblue: "b0c4de",
	      lightyellow: "ffffe0",
	      lime: "0f0",
	      limegreen: "32cd32",
	      linen: "faf0e6",
	      magenta: "f0f",
	      maroon: "800000",
	      mediumaquamarine: "66cdaa",
	      mediumblue: "0000cd",
	      mediumorchid: "ba55d3",
	      mediumpurple: "9370db",
	      mediumseagreen: "3cb371",
	      mediumslateblue: "7b68ee",
	      mediumspringgreen: "00fa9a",
	      mediumturquoise: "48d1cc",
	      mediumvioletred: "c71585",
	      midnightblue: "191970",
	      mintcream: "f5fffa",
	      mistyrose: "ffe4e1",
	      moccasin: "ffe4b5",
	      navajowhite: "ffdead",
	      navy: "000080",
	      oldlace: "fdf5e6",
	      olive: "808000",
	      olivedrab: "6b8e23",
	      orange: "ffa500",
	      orangered: "ff4500",
	      orchid: "da70d6",
	      palegoldenrod: "eee8aa",
	      palegreen: "98fb98",
	      paleturquoise: "afeeee",
	      palevioletred: "db7093",
	      papayawhip: "ffefd5",
	      peachpuff: "ffdab9",
	      peru: "cd853f",
	      pink: "ffc0cb",
	      plum: "dda0dd",
	      powderblue: "b0e0e6",
	      purple: "800080",
	      rebeccapurple: "663399",
	      red: "f00",
	      rosybrown: "bc8f8f",
	      royalblue: "4169e1",
	      saddlebrown: "8b4513",
	      salmon: "fa8072",
	      sandybrown: "f4a460",
	      seagreen: "2e8b57",
	      seashell: "fff5ee",
	      sienna: "a0522d",
	      silver: "c0c0c0",
	      skyblue: "87ceeb",
	      slateblue: "6a5acd",
	      slategray: "708090",
	      slategrey: "708090",
	      snow: "fffafa",
	      springgreen: "00ff7f",
	      steelblue: "4682b4",
	      tan: "d2b48c",
	      teal: "008080",
	      thistle: "d8bfd8",
	      tomato: "ff6347",
	      turquoise: "40e0d0",
	      violet: "ee82ee",
	      wheat: "f5deb3",
	      white: "fff",
	      whitesmoke: "f5f5f5",
	      yellow: "ff0",
	      yellowgreen: "9acd32"
	    }; // Make it easy to access colors via `hexNames[hex]`

	    var hexNames = tinycolor.hexNames = flip(names); // Utilities
	    // ---------
	    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`

	    function flip(o) {
	      var flipped = {};

	      for (var i in o) {
	        if (o.hasOwnProperty(i)) {
	          flipped[o[i]] = i;
	        }
	      }

	      return flipped;
	    } // Return a valid alpha value [0,1] with all invalid values being set to 1


	    function boundAlpha(a) {
	      a = parseFloat(a);

	      if (isNaN(a) || a < 0 || a > 1) {
	        a = 1;
	      }

	      return a;
	    } // Take input from [0, n] and return it as [0, 1]


	    function bound01(n, max) {
	      if (isOnePointZero(n)) {
	        n = "100%";
	      }

	      var processPercent = isPercentage(n);
	      n = mathMin(max, mathMax(0, parseFloat(n))); // Automatically convert percentage into number

	      if (processPercent) {
	        n = parseInt(n * max, 10) / 100;
	      } // Handle floating point rounding errors


	      if (Math.abs(n - max) < 0.000001) {
	        return 1;
	      } // Convert into [0, 1] range if it isn't already


	      return n % max / parseFloat(max);
	    } // Force a number between 0 and 1


	    function clamp01(val) {
	      return mathMin(1, mathMax(0, val));
	    } // Parse a base-16 hex value into a base-10 integer


	    function parseIntFromHex(val) {
	      return parseInt(val, 16);
	    } // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
	    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>


	    function isOnePointZero(n) {
	      return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
	    } // Check to see if string passed in is a percentage


	    function isPercentage(n) {
	      return typeof n === "string" && n.indexOf('%') != -1;
	    } // Force a hex value to have 2 characters


	    function pad2(c) {
	      return c.length == 1 ? '0' + c : '' + c;
	    } // Replace a decimal with it's percentage value


	    function convertToPercentage(n) {
	      if (n <= 1) {
	        n = n * 100 + "%";
	      }

	      return n;
	    } // Converts a decimal to a hex value


	    function convertDecimalToHex(d) {
	      return Math.round(parseFloat(d) * 255).toString(16);
	    } // Converts a hex value to a decimal


	    function convertHexToDecimal(h) {
	      return parseIntFromHex(h) / 255;
	    }

	    var matchers = function () {
	      // <http://www.w3.org/TR/css3-values/#integers>
	      var CSS_INTEGER = "[-\\+]?\\d+%?"; // <http://www.w3.org/TR/css3-values/#number-value>

	      var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?"; // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.

	      var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")"; // Actual matching.
	      // Parentheses and commas are optional, but not required.
	      // Whitespace can take the place of commas or opening paren

	      var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	      var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	      return {
	        CSS_UNIT: new RegExp(CSS_UNIT),
	        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
	        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
	        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
	        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
	        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
	        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
	        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
	        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
	      };
	    }(); // `isValidCSSUnit`
	    // Take in a single string / number and check to see if it looks like a CSS unit
	    // (see `matchers` above for definition).


	    function isValidCSSUnit(color) {
	      return !!matchers.CSS_UNIT.exec(color);
	    } // `stringInputToObject`
	    // Permissive string parsing.  Take in a number of formats, and output an object
	    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`


	    function stringInputToObject(color) {
	      color = color.replace(trimLeft, '').replace(trimRight, '').toLowerCase();
	      var named = false;

	      if (names[color]) {
	        color = names[color];
	        named = true;
	      } else if (color == 'transparent') {
	        return {
	          r: 0,
	          g: 0,
	          b: 0,
	          a: 0,
	          format: "name"
	        };
	      } // Try to match string input using regular expressions.
	      // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
	      // Just return an object and let the conversion functions handle that.
	      // This way the result will be the same whether the tinycolor is initialized with string or object.


	      var match;

	      if (match = matchers.rgb.exec(color)) {
	        return {
	          r: match[1],
	          g: match[2],
	          b: match[3]
	        };
	      }

	      if (match = matchers.rgba.exec(color)) {
	        return {
	          r: match[1],
	          g: match[2],
	          b: match[3],
	          a: match[4]
	        };
	      }

	      if (match = matchers.hsl.exec(color)) {
	        return {
	          h: match[1],
	          s: match[2],
	          l: match[3]
	        };
	      }

	      if (match = matchers.hsla.exec(color)) {
	        return {
	          h: match[1],
	          s: match[2],
	          l: match[3],
	          a: match[4]
	        };
	      }

	      if (match = matchers.hsv.exec(color)) {
	        return {
	          h: match[1],
	          s: match[2],
	          v: match[3]
	        };
	      }

	      if (match = matchers.hsva.exec(color)) {
	        return {
	          h: match[1],
	          s: match[2],
	          v: match[3],
	          a: match[4]
	        };
	      }

	      if (match = matchers.hex8.exec(color)) {
	        return {
	          r: parseIntFromHex(match[1]),
	          g: parseIntFromHex(match[2]),
	          b: parseIntFromHex(match[3]),
	          a: convertHexToDecimal(match[4]),
	          format: named ? "name" : "hex8"
	        };
	      }

	      if (match = matchers.hex6.exec(color)) {
	        return {
	          r: parseIntFromHex(match[1]),
	          g: parseIntFromHex(match[2]),
	          b: parseIntFromHex(match[3]),
	          format: named ? "name" : "hex"
	        };
	      }

	      if (match = matchers.hex4.exec(color)) {
	        return {
	          r: parseIntFromHex(match[1] + '' + match[1]),
	          g: parseIntFromHex(match[2] + '' + match[2]),
	          b: parseIntFromHex(match[3] + '' + match[3]),
	          a: convertHexToDecimal(match[4] + '' + match[4]),
	          format: named ? "name" : "hex8"
	        };
	      }

	      if (match = matchers.hex3.exec(color)) {
	        return {
	          r: parseIntFromHex(match[1] + '' + match[1]),
	          g: parseIntFromHex(match[2] + '' + match[2]),
	          b: parseIntFromHex(match[3] + '' + match[3]),
	          format: named ? "name" : "hex"
	        };
	      }

	      return false;
	    }

	    function validateWCAG2Parms(parms) {
	      // return valid WCAG2 parms for isReadable.
	      // If input parms are invalid, return {"level":"AA", "size":"small"}
	      var level, size;
	      parms = parms || {
	        "level": "AA",
	        "size": "small"
	      };
	      level = (parms.level || "AA").toUpperCase();
	      size = (parms.size || "small").toLowerCase();

	      if (level !== "AA" && level !== "AAA") {
	        level = "AA";
	      }

	      if (size !== "small" && size !== "large") {
	        size = "small";
	      }

	      return {
	        "level": level,
	        "size": size
	      };
	    } // Node: Export function


	    if ( module.exports) {
	      module.exports = tinycolor;
	    } // AMD/requirejs: Define the module
	    else {
	          window.tinycolor = tinycolor;
	        }
	  })(Math);
	});

	var generate_1 = createCommonjsModule(function (module, exports) {

	  var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function (mod) {
	    return mod && mod.__esModule ? mod : {
	      "default": mod
	    };
	  };

	  Object.defineProperty(exports, "__esModule", {
	    value: true
	  });

	  var tinycolor2_1 = __importDefault(tinycolor);

	  var hueStep = 2; // 色相阶梯

	  var saturationStep = 16; // 饱和度阶梯，浅色部分

	  var saturationStep2 = 5; // 饱和度阶梯，深色部分

	  var brightnessStep1 = 5; // 亮度阶梯，浅色部分

	  var brightnessStep2 = 15; // 亮度阶梯，深色部分

	  var lightColorCount = 5; // 浅色数量，主色上

	  var darkColorCount = 4; // 深色数量，主色下

	  function getHue(hsv, i, light) {
	    var hue; // 根据色相不同，色相转向不同

	    if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
	      hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
	    } else {
	      hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
	    }

	    if (hue < 0) {
	      hue += 360;
	    } else if (hue >= 360) {
	      hue -= 360;
	    }

	    return hue;
	  }

	  function getSaturation(hsv, i, light) {
	    // grey color don't change saturation
	    if (hsv.h === 0 && hsv.s === 0) {
	      return hsv.s;
	    }

	    var saturation;

	    if (light) {
	      saturation = Math.round(hsv.s * 100) - saturationStep * i;
	    } else if (i === darkColorCount) {
	      saturation = Math.round(hsv.s * 100) + saturationStep;
	    } else {
	      saturation = Math.round(hsv.s * 100) + saturationStep2 * i;
	    } // 边界值修正


	    if (saturation > 100) {
	      saturation = 100;
	    } // 第一格的 s 限制在 6-10 之间


	    if (light && i === lightColorCount && saturation > 10) {
	      saturation = 10;
	    }

	    if (saturation < 6) {
	      saturation = 6;
	    }

	    return saturation;
	  }

	  function getValue(hsv, i, light) {
	    if (light) {
	      return Math.round(hsv.v * 100) + brightnessStep1 * i;
	    }

	    return Math.round(hsv.v * 100) - brightnessStep2 * i;
	  }

	  function generate(color) {
	    var patterns = [];
	    var pColor = tinycolor2_1["default"](color);

	    for (var i = lightColorCount; i > 0; i -= 1) {
	      var hsv = pColor.toHsv();
	      var colorString = tinycolor2_1["default"]({
	        h: getHue(hsv, i, true),
	        s: getSaturation(hsv, i, true),
	        v: getValue(hsv, i, true)
	      }).toHexString();
	      patterns.push(colorString);
	    }

	    patterns.push(pColor.toHexString());

	    for (var i = 1; i <= darkColorCount; i += 1) {
	      var hsv = pColor.toHsv();
	      var colorString = tinycolor2_1["default"]({
	        h: getHue(hsv, i),
	        s: getSaturation(hsv, i),
	        v: getValue(hsv, i)
	      }).toHexString();
	      patterns.push(colorString);
	    }

	    return patterns;
	  }

	  exports["default"] = generate;
	});
	unwrapExports(generate_1);

	var lib = createCommonjsModule(function (module, exports) {

	  var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function (mod) {
	    return mod && mod.__esModule ? mod : {
	      "default": mod
	    };
	  };

	  Object.defineProperty(exports, "__esModule", {
	    value: true
	  });

	  var generate_1$1 = __importDefault(generate_1);

	  exports.generate = generate_1$1["default"];
	  var presetPrimaryColors = {
	    red: '#F5222D',
	    volcano: '#FA541C',
	    orange: '#FA8C16',
	    gold: '#FAAD14',
	    yellow: '#FADB14',
	    lime: '#A0D911',
	    green: '#52C41A',
	    cyan: '#13C2C2',
	    blue: '#1890FF',
	    geekblue: '#2F54EB',
	    purple: '#722ED1',
	    magenta: '#EB2F96',
	    grey: '#666666'
	  };
	  exports.presetPrimaryColors = presetPrimaryColors;
	  var presetPalettes = {};
	  exports.presetPalettes = presetPalettes;
	  Object.keys(presetPrimaryColors).forEach(function (key) {
	    presetPalettes[key] = generate_1$1["default"](presetPrimaryColors[key]);
	    presetPalettes[key].primary = presetPalettes[key][6];
	  });
	  var red = presetPalettes.red;
	  exports.red = red;
	  var volcano = presetPalettes.volcano;
	  exports.volcano = volcano;
	  var gold = presetPalettes.gold;
	  exports.gold = gold;
	  var orange = presetPalettes.orange;
	  exports.orange = orange;
	  var yellow = presetPalettes.yellow;
	  exports.yellow = yellow;
	  var lime = presetPalettes.lime;
	  exports.lime = lime;
	  var green = presetPalettes.green;
	  exports.green = green;
	  var cyan = presetPalettes.cyan;
	  exports.cyan = cyan;
	  var blue = presetPalettes.blue;
	  exports.blue = blue;
	  var geekblue = presetPalettes.geekblue;
	  exports.geekblue = geekblue;
	  var purple = presetPalettes.purple;
	  exports.purple = purple;
	  var magenta = presetPalettes.magenta;
	  exports.magenta = magenta;
	  var grey = presetPalettes.grey;
	  exports.grey = grey;
	});
	unwrapExports(lib);
	var lib_1 = lib.generate;
	var lib_2 = lib.presetPrimaryColors;
	var lib_3 = lib.presetPalettes;
	var lib_4 = lib.red;
	var lib_5 = lib.volcano;
	var lib_6 = lib.gold;
	var lib_7 = lib.orange;
	var lib_8 = lib.yellow;
	var lib_9 = lib.lime;
	var lib_10 = lib.green;
	var lib_11 = lib.cyan;
	var lib_12 = lib.blue;
	var lib_13 = lib.geekblue;
	var lib_14 = lib.purple;
	var lib_15 = lib.magenta;
	var lib_16 = lib.grey;

	var grey = lib_1('#b2b2b2');
	/*
	'#f2f2f2', '#e6e6e6', '#d9d9d9', '#cccccc', '#bfbfbf',
	'#b2b2b2', '#8c8c8c', '#666666', '#404040', '#1a1a1a'
	*/

	var _primaryColor, _successColor, _warningColor, _dangerColor, _infoColor;

	var variables = {
	  /* document */
	  documentFontSizePx: 14,

	  /* button */
	  buttonHeightPx: 34,
	  buttonLineHeightPx: 20,
	  buttonBorderRadiusPx: 2,
	  buttonFontSize: '1rem',
	  buttonShadow: 1,
	  buttonDefaultColor: grey[7],
	  buttonDefaultHoverColor: grey[6],
	  buttonDefaultActiveColor: grey[8],
	  buttonDefaultDisabledColor: grey[4],

	  /* input */
	  inputHeightPx: 34,
	  inputBorderRadiusPx: 2,
	  inputFontSize: '1rem',
	  inputBorderColor: grey[5],
	  inputReadonlyBackground: '#feffe6',
	  inputDisabledBackground: grey[1],

	  /* text colours */
	  textBlack: grey[9],
	  textGrey: grey[7],
	  textDarkGrey: grey[8],
	  textLightGrey: grey[6],
	  textDark: 'rgba(0, 0, 0, .7)',
	  textHalfDark: 'rgba(0, 0, 0, .35)',
	  textQuarterDark: 'rgba(0, 0, 0, .175)',
	  textLight: 'rgba(255, 255, 255, .7)',
	  textHalfLight: 'rgba(255, 255, 255, .35)',
	  textQuarterLight: 'rgba(255, 255, 25, .175)',

	  /* margin, padding */
	  marginUnitSize: 8,

	  /* shadow */
	  // level 1: button
	  boxShadowLevel1: '0 1.5px 4px rgba(0, 0, 0, 0.24), 0 1.5px 6px rgba(0, 0, 0, 0.12)',
	  // level 2: button:hover, dropdown
	  boxShadowLevel2: '0 3px 12px rgba(0, 0, 0, 0.23), 0 3px 12px rgba(0, 0, 0, 0.16)',
	  // level 3: drawer, window, dialog
	  boxShadowLevel3: '0 6px 12px rgba(0, 0, 0, 0.23), 0 10px 40px rgba(0, 0, 0, 0.19)',
	  boxshadowLevel4: '0 10px 20px rgba(0, 0, 0, 0.22), 0 14px 56px rgba(0, 0, 0, 0.25)',
	  boxshadowLevel5: '0 15px 24px rgba(0, 0, 0, 0.22), 0 19px 76px rgba(0, 0, 0, 0.3)'
	};

	function setButtonColors(buttonType, colors) {
	  variables["button".concat(buttonType, "Color")] = colors[5];
	  variables["button".concat(buttonType, "HoverColor")] = colors[4];
	  variables["button".concat(buttonType, "ActiveColor")] = colors[6];
	  variables["button".concat(buttonType, "DisabledColor")] = colors[2];
	}

	Object.defineProperties(variables, {
	  primaryColor: {
	    get: function get() {
	      return _primaryColor;
	    },
	    set: function set(v) {
	      _primaryColor = v;
	      var colors = lib_1(v);
	      setButtonColors('Primary', colors);
	      this.inputFocusShadowColor = colors[2];
	      this.inputHoverBorderColor = colors[5];
	    }
	  },
	  successColor: {
	    get: function get() {
	      return _successColor;
	    },
	    set: function set(v) {
	      _successColor = v;
	      var colors = lib_1(v);
	      setButtonColors('Submit', colors);
	    }
	  },
	  warningColor: {
	    get: function get() {
	      return _warningColor;
	    },
	    set: function set(v) {
	      _warningColor = v;
	    }
	  },
	  dangerColor: {
	    get: function get() {
	      return _dangerColor;
	    },
	    set: function set(v) {
	      _dangerColor = v;
	      var colors = lib_1(v);
	      setButtonColors('Danger', colors);
	      this.inputInvalidShadowColor = colors[2];
	      this.inputInvalidBorderColor = colors[5];
	    }
	  },
	  infoColor: {
	    get: function get() {
	      return _infoColor;
	    },
	    set: function set(v) {
	      _infoColor = v;
	    }
	  }
	});
	Object.assign(variables, {
	  primaryColor: '#1890ff',
	  successColor: '#52c41a',
	  warningColor: '#fa8c16',
	  dangerColor: '#fa541c',
	  infoColor: '#2ccdfa'
	});

	var getOwnPropertyNames$1 = objectGetOwnPropertyNames.f;
	var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;
	var defineProperty$4 = objectDefineProperty.f;
	var trim$2 = stringTrim.trim;

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
	    it = trim$2(it);
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
	  for (var keys$2 = descriptors ? getOwnPropertyNames$1(NativeNumber) : (
	    // ES3:
	    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
	    // ES2015 (in case, if modules with ES2015 Number statics required before):
	    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
	    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
	  ).split(','), j = 0, key; keys$2.length > j; j++) {
	    if (has(NativeNumber, key = keys$2[j]) && !has(NumberWrapper, key)) {
	      defineProperty$4(NumberWrapper, key, getOwnPropertyDescriptor$2(NativeNumber, key));
	    }
	  }
	  NumberWrapper.prototype = NumberPrototype;
	  NumberPrototype.constructor = NumberWrapper;
	  redefine(global_1, NUMBER, NumberWrapper);
	}

	//
	//
	//
	//
	//
	//
	var script = {
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
	    parentDirection: function parentDirection() {
	      return this.$parent.flexDirection || 'row';
	    },
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
	    style: _vm.style,
	    attrs: {
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

	var FlexItem = normalizeComponent_1({
	  render: __vue_render__,
	  staticRenderFns: __vue_staticRenderFns__
	}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, undefined, undefined);

	var script$1 = {
	  mixins: [FlexItem],
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

	var css = ".bue-flex-box {\r\n  position: relative;\r\n  display: flex;\r\n  align-items: stretch;\r\n}\r\n.bue-flex-box[direction=column] {\r\n  flex-direction: column;\r\n}\r\n.bue-flex-box[inline] {\r\n  display: inline-flex;\r\n}\r\n.bue-flex-box[flex-wrap] {\r\n  flex-wrap: wrap;\r\n  align-content: flex-start;\r\n}\r\n.bue-flex-box[justify-content=center] {\r\n  justify-content: center;\r\n}\r\n.bue-flex-box[align-items=flex-start] {\r\n  align-items: flex-start;\r\n}\r\n.bue-flex-box[align-items=center] {\r\n  align-items: center;\r\n}\r\n.bue-flex-box[align-items=stretch] {\r\n  align-items: stretch;\r\n}\r\n.bue-flex-box[flex-center] {\r\n  align-items: center;\r\n  justify-content: center;\r\n}\r\n.bue-flex-box[bordered] {\r\n  border: 1px solid #ddd;\r\n}\r\n.bue-flex-box[cellpadding],\r\n.bue-flex-box[itemspacing] {\r\n  padding: 8px;\r\n}\r\n.bue-flex-box [cellspacing],\r\n.bue-flex-box[itemspacing] > * {\r\n  margin: 8px;\r\n}\r\n.bue-flex-box > * {\r\n  position: relative;\r\n}\r\n.bue-flex-box > [flex-auto] {\r\n  flex: 1 1 auto!important;\r\n}\r\n.bue-flex-box > [flex-none] {\r\n  flex: 0 0 none!important;\r\n}\r\n.bue-flex-box[direction=column] > [size] {\r\n  height: 10px;\r\n}\r\n.bue-flex-box:not(direction=\"column\") > [size] {\r\n  width: 10px;\r\n}\r\n.bue-flex-box > [size=auto] {\r\n  flex-grow: 1;\r\n}\r\n.bue-flex-box > [size=\"1\"] {\r\n  flex-grow: 1;\r\n}\r\n.bue-flex-box > [size=\"2\"] {\r\n  flex-grow: 2;\r\n}\r\n.bue-flex-box > [size=\"3\"] {\r\n  flex-grow: 3;\r\n}\r\n.bue-flex-box > [size=\"4\"] {\r\n  flex-grow: 4;\r\n}\r\n.bue-flex-box > [size=\"5\"] {\r\n  flex-grow: 5;\r\n}\r\n.bue-flex-box > [size=\"6\"] {\r\n  flex-grow: 6;\r\n}\r\n.bue-flex-box > [size=\"7\"] {\r\n  flex-grow: 7;\r\n}\r\n.bue-flex-box > [size=\"8\"] {\r\n  flex-grow: 8;\r\n}";
	styleInject(css);

	/* script */
	var __vue_script__$1 = script$1;
	/* template */

	var __vue_render__$1 = function __vue_render__() {
	  var _vm = this;

	  var _h = _vm.$createElement;

	  var _c = _vm._self._c || _h;

	  return _c("div", {
	    staticClass: "bue-flex-box",
	    style: _vm.style,
	    attrs: {
	      direction: _vm.flexDirection,
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

	var FlexBox = normalizeComponent_1({
	  render: __vue_render__$1,
	  staticRenderFns: __vue_staticRenderFns__$1
	}, __vue_inject_styles__$1, __vue_script__$1, __vue_scope_id__$1, __vue_is_functional_template__$1, __vue_module_identifier__$1, undefined, undefined);

	var HBox = {
	  "extends": FlexBox,
	  computed: {
	    flexDirection: function flexDirection() {
	      return 'row';
	    }
	  }
	};

	var VBox = {
	  "extends": FlexBox,
	  computed: {
	    flexDirection: function flexDirection() {
	      return 'column';
	    }
	  }
	};

	var $filter = arrayIteration.filter;


	// `Array.prototype.filter` method
	// https://tc39.github.io/ecma262/#sec-array.prototype.filter
	// with adding support of @@species
	_export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('filter') }, {
	  filter: function filter(callbackfn /* , thisArg */) {
	    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});

	var nativeReverse = [].reverse;
	var test$1 = [1, 2];

	// `Array.prototype.reverse` method
	// https://tc39.github.io/ecma262/#sec-array.prototype.reverse
	// fix for Safari 12.0 bug
	// https://bugs.webkit.org/show_bug.cgi?id=188794
	_export({ target: 'Array', proto: true, forced: String(test$1) === String(test$1.reverse()) }, {
	  reverse: function reverse() {
	    if (isArray(this)) this.length = this.length;
	    return nativeReverse.call(this);
	  }
	});

	var nativeGetOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;


	var FAILS_ON_PRIMITIVES$1 = fails(function () { nativeGetOwnPropertyDescriptor$2(1); });
	var FORCED$4 = !descriptors || FAILS_ON_PRIMITIVES$1;

	// `Object.getOwnPropertyDescriptor` method
	// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
	_export({ target: 'Object', stat: true, forced: FORCED$4, sham: !descriptors }, {
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

	var css$1 = ".bue-splitter {\r\n  background: rgba(0,0,0,.1);\r\n  border-radius: 4px;\r\n  -webkit-user-select: none;\r\n  -moz-user-select: none;\r\n  -ms-user-select: none;\r\n  user-select: none;\r\n}\r\n.bue-splitter:hover {\r\n  background: rgba(0,0,0,.2);\r\n}\r\n.bue-splitter:first-child,\r\n.bue-splitter:last-child {\r\n  display: none;\r\n}\r\n[cellpadding] > .bue-splitter,\r\n[item-spacing] > .bue-splitter {\r\n  margin: 8px;\r\n}\r\n[direction=row] > .bue-splitter {\r\n  width: 4px;\r\n  margin-left: 0;\r\n  margin-right: 0;\r\n  cursor: col-resize;\r\n}\r\n[direction=column] > .bue-splitter {\r\n  height: 4px;\r\n  margin-top: 0;\r\n  margin-bottom: 0;\r\n  cursor: row-resize;\r\n}";
	styleInject(css$1);

	/* script */
	var __vue_script__$2 = script$2;
	/* template */

	var __vue_render__$2 = function __vue_render__() {
	  var _vm = this;

	  var _h = _vm.$createElement;

	  var _c = _vm._self._c || _h;

	  return _c("div", {
	    staticClass: "bue-splitter",
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

	var css$2 = ".bue-button {\r\n  position: relative;\r\n  display: inline-block;\r\n  height: 34px;\r\n  padding: 6px 15px;\r\n  outline: 0;\r\n  border: 1px solid #666;\r\n  border-radius: 2px;\r\n  background: #fff;\r\n  line-height: 20px;\r\n  text-decoration: none;\r\n  text-align: center;\r\n  font-size: 1rem;\r\n  color: #666;\r\n  fill: #666;\r\n  cursor: pointer;\r\n}\r\n.bue-button::before {\r\n  display: inline-block;\r\n  width: 0;\r\n  content: '\\00a0';\r\n}\r\n.bue-button:not([button-type])[button-style=link]:hover,\r\n.bue-button[button-type=normal][button-style=link]:hover {\r\n  color: #8c8c8c;\r\n  fill: #8c8c8c;\r\n}\r\n.bue-button:not([button-type])[active],\r\n.bue-button[button-type=normal][active] {\r\n  background: #404040;\r\n}\r\n.bue-button:not([button-type]):hover,\r\n.bue-button[button-type=normal]:hover {\r\n  background: #8c8c8c;\r\n  border-color: #8c8c8c;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.bue-button:not([button-type])[disabled][button-style=link],\r\n.bue-button[button-type=normal][disabled][button-style=link] {\r\n  color: #bfbfbf;\r\n  fill: #bfbfbf;\r\n}\r\n.bue-button:not([button-type])[disabled]:not([button-style=link]),\r\n.bue-button[button-type=normal][disabled]:not([button-style=link]) {\r\n  background: #bfbfbf;\r\n  border-color: #bfbfbf;\r\n}\r\n.bue-button[button-type=primary] {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #1890ff;\r\n  border-color: #1890ff;\r\n}\r\n.bue-button[button-type=primary][button-style=link] {\r\n  color: #1890ff;\r\n  fill: #1890ff;\r\n}\r\n.bue-button[button-type=primary][button-style=link]:hover {\r\n  color: #40a9ff;\r\n  fill: #40a9ff;\r\n}\r\n.bue-button[button-type=primary][button-style=outline],\r\n.bue-button[button-type=primary][button-style=text] {\r\n  color: #1890ff;\r\n  fill: #1890ff;\r\n}\r\n.bue-button[button-type=primary][active] {\r\n  background: #096dd9;\r\n  border-color: #096dd9;\r\n}\r\n.bue-button[button-type=primary]:hover {\r\n  background: #40a9ff;\r\n  border-color: #40a9ff;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.bue-button[button-type=primary][disabled][button-style=link] {\r\n  color: #91d5ff;\r\n  fill: #91d5ff;\r\n}\r\n.bue-button[button-type=primary][disabled]:not([button-style=link]) {\r\n  background: #91d5ff;\r\n  border-color: #91d5ff;\r\n}\r\n.bue-button[button-type=submit] {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #52c41a;\r\n  border-color: #52c41a;\r\n}\r\n.bue-button[button-type=submit][button-style=link] {\r\n  color: #52c41a;\r\n  fill: #52c41a;\r\n}\r\n.bue-button[button-type=submit][button-style=link]:hover {\r\n  color: #73d13d;\r\n  fill: #73d13d;\r\n}\r\n.bue-button[button-type=submit][button-style=outline],\r\n.bue-button[button-type=submit][button-style=text] {\r\n  color: #52c41a;\r\n  fill: #52c41a;\r\n}\r\n.bue-button[button-type=submit][active] {\r\n  background: #389e0d;\r\n  border-color: #389e0d;\r\n}\r\n.bue-button[button-type=submit]:hover {\r\n  background: #73d13d;\r\n  border-color: #73d13d;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.bue-button[button-type=submit][disabled][button-style=link] {\r\n  color: #b7eb8f;\r\n  fill: #b7eb8f;\r\n}\r\n.bue-button[button-type=submit][disabled]:not([button-style=link]) {\r\n  background: #b7eb8f;\r\n  border-color: #b7eb8f;\r\n}\r\n.bue-button[button-type=danger] {\r\n  color: #fff;\r\n  fill: #fff;\r\n  background: #fa541c;\r\n  border-color: #fa541c;\r\n}\r\n.bue-button[button-type=danger][button-style=link] {\r\n  color: #fa541c;\r\n  fill: #fa541c;\r\n}\r\n.bue-button[button-type=danger][button-style=link]:hover {\r\n  color: #ff7a45;\r\n  fill: #ff7a45;\r\n}\r\n.bue-button[button-type=danger][button-style=outline],\r\n.bue-button[button-type=danger][button-style=text] {\r\n  color: #fa541c;\r\n  fill: #fa541c;\r\n}\r\n.bue-button[button-type=danger][active] {\r\n  background: #d4380d;\r\n  border-color: #d4380d;\r\n}\r\n.bue-button[button-type=danger]:hover {\r\n  background: #ff7a45;\r\n  border-color: #ff7a45;\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.bue-button[button-type=danger][disabled][button-style=link] {\r\n  color: #ffbb96;\r\n  fill: #ffbb96;\r\n}\r\n.bue-button[button-type=danger][disabled]:not([button-style=link]) {\r\n  background: #ffbb96;\r\n  border-color: #ffbb96;\r\n}\r\n.bue-button[button-style=link],\r\n.bue-button[button-style=link]:hover,\r\n.bue-button[button-style=link][active],\r\n.bue-button[button-style=text] {\r\n  background: 0 0;\r\n  border-color: transparent;\r\n  box-shadow: none;\r\n}\r\n.bue-button[button-style=outline] {\r\n  background: #fff;\r\n}\r\n.bue-button[button-style=link]:not([disabled]):hover {\r\n  text-decoration: underline;\r\n}\r\n.bue-button[active] {\r\n  color: #fff;\r\n  fill: #fff;\r\n}\r\n.bue-button[disabled] {\r\n  cursor: default;\r\n}\r\n.bue-button[disabled]:not([button-style=link]) {\r\n  color: rgba(255,255,255,.7);\r\n  fill: rgba(255,255,255,.7);\r\n}\r\n.bue-button:not([disabled]) {\r\n  box-shadow: 0 1.5px 4px rgba(0,0,0,.24),0 1.5px 6px rgba(0,0,0,.12);\r\n}\r\n.bue-button:not([disabled])[button-style=text] {\r\n  box-shadow: none;\r\n}\r\n.bue-button:not([disabled]):hover {\r\n  box-shadow: 0 3px 12px rgba(0,0,0,.23),0 3px 12px rgba(0,0,0,.16);\r\n}\r\n.bue-button:not([disabled])[button-style=link] {\r\n  box-shadow: none;\r\n}\r\n.bue-button:empty,\r\n.bue-button[icon-only] {\r\n  width: 34px;\r\n  padding-left: 0;\r\n  padding-right: 0;\r\n}\r\n.bue-button > * + span,\r\n.bue-button > span + * {\r\n  margin-left: 4px;\r\n}\r\n.bue-button-group {\r\n  position: relative;\r\n  display: inline-block;\r\n  border-radius: 2px;\r\n  box-shadow: 0 1.5px 4px rgba(0,0,0,.24),0 1.5px 6px rgba(0,0,0,.12);\r\n}\r\n.bue-button-group > .bue-button {\r\n  float: left;\r\n  box-shadow: none;\r\n  z-index: 0;\r\n}\r\n.bue-button-group > .bue-button:hover:not([disabled]) {\r\n  z-index: 1;\r\n}\r\n.bue-button-group > .bue-button:not(:first-child) {\r\n  border-top-left-radius: 0;\r\n  border-bottom-left-radius: 0;\r\n}\r\n.bue-button-group > .bue-button:not(:first-child)[button-type]:not([button-type=normal]):not(:hover):not([active]):not([button-style]),\r\n.bue-button-group > .bue-button:not(:first-child)[button-type]:not([button-type=normal]):not(:hover):not([active])[button-style=normal] {\r\n  border-left-color: rgba(255,255,255,.5);\r\n}\r\n.bue-button-group > .bue-button:not(:last-child) {\r\n  margin-right: -1px;\r\n  border-top-right-radius: 0;\r\n  border-bottom-right-radius: 0;\r\n}\r\n[button-shape=round],\r\n[button-shape=round] > .bue-button {\r\n  border-radius: 17px;\r\n}";
	styleInject(css$2);

	var Button = {
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
	    caption: String,
	    icon: String,
	    iconOnly: Boolean
	  },
	  computed: {
	    isIconOnly: function isIconOnly() {
	      return this.iconOnly || !this.$slots["default"] && !this.caption && this.icon;
	    }
	  },
	  methods: {
	    onClick: function onClick() {
	      this.$emit('click');
	    }
	  },
	  render: function render(h) {
	    return h("button", {
	      "class": "bue-button",
	      "attrs": {
	        "icon-only": this.isIconOnly,
	        "button-type": this.buttonType === 'normal' ? undefined : this.buttonType,
	        "button-style": this.buttonStyle === 'normal' ? undefined : this.buttonStyle,
	        "button-shape": this.buttonShape === 'normal' ? undefined : this.buttonShape
	      },
	      "on": {
	        "click": this.onClick
	      }
	    }, [this.icon ? h("i", {
	      "class": this.icon
	    }) : undefined, this.$slots["default"] ? this.icon ? h("span", [this.$slots["default"]]) : this.$slots["default"] : this.caption ? h("span", [this.caption]) : undefined]);
	  }
	};

	//
	//
	//
	//
	//
	//
	var script$3 = {};

	/* script */
	var __vue_script__$3 = script$3;
	/* template */

	var __vue_render__$3 = function __vue_render__() {
	  var _vm = this;

	  var _h = _vm.$createElement;

	  var _c = _vm._self._c || _h;

	  return _c("div", {
	    staticClass: "bue-button-group"
	  }, [_vm._t("default")], 2);
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

	var ButtonGroup = normalizeComponent_1({
	  render: __vue_render__$3,
	  staticRenderFns: __vue_staticRenderFns__$3
	}, __vue_inject_styles__$3, __vue_script__$3, __vue_scope_id__$3, __vue_is_functional_template__$3, __vue_module_identifier__$3, undefined, undefined);

	var ok = 'M351.81165742 729.48242963L134.32922778 512 61.83508498 584.49414281 351.81165742 874.47071645 973.19002778 253.09234608 900.69588498 180.59820206Z';
	var close = 'M951.90520135 160.07583979L863.92416021 72.09479865 512 424.01896032 160.07583979 72.09479865 72.09479865 160.07583979 424.01896032 512 72.09479865 863.92416021 160.07583979 951.90520135 512 599.98103968 863.92416021 951.90520135 951.90520135 863.92416021 599.98103968 512Z';
	var keyDown = 'M240.98697401 294.01126208L512 565.02428806 783.01302599 294.01126208 865.4952507 376.49348677 512 729.98873747 158.5047493 376.49348677Z';
	var keyLeft = 'M733.64730918 774.88842085L462.6342832 503.87539624 733.64730918 232.86237024 651.1650831 150.38014552 297.6698324 503.87539624 651.1650831 857.37064693Z';
	var keyRight = 'M290.35269082 765.33826345L561.3657168 500.21682544 290.35269082 229.20379943 372.8349169 146.72157474 726.3301676 500.21682544 372.8349169 853.71207613Z';
	var keyUp = 'M240.98697401 733.64730918L512 462.6342832 783.01302599 733.64730918 865.4952507 651.1650831 512 297.6698324 158.5047493 651.1650831Z';
	var _d = {
	  ok: ok,
	  close: close,
	  'key-down': keyDown,
	  'key-left': keyLeft,
	  'key-right': keyRight,
	  'key-up': keyUp
	};

	//
	var script$4 = {
	  props: {
	    icon: {
	      type: String,
	      defalt: 'close'
	    },
	    size: {
	      type: String,
	      "default": '1em'
	    }
	  },
	  computed: {
	    d: function d() {
	      return _d[this.icon];
	    }
	  }
	};

	var css$3 = ".bue-svg-icon {\r\n  vertical-align: -.15em;\r\n}";
	styleInject(css$3);

	/* script */
	var __vue_script__$4 = script$4;
	/* template */

	var __vue_render__$4 = function __vue_render__() {
	  var _vm = this;

	  var _h = _vm.$createElement;

	  var _c = _vm._self._c || _h;

	  return _c("svg", {
	    staticClass: "bue-svg-icon",
	    attrs: {
	      viewBox: "0 0 1024 1024",
	      width: _vm.size,
	      height: _vm.size
	    }
	  }, [_c("path", {
	    attrs: {
	      d: _vm.d
	    }
	  })]);
	};

	var __vue_staticRenderFns__$4 = [];
	__vue_render__$4._withStripped = true;
	/* style */

	var __vue_inject_styles__$4 = undefined;
	/* scoped */

	var __vue_scope_id__$4 = undefined;
	/* module identifier */

	var __vue_module_identifier__$4 = undefined;
	/* functional template */

	var __vue_is_functional_template__$4 = false;
	/* style inject */

	/* style inject SSR */

	var Icon = normalizeComponent_1({
	  render: __vue_render__$4,
	  staticRenderFns: __vue_staticRenderFns__$4
	}, __vue_inject_styles__$4, __vue_script__$4, __vue_scope_id__$4, __vue_is_functional_template__$4, __vue_module_identifier__$4, undefined, undefined);

	function install(Vue) {
	  Vue.component('bue-flex-box', FlexBox);
	  Vue.component('bue-flex-item', FlexItem);
	  Vue.component('bue-h-box', HBox);
	  Vue.component('bue-v-box', VBox);
	  Vue.component('bue-splitter', Splitter);
	  Vue.component('bue-button', Button);
	  Vue.component('bue-button-group', ButtonGroup);
	  Vue.component('bue-icon', Icon);
	}

	if (window.Vue) install(window.Vue);

	exports.Button = Button;
	exports.ButtonGroup = ButtonGroup;
	exports.FlexBox = FlexBox;
	exports.FlexItem = FlexItem;
	exports.HBox = HBox;
	exports.Icon = Icon;
	exports.Splitter = Splitter;
	exports.VBox = VBox;
	exports.install = install;
	exports.variables = variables;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
