function Nil() {}

Nil.prototype[Symbol.toStringTag] = "Nil";

function isNil(x) {
  return x == null;
}

function isSome(x) {
  return x != null;
}

function nil() {
  return null;
}

Object.defineProperty(Nil, Symbol.hasInstance, {
  value: isNil
});

var _part, _lift, _partial, _lift2;

const unbind = Function.call.bind(Function.bind, Function.call);

const slice = unbind(Array.prototype.slice);

const indexOf = unbind(Array.prototype.indexOf);

function type(self) {
  return self == null ? Nil : self.constructor;
}

function isFunction(f) {
  return typeof f === "function";
}

function isSymbol(self) {
  return typeof self === "symbol";
}

function isString(self) {
  return typeof self === "string";
}

function noop$1() {}

function identity(x) {
  return x;
}

function constantly(x) {
  return function() {
    return x;
  };
}

function complement(f) {
  return function() {
    return !f.apply(this, arguments);
  };
}

function invokes(self, method, ...args) {
  return self[method].apply(self, args);
}

function overload() {
  const fs = arguments, fallback = fs[fs.length - 1];
  return function() {
    const f = fs[arguments.length] || (arguments.length >= fs.length ? fallback : null);
    return f.apply(this, arguments);
  };
}

function compN(...fs) {
  const f = fs.pop();
  return function(...args) {
    return fs.reduceRight((function(memo, f) {
      return f.call(this, memo);
    }), f.apply(this, args));
  };
}

const comp = overload(constantly(identity), identity, compN);

function pipeN(f, ...fs) {
  return function(...args) {
    return fs.reduce((function(memo, f) {
      return f.call(this, memo);
    }), f.apply(this, args));
  };
}

const pipe = overload(constantly(identity), identity, pipeN);

function chain(value, ...fs) {
  const f = pipe(...fs);
  return f(value);
}

function handle() {
  const handlers = slice(arguments, 0, arguments.length - 1), fallback = arguments[arguments.length - 1];
  return function() {
    for (let handler of handlers) {
      const check = handler[0];
      if (check.apply(this, arguments)) {
        const fn = handler[1];
        return fn.apply(this, arguments);
      }
    }
    return fallback.apply(this, arguments);
  };
}

function assume(pred, obj, f) {
  return handle([ pred, f ], partial(f, obj));
}

function subj(f, len) {
  const length = len || f.length;
  return function(...ys) {
    return ys.length >= length ? f.apply(null, ys) : function(...xs) {
      return f.apply(null, xs.concat(ys));
    };
  };
}

function obj(f, len) {
  const length = len || f.length;
  return function(...xs) {
    return xs.length >= length ? f.apply(null, xs) : function(...ys) {
      return f.apply(null, xs.concat(ys));
    };
  };
}

function curry1(f) {
  return curry2(f, f.length);
}

function curry2(f, minimum) {
  return function(...args) {
    const xs = args.length ? args : [ undefined ];
    if (xs.length >= minimum) {
      return f.apply(this, xs);
    } else {
      return curry2((function(...ys) {
        return f.apply(this, [ ...xs, ...ys ]);
      }), minimum - xs.length);
    }
  };
}

const curry = overload(null, curry1, curry2);

function plugging(placeholder) {
  return function plug(f, ...xs) {
    const n = xs.length;
    return xs.indexOf(placeholder) < 0 ? f.apply(null, xs) : function(...ys) {
      const zs = [];
      for (let i = 0; i < n; i++) {
        let x = xs[i];
        zs.push(x === placeholder && ys.length ? ys.shift() : x);
      }
      return plug.apply(null, [ f, ...zs, ...ys ]);
    };
  };
}

const placeholder = {};

const plug = plugging(placeholder);

const part = plug;

function partial(f, ...xs) {
  return function(...ys) {
    return f.apply(this, [ ...xs, ...ys ]);
  };
}

function lift(g, f) {
  return function(...args) {
    return g.call(this, f, ...args);
  };
}

const partly = (_lift = lift, _part = part, function lift(_argPlaceholder) {
  return _lift(_part, _argPlaceholder);
});

const partially = (_lift2 = lift, _partial = partial, function lift(_argPlaceholder2) {
  return _lift2(_partial, _argPlaceholder2);
});

const deferring = partially;

function factory(f, ...args) {
  return deferring(partial(f, ...args));
}

function multi(dispatch) {
  return function(...args) {
    const f = dispatch.apply(this, args);
    if (!f) {
      throw Error("Failed dispatch");
    }
    return f.apply(this, args);
  };
}

function doto(obj, ...effects) {
  const len = effects.length;
  for (let i = 0; i < len; i++) {
    const effect = effects[i];
    effect(obj);
  }
  return obj;
}

function does(...effects) {
  const len = effects.length;
  return function doing(...args) {
    for (let i = 0; i < len; i++) {
      const effect = effects[i];
      effect(...args);
    }
  };
}

function unspread1(f) {
  return function(...args) {
    return f(args);
  };
}

function unspread2(f, start, len = Infinity) {
  const end = start + len;
  return function(...args) {
    const out = [];
    const tgt = [];
    for (let i = 0; i < args.length; i++) {
      if (i === start) {
        out.push(tgt);
      }
      (i < start || i > end ? out : tgt).push(args[i]);
    }
    return f(...out);
  };
}

const unspread = overload(null, unspread1, unspread2);

function once(f) {
  const pending = {};
  let result = pending;
  return function(...args) {
    if (result === pending) {
      result = f(...args);
    }
    return result;
  };
}

function execute(f, ...args) {
  return f.apply(this, args);
}

function applying(...args) {
  return function(f) {
    return f.apply(this, args);
  };
}

function constructs(Type) {
  return function(...args) {
    return new (Function.prototype.bind.apply(Type, [ null ].concat(args)));
  };
}

function branch3(pred, yes, no) {
  return function(...args) {
    return pred(...args) ? yes(...args) : no(...args);
  };
}

function branchN(pred, f, ...fs) {
  return function(...args) {
    return pred(...args) ? f(...args) : branch(...fs)(...args);
  };
}

const branch = overload(null, null, null, branch3, branchN);

function guard1(pred) {
  return guard2(pred, identity);
}

function guard2(pred, f) {
  return branch3(pred, f, noop$1);
}

function guard3(value, pred, f) {
  return chain(value, guard2(pred, f));
}

const guard = overload(null, guard1, guard2, guard3);

function memoize1(f) {
  return memoize2(f, (function(...args) {
    return JSON.stringify(args);
  }));
}

function memoize2(f, hash) {
  const cache = {};
  return function() {
    const key = hash.apply(this, arguments);
    if (cache.hasOwnProperty(key)) {
      return cache[key];
    } else {
      const result = f.apply(this, arguments);
      cache[key] = result;
      return result;
    }
  };
}

const memoize = overload(null, memoize1, memoize2);

function isNative(f) {
  return /\{\s*\[native code\]\s*\}/.test("" + f);
}

function toggles4(on, off, want, self) {
  return want(self) ? on(self) : off(self);
}

function toggles5(on, off, _, self, want) {
  return want ? on(self) : off(self);
}

const toggles = overload(null, null, null, null, toggles4, toggles5);

function detach(method) {
  return function(obj, ...args) {
    return obj[method](...args);
  };
}

function attach(f) {
  return function(...args) {
    return f.apply(null, [ this, ...args ]);
  };
}

function PreconditionError(f, pred, args) {
  this.f = f;
  this.pred = pred;
  this.args = args;
}

PreconditionError.prototype = new Error;

function PostconditionError(f, pred, args, result) {
  this.f = f;
  this.pred = pred;
  this.args = args;
  this.result = result;
}

PostconditionError.prototype = new Error;

function pre(f, pred) {
  return function() {
    if (!pred.apply(this, arguments)) {
      throw new PreconditionError(f, pred, arguments);
    }
    return f.apply(this, arguments);
  };
}

function post(f, pred) {
  return function() {
    const result = f.apply(this, arguments);
    if (!pred(result)) {
      throw new PostconditionError(f, pred, arguments, result);
    }
    return result;
  };
}

function nullary(f) {
  return function() {
    return f();
  };
}

function unary(f) {
  return a => f(a);
}

function binary(f) {
  return (a, b) => f(a, b);
}

function ternary(f) {
  return (a, b, c) => f(a, b, c);
}

function quaternary(f) {
  return (a, b, c, d) => f(a, b, c, d);
}

function nary(f, length) {
  return function() {
    return f(...slice(arguments, 0, length));
  };
}

function arity(f, length) {
  return ([ nullary, unary, binary, ternary, quaternary ][length] || nary)(f, length);
}

function fold(f, init, xs) {
  let memo = init;
  xs.length - 1;
  let r = {};
  for (const x of xs) {
    if (memo === r) break;
    memo = f(memo, x, (reduced => r = reduced));
  }
  return memo;
}

function foldkv(f, init, xs) {
  let memo = init, len = xs.length, r = {};
  for (let i = 0; i < len; i++) {
    if (memo === r) break;
    memo = f(memo, i, xs[i], (reduced => r = reduced));
  }
  return memo;
}

function posn(...xfs) {
  return function(arr) {
    return foldkv((function(memo, idx, xf) {
      const val = arr[idx];
      memo.push(xf ? xf(val) : val);
      return memo;
    }), [], xfs);
  };
}

function signature(...preds) {
  return function(...values) {
    return foldkv((function(memo, idx, pred, reduced) {
      return memo ? !pred || pred(values[idx]) : reduced(memo);
    }), preds.length === values.length, preds);
  };
}

function signatureHead(...preds) {
  return function(...values) {
    return foldkv((function(memo, idx, value, reduced) {
      let pred = preds[idx];
      return memo ? !pred || pred(value) : reduced(memo);
    }), true, values);
  };
}

function and(...preds) {
  return function(...args) {
    return fold((function(memo, pred, reduced) {
      return memo ? pred(...args) : reduced(memo);
    }), true, preds);
  };
}

function or(...preds) {
  return function(...args) {
    return fold((function(memo, pred, reduced) {
      return memo ? reduced(memo) : pred(...args);
    }), false, preds);
  };
}

function both(memo, value) {
  return memo && value;
}

function either(memo, value) {
  return memo || value;
}

function isIdentical(x, y) {
  return x === y;
}

function everyPred(...preds) {
  return function() {
    return fold((function(memo, arg) {
      return fold((function(memo, pred, reduced) {
        let result = memo && pred(arg);
        return result ? result : reduced(result);
      }), memo, preds);
    }), true, slice(arguments));
  };
}

function folding1(f) {
  return folding2(f, identity);
}

function folding2(f, order) {
  return function(x, ...xs) {
    return fold(f, x, order(xs));
  };
}

const folding = overload(null, folding1, folding2);

const all = overload(null, identity, both, folding1(both));

const any = overload(null, identity, either, folding1(either));

function everyPair(pred, xs) {
  let every = xs.length > 0;
  while (every && xs.length > 1) {
    every = pred(xs[0], xs[1]);
    xs = slice(xs, 1);
  }
  return every;
}

function addMeta(target, key, value) {
  try {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      writable: true,
      value: value
    });
  } catch (ex) {
    target[key] = value;
  }
}

const TEMPLATE = Symbol("@protocol-template"), INDEX = Symbol("@protocol-index"), MISSING = Symbol("@protocol-missing");

function protocol(template) {
  const p = new Protocol({}, {});
  p.extend(template);
  return p;
}

function Protocol(template, index) {
  this[INDEX] = index;
  this[TEMPLATE] = template;
}

function extend$1(template) {
  for (let method in template) {
    this[method] = this.dispatch(method);
  }
  Object.assign(this[TEMPLATE], template);
}

function dispatch(method) {
  const protocol = this;
  return function(self, ...args) {
    const f = satisfies2.call(protocol, method, self);
    if (!f) {
      throw new ProtocolLookupError(protocol, method, self, args);
    }
    return f.apply(null, [ self, ...args ]);
  };
}

function generate$1() {
  const index = this[INDEX];
  return function(method) {
    const sym = index[method] || Symbol(method);
    index[method] = sym;
    return sym;
  };
}

function keys$b() {
  return Object.keys(this[TEMPLATE]);
}

function specify1(behavior) {
  const protocol = this;
  return function(target) {
    specify2.call(protocol, behavior, target);
  };
}

function specify2(behavior, target) {
  if (this == null) {
    throw new Error("Protocol not specified.");
  }
  if (behavior == null || typeof behavior != "object") {
    throw new Error("Behavior must be an object map.");
  }
  if (target == null) {
    throw new Error("Subject not specified.");
  }
  const keys = this.generate();
  addMeta(target, keys("__marker__"), this);
  for (let method in behavior) {
    if (!this[method]) {
      throw new Error("Foreign behavior specified: " + method);
    }
    addMeta(target, keys(method), behavior[method]);
  }
}

const specify$1 = overload(null, specify1, specify2);

function unspecify1(behavior) {
  const protocol = this;
  return function(target) {
    unspecify2.call(protocol, behavior, target);
  };
}

function unspecify2(behavior, target) {
  const keys = this.generate();
  addMeta(target, keys("__marker__"), undefined);
  for (let method in behavior) {
    addMeta(target, keys(method), undefined);
  }
}

const unspecify$1 = overload(null, unspecify1, unspecify2);

function implement0() {
  return implement1.call(this, {});
}

function implement1(obj) {
  const behavior = obj.behaves ? obj.behaves(this) : obj;
  if (obj.behaves && !behavior) {
    throw new Error("Unable to borrow behavior.");
  }
  return Object.assign(implement2.bind(this, behavior), {
    protocol: this,
    behavior: behavior
  });
}

function implement2(behavior, target) {
  let tgt = target.prototype;
  if (tgt.constructor === Object) {
    tgt = Object;
  }
  specify2.call(this, behavior, tgt);
}

const implement$1 = overload(implement0, implement1, implement2);

function satisfies0() {
  return this.satisfies.bind(this);
}

function satisfies1(obj) {
  const target = obj == null ? new Nil : obj, key = this[INDEX]["__marker__"] || MISSING;
  return target[key] || (target.constructor === Object ? target.constructor[key] : null);
}

function satisfies2(method, obj) {
  const target = obj == null ? new Nil : obj, key = this[INDEX][method] || MISSING;
  return target[key] || (target.constructor === Object ? target.constructor[key] : null) || this[TEMPLATE][method];
}

const satisfies$1 = overload(satisfies0, satisfies1, satisfies2);

Object.assign(Protocol.prototype, {
  extend: extend$1,
  dispatch: dispatch,
  generate: generate$1,
  keys: keys$b,
  specify: specify$1,
  unspecify: unspecify$1,
  implement: implement$1,
  satisfies: satisfies$1
});

Protocol.prototype[Symbol.toStringTag] = "Protocol";

class ProtocolLookupError extends Error {
  constructor(protocol, method, subject, args) {
    super(`Protocol lookup for ${method} failed.`);
    this.protocol = protocol;
    this.method = method;
    this.subject = subject;
    this.args = args;
    this.name = this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return "ProtocolLookupError";
  }
  toString() {
    return this.message;
  }
}

const extend = unbind(Protocol.prototype.extend);

const satisfies = unbind(Protocol.prototype.satisfies);

const specify = unbind(Protocol.prototype.specify);

const unspecify = unbind(Protocol.prototype.unspecify);

const implement = unbind(Protocol.prototype.implement);

function reifiable(properties) {
  function Reifiable(properties) {
    Object.assign(this, properties);
  }
  return new Reifiable(properties || {});
}

function behaves(behaviors, env, callback) {
  for (let key in behaviors) {
    if (key in env) {
      const type = env[key], behave = behaviors[key];
      callback && callback(type, key, behave);
      behave(type);
    }
  }
}

function forward1(key) {
  return function forward(f) {
    return function(self, ...args) {
      return f.apply(this, [ self[key], ...args ]);
    };
  };
}

function forwardN(target, ...protocols) {
  const fwd = forward1(target);
  const behavior = fold((function(memo, protocol) {
    memo.push(implement(protocol, fold((function(memo, key) {
      memo[key] = fwd(protocol[key]);
      return memo;
    }), {}, protocol.keys() || [])));
    return memo;
  }), [], protocols);
  return does(...behavior);
}

const forward = overload(null, forward1, forwardN);

const IAddable = protocol({
  add: null
});

const IAppendable = protocol({
  append: null
});

const IAssociative = protocol({
  assoc: null,
  contains: null
});

const IBounded = protocol({
  start: null,
  end: null
});

function clone$b(self) {
  return Object.assign(Object.create(self.constructor.prototype), self);
}

const ICloneable = protocol({
  clone: clone$b
});

const ICollection = protocol({
  conj: null,
  unconj: null
});

const ICompactible = protocol({
  compact: null
});

function compare$6(x, y) {
  return x > y ? 1 : x < y ? -1 : 0;
}

const IComparable = protocol({
  compare: compare$6
});

const IMultipliable = protocol({
  mult: null
});

const IReducible = protocol({
  reduce: null
});

const ISeq = protocol({
  first: null,
  rest: null
});

function reduce2(f, coll) {
  return reduce3(f, ISeq.first(coll), ISeq.rest(coll));
}

function reduce3(f, init, coll) {
  return IReducible.reduce(coll, f, init);
}

const reduce$9 = overload(null, null, reduce2, reduce3);

function reducing1(f) {
  return reducing2(f, identity);
}

function reducing2(f, order) {
  return function(x, ...xs) {
    return reduce3(f, x, order(xs));
  };
}

const reducing = overload(null, reducing1, reducing2);

const mult$2 = overload(constantly(1), identity, IMultipliable.mult, reducing(IMultipliable.mult));

function inverse$4(self) {
  return IMultipliable.mult(self, -1);
}

const IInversive = protocol({
  inverse: inverse$4
});

const ICounted = protocol({
  count: null
});

const IDeref = protocol({
  deref: null
});

const IDisposable = protocol({
  dispose: null
});

const IDivisible = protocol({
  divide: null
});

const IEmptyableCollection = protocol({
  empty: null
});

function equiv$e(x, y) {
  return x === y;
}

const IEquiv = protocol({
  equiv: equiv$e
});

const IFind = protocol({
  find: null
});

const IFunctor = protocol({
  fmap: null
});

function flatMap$3(self, f) {
  var _f, _IFunctor$fmap, _IFunctor;
  return chain(self, IFlatMappable.flat, (_IFunctor = IFunctor, _IFunctor$fmap = _IFunctor.fmap, 
  _f = f, function fmap(_argPlaceholder) {
    return _IFunctor$fmap.call(_IFunctor, _argPlaceholder, _f);
  }));
}

const IFlatMappable = protocol({
  flat: null,
  flatMap: flatMap$3
});

const IFn = protocol({
  invoke: null
});

const IForkable = protocol({
  fork: null
});

const IHashable = protocol({
  hash: null
});

const IHierarchy = protocol({
  root: null,
  parent: null,
  parents: null,
  closest: null,
  children: null,
  descendants: null,
  siblings: null,
  nextSibling: null,
  nextSiblings: null,
  prevSibling: null,
  prevSiblings: null
});

const IIdentifiable = protocol({
  identifier: null
});

const IInclusive = protocol({
  includes: null
});

const IIndexed = protocol({
  nth: null,
  idx: null
});

const IInsertable = protocol({
  before: null,
  after: null
});

const IKVReducible = protocol({
  reducekv: null
});

function lookup$8(self, key) {
  return self && self[key];
}

const ILookup = protocol({
  lookup: lookup$8
});

const IMap = protocol({
  dissoc: null,
  keys: null,
  vals: null
});

const IMapEntry = protocol({
  key: null,
  val: null
});

const cache = Symbol("hashcode");

function hashTag(random = Math.random) {
  const tag = random(0);
  return function(self) {
    if (!self[cache]) {
      self[cache] = tag;
    }
  };
}

function hash$7(self) {
  if (self == null) {
    return 0;
  } else if (self[cache]) {
    return self[cache];
  }
  const hash = self.hashCode ? nullary(self.hashCode.bind(self)) : satisfies(IHashable, "hash", self);
  if (hash) {
    const hashcode = hash(self);
    return Object.isFrozen(self) ? hashcode : self[cache] = hashcode;
  } else {
    hashTag()(self);
    return self[cache];
  }
}

function _IsValueObject(maybeValue) {
  return Boolean(maybeValue && typeof maybeValue.equals === "function" && typeof maybeValue.hashCode === "function");
}

function isValueObject(self) {
  return satisfies(IHashable, self) && satisfies(IEquiv, self) || _IsValueObject(self);
}

const key$3 = IMapEntry.key;

const val$2 = IMapEntry.val;

function is(self, constructor) {
  return type(self) === constructor;
}

function ako(self, constructor) {
  return self instanceof constructor;
}

function keying(label, random = Math.random) {
  if (!isString(label)) {
    throw new Error("Label must be a string");
  }
  return does(hashTag(random), label ? function(Type) {
    Type[Symbol.toStringTag] = label;
  } : noop);
}

const invoke$2 = IFn.invoke;

function Reduced(value) {
  this.value = value;
}

Reduced.prototype[Symbol.toStringTag] = "Reduced";

Reduced.prototype.valueOf = function() {
  return this.value;
};

function reduced(value) {
  return new Reduced(value);
}

function get(self, key, notFound) {
  const found = ILookup.lookup(self, key);
  return found == null ? notFound == null ? null : notFound : found;
}

function getIn(self, keys, notFound) {
  const found = reduce$9(get, self, keys);
  return found == null ? notFound == null ? null : notFound : found;
}

function kin(self, other) {
  return is(other, self.constructor);
}

function equiv$d(self, other) {
  return self === other || IEquiv.equiv(self, other);
}

function alike2(self, other) {
  return alike3(self, other, Object.keys(self));
}

function alike3(self, other, keys) {
  return reduce$9((function(memo, key) {
    return memo ? equiv$d(self[key], other[key]) : reduced(memo);
  }), true, keys);
}

const alike = overload(null, null, alike2, alike3);

function equivalent() {
  function equiv(self, other) {
    return kin(self, other) && alike(self, other);
  }
  return implement(IEquiv, {
    equiv: equiv
  });
}

function eqN(...args) {
  return everyPair(equiv$d, args);
}

const eq = overload(constantly(true), constantly(true), equiv$d, eqN);

const notEq = complement(eq);

function HashMap(mapped, length, equals) {
  this.mapped = mapped;
  this.length = length;
  this.equals = equals;
}

function hashMap(xs = [], equals = equiv$d) {
  const entries = Array.from(xs);
  let map = new HashMap({}, 0, equals);
  for (const [key, value] of entries) {
    map = IAssociative.assoc(map, key, value);
  }
  return map;
}

function Multimethod(dispatch, methods, fallback) {
  this.dispatch = dispatch;
  this.methods = methods;
  this.fallback = fallback;
}

function multimethod(dispatch, fallback) {
  const behavior = new Multimethod(dispatch, hashMap(), fallback);
  const fn = partial(invoke$2, behavior);
  fn.behavior = behavior;
  return fn;
}

function key$2(self) {
  if (satisfies(IMapEntry, "key", self)) {
    return key$3(self);
  } else {
    return self;
  }
}

const coerce = multimethod((function(source, Type) {
  return [ key$2(type(source)), key$2(Type) ];
}));

var _Array, _coerce$3;

function isArray(self) {
  return is(self, Array);
}

const toArray = (_coerce$3 = coerce, _Array = Array, function coerce(_argPlaceholder) {
  return _coerce$3(_argPlaceholder, _Array);
});

function reducekv2(f, coll) {
  return IKVReducible.reducekv(coll, f, f());
}

function reducekv3(f, init, coll) {
  return IKVReducible.reducekv(coll, f, init);
}

const reducekv$7 = overload(null, null, reducekv2, reducekv3);

const ISeqable = protocol({
  seq: null
});

const seq$c = ISeqable.seq;

function first0() {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return reduced(rf(rf(memo, value)));
    }));
  };
}

const first$e = overload(first0, ISeq.first);

const rest$e = ISeq.rest;

const next = comp(seq$c, rest$e);

function assocN(self, key, value, ...args) {
  const instance = IAssociative.assoc(self, key, value);
  return args.length > 0 ? assocN(instance, ...args) : instance;
}

const assoc$7 = overload(null, null, null, IAssociative.assoc, assocN);

function assocIn(self, keys, value) {
  let key = keys[0];
  switch (keys.length) {
   case 0:
    return self;

   case 1:
    return IAssociative.assoc(self, key, value);

   default:
    return IAssociative.assoc(self, key, assocIn(get(self, key), toArray(rest$e(keys)), value));
  }
}

function dissocIn(self, keys) {
  var _k, _IMap$dissoc, _IMap;
  let key = keys[0];
  switch (keys.length) {
   case 0:
    return self;

   case 1:
    return IMap.dissoc(self, key);

   default:
    const ks = slice(keys), k = ks.pop();
    return updateIn3(self, ks, (_IMap = IMap, _IMap$dissoc = _IMap.dissoc, _k = k, function dissoc(_argPlaceholder) {
      return _IMap$dissoc.call(_IMap, _argPlaceholder, _k);
    }));
  }
}

function update3(self, key, f) {
  return IAssociative.assoc(self, key, f(get(self, key)));
}

function update4(self, key, f, a) {
  return IAssociative.assoc(self, key, f(get(self, key), a));
}

function update5(self, key, f, a, b) {
  return IAssociative.assoc(self, key, f(get(self, key), a, b));
}

function update6(self, key, f, a, b, c) {
  return IAssociative.assoc(self, key, f(get(self, key), a, b, c));
}

function updateN(self, key, f, ...xs) {
  let tgt = get(self, key), args = [ tgt, ...xs ];
  return IAssociative.assoc(self, key, f.apply(this, args));
}

const update = overload(null, null, null, update3, update4, update5, update6, updateN);

function updateIn3(self, keys, f) {
  let k = keys[0], ks = toArray(rest$e(keys));
  return ks.length ? IAssociative.assoc(self, k, updateIn3(get(self, k), ks, f)) : update3(self, k, f);
}

function updateIn4(self, keys, f, a) {
  let k = keys[0], ks = toArray(rest$e(keys));
  return ks.length ? IAssociative.assoc(self, k, updateIn4(get(self, k), ks, f, a)) : update4(self, k, f, a);
}

function updateIn5(self, keys, f, a, b) {
  let k = keys[0], ks = toArray(rest$e(keys));
  return ks.length ? IAssociative.assoc(self, k, updateIn5(get(self, k), ks, f, a, b)) : update5(self, k, f, a, b);
}

function updateIn6(self, key, f, a, b, c) {
  let k = keys[0], ks = toArray(rest$e(keys));
  return ks.length ? IAssociative.assoc(self, k, updateIn6(get(self, k), ks, f, a, b, c)) : update6(self, k, f, a, b, c);
}

function updateInN(self, keys, f) {
  return updateIn3(self, keys, (function(...xs) {
    return f.apply(null, xs);
  }));
}

const updateIn = overload(null, null, null, updateIn3, updateIn4, updateIn5, updateIn6, updateInN);

function contains3(self, key, value) {
  return IAssociative.contains(self, key) && equiv$d(get(self, key), value);
}

const contains$7 = overload(null, null, IAssociative.contains, contains3);

const rewrite = branch(IAssociative.contains, update, identity);

const prop = overload(null, (function(key) {
  return overload(null, (v => get(v, key)), (v => assoc$7(v, key, v)));
}), get, assoc$7);

function patch2(target, source) {
  return reducekv$7((function(memo, key, value) {
    return assoc$7(memo, key, typeof value === "function" ? value(get(memo, key)) : value);
  }), target, source);
}

const patch = overload(null, identity, patch2, reducing(patch2));

function merge$8(target, source) {
  return reducekv$7(assoc$7, target, source);
}

function mergeWith3(f, init, x) {
  return reducekv$7((function(memo, key, value) {
    return assoc$7(memo, key, contains$7(memo, key) ? f(get(memo, key), value) : f(value));
  }), init, x);
}

function mergeWithN(f, init, ...xs) {
  var _f, _mergeWith;
  return reduce$9((_mergeWith = mergeWith3, _f = f, function mergeWith3(_argPlaceholder, _argPlaceholder2) {
    return _mergeWith(_f, _argPlaceholder, _argPlaceholder2);
  }), init, xs);
}

const mergeWith = overload(null, null, null, mergeWith3, mergeWithN);

const IMergable = protocol({
  merge: merge$8
});

const INamable = protocol({
  name: null
});

const IOtherwise = protocol({
  otherwise: identity
});

const IPath = protocol({
  path: null
});

const IPrependable = protocol({
  prepend: null
});

const IReversible = protocol({
  reverse: null
});

const IRevertible = protocol({
  undo: null,
  redo: null,
  revert: null,
  flush: null,
  crunch: null,
  undoable: null,
  redoable: null,
  revertible: null,
  flushable: null,
  crunchable: null,
  revision: null
});

const ISequential = protocol();

const IOmissible = protocol({
  omit: null
});

const omit$3 = overload(null, identity, IOmissible.omit, reducing(IOmissible.omit));

const conj$b = overload((function() {
  return [];
}), identity, ICollection.conj, reducing(ICollection.conj));

const unconj$1 = overload(null, identity, ICollection.unconj, reducing(ICollection.unconj));

function excludes2(self, value) {
  return !IInclusive.includes(self, value);
}

function includesN(self, ...args) {
  for (let arg of args) {
    if (!IInclusive.includes(self, arg)) {
      return false;
    }
  }
  return true;
}

function excludesN(self, ...args) {
  for (let arg of args) {
    if (IInclusive.includes(self, arg)) {
      return false;
    }
  }
  return true;
}

const includes$c = overload(null, constantly(true), IInclusive.includes, includesN);

const excludes = overload(null, constantly(false), excludes2, excludesN);

const transpose = branch(IInclusive.includes, omit$3, conj$b);

function unite$1(self, value) {
  return includes$c(self, value) ? self : conj$b(self, value);
}

const ISet = protocol({
  unite: unite$1,
  disj: null
});

const ISplittable = protocol({
  split: null
});

const ITopic = protocol({
  asserts: null,
  assert: null,
  retract: null
});

function addMethod(self, key, handler) {
  const mm = self.behavior ? self.behavior : self;
  mm.methods = IAssociative.assoc(mm.methods, key, handler);
}

function method(self, ...args) {
  const mm = self.behavior ? self.behavior : self;
  const key = mm.dispatch.apply(this, args);
  return ILookup.lookup(mm.methods, key);
}

function EmptyList() {}

function emptyList() {
  return new EmptyList;
}

EmptyList.prototype[Symbol.toStringTag] = "EmptyList";

EmptyList.prototype.hashCode = function() {
  return -0;
};

const count$d = ICounted.count;

function reduce$8(self, f, init) {
  return init;
}

function append$6(self, x) {
  return [ x ];
}

const prepend$5 = append$6;

function equiv$c(xs, ys) {
  return !!satisfies(ISequential, xs) === !!satisfies(ISequential, ys) && count$d(xs) === count$d(ys) && equiv$d(first$e(xs), first$e(ys)) && equiv$d(next(xs), next(ys));
}

const iequiv = implement(IEquiv, {
  equiv: equiv$c
});

var behave$A = does(iequiv, keying("EmptyList"), implement(ISequential), implement(IPrependable, {
  prepend: prepend$5
}), implement(IAppendable, {
  append: append$6
}), implement(IReversible, {
  reverse: emptyList
}), implement(ICounted, {
  count: constantly(0)
}), implement(IOmissible, {
  omit: identity
}), implement(IEmptyableCollection, {
  empty: identity
}), implement(IInclusive, {
  includes: constantly(false)
}), implement(IKVReducible, {
  reducekv: reduce$8
}), implement(IReducible, {
  reduce: reduce$8
}), implement(ISeq, {
  first: constantly(null),
  rest: emptyList
}), implement(ISeqable, {
  seq: constantly(null)
}));

behave$A(EmptyList);

function compare$5(x, y) {
  if (x === y) {
    return 0;
  } else if (x == null) {
    return -1;
  } else if (y == null) {
    return 1;
  } else if (kin(x, y)) {
    return IComparable.compare(x, y);
  } else {
    throw new TypeError("Cannot compare different types.");
  }
}

function lt2(a, b) {
  return compare$5(a, b) < 0;
}

function ltN(...args) {
  return everyPair(lt2, args);
}

const lt = overload(constantly(false), constantly(true), lt2, ltN);

const lte2 = or(lt2, equiv$d);

function lteN(...args) {
  return everyPair(lte2, args);
}

const lte = overload(constantly(false), constantly(true), lte2, lteN);

function gt2(a, b) {
  return compare$5(a, b) > 0;
}

function gtN(...args) {
  return everyPair(gt2, args);
}

const gt = overload(constantly(false), constantly(true), gt2, gtN);

const gte2 = or(equiv$d, gt2);

function gteN(...args) {
  return everyPair(gte2, args);
}

const gte = overload(constantly(false), constantly(true), gte2, gteN);

var _, _IAddable$add, _IAddable, _2, _IAddable$add2, _IAddable2;

function directed(start, step) {
  return compare$5(IAddable.add(start, step), start);
}

function steps(Type, pred) {
  return function(start, end, step) {
    if (start == null && end == null) {
      return new Type;
    }
    if (start != null && !pred(start)) {
      throw Error(Type.name + " passed invalid start value.");
    }
    if (end != null && !pred(end)) {
      throw Error(Type.name + " passed invalid end value.");
    }
    if (start == null && end != null) {
      throw Error(Type.name + " cannot get started without a beginning.");
    }
    const direction = directed(start, step);
    if (direction === 0) {
      throw Error(Type.name + " lacks direction.");
    }
    return new Type(start, end, step, direction);
  };
}

function subtract2(self, n) {
  return IAddable.add(self, IInversive.inverse(n));
}

const subtract = overload(constantly(0), identity, subtract2, reducing(subtract2));

const add$4 = overload(constantly(0), identity, IAddable.add, reducing(IAddable.add));

const inc = overload(constantly(+1), (_IAddable = IAddable, _IAddable$add = _IAddable.add, 
_ = +1, function add(_argPlaceholder) {
  return _IAddable$add.call(_IAddable, _argPlaceholder, _);
}));

const dec = overload(constantly(-1), (_IAddable2 = IAddable, _IAddable$add2 = _IAddable2.add, 
_2 = -1, function add(_argPlaceholder2) {
  return _IAddable$add2.call(_IAddable2, _argPlaceholder2, _2);
}));

const number = constructs(Number);

const num = unary(number);

const int = parseInt;

const float = parseFloat;

function isNaN(n) {
  return n !== n;
}

function isNumber(n) {
  return is(n, Number) && !isNaN(n);
}

function isInteger(n) {
  return isNumber(n) && n % 1 === 0;
}

const isInt = isInteger;

function isFloat(n) {
  return isNumber(n) && n % 1 !== 0;
}

function modulus(n, div) {
  return n % div;
}

function min2(x, y) {
  return compare$5(x, y) < 0 ? x : y;
}

function max2(x, y) {
  return compare$5(x, y) > 0 ? x : y;
}

const min = overload(null, identity, min2, reducing(min2));

const max = overload(null, identity, max2, reducing(max2));

function isZero(x) {
  return x === 0;
}

function isPos(x) {
  return x > 0;
}

function isNeg(x) {
  return x < 0;
}

function isOdd(n) {
  return !!(n % 2);
}

const isEven = complement(isOdd);

function clamp(self, min, max) {
  return self < min ? min : self > max ? max : self;
}

function rand1(n) {
  return rand2(Math.random, n);
}

function rand2(random = Math.random, n) {
  return random() * n;
}

const rand = overload(Math.random, rand1, rand2);

function randInt1(n) {
  return randInt2(Math.random, n);
}

function randInt2(random = Math.random, n) {
  return Math.floor(random() * n);
}

const randInt = overload(null, randInt1, randInt2);

function sum(ns) {
  return reduce$9(add$4, 0, ns);
}

function least(ns) {
  return reduce$9(min, Number.POSITIVE_INFINITY, ns);
}

function most(ns) {
  return reduce$9(max, Number.NEGATIVE_INFINITY, ns);
}

function average(ns) {
  return sum(ns) / count$d(ns);
}

function measure(ns) {
  return {
    count: count$d(ns),
    sum: sum(ns),
    least: least(ns),
    most: most(ns),
    average: average(ns)
  };
}

function compare$4(self, other) {
  return self === other ? 0 : self - other;
}

function add$3(self, other) {
  return self + other;
}

function inverse$3(self) {
  return self * -1;
}

function mult$1(self, n) {
  return self * n;
}

function divide$3(self, n) {
  return self / n;
}

const clone$a = identity, start$2 = identity, end$2 = identity, hash$6 = identity;

var behave$z = does(keying("Number"), implement(ICloneable, {
  clone: clone$a
}), implement(IHashable, {
  hash: hash$6
}), implement(IDivisible, {
  divide: divide$3
}), implement(IMultipliable, {
  mult: mult$1
}), implement(IBounded, {
  start: start$2,
  end: end$2
}), implement(IComparable, {
  compare: compare$4
}), implement(IInversive, {
  inverse: inverse$3
}), implement(IAddable, {
  add: add$3
}));

const behaviors = {};

Object.assign(behaviors, {
  Number: behave$z
});

behave$z(Number);

function LazySeq(perform) {
  this.perform = perform;
}

LazySeq.prototype[Symbol.toStringTag] = "LazySeq";

function lazySeq(perform) {
  if (typeof perform !== "function") {
    throw new Error("Lazy Seq needs a thunk.");
  }
  return new LazySeq(once(perform));
}

function array(...args) {
  return args;
}

function emptyArray() {
  return [];
}

function boolean(...args) {
  return Boolean(...args);
}

const bool = boolean;

function isBoolean(self) {
  return Boolean(self) === self;
}

function not(self) {
  return !self;
}

function isTrue(self) {
  return self === true;
}

function isFalse(self) {
  return self === false;
}

function compare$3(self, other) {
  return self === other ? 0 : self === true ? 1 : -1;
}

function inverse$2(self) {
  return !self;
}

function hash$5(self) {
  return self ? 1 : 0;
}

var behave$y = does(keying("Boolean"), implement(IHashable, {
  hash: hash$5
}), implement(IComparable, {
  compare: compare$3
}), implement(IInversive, {
  inverse: inverse$2
}));

Object.assign(behaviors, {
  Boolean: behave$y
});

behave$y(Boolean);

function List(head, tail) {
  this.head = head;
  this.tail = tail;
}

function cons2(head, tail) {
  return new List(head, tail || emptyList());
}

const _consN = reducing(cons2);

function consN(...args) {
  return _consN.apply(this, args.concat([ emptyList() ]));
}

const cons = overload(emptyList, cons2, cons2, consN);

List.prototype[Symbol.toStringTag] = "List";

function list(...args) {
  return reduce$9((function(memo, value) {
    return cons(value, memo);
  }), emptyList(), args.reverse());
}

const merge$7 = overload(null, identity, IMergable.merge, reducing(IMergable.merge));

function assoc$6(self, key, value) {
  const obj = {};
  obj[key] = value;
  return obj;
}

function reduce$7(self, f, init) {
  return init;
}

function equiv$b(self, other) {
  return null == other;
}

function otherwise$4(self, other) {
  return other;
}

function conj$a(self, value) {
  return cons(value);
}

function merge$6(self, ...xs) {
  return count$d(xs) ? merge$7.apply(null, Array.from(xs)) : null;
}

function hash$4(self) {
  return 0;
}

var behave$x = does(keying("Nil"), implement(IHashable, {
  hash: hash$4
}), implement(ICloneable, {
  clone: identity
}), implement(ICompactible, {
  compact: identity
}), implement(ICollection, {
  conj: conj$a
}), implement(IMergable, {
  merge: merge$6
}), implement(IMap, {
  keys: nil,
  vals: nil,
  dissoc: nil
}), implement(IEmptyableCollection, {
  empty: identity
}), implement(IOtherwise, {
  otherwise: otherwise$4
}), implement(IEquiv, {
  equiv: equiv$b
}), implement(ILookup, {
  lookup: identity
}), implement(IInclusive, {
  includes: constantly(false)
}), implement(IAssociative, {
  assoc: assoc$6,
  contains: constantly(false)
}), implement(ISeq, {
  first: identity,
  rest: emptyList
}), implement(ISeqable, {
  seq: identity
}), implement(IIndexed, {
  nth: identity
}), implement(ICounted, {
  count: constantly(0)
}), implement(IKVReducible, {
  reducekv: reduce$7
}), implement(IReducible, {
  reduce: reduce$7
}));

behave$x(Nil);

const deref$5 = IDeref.deref;

const fmap$7 = overload(constantly(identity), IFunctor.fmap, reducing(IFunctor.fmap));

function thrushN(unit, init, ...fs) {
  return deref$5(reduce$9(IFunctor.fmap, unit(init), fs));
}

function thrush1(f) {
  return overload(null, f, partial(thrushN, f));
}

const thrush = overload(null, thrush1, thrushN);

function pipeline1(unit) {
  return partial(pipelineN, unit);
}

function pipelineN(unit, ...fs) {
  return function(init) {
    return thrush(unit, init, ...fs);
  };
}

const pipeline = overload(null, pipeline1, pipelineN);

function Nothing() {}

Nothing.prototype[Symbol.toStringTag] = "Nothing";

const nothing = new Nothing;

function Just(value) {
  this.value = value;
}

Just.prototype[Symbol.toStringTag] = "Just";

function maybe1(value) {
  return value == null ? nothing : new Just(value);
}

const maybe = thrush(maybe1);

const opt = pipeline(maybe1);

const inverse$1 = IInversive.inverse;

function Range(start, end, step, direction) {
  this.start = start;
  this.end = end;
  this.step = step;
  this.direction = direction;
}

function emptyRange() {
  return new Range;
}

function range0() {
  return range1(Number.POSITIVE_INFINITY);
}

function range1(end) {
  return range3(0, end, 1);
}

function range2(start, end) {
  return range3(start, end, 1);
}

const range3 = steps(Range, isNumber);

const range = overload(range0, range1, range2, range3);

Range.prototype[Symbol.toStringTag] = "Range";

function emptyString() {
  return "";
}

var _param$1, _upperCase, _replace;

function str1(x) {
  return x == null ? "" : x.toString();
}

function str2(x, y) {
  return str1(x) + str1(y);
}

function camelToDashed(str) {
  return str.replace(/[A-Z]/g, (x => "-" + x.toLowerCase()));
}

const startsWith = unbind(String.prototype.startsWith);

const endsWith = unbind(String.prototype.endsWith);

const replace = unbind(String.prototype.replace);

const subs = unbind(String.prototype.substring);

const lowerCase = unbind(String.prototype.toLowerCase);

const upperCase = unbind(String.prototype.toUpperCase);

const titleCase = (_replace = replace, _param$1 = /(^|\s|\.)(\S|\.)/g, _upperCase = upperCase, 
function replace(_argPlaceholder) {
  return _replace(_argPlaceholder, _param$1, _upperCase);
});

const lpad = unbind(String.prototype.padStart);

const rpad = unbind(String.prototype.padEnd);

const trim = unbind(String.prototype.trim);

const rtrim = unbind(String.prototype.trimRight);

const ltrim = unbind(String.prototype.trimLeft);

const str = overload(emptyString, str1, str2, reducing(str2));

function zeros(value, n) {
  return lpad(str(value), n, "0");
}

function spread1(f) {
  return function(args) {
    return f(...toArray(args));
  };
}

function spread2(f, idx) {
  return function(...args) {
    const out = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (i === idx) {
        out.push(...arg);
      } else {
        out.push(arg);
      }
    }
    return f(...out);
  };
}

const spread = overload(null, spread1, spread2);

function parsedo(re, xf, callback) {
  return opt(re, xf, spread(callback));
}

function realize(g) {
  return isFunction(g) ? g() : g;
}

function realized(f) {
  return function(...args) {
    return apply(f, reduce$9((function(memo, arg) {
      memo.push(realize(arg));
      return memo;
    }), [], args));
  };
}

function juxt(...fs) {
  return function(...args) {
    return reduce$9((function(memo, f) {
      return memo.concat([ f.apply(this, args) ]);
    }), [], fs);
  };
}

function apply2(f, args) {
  return f.apply(null, toArray(args));
}

function apply3(f, a, args) {
  return f.apply(null, [ a, ...toArray(args) ]);
}

function apply4(f, a, b, args) {
  return f.apply(null, [ a, b, ...toArray(args) ]);
}

function apply5(f, a, b, c, args) {
  return f.apply(null, [ a, b, c, ...toArray(args) ]);
}

function applyN(f, a, b, c, d, args) {
  return f.apply(null, [ a, b, c, d, ...toArray(args) ]);
}

const apply = overload(null, null, apply2, apply3, apply4, apply5, applyN);

function flip(f) {
  return function(b, a, ...args) {
    return f.apply(this, [ a, b, ...args ]);
  };
}

function farg(f, ...fs) {
  return function(...args) {
    for (let x = 0; x < args.length; x++) {
      const g = fs[x];
      if (g) {
        args[x] = g(args[x]);
      }
    }
    return f(...args);
  };
}

function fnil(f, ...substitutes) {
  return function(...args) {
    for (let x = 0; x < substitutes.length; x++) {
      if (isNil(args[x])) {
        args[x] = substitutes[x];
      }
    }
    return f(...args);
  };
}

function Concatenated(colls) {
  this.colls = colls;
}

Concatenated.prototype[Symbol.toStringTag] = "Concatenated";

function flat0() {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return reduce$9(memo, rf, value);
    }));
  };
}

const flatMap$2 = IFlatMappable.flatMap;

const flat$2 = overload(flat0, IFlatMappable.flat);

const cat = flat$2;

const keys$a = IMap.keys;

const vals$5 = IMap.vals;

function dissocN(obj, ...keys) {
  return reduce$9(IMap.dissoc, obj, keys);
}

const dissoc$5 = overload(null, identity, IMap.dissoc, dissocN);

const nth$6 = IIndexed.nth;

const idx$3 = IIndexed.idx;

const reverse$4 = IReversible.reverse;

function concatenated(xs) {
  const colls = filter2(seq$c, xs);
  return seq$c(colls) ? new Concatenated(colls) : emptyList();
}

const concat = overload(emptyList, seq$c, unspread(concatenated));

function map1(f) {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return rf(memo, f(value));
    }));
  };
}

function map2(f, xs) {
  return seq$c(xs) ? lazySeq((function() {
    return cons(f(first$e(xs)), map2(f, rest$e(xs)));
  })) : emptyList();
}

function map3(f, c1, c2) {
  const s1 = seq$c(c1), s2 = seq$c(c2);
  return s1 && s2 ? lazySeq((function() {
    return cons(f(first$e(s1), first$e(s2)), map3(f, rest$e(s1), rest$e(s2)));
  })) : emptyList();
}

function mapN(f, ...tail) {
  const seqs = map2(seq$c, tail);
  return notAny(isNil, seqs) ? lazySeq((function() {
    return cons(apply(f, mapa(first$e, seqs)), apply(mapN, f, mapa(rest$e, seqs)));
  })) : emptyList();
}

const map1m = multi((function(f) {
  return isFunction(f) ? map1 : hashMap;
}));

const map = overload(hashMap, map1m, map2, map3, mapN);

const mapa = comp(toArray, map);

function mapArgs(xf, f) {
  return function(...args) {
    var _xf, _maybe;
    return apply(f, args.map((_maybe = maybe, _xf = xf, function maybe(_argPlaceholder) {
      return _maybe(_argPlaceholder, _xf);
    })));
  };
}

function keyed(f, keys) {
  return reduce$9((function(memo, key) {
    return assoc$7(memo, key, f(key));
  }), {}, keys);
}

function transduce3(xform, f, coll) {
  return transduce4(xform, f, f(), coll);
}

function transduce4(xform, f, init, coll) {
  const step = xform(f);
  return step(reduce$9(step, init, coll));
}

const transduce = overload(null, null, null, transduce3, transduce4);

function into2(to, from) {
  return reduce$9(conj$b, to, from);
}

function into3(to, xform, from) {
  return transduce(xform, conj$b, to, from);
}

const into = overload(emptyArray, identity, into2, into3);

function entries2(xs, keys) {
  return seq$c(keys) ? lazySeq((function() {
    return cons([ first$e(keys), get(xs, first$e(keys)) ], entries2(xs, rest$e(keys)));
  })) : emptyList();
}

function entries1(xs) {
  return entries2(xs, keys$a(xs));
}

const entries = overload(null, entries1, entries2);

function mapkv(f, xs) {
  return map2((function([key, value]) {
    return f(key, value);
  }), entries(xs));
}

function mapvk(f, xs) {
  return map2((function([key, value]) {
    return f(value, key);
  }), entries(xs));
}

function seek(...fs) {
  return function(...args) {
    return reduce$9((function(memo, f) {
      return memo == null ? f(...args) : reduced(memo);
    }), null, fs);
  };
}

function some(f, coll) {
  let xs = seq$c(coll);
  while (xs) {
    const value = f(first$e(xs));
    if (value) {
      return value;
    }
    xs = next(xs);
  }
  return null;
}

function someFn1(p) {
  function f1(x) {
    return p(x);
  }
  function f2(x, y) {
    return p(x) || p(y);
  }
  function f3(x, y, z) {
    return p(x) || p(y) || p(z);
  }
  function fn(x, y, z, ...args) {
    return f3(x, y, z) || some(p, args);
  }
  return overload(constantly(null), f1, f2, f3, fn);
}

function someFn2(p1, p2) {
  function f1(x) {
    return p1(x) || p2(x);
  }
  function f2(x, y) {
    return p1(x) || p1(y) || p2(x) || p2(y);
  }
  function f3(x, y, z) {
    return p1(x) || p1(y) || p1(z) || p2(x) || p2(y) || p2(z);
  }
  function fn(x, y, z, ...args) {
    return f3(x, y, z) || some(or(p1, p2), args);
  }
  return overload(constantly(null), f1, f2, f3, fn);
}

function someFnN(...ps) {
  function fn(...args) {
    return some(or(...ps), args);
  }
  return overload(constantly(null), fn);
}

const someFn = overload(null, someFn1, someFn2, someFnN);

const notSome = comp(not, some);

const notAny = notSome;

function every(pred, coll) {
  let xs = seq$c(coll);
  while (xs) {
    if (!pred(first$e(xs))) {
      return false;
    }
    xs = next(xs);
  }
  return true;
}

const notEvery = comp(not, every);

function mapSome2(f, pred) {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return rf(memo, pred(value) ? f(value) : value);
    }));
  };
}

function mapSome3(f, pred, coll) {
  return map2((function(value) {
    return pred(value) ? f(value) : value;
  }), coll);
}

const mapSome = overload(null, null, mapSome2, mapSome3);

function mapcat1(f) {
  return comp(map1(f), cat());
}

function mapcat2(f, colls) {
  return concatenated(map2(f, colls));
}

const mapcat = overload(null, mapcat1, mapcat2);

function filter1(pred) {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return pred(value) ? rf(memo, value) : memo;
    }));
  };
}

function filter2(pred, xs) {
  return seq$c(xs) ? lazySeq((function() {
    let ys = xs;
    while (seq$c(ys)) {
      const head = first$e(ys), tail = rest$e(ys);
      if (pred(head)) {
        return cons(head, lazySeq((function() {
          return filter2(pred, tail);
        })));
      }
      ys = tail;
    }
    return emptyList();
  })) : emptyList();
}

const filter = overload(null, filter1, filter2);

function detect1(pred) {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return pred(value) ? reduced(rf(memo, value)) : memo;
    }));
  };
}

const detect2 = comp(first$e, filter2);

const detect = overload(null, detect1, detect2);

function detectIndex(pred, xs) {
  const found = detect2((function([idx, x]) {
    return pred(x);
  }), mapIndexed((function(idx, x) {
    return [ idx, x ];
  }), xs));
  return found ? found[0] : null;
}

function detectKey(pred, obj) {
  return reducekv$7((function(memo, key, value) {
    return pred(value) ? reduced(key) : null;
  }), null, obj);
}

function cycle(coll) {
  return seq$c(coll) ? lazySeq((function() {
    return cons(first$e(coll), concat(rest$e(coll), cycle(coll)));
  })) : emptyList();
}

function treeSeq(branch, children, root) {
  function walk(node) {
    return cons(node, branch(node) ? mapcat2(walk, children(node)) : emptyList());
  }
  return walk(root);
}

function flatten(coll) {
  return filter2(complement(satisfies(ISequential)), rest$e(treeSeq(satisfies(ISequential), seq$c, coll)));
}

function zip(...colls) {
  return mapcat2(identity, map2(seq$c, ...colls));
}

const filtera = comp(toArray, filter);

const remove1 = comp(filter1, complement);

function remove2(pred, xs) {
  return filter2(complement(pred), xs);
}

const remove = overload(null, remove1, remove2);

function keep1(f) {
  return comp(map1(f), filter1(isSome));
}

function keep2(f, xs) {
  return filter2(isSome, map2(f, xs));
}

const keep = overload(null, keep1, keep2);

function drop1(n) {
  return function(rf) {
    let dropping = n;
    return overload(rf, rf, (function(memo, value) {
      return dropping-- > 0 ? memo : rf(memo, value);
    }));
  };
}

function drop2(n, coll) {
  let i = n, xs = seq$c(coll);
  while (i > 0 && xs) {
    xs = rest$e(xs);
    i = i - 1;
  }
  return xs;
}

const drop = overload(null, drop1, drop2);

function dropWhile1(pred) {
  return function(rf) {
    let dropping = true;
    return overload(rf, rf, (function(memo, value) {
      !dropping || (dropping = pred(value));
      return dropping ? memo : rf(memo, value);
    }));
  };
}

function dropWhile2(pred, xs) {
  return seq$c(xs) ? pred(first$e(xs)) ? dropWhile(pred, rest$e(xs)) : xs : emptyList();
}

const dropWhile = overload(null, dropWhile1, dropWhile2);

function dropLast(n, coll) {
  return map3((function(x, _) {
    return x;
  }), coll, drop(n, coll));
}

function take1(n) {
  return function(rf) {
    let taking = n < 0 ? 0 : n;
    return overload(rf, rf, (function(memo, value) {
      switch (taking) {
       case 0:
        return reduced(memo);

       case 1:
        taking--;
        return reduced(rf(memo, value));

       default:
        taking--;
        return rf(memo, value);
      }
    }));
  };
}

function take2(n, coll) {
  const xs = seq$c(coll);
  return n > 0 && xs ? lazySeq((function() {
    return cons(first$e(xs), take2(n - 1, rest$e(xs)));
  })) : emptyList();
}

const take = overload(null, take1, take2);

function takeWhile1(pred) {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return pred(value) ? rf(memo, value) : reduced(memo);
    }));
  };
}

function takeWhile2(pred, xs) {
  return seq$c(xs) ? lazySeq((function() {
    const item = first$e(xs);
    return pred(item) ? cons(item, lazySeq((function() {
      return takeWhile(pred, rest$e(xs));
    }))) : emptyList();
  })) : emptyList();
}

const takeWhile = overload(null, takeWhile1, takeWhile2);

function takeNth1(n) {
  return function(rf) {
    let x = -1;
    return overload(rf, rf, (function(memo, value) {
      x++;
      return x === 0 || x % n === 0 ? rf(memo, value) : memo;
    }));
  };
}

function takeNth2(n, xs) {
  return seq$c(xs) ? lazySeq((function() {
    return cons(first$e(xs), takeNth(n, drop(n, xs)));
  })) : emptyList();
}

const takeNth = overload(null, takeNth1, takeNth2);

function takeLast(n, coll) {
  return n ? drop(count$d(coll) - n, coll) : emptyList();
}

function interleave2(xs, ys) {
  const as = seq$c(xs), bs = seq$c(ys);
  return as != null && bs != null ? cons(first$e(as), lazySeq((function() {
    return cons(first$e(bs), interleave2(rest$e(as), rest$e(bs)));
  }))) : emptyList();
}

function interleaveN(...colls) {
  return concatenated(interleaved(colls));
}

function interleaved(colls) {
  return seq$c(filter2(isNil, colls)) ? emptyList() : lazySeq((function() {
    return cons(map2(first$e, colls), interleaved(map2(next, colls)));
  }));
}

const interleave = overload(null, null, interleave2, interleaveN);

function interpose1(sep) {
  return function(rf) {
    return overload(rf, rf, (function(memo, value) {
      return rf(seq$c(memo) ? rf(memo, sep) : memo, value);
    }));
  };
}

function interpose2(sep, xs) {
  return drop2(1, interleave2(repeat1(sep), xs));
}

const interpose = overload(null, interpose1, interpose2);

function partition2(n, xs) {
  return partition3(n, n, xs);
}

function partition3(n, step, xs) {
  const coll = seq$c(xs);
  if (!coll) return xs;
  const part = take2(n, coll);
  return n === count$d(part) ? cons(part, partition3(n, step, drop(step, coll))) : emptyList();
}

function partition4(n, step, pad, xs) {
  const coll = seq$c(xs);
  if (!coll) return xs;
  const part = take2(n, coll);
  return n === count$d(part) ? cons(part, partition4(n, step, pad, drop(step, coll))) : cons(take2(n, concat(part, pad)));
}

const partition = overload(null, null, partition2, partition3, partition4);

function partitionAll1(n) {
  return partial(partitionAll, n);
}

function partitionAll2(n, xs) {
  return partitionAll3(n, n, xs);
}

function partitionAll3(n, step, xs) {
  const coll = seq$c(xs);
  if (!coll) return xs;
  return cons(take2(n, coll), partitionAll3(n, step, drop2(step, coll)));
}

const partitionAll = overload(null, partitionAll1, partitionAll2, partitionAll3);

function partitionBy(f, xs) {
  const coll = seq$c(xs);
  if (!coll) return xs;
  const head = first$e(coll), val = f(head), run = cons(head, takeWhile2((function(x) {
    return val === f(x);
  }), next(coll)));
  return cons(run, partitionBy(f, seq$c(drop(count$d(run), coll))));
}

function sift(pred, xs) {
  const sifted = groupBy(pred, xs);
  return [ sifted["true"] || null, sifted["false"] || null ];
}

function lastN1(size = 1) {
  return function(rf) {
    let prior = [];
    return overload(rf, (function(memo) {
      let acc = memo;
      for (let x of prior) {
        acc = rf(acc, x);
      }
      return rf(acc);
    }), (function(memo, value) {
      prior.push(value);
      while (prior.length > size) {
        prior.shift();
      }
      return memo;
    }));
  };
}

function lastN2(n, coll) {
  let xs = coll, ys = [];
  while (seq$c(xs)) {
    ys.push(first$e(xs));
    while (ys.length > n) {
      ys.shift();
    }
    xs = next(xs);
  }
  return ys;
}

const lastN = overload(null, lastN1, lastN2);

function last0() {
  return lastN1(1);
}

function last1(coll) {
  let xs = coll, ys = null;
  while (ys = next(xs)) {
    xs = ys;
  }
  return first$e(xs);
}

const last = overload(last0, last1);

function thin1(equiv) {
  const nil = {};
  return function(rf) {
    let last = nil;
    return overload(rf, rf, (function(memo, value) {
      const result = last !== nil && equiv(value, last) ? memo : rf(memo, value);
      last = value;
      return result;
    }));
  };
}

function thin2(equiv, coll) {
  return seq$c(coll) ? lazySeq((function() {
    let xs = seq$c(coll);
    const last = first$e(xs);
    while (next(xs) && equiv$d(first$e(next(xs)), last)) {
      xs = next(xs);
    }
    return cons(last, thin2(equiv$d, next(xs)));
  })) : coll;
}

const thin = overload(null, thin1, thin2);

function dedupe0() {
  return thin1(equiv$d);
}

function dedupe1(coll) {
  return thin2(equiv$d, coll);
}

const dedupe = overload(dedupe0, dedupe1);

function repeatedly1(f) {
  return lazySeq((function() {
    return cons(f(), repeatedly1(f));
  }));
}

function repeatedly2(n, f) {
  return take2(n, repeatedly1(f));
}

const repeatedly = overload(null, repeatedly1, repeatedly2);

function repeat1(x) {
  return repeatedly1(constantly(x));
}

function repeat2(n, x) {
  return repeatedly2(n, constantly(x));
}

const repeat = overload(null, repeat1, repeat2);

function isEmpty(coll) {
  return !seq$c(coll);
}

function notEmpty(coll) {
  return isEmpty(coll) ? null : coll;
}

function asc2(compare, f) {
  return function(a, b) {
    return compare(f(a), f(b));
  };
}

function asc1(f) {
  return asc2(compare$5, f);
}

const asc = overload(constantly(compare$5), asc1, asc2);

function desc0() {
  return function(a, b) {
    return compare$5(b, a);
  };
}

function desc2(compare, f) {
  return function(a, b) {
    return compare(f(b), f(a));
  };
}

function desc1(f) {
  return desc2(compare$5, f);
}

const desc = overload(desc0, desc1, desc2);

function sort1(coll) {
  return sort2(compare$5, coll);
}

function sort2(compare, coll) {
  return into([], coll).sort(compare);
}

function sortN(...args) {
  const compares = initial(args), coll = last(args);
  function compare(x, y) {
    return reduce$9((function(memo, compare) {
      return memo === 0 ? compare(x, y) : reduced(memo);
    }), 0, compares);
  }
  return sort2(compare, coll);
}

const sort = overload(null, sort1, sort2, sortN);

function sortBy2(keyFn, coll) {
  return sortBy3(keyFn, compare$5, coll);
}

function sortBy3(keyFn, compare, coll) {
  return sort((function(x, y) {
    return compare$5(keyFn(x), keyFn(y));
  }), coll);
}

const sortBy = overload(null, null, sortBy2, sortBy3);

function withIndex(iter) {
  return function(f, xs) {
    let idx = -1;
    return iter((function(x) {
      return f(++idx, x);
    }), xs);
  };
}

function keepIndexed1(f) {
  return comp(mapIndexed1(f), filter1(isSome));
}

function mapIndexed1(f) {
  return function(rf) {
    let idx = -1;
    return overload(rf, rf, (function(memo, value) {
      return rf(memo, f(++idx, value));
    }));
  };
}

const butlast = partial(dropLast, 1);

const initial = butlast;

const mapIndexed = overload(null, mapIndexed1, withIndex(map));

const keepIndexed = overload(null, keepIndexed1, withIndex(keep));

const splitAt = juxt(take, drop);

const splitWith = juxt(takeWhile, dropWhile);

function braid3(f, xs, ys) {
  return mapcat2((function(x) {
    return map2((function(y) {
      return f(x, y);
    }), ys);
  }), xs);
}

function braid4(f, xs, ys, zs) {
  return mapcat2((function(x) {
    return mapcat2((function(y) {
      return map2((function(z) {
        return f(x, y, z);
      }), zs);
    }), ys);
  }), xs);
}

function braidN(f, xs, ...colls) {
  if (seq$c(colls)) {
    return mapcat2((function(x) {
      return apply(braid, (function(...args) {
        return apply(f, x, args);
      }), colls);
    }), xs);
  } else {
    return map2(f, xs || []);
  }
}

const braid = overload(null, null, map, braid3, braid4, braidN);

function best1(better) {
  return function(rf) {
    return overload(rf, rf, better);
  };
}

function best2(better, xs) {
  const coll = seq$c(xs);
  return coll ? reduce$9((function(a, b) {
    return better(a, b) ? a : b;
  }), first$e(coll), rest$e(coll)) : null;
}

const best = overload(null, best1, best2);

function scan(n, xs) {
  return lazySeq((function() {
    const ys = take2(n, xs);
    return count$d(ys) === n ? cons(ys, scan(n, rest$e(xs))) : emptyList();
  }));
}

function isDistinct1(coll) {
  let seen = new Set;
  return reduce$9((function(memo, x) {
    if (memo && seen.has(x)) {
      return reduced(false);
    }
    seen.add(x);
    return memo;
  }), true, coll);
}

function isDistinctN(...xs) {
  return isDistinct1(xs);
}

const isDistinct = overload(null, constantly(true), (function(a, b) {
  return a !== b;
}), isDistinctN);

function iterate$1(f, x) {
  return lazySeq((function() {
    return cons(x, iterate$1(f, f(x)));
  }));
}

const integers = range(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1);

const positives = range(0, Number.MAX_SAFE_INTEGER, 1);

const negatives = range(-1, Number.MIN_SAFE_INTEGER, -1);

function randNth1(coll) {
  return randNth2(Math.random, coll);
}

function randNth2(random = Math.random, coll) {
  return nth$6(coll, randInt(random, count$d(coll)));
}

const randNth = overload(null, randNth1, randNth2);

const pluck = randNth;

function cond(...xs) {
  const conditions = isEven(count$d(xs)) ? xs : Array.from(concat(butlast(xs), [ constantly(true), last(xs) ]));
  return function(...args) {
    return reduce$9((function(memo, condition) {
      const pred = first$e(condition);
      return pred(...args) ? reduced(first$e(rest$e(condition))) : memo;
    }), null, partition2(2, conditions));
  };
}

function join1(xs) {
  return into("", map2(str, xs));
}

function join2(sep, xs) {
  return join1(interpose(sep, xs));
}

const join = overload(null, join1, join2);

function shuffle2(f, coll) {
  let a = Array.from(coll);
  let j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(f() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

function shuffle1(coll) {
  return shuffle2(Math.random, coll);
}

const shuffle = overload(null, shuffle1, shuffle2);

function generate(iterable) {
  let iter = iterable[Symbol.iterator]();
  return function() {
    return iter.done ? null : iter.next().value;
  };
}

function splice4(self, start, nix, coll) {
  return concat(take2(start, self), coll, drop2(start + nix, self));
}

function splice3(self, start, coll) {
  return splice4(self, start, 0, coll);
}

const splice = overload(null, null, null, splice3, splice4);

function also(f, xs) {
  return concat(xs, mapcat2((function(x) {
    const result = f(x);
    return satisfies(ISequential, result) ? result : [ result ];
  }), xs));
}

function countBy(f, coll) {
  return reduce$9((function(memo, value) {
    let by = f(value), n = memo[by];
    memo[by] = n ? inc(n) : 1;
    return memo;
  }), {}, coll);
}

function groupBy3(init, f, coll) {
  return reduce$9((function(memo, value) {
    return update(memo, f(value), (function(group) {
      return conj$b(group || [], value);
    }));
  }), init, coll);
}

function groupBy2(f, coll) {
  return groupBy3({}, f, coll);
}

const groupBy = overload(null, null, groupBy2, groupBy3);

function index4(init, key, val, coll) {
  return reduce$9((function(memo, x) {
    return assoc$7(memo, key(x), val(x));
  }), init, coll);
}

function index3(key, val, coll) {
  return index4({}, key, val, coll);
}

function index2(key, coll) {
  return index4({}, key, identity, coll);
}

const index = overload(null, null, index2, index3, index4);

function coalesce(...fs) {
  return function(...args) {
    return detect2(isSome, map2(applying(...args), fs));
  };
}

function lazyIterable1(iter) {
  return lazyIterable2(iter, emptyList());
}

function lazyIterable2(iter, done) {
  const res = iter.next();
  return res.done ? done : lazySeq((function() {
    return cons(res.value, lazyIterable1(iter));
  }));
}

const lazyIterable = overload(null, lazyIterable1, lazyIterable2);

function isReduced(self) {
  return is(self, Reduced);
}

function unreduced(self) {
  return isReduced(self) ? self.valueOf() : self;
}

function deref$4(self) {
  return self.valueOf();
}

var behave$w = does(keying("Reduced"), implement(IDeref, {
  deref: deref$4
}));

behave$w(Reduced);

function compact0() {
  return filter(identity);
}

function compact1$2(self) {
  return satisfies(ICompactible, self) ? ICompactible.compact(self) : filter(identity, self);
}

const compact$3 = overload(compact0, compact1$2);

const only = unspread(compact$3);

var _array, _mapIndexed, _identity, _map;

function blot(self) {
  return seq$c(compact$3(self)) ? self : null;
}

function blottable(self) {
  return blot(self) == null;
}

const seqIndexed = (_mapIndexed = mapIndexed, _array = array, function mapIndexed(_argPlaceholder) {
  return _mapIndexed(_array, _argPlaceholder);
});

const sequence1 = (_map = map, _identity = identity, function map(_argPlaceholder2) {
  return _map(_identity, _argPlaceholder2);
});

function sequence2(xform, coll) {
  return seq$c(coll) ? lazySeq((function() {
    const step = xform((function(memo, value) {
      return cons(value, memo);
    }));
    return step(sequence2(xform, rest$e(coll)), first$e(coll));
  })) : emptyList();
}

function sequence3(xform, ...colls) {
  return sequence2(xform, map(unspread(identity), ...colls));
}

const sequence = overload(null, sequence1, sequence2, sequence3);

function first$d(self) {
  const key = first$e(keys$a(self));
  return key ? [ key, get(self, key) ] : null;
}

function rest2(self, keys) {
  return seq$c(keys) ? lazySeq((function() {
    const key = first$e(keys);
    return cons([ key, get(self, key) ], rest2(self, next(keys)));
  })) : emptyList();
}

function rest$d(self) {
  return rest2(self, next(keys$a(self)));
}

function reduceWith(seq) {
  return function reduce(xs, f, init) {
    let memo = init, ys = seq(xs);
    while (ys && !isReduced(memo)) {
      memo = f(memo, first$e(ys));
      ys = next(ys);
    }
    return unreduced(memo);
  };
}

function reducekvWith(seq) {
  return function reducekv(xs, f, init) {
    let memo = init, ys = seq(xs);
    while (ys && !isReduced(memo)) {
      memo = f(memo, ...first$e(ys));
      ys = next(ys);
    }
    return unreduced(memo);
  };
}

const reduce$6 = reduceWith(seq$c);

const reducekv$6 = reducekvWith(seqIndexed);

const compact1$1 = partial(filter, identity);

function compact2$1(self, pred) {
  return remove(pred, self);
}

const compact$2 = overload(null, compact1$1, compact2$1);

function fmap$6(self, f) {
  return map(f, self);
}

function conj$9(self, value) {
  return cons(value, self);
}

function seq$b(self) {
  return seq$c(self.perform());
}

function iterate(self) {
  let state = self;
  return {
    next: function() {
      let result = seq$c(state) ? {
        value: first$e(state),
        done: false
      } : {
        done: true
      };
      state = next(state);
      return result;
    }
  };
}

function iterator() {
  return iterate(this);
}

function iterable(Type) {
  Type.prototype[Symbol.iterator] = iterator;
}

function find$4(coll, key) {
  return reducekv$6(coll, (function(memo, k, v) {
    return key === k ? reduced([ k, v ]) : memo;
  }), null);
}

function first$c(self) {
  return first$e(self.perform());
}

function rest$c(self) {
  return rest$e(self.perform());
}

function nth$5(self, n) {
  let xs = self, idx = 0;
  while (xs) {
    let x = first$e(xs);
    if (idx === n) {
      return x;
    }
    idx++;
    xs = next(xs);
  }
  return null;
}

function idx$2(self, x) {
  let xs = seq$c(self), n = 0;
  while (xs) {
    if (x === first$e(xs)) {
      return n;
    }
    n++;
    xs = next(xs);
  }
  return null;
}

function count$c(self) {
  return reduce$6(self, (function(memo) {
    return memo + 1;
  }), 0);
}

function append$5(self, other) {
  return concat(self, [ other ]);
}

function omit$2(self, value) {
  return remove((function(x) {
    return x === value;
  }), self);
}

function includes$b(self, value) {
  return detect((function(x) {
    return x === value;
  }), self);
}

const reverse$3 = comp(reverse$4, toArray);

const reductive = does(implement(IReducible, {
  reduce: reduce$6
}), implement(IKVReducible, {
  reducekv: reducekv$6
}));

var lazyseq = does(iterable, iequiv, reductive, keying("LazySeq"), implement(ISequential), implement(IIndexed, {
  nth: nth$5,
  idx: idx$2
}), implement(IReversible, {
  reverse: reverse$3
}), implement(ICompactible, {
  compact: compact$2
}), implement(IInclusive, {
  includes: includes$b
}), implement(IOmissible, {
  omit: omit$2
}), implement(IFunctor, {
  fmap: fmap$6
}), implement(ICollection, {
  conj: conj$9
}), implement(IAppendable, {
  append: append$5
}), implement(IPrependable, {
  prepend: conj$9
}), implement(ICounted, {
  count: count$c
}), implement(IFind, {
  find: find$4
}), implement(IEmptyableCollection, {
  empty: emptyList
}), implement(ISeq, {
  first: first$c,
  rest: rest$c
}), implement(ISeqable, {
  seq: seq$b
}));

lazyseq(LazySeq);

function IndexedSeq(seq, start) {
  this.seq = seq;
  this.start = start;
}

function indexedSeq1(seq) {
  return indexedSeq2(seq, 0);
}

function indexedSeq2(seq, start) {
  return start < count$d(seq) ? new IndexedSeq(seq, start) : emptyList();
}

const indexedSeq = overload(null, indexedSeq1, indexedSeq2);

IndexedSeq.prototype[Symbol.toStringTag] = "IndexedSeq";

function RevSeq(coll, idx) {
  this.coll = coll;
  this.idx = idx;
}

RevSeq.prototype[Symbol.toStringTag] = "RevSeq";

function revSeq(coll, idx) {
  return new RevSeq(coll, idx);
}

function hashSeq(hs) {
  return reduce$9((function(h1, h2) {
    return 3 * h1 + h2;
  }), 0, map(hash$7, hs));
}

function hashKeyed(self) {
  return reduce$9((function(memo, key) {
    return hashSeq([ memo, key, get(self, key) ]);
  }), 0, sort(keys$a(self)));
}

function reverse$2(self) {
  let c = count$b(self);
  return c > 0 ? revSeq(self, c - 1) : null;
}

function key$1(self) {
  return lookup$7(self, 0);
}

function val$1(self) {
  return lookup$7(self, 1);
}

function find$3(self, key) {
  return contains$6(self, key) ? [ key, lookup$7(self, key) ] : null;
}

function contains$6(self, key) {
  return key < count$d(self.seq) - self.start;
}

function lookup$7(self, key) {
  return get(self.seq, self.start + key);
}

function append$4(self, x) {
  return concat(self, [ x ]);
}

function prepend$4(self, x) {
  return concat([ x ], self);
}

function nth$4(self, idx) {
  return nth$6(self.seq, idx + self.start);
}

function idx2(self, x) {
  return idx3(self, x, 0);
}

function idx3(self, x, idx) {
  if (first$b(self) === x) {
    return idx;
  }
  const nxt = next(self);
  return nxt ? idx3(nxt, x, idx + 1) : null;
}

const idx$1 = overload(null, null, idx2, idx3);

function first$b(self) {
  return nth$4(self, 0);
}

function rest$b(self) {
  return indexedSeq(self.seq, self.start + 1);
}

function count$b(self) {
  return count$d(self.seq) - self.start;
}

function includes$a(self, x) {
  return detect((function(y) {
    return y === x;
  }), drop(self.start, self.seq));
}

var behave$v = does(iterable, iequiv, keying("IndexedSeq"), implement(ISequential), implement(IHashable, {
  hash: hashKeyed
}), implement(IIndexed, {
  nth: nth$4,
  idx: idx$1
}), implement(IReversible, {
  reverse: reverse$2
}), implement(IMapEntry, {
  key: key$1,
  val: val$1
}), implement(IInclusive, {
  includes: includes$a
}), implement(IFind, {
  find: find$3
}), implement(IAssociative, {
  contains: contains$6
}), implement(IAppendable, {
  append: append$4
}), implement(IPrependable, {
  prepend: prepend$4
}), implement(IEmptyableCollection, {
  empty: emptyArray
}), implement(IReducible, {
  reduce: reduce$6
}), implement(IKVReducible, {
  reducekv: reducekv$6
}), implement(IFn, {
  invoke: lookup$7
}), implement(ILookup, {
  lookup: lookup$7
}), implement(ICollection, {
  conj: append$4
}), implement(ISeq, {
  first: first$b,
  rest: rest$b
}), implement(ISeqable, {
  seq: identity
}), implement(ICounted, {
  count: count$b
}));

behave$v(IndexedSeq);

function clone$9(self) {
  return new revSeq(self.coll, self.idx);
}

function count$a(self) {
  return count$d(self.coll);
}

function keys$9(self) {
  return range(count$a(self));
}

function vals$4(self) {
  var _self, _nth;
  return map((_nth = nth$3, _self = self, function nth(_argPlaceholder) {
    return _nth(_self, _argPlaceholder);
  }), keys$9(self));
}

function nth$3(self, idx) {
  return nth$6(self.coll, count$a(self) - 1 - idx);
}

function first$a(self) {
  return nth$6(self.coll, self.idx);
}

function rest$a(self) {
  return self.idx > 0 ? revSeq(self.coll, self.idx - 1) : emptyList();
}

function conj$8(self, value) {
  return cons(value, self);
}

var behave$u = does(iterable, keying("RevSeq"), implement(ISequential), implement(ICounted, {
  count: count$a
}), implement(IIndexed, {
  nth: nth$3
}), implement(ILookup, {
  lookup: nth$3
}), implement(IMap, {
  keys: keys$9,
  vals: vals$4
}), implement(IEmptyableCollection, {
  empty: emptyList
}), implement(IReducible, {
  reduce: reduce$6
}), implement(IKVReducible, {
  reducekv: reducekv$6
}), implement(ICollection, {
  conj: conj$8
}), implement(ISeq, {
  first: first$a,
  rest: rest$a
}), implement(ISeqable, {
  seq: identity
}), implement(ICloneable, {
  clone: clone$9
}));

behave$u(RevSeq);

function clone$8(self) {
  return slice(self);
}

function _before(self, reference, inserted) {
  const pos = self.indexOf(reference);
  pos === -1 || self.splice(pos, 0, inserted);
}

function before$1(self, reference, inserted) {
  let arr = Array.from(self);
  _before(arr, reference, inserted);
  return arr;
}

function _after(self, reference, inserted) {
  const pos = self.indexOf(reference);
  pos === -1 || self.splice(pos + 1, 0, inserted);
}

function after$1(self, reference, inserted) {
  let arr = Array.from(self);
  _after(arr, reference, inserted);
  return arr;
}

function keys$8(self) {
  return range(count$9(self));
}

function _dissoc(self, idx) {
  self.splice(idx, 1);
}

function dissoc$4(self, idx) {
  let arr = Array.from(self);
  _dissoc(arr, idx);
  return arr;
}

function reduce$5(xs, f, init) {
  let memo = init, to = xs.length - 1;
  for (let i = 0; i <= to; i++) {
    if (isReduced(memo)) break;
    memo = f(memo, xs[i]);
  }
  return unreduced(memo);
}

function reducekv$5(xs, f, init) {
  let memo = init, len = xs.length;
  for (let i = 0; i < len; i++) {
    if (isReduced(memo)) break;
    memo = f(memo, i, xs[i]);
  }
  return unreduced(memo);
}

function omit$1(self, value) {
  return filtera((function(x) {
    return x !== value;
  }), self);
}

function reverse$1(self) {
  let c = count$9(self);
  return c > 0 ? revSeq(self, c - 1) : null;
}

function key(self) {
  return self[0];
}

function val(self) {
  return self[1];
}

function find$2(self, key) {
  return contains$5(self, key) ? [ key, lookup$6(self, key) ] : null;
}

function lookup$6(self, key) {
  return key in self ? self[key] : null;
}

function assoc$5(self, key, value) {
  if (key < 0 || key > count$9(self)) {
    throw new Error(`Index ${key} out of bounds`);
  }
  if (lookup$6(self, key) === value) {
    return self;
  }
  const arr = Array.from(self);
  arr.splice(key, 1, value);
  return arr;
}

function contains$5(self, key) {
  return key > -1 && key < self.length;
}

function seq$a(self) {
  return self.length ? self : null;
}

function unconj(self, x) {
  let arr = Array.from(self);
  const pos = arr.lastIndexOf(x);
  arr.splice(pos, 1);
  return arr;
}

function append$3(self, x) {
  return [ ...self, x ];
}

function prepend$3(self, x) {
  return [ x, ...self ];
}

function first$9(self) {
  return self[0];
}

function rest$9(self) {
  return indexedSeq(self, 1);
}

function includes$9(self, x) {
  return self.includes(x);
}

function add$2(self, x) {
  return includes$9(self, x) ? self : append$3(self, x);
}

function count$9(self) {
  return self.length;
}

const nth$2 = lookup$6;

function idx(self, x) {
  const n = self.indexOf(x);
  return n === -1 ? null : n;
}

function fmap$5(self, f) {
  return mapa(f, self);
}

const iindexed = does(implement(IIndexed, {
  nth: nth$2,
  idx: idx
}), implement(ICounted, {
  count: count$9
}));

function flat$1(self) {
  return self.flat();
}

function flatMap$1(self, f) {
  return self.flatMap(f);
}

var behave$t = does(iequiv, iindexed, keying("Array"), implement(ISequential), implement(IFlatMappable, {
  flatMap: flatMap$1,
  flat: flat$1
}), implement(IHashable, {
  hash: hashSeq
}), implement(IMap, {
  dissoc: dissoc$4,
  keys: keys$8,
  vals: identity
}), implement(IMergable, {
  merge: concat
}), implement(IInsertable, {
  before: before$1,
  after: after$1
}), implement(IFunctor, {
  fmap: fmap$5
}), implement(IOmissible, {
  omit: omit$1
}), implement(IReversible, {
  reverse: reverse$1
}), implement(IFind, {
  find: find$2
}), implement(IMapEntry, {
  key: key,
  val: val
}), implement(IInclusive, {
  includes: includes$9
}), implement(IAppendable, {
  append: append$3
}), implement(IPrependable, {
  prepend: prepend$3
}), implement(ICloneable, {
  clone: clone$8
}), implement(IFn, {
  invoke: lookup$6
}), implement(IEmptyableCollection, {
  empty: emptyArray
}), implement(IReducible, {
  reduce: reduce$5
}), implement(IKVReducible, {
  reducekv: reducekv$5
}), implement(ILookup, {
  lookup: lookup$6
}), implement(IAssociative, {
  assoc: assoc$5,
  contains: contains$5
}), implement(ISeqable, {
  seq: seq$a
}), implement(IAddable, {
  add: add$2
}), implement(ICollection, {
  conj: append$3,
  unconj: unconj
}), implement(ISeq, {
  first: first$9,
  rest: rest$9
}));

Object.assign(behaviors, {
  Array: behave$t
});

behave$t(Array);

function conj$7(self, x) {
  return new self.constructor(conj$b(self.colls, [ x ]));
}

function first$8(self) {
  return first$e(first$e(self.colls));
}

function rest$8(self) {
  return apply(concat, rest$e(first$e(self.colls)), rest$e(self.colls));
}

function count$8(self) {
  return reduce$6(self, (function(memo, value) {
    return memo + 1;
  }), 0);
}

var behave$s = does(iterable, iequiv, keying("Concatenated"), implement(IKVReducible, {
  reducekv: reducekv$6
}), implement(IReducible, {
  reduce: reduce$6
}), implement(IHashable, {
  hash: hashSeq
}), implement(ISequential), implement(IEmptyableCollection, {
  empty: emptyList
}), implement(ICollection, {
  conj: conj$7
}), implement(ISeq, {
  first: first$8,
  rest: rest$8
}), implement(ISeqable, {
  seq: identity
}), implement(ICounted, {
  count: count$8
}));

behave$s(Concatenated);

function date7(year, month, day, hour, minute, second, millisecond) {
  return new Date(year, month || 0, day || 1, hour || 0, minute || 0, second || 0, millisecond || 0);
}

const create = constructs(Date);

const date = overload(create, create, date7);

Date.prototype[Symbol.toStringTag] = "Date";

const clone$7 = ICloneable.clone;

function isDate(self) {
  return is(self, Date);
}

function monthDays(self) {
  return patch(self, {
    month: inc,
    day: 0
  }).getDate();
}

function weekday(self) {
  return self ? !weekend(self) : null;
}

function weekend(self) {
  const day = dow1(self);
  return day == null ? null : day == 0 || day == 6;
}

function dow1(self) {
  return self ? self.getDay() : null;
}

function dow2(self, n) {
  return self ? dow1(self) === n : null;
}

const dow = overload(null, dow1, dow2);

const year = prop("year");

const month = prop("month");

const day = prop("day");

const hour = prop("hour");

const minute = prop("minute");

const millisecond = prop("millisecond");

function quarter(self) {
  return Math.ceil((month(self) + 1) / 3);
}

function clockHour(self) {
  const h = self.getHours();
  return (h > 12 ? h - 12 : h) || 12;
}

function pm(self) {
  return self.getHours() >= 12;
}

function rdow(self, n) {
  let dt = clone$7(self);
  while (n < 0) {
    dt = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 7, dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds());
    n += 7;
  }
  if (n > 6) {
    const dys = Math.floor(n / 7) * 7;
    dt.setDate(dt.getDate() + dys);
    n = n % 7;
  }
  const offset = n - dt.getDay();
  dt.setDate(dt.getDate() + offset + (offset < 0 ? 7 : 0));
  return dt;
}

function mdow(self, n) {
  return rdow(patch(self, som()), n);
}

function time(hour, minute, second, millisecond) {
  return {
    hour: hour || 0,
    minute: minute || 0,
    second: second || 0,
    millisecond: millisecond || 0
  };
}

function sod() {
  return time(0, 0, 0, 0);
}

function eod() {
  return {
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    day: inc
  };
}

function noon() {
  return time(12, 0, 0, 0);
}

function annually(month, day) {
  return {
    month: month,
    day: day,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
  };
}

const midnight = sod;

function som() {
  return {
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
  };
}

function eom() {
  return {
    month: inc,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
  };
}

function soy() {
  return {
    month: 0,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
  };
}

function eoy() {
  return {
    year: inc,
    month: 0,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0
  };
}

function tick(n) {
  return {
    millisecond: n
  };
}

function untick() {
  return tick(dec);
}

var _Duration, _coerce$2, _mult;

const toDuration = (_coerce$2 = coerce, _Duration = Duration, function coerce(_argPlaceholder) {
  return _coerce$2(_argPlaceholder, _Duration);
});

function Duration(units) {
  this.units = units;
}

function valueOf() {
  const units = this.units;
  return (units.year || 0) * 1e3 * 60 * 60 * 24 * 365.25 + (units.month || 0) * 1e3 * 60 * 60 * 24 * 30.4375 + (units.day || 0) * 1e3 * 60 * 60 * 24 + (units.hour || 0) * 1e3 * 60 * 60 + (units.minute || 0) * 1e3 * 60 + (units.second || 0) * 1e3 + (units.millisecond || 0);
}

function unit(key) {
  return function(n) {
    return new Duration(assoc$7({}, key, n));
  };
}

const years = unit("year");

const months = unit("month");

const days = unit("day");

const hours = unit("hour");

const minutes = unit("minute");

const seconds = unit("second");

const milliseconds = unit("millisecond");

const duration = overload(null, branch(isNumber, milliseconds, constructs(Duration)), (function(start, end) {
  return milliseconds(end - start);
}));

const weeks = comp(days, (_mult = mult$2, function mult(_argPlaceholder2) {
  return _mult(_argPlaceholder2, 7);
}));

Duration.prototype[Symbol.toStringTag] = "Duration";

Duration.prototype.valueOf = valueOf;

Duration.units = [ "year", "month", "day", "hour", "minute", "second", "millisecond" ];

function reducekv$4(self, f, init) {
  return reduce$9((function(memo, key) {
    return f(memo, key, lookup$5(self, key));
  }), init, keys$7(self));
}

const merge$5 = partial(mergeWith, add$4);

function mult(self, n) {
  return fmap$4(self, (function(value) {
    return value * n;
  }));
}

function fmap$4(self, f) {
  return new self.constructor(reducekv$4(self, (function(memo, key, value) {
    return assoc$7(memo, key, f(value));
  }), {}));
}

function keys$7(self) {
  return keys$a(self.units);
}

function dissoc$3(self, key) {
  return new self.constructor(dissoc$5(self.units, key));
}

function lookup$5(self, key) {
  if (!includes$c(Duration.units, key)) {
    throw new Error("Invalid unit.");
  }
  return get(self.units, key);
}

function contains$4(self, key) {
  return contains$7(self.units, key);
}

function assoc$4(self, key, value) {
  if (!includes$c(Duration.units, key)) {
    throw new Error("Invalid unit.");
  }
  return new self.constructor(assoc$7(self.units, key, value));
}

function divide$2(a, b) {
  return a.valueOf() / b.valueOf();
}

var behave$r = does(keying("Duration"), implement(IKVReducible, {
  reducekv: reducekv$4
}), implement(IAddable, {
  add: merge$5
}), implement(IMergable, {
  merge: merge$5
}), implement(IFunctor, {
  fmap: fmap$4
}), implement(IAssociative, {
  assoc: assoc$4,
  contains: contains$4
}), implement(ILookup, {
  lookup: lookup$5
}), implement(IMap, {
  keys: keys$7,
  dissoc: dissoc$3
}), implement(IDivisible, {
  divide: divide$2
}), implement(IMultipliable, {
  mult: mult
}));

behave$r(Duration);

function add$1(self, other) {
  return mergeWith(add$4, self, isNumber(other) ? days(other) : other);
}

function lookup$4(self, key) {
  switch (key) {
   case "year":
    return self.getFullYear();

   case "month":
    return self.getMonth();

   case "day":
    return self.getDate();

   case "hour":
    return self.getHours();

   case "minute":
    return self.getMinutes();

   case "second":
    return self.getSeconds();

   case "millisecond":
    return self.getMilliseconds();
  }
}

function InvalidKeyError(key, target) {
  this.key = key;
  this.target = target;
}

function contains$3(self, key) {
  return keys$6().indexOf(key) > -1;
}

function keys$6(self) {
  return [ "year", "month", "day", "hour", "minute", "second", "millisecond" ];
}

function vals$3(self) {
  return reduce$9((function(memo, key) {
    memo.push(get(self, key));
    return memo;
  }), [], keys$6());
}

function conj$6(self, [key, value]) {
  return assoc$3(self, key, value);
}

function assoc$3(self, key, value) {
  const dt = new Date(self.valueOf());
  switch (key) {
   case "year":
    dt.setFullYear(value);
    break;

   case "month":
    dt.setMonth(value);
    break;

   case "day":
    dt.setDate(value);
    break;

   case "hour":
    dt.setHours(value);
    break;

   case "minute":
    dt.setMinutes(value);
    break;

   case "second":
    dt.setSeconds(value);
    break;

   case "millisecond":
    dt.setMilliseconds(value);
    break;

   default:
    throw new InvalidKeyError(key, self);
  }
  return dt;
}

function clone$6(self) {
  return new Date(self.valueOf());
}

function equiv$a(self, other) {
  return other != null && deref$3(self) === deref$5(other);
}

function compare$2(self, other) {
  return other == null ? -1 : deref$3(self) - deref$5(other);
}

function reduce$4(self, f, init) {
  return reduce$9((function(memo, key) {
    const value = get(self, key);
    return f(memo, [ key, value ]);
  }), init, keys$6());
}

function reducekv$3(self, f, init) {
  return reduce$4(self, (function(memo, [key, value]) {
    return f(memo, key, value);
  }), init);
}

function deref$3(self) {
  return self.valueOf();
}

function hash$3(self) {
  return self.valueOf();
}

var behave$q = does(keying("Date"), implement(IHashable, {
  hash: hash$3
}), implement(IAddable, {
  add: add$1
}), implement(IDeref, {
  deref: deref$3
}), implement(IBounded, {
  start: identity,
  end: identity
}), implement(ISeqable, {
  seq: identity
}), implement(IReducible, {
  reduce: reduce$4
}), implement(IKVReducible, {
  reducekv: reducekv$3
}), implement(IEquiv, {
  equiv: equiv$a
}), implement(IMap, {
  keys: keys$6,
  vals: vals$3
}), implement(IComparable, {
  compare: compare$2
}), implement(ICollection, {
  conj: conj$6
}), implement(IAssociative, {
  assoc: assoc$3,
  contains: contains$3
}), implement(ILookup, {
  lookup: lookup$4
}), implement(ICloneable, {
  clone: clone$6
}));

Object.assign(behaviors, {
  Date: behave$q
});

behave$q(Date);

const error = constructs(Error);

function isError(self) {
  return ako(self, Error);
}

var behave$p = keying("Error");

behave$p(Error);

Function.prototype[Symbol.toStringTag] = "Function";

function append$2(f, ...applied) {
  return function(...args) {
    return f.apply(this, args.concat(applied));
  };
}

function invoke$1(self, ...args) {
  return self.apply(null, args);
}

function name$1(self) {
  return self.name ? self.name : get(/function (.+)\s?\(/.exec(self.toString()), 1);
}

var behave$o = does(keying("Function"), implement(INamable, {
  name: name$1
}), implement(IAppendable, {
  append: append$2
}), implement(IPrependable, {
  prepend: partial
}), implement(IFn, {
  invoke: invoke$1
}));

behave$o(Function);

function GUID(id) {
  this.id = id;
}

GUID.prototype[Symbol.toStringTag] = "GUID";

GUID.prototype.toString = function() {
  return this.id;
};

function guids(random = Math.random) {
  function s4() {
    return Math.floor((1 + random()) * 65536).toString(16).substring(1);
  }
  function guid1(id) {
    return new GUID(id);
  }
  function guid0() {
    return guid1(s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
  }
  return overload(guid0, guid1);
}

const guid = guids();

function equiv$9(self, other) {
  return kin(self, other) && self.id === other.id;
}

function hash$2(self) {
  return hash$7(self.id);
}

var behave$n = does(keying("GUID"), implement(IHashable, {
  hash: hash$2
}), implement(IEquiv, {
  equiv: equiv$9
}));

behave$n(GUID);

class Chance {
  constructor(seed, hash) {
    this.seed = seed;
    this.hash = hash;
  }
  random() {
    let h = this.hash;
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    this.hash = h;
    return (h >>> 0) / 4294967296;
  }
  serialize() {
    return JSON.stringify(this);
  }
  static deserialize(serialized) {
    const {seed: seed, hash: hash} = JSON.parse(serialized);
    return chance(seed, hash);
  }
}

function chance(seed = Math.random(), hash = 1779033703 ^ seed) {
  const chance = new Chance(seed, hash);
  chance.random = chance.random.bind(chance);
  return chance;
}

function Indexed(obj) {
  this.obj = obj;
}

Indexed.prototype[Symbol.toStringTag] = "Indexed";

function indexed(obj) {
  return new Indexed(obj);
}

function count$7(self) {
  return self.obj.length;
}

function nth$1(self, idx) {
  return self.obj[idx];
}

function first$7(self) {
  return nth$1(self, 0);
}

function rest$7(self) {
  return count$7(self) > 0 ? indexedSeq(self, 1) : emptyList();
}

function seq$9(self) {
  return count$7(self) ? self : null;
}

function includes$8(self, value) {
  return !!some((function(x) {
    return x === value;
  }), self);
}

function keys$5(self) {
  return range(count$7(self));
}

var behave$m = does(iterable, reductive, keying("Indexed"), implement(IHashable, {
  hash: hashKeyed
}), implement(IMap, {
  keys: keys$5
}), implement(ISequential), implement(IInclusive, {
  includes: includes$8
}), implement(IIndexed, {
  nth: nth$1
}), implement(ILookup, {
  lookup: nth$1
}), implement(ISeq, {
  first: first$7,
  rest: rest$7
}), implement(ISeqable, {
  seq: seq$9
}), implement(ICounted, {
  count: count$7
}));

behave$m(Indexed);

function Journal(pos, max, history, state) {
  this.pos = pos;
  this.max = max;
  this.history = history;
  this.state = state;
}

Journal.prototype[Symbol.toStringTag] = "Journal";

function journal2(max, state) {
  return new Journal(0, max, [ state ], state);
}

function journal1(state) {
  return journal2(Infinity, state);
}

const journal = overload(null, journal1, journal2);

const append$1 = overload(null, identity, IAppendable.append, reducing(IAppendable.append));

const start$1 = IBounded.start;

const end$1 = IBounded.end;

function chronology(item) {
  const s = start$1(item), e = end$1(item);
  return s == null || e == null ? [ s, e ] : [ s, e ].sort(compare$5);
}

function inside(sr, er, b) {
  if (b == null) {
    return false;
  }
  if (sr == null && er == null) {
    return true;
  }
  return (sr == null || compare$5(b, sr) >= 0) && (er == null || compare$5(b, er) < 0);
}

function between(a, b) {
  const [sa, ea] = chronology(a), [sb, eb] = chronology(b);
  return inside(sa, ea, sb) && inside(sa, ea, eb);
}

function overlap(self, other) {
  const make = constructs(self.constructor), ss = start$1(self), es = end$1(self), so = start$1(other), eo = end$1(other), sn = isNil(ss) || isNil(so) ? ss || so : gt(ss, so) ? ss : so, en = isNil(es) || isNil(eo) ? es || eo : lt(es, eo) ? es : eo;
  return lte(sn, en) ? make(sn, en) : null;
}

const dispose = IDisposable.dispose;

const divide$1 = overload(null, identity, IDivisible.divide, reducing(IDivisible.divide));

const empty$4 = IEmptyableCollection.empty;

const find$1 = IFind.find;

var _noop, _IForkable$fork, _IForkable;

const fork$2 = overload(null, null, (_IForkable = IForkable, _IForkable$fork = _IForkable.fork, 
_noop = noop$1, function fork(_argPlaceholder, _argPlaceholder2) {
  return _IForkable$fork.call(_IForkable, _argPlaceholder, _noop, _argPlaceholder2);
}), IForkable.fork);

const path = IPath.path;

function downward(f) {
  return function down(self) {
    const xs = f(self), ys = mapcat(down, xs);
    return concat(xs, ys);
  };
}

function upward(f) {
  return function up(self) {
    const other = f(self);
    return other ? cons(other, up(other)) : emptyList();
  };
}

const root$1 = IHierarchy.root;

const parent = IHierarchy.parent;

const parents$1 = IHierarchy.parents;

const closest$1 = IHierarchy.closest;

const ancestors = IHierarchy.parents;

const children = IHierarchy.children;

const descendants = IHierarchy.descendants;

const nextSibling$1 = IHierarchy.nextSibling;

const prevSibling$1 = IHierarchy.prevSibling;

const nextSiblings$1 = IHierarchy.nextSiblings;

const prevSiblings$1 = IHierarchy.prevSiblings;

const siblings$1 = IHierarchy.siblings;

function leaves(self) {
  return remove(comp(count$d, children), descendants(self));
}

const identifier = IIdentifiable.identifier;

function afterN(self, ...els) {
  let ref = self;
  while (els.length) {
    let el = els.shift();
    IInsertable.after(ref, el);
    ref = el;
  }
}

const after = overload(null, identity, IInsertable.after, afterN);

function beforeN(self, ...els) {
  let ref = self;
  while (els.length) {
    let el = els.pop();
    IInsertable.before(ref, el);
    ref = el;
  }
}

const before = overload(null, identity, IInsertable.before, beforeN);

const name = INamable.name;

const otherwise$3 = IOtherwise.otherwise;

const prepend$2 = overload(null, identity, IPrependable.prepend, reducing(IPrependable.prepend, reverse$4));

const crunch$1 = IRevertible.crunch;

const crunchable$1 = IRevertible.crunchable;

const undo$1 = IRevertible.undo;

const undoable$1 = IRevertible.undoable;

const redo$1 = IRevertible.redo;

const redoable$1 = IRevertible.redoable;

const revert$1 = IRevertible.revert;

const revertible$1 = IRevertible.revertible;

const flush$1 = IRevertible.flush;

const flushable$1 = IRevertible.flushable;

const revision$1 = overload(null, (function(self) {
  return IRevertible.revision(self, self.pos);
}), IRevertible.revision);

function sequential(items) {
  return satisfies(ISequential, items) ? items : cons(items);
}

var _ISet$unite, _reduce;

const disj$2 = overload(null, identity, ISet.disj, reducing(ISet.disj));

const union2 = (_reduce = reduce$9, _ISet$unite = ISet.unite, function reduce(_argPlaceholder, _argPlaceholder2) {
  return _reduce(_ISet$unite, _argPlaceholder, _argPlaceholder2);
});

function intersection2(xs, ys) {
  return reduce$9((function(memo, x) {
    return includes$c(ys, x) ? conj$b(memo, x) : memo;
  }), empty$4(xs), xs);
}

function difference2(xs, ys) {
  return reduce$9((function(memo, x) {
    return includes$c(ys, x) ? memo : conj$b(memo, x);
  }), empty$4(xs), xs);
}

function subset(self, other) {
  var _other, _includes;
  return every((_includes = includes$c, _other = other, function includes(_argPlaceholder3) {
    return _includes(_other, _argPlaceholder3);
  }), self);
}

function superset(self, other) {
  return subset(other, self);
}

const unite = overload(null, null, ISet.unite, reducing(ISet.unite));

const union = overload(null, identity, union2, reducing(union2));

const intersection = overload(null, null, intersection2, reducing(intersection2));

const difference = overload(null, null, difference2, reducing(difference2));

const split$2 = ISplittable.split;

const assert = ITopic.assert;

const asserts = ITopic.asserts;

const retract = ITopic.retract;

function verify(self, key, value) {
  var _value, _equiv;
  return detect((_equiv = equiv$d, _value = value, function equiv(_argPlaceholder) {
    return _equiv(_argPlaceholder, _value);
  }), asserts(self, key));
}

var p$2 = Object.freeze({
  __proto__: null,
  add: add$4,
  after: after,
  ako: ako,
  alike: alike,
  ancestors: ancestors,
  append: append$1,
  assert: assert,
  asserts: asserts,
  assoc: assoc$7,
  assocIn: assocIn,
  before: before,
  between: between,
  cat: cat,
  children: children,
  clone: clone$7,
  closest: closest$1,
  compact: compact$3,
  compare: compare$5,
  conj: conj$b,
  contains: contains$7,
  count: count$d,
  crunch: crunch$1,
  crunchable: crunchable$1,
  dec: dec,
  deref: deref$5,
  descendants: descendants,
  difference: difference,
  directed: directed,
  disj: disj$2,
  dispose: dispose,
  dissoc: dissoc$5,
  dissocIn: dissocIn,
  divide: divide$1,
  downward: downward,
  empty: empty$4,
  end: end$1,
  eq: eq,
  equiv: equiv$d,
  equivalent: equivalent,
  excludes: excludes,
  find: find$1,
  first: first$e,
  flat: flat$2,
  flatMap: flatMap$2,
  flush: flush$1,
  flushable: flushable$1,
  fmap: fmap$7,
  fork: fork$2,
  get: get,
  getIn: getIn,
  gt: gt,
  gte: gte,
  hash: hash$7,
  hashTag: hashTag,
  identifier: identifier,
  idx: idx$3,
  inc: inc,
  includes: includes$c,
  inside: inside,
  intersection: intersection,
  inverse: inverse$1,
  invoke: invoke$2,
  is: is,
  isValueObject: isValueObject,
  key: key$3,
  keying: keying,
  keys: keys$a,
  kin: kin,
  leaves: leaves,
  lt: lt,
  lte: lte,
  merge: merge$7,
  mult: mult$2,
  name: name,
  next: next,
  nextSibling: nextSibling$1,
  nextSiblings: nextSiblings$1,
  notEq: notEq,
  nth: nth$6,
  omit: omit$3,
  only: only,
  otherwise: otherwise$3,
  overlap: overlap,
  parent: parent,
  parents: parents$1,
  patch: patch,
  path: path,
  pipeline: pipeline,
  prepend: prepend$2,
  prevSibling: prevSibling$1,
  prevSiblings: prevSiblings$1,
  prop: prop,
  redo: redo$1,
  redoable: redoable$1,
  reduce: reduce$9,
  reducekv: reducekv$7,
  reducekv2: reducekv2,
  reducekv3: reducekv3,
  reducing: reducing,
  rest: rest$e,
  retract: retract,
  reverse: reverse$4,
  revert: revert$1,
  revertible: revertible$1,
  revision: revision$1,
  rewrite: rewrite,
  root: root$1,
  seq: seq$c,
  sequential: sequential,
  siblings: siblings$1,
  split: split$2,
  start: start$1,
  steps: steps,
  subset: subset,
  subtract: subtract,
  superset: superset,
  thrush: thrush,
  transpose: transpose,
  unconj: unconj$1,
  undo: undo$1,
  undoable: undoable$1,
  union: union,
  unite: unite,
  update: update,
  updateIn: updateIn,
  upward: upward,
  val: val$2,
  vals: vals$5,
  verify: verify
});

function undo(self) {
  const pos = self.pos + 1;
  return undoable(self) ? new Journal(pos, self.max, self.history, self.history[pos]) : self;
}

function redo(self) {
  const pos = self.pos - 1;
  return redoable(self) ? new Journal(pos, self.max, self.history, self.history[pos]) : self;
}

function flush(self) {
  return new Journal(0, self.max, [ self.state ], self.state);
}

function flushable(self) {
  return count$d(self.history) > 1;
}

const crunchable = flushable;

function crunch(self) {
  return crunchable(self) ? new Journal(self.pos, self.max, toArray(splice(self.history, count$d(self.history) - 1, 1, [])), self.state) : self;
}

function undoable(self) {
  return self.pos + 1 < count$d(self.history);
}

function redoable(self) {
  return self.pos > 0;
}

function revert(self) {
  const at = count$d(self.history) - 1, state = nth$6(self.history, at);
  return new Journal(at, self.max, self.history, state);
}

function revertible(self) {
  return self.pos !== count$d(self.history) - 1;
}

function deref$2(self) {
  return self.state;
}

function fmap$3(self, f) {
  const revised = f(self.state);
  return new Journal(0, self.max, prepend$2(self.pos ? slice(self.history, self.pos) : self.history, revised), revised);
}

function revision(self, pos) {
  return [ self.history[pos], self.history[pos + 1] || null ];
}

var behave$l = does(keying("Journal"), implement(IDeref, {
  deref: deref$2
}), implement(IFunctor, {
  fmap: fmap$3
}), implement(IRevertible, {
  undo: undo,
  redo: redo,
  revert: revert,
  flush: flush,
  crunch: crunch,
  flushable: flushable,
  crunchable: crunchable,
  undoable: undoable,
  redoable: redoable,
  revertible: revertible,
  revision: revision
}));

behave$l(Journal);

function otherwise$2(self) {
  return self.value;
}

function flat(self) {
  return self.value instanceof Just ? self.value : self;
}

function fmap$2(self, f) {
  return maybe(f(self.value));
}

function deref$1(self) {
  return self.value;
}

var behave$k = does(keying("Just"), implement(IFunctor, {
  fmap: fmap$2
}), implement(IFlatMappable, {
  flat: flat
}), implement(IDeref, {
  deref: deref$1
}), implement(IOtherwise, {
  otherwise: otherwise$2
}));

behave$k(Just);

function first$6(self) {
  return self.head;
}

function rest$6(self) {
  return self.tail;
}

var behave$j = does(lazyseq, keying("List"), implement(IHashable, {
  hash: hashSeq
}), implement(ISeqable, {
  seq: identity
}), implement(ISeq, {
  first: first$6,
  rest: rest$6
}));

behave$j(List);

function invoke(self, ...args) {
  const key = self.dispatch.apply(this, args);
  const f = ILookup.lookup(self.methods, key) || self.fallback;
  if (!f) {
    throw new Error("Unable to locate appropriate method.");
  }
  return f.apply(this, args);
}

var behave$i = does(keying("Multimethod"), implement(IFn, {
  invoke: invoke
}));

behave$i(Multimethod);

function otherwise$1(self, other) {
  return other;
}

const deref = constantly(null);

var behave$h = does(keying("Nothing"), implement(IDeref, {
  deref: deref
}), implement(IOtherwise, {
  otherwise: otherwise$1
}), implement(IFlatMappable, {
  flatMap: identity
}), implement(IFunctor, {
  fmap: identity
}));

behave$h(Nothing);

const object = constructs(Object);

function emptyObject() {
  return {};
}

var _Object, _coerce$1;

const toObject = (_coerce$1 = coerce, _Object = Object, function coerce(_argPlaceholder) {
  return _coerce$1(_argPlaceholder, _Object);
});

function isObject(self) {
  return is(self, Object);
}

function descriptive(self) {
  return satisfies(ILookup, self) && satisfies(IMap, self) && !satisfies(IIndexed, self);
}

function where(self, other) {
  return reducekv$7((function(memo, key, value) {
    return memo ? contains$7(self, key, value) : reduced(memo);
  }), true, other);
}

const emptied = branch(satisfies(IEmptyableCollection), empty$4, emptyObject);

function juxtVals(self, value) {
  return reducekv$7((function(memo, key, f) {
    return assoc$7(memo, key, isFunction(f) ? f(value) : f);
  }), emptied(self), self);
}

function evolve(template, obj) {
  return template ? reducekv$7((function(memo, key, value) {
    const f = get(template, key);
    return assoc$7(memo, key, isFunction(f) ? f(value) : alter(f, value));
  }), emptied(obj), obj) : obj;
}

function selectKeys(self, keys) {
  return reduce$9((function(memo, key) {
    return assoc$7(memo, key, get(self, key));
  }), emptied(self), keys);
}

function removeKeys(self, keys) {
  return reducekv$7((function(memo, key, value) {
    return includes$c(keys, key) ? memo : assoc$7(memo, key, value);
  }), emptied(self), self);
}

function mapKeys(self, f) {
  return reducekv$7((function(memo, key, value) {
    return assoc$7(memo, f(key), value);
  }), emptied(self), self);
}

function mapVals2(self, f) {
  return reducekv$7((function(memo, key, value) {
    return assoc$7(memo, key, f(value));
  }), self, self);
}

function mapVals3(init, f, pred) {
  return reduce$9((function(memo, key) {
    return pred(key) ? assoc$7(memo, key, f(get(memo, key))) : memo;
  }), init, keys$a(init));
}

const mapVals = overload(null, null, mapVals2, mapVals3);

function defaults2(self, defaults) {
  return reducekv$7(assoc$7, defaults, self);
}

const defaults = overload(null, null, defaults2, reducing(defaults2));

function toFunction(self) {
  return isFunction(self) ? self : function(...args) {
    return apply(invoke$2, self, args);
  };
}

const keys$4 = Object.keys;

const vals$2 = Object.values;

function merge$4(...maps) {
  return reduce$9((function(memo, map) {
    return reduce$9((function(memo, [key, value]) {
      memo[key] = value;
      return memo;
    }), memo, seq$c(map));
  }), {}, maps);
}

function compact1(self) {
  return compact2(self, (function([_, value]) {
    return value == null;
  }));
}

function compact2(self, pred) {
  return reducekv$7((function(memo, key, value) {
    return pred([ key, value ]) ? memo : assoc$7(memo, key, value);
  }), {}, self);
}

const compact$1 = overload(null, compact1, compact2);

function omit(self, entry) {
  const key = key$3(entry);
  if (includes$c(self, entry)) {
    const result = clone$7(self);
    delete result[key];
    return result;
  } else {
    return self;
  }
}

function conj$5(self, entry) {
  const key = key$3(entry), val = val$2(entry);
  const result = clone$7(self);
  result[key] = val;
  return result;
}

function equiv$8(self, other) {
  return descriptive(other) && count$d(keys$a(self)) === count$d(keys$a(other)) && reduce$9((function(memo, key) {
    return memo ? equiv$d(get(self, key), get(other, key)) : reduced(memo);
  }), true, keys$a(self));
}

function find(self, key) {
  return contains$7(self, key) ? [ key, get(self, key) ] : null;
}

function includes$7(self, entry) {
  const key = key$3(entry), val = val$2(entry);
  return self[key] === val;
}

function lookup$3(self, key) {
  return self[key];
}

function dissoc$2(self, key) {
  if (contains$7(self, key)) {
    const result = clone$7(self);
    delete result[key];
    return result;
  } else {
    return self;
  }
}

function assoc$2(self, key, value) {
  if (get(self, key) === value) {
    return self;
  } else {
    const result = clone$7(self);
    result[key] = value;
    return result;
  }
}

function contains$2(self, key) {
  return self.hasOwnProperty(key);
}

function seq$8(self) {
  if (!count$d(self)) return null;
  return map((function(key) {
    return [ key, get(self, key) ];
  }), keys$a(self));
}

function count$6(self) {
  return keys$a(self).length;
}

function clone$5(self) {
  return Object.assign({}, self);
}

const reduce$3 = reduceWith(seq$8);

const reducekv$2 = reducekvWith(seq$8);

var behave$g = does(keying("Object"), implement(IHashable, {
  hash: hashKeyed
}), implement(IMergable, {
  merge: merge$4
}), implement(ICompactible, {
  compact: compact$1
}), implement(IEquiv, {
  equiv: equiv$8
}), implement(IFind, {
  find: find
}), implement(IOmissible, {
  omit: omit
}), implement(IInclusive, {
  includes: includes$7
}), implement(ICollection, {
  conj: conj$5
}), implement(ICloneable, {
  clone: clone$5
}), implement(IReducible, {
  reduce: reduce$3
}), implement(IKVReducible, {
  reducekv: reducekv$2
}), implement(IMap, {
  dissoc: dissoc$2,
  keys: keys$4,
  vals: vals$2
}), implement(IFn, {
  invoke: lookup$3
}), implement(ISeq, {
  first: first$d,
  rest: rest$d
}), implement(ILookup, {
  lookup: lookup$3
}), implement(IEmptyableCollection, {
  empty: emptyObject
}), implement(IAssociative, {
  assoc: assoc$2,
  contains: contains$2
}), implement(ISeqable, {
  seq: seq$8
}), implement(ICounted, {
  count: count$6
}));

Object.assign(behaviors, {
  Object: behave$g
});

behave$g(Object);

var p$1 = Object.freeze({
  __proto__: null,
  add: add$4,
  alike: alike,
  between: between,
  compare: compare$5,
  dec: dec,
  directed: directed,
  divide: divide$1,
  end: end$1,
  eq: eq,
  equiv: equiv$d,
  equivalent: equivalent,
  gt: gt,
  gte: gte,
  inc: inc,
  inside: inside,
  kin: kin,
  lt: lt,
  lte: lte,
  notEq: notEq,
  overlap: overlap,
  start: start$1,
  steps: steps,
  subtract: subtract
});

function Period(start, end) {
  this.start = start;
  this.end = end;
}

function emptyPeriod() {
  return new Period;
}

function period1(obj) {
  return period2(patch(obj, sod()), patch(obj, eod()));
}

function period2(start, end) {
  const pd = new Period(start, end == null || isDate(end) ? end : add$4(start, end));
  if (!(pd.start == null || isDate(pd.start))) {
    throw new Error("Invalid start of period.");
  }
  if (!(pd.end == null || isDate(pd.end))) {
    throw new Error("Invalid end of period.");
  }
  if (pd.start != null && pd.end != null && pd.start > pd.end) {
    throw new Error("Period bounds must be chronological.");
  }
  return pd;
}

const period = overload(emptyPeriod, period1, period2);

Period.prototype[Symbol.toStringTag] = "Period";

function seq$7(self) {
  return seq$c(mapcat((function(key) {
    var _key, _array;
    return map((_array = array, _key = key, function array(_argPlaceholder) {
      return _array(_key, _argPlaceholder);
    }), asserts(self, key));
  }), keys$a(self)));
}

function equiv$7(self, other) {
  if (self == null && other != null || self != null && other == null) {
    return false;
  }
  return self.constructor === other.constructor && count$d(self) === count$d(other) && reducekv$7((function(memo, key, value) {
    return memo ? equiv$d(get(other, key), value) : reduced(memo);
  }), true, self);
}

function construct(Type, attrs) {
  return Object.assign(new Type, attrs);
}

function emptyable(Type) {
  const empty = constantly(new Type);
  implement(IEmptyableCollection, {
    empty: empty
  }, Type);
}

function record(Type) {
  function clone(self) {
    return Object.assign(new Type, self);
  }
  function asserts(self, key) {
    return maybe(get(self, key), array);
  }
  const assert$1 = assoc$7;
  function retract3(self, key, value) {
    let copy = self;
    if (equiv$d(get(self, key), value)) {
      copy = clone$7(self);
      copy[key] = dissoc$5(self, key);
    }
    return copy;
  }
  function dissoc(self, key) {
    const copy = clone$7(self);
    delete copy[key];
    return includes$c(Object.keys(new Type), key) ? coerce(copy, Object) : copy;
  }
  const retract = overload(null, null, dissoc$5, retract3);
  const make = constructs(Type);
  addMethod(coerce, [ Object, Type ], make);
  addMethod(coerce, [ Type, Object ], (attrs => Object.assign({}, attrs)));
  doto(Type, behave$g, emptyable, keying(Type.name), implement(ICloneable, {
    clone: clone
  }), implement(ITopic, {
    asserts: asserts,
    assert: assert$1,
    retract: retract
  }), implement(IEquiv, {
    equiv: equiv$7
  }), implement(IMap, {
    dissoc: dissoc
  }), implement(ISeqable, {
    seq: seq$7
  }));
  function from(init) {
    if (isObject(init)) {
      var _Type, _construct;
      return _construct = construct, _Type = Type, function construct(_argPlaceholder2) {
        return _construct(_Type, _argPlaceholder2);
      };
    } else if (isArray(init)) {
      var _param, _construct2, _fold;
      return _fold = fold, _param = function(memo, [key, value]) {
        return assert(memo, key, value);
      }, _construct2 = construct(Type, {}), function fold(_argPlaceholder3) {
        return _fold(_param, _construct2, _argPlaceholder3);
      };
    }
    return make;
  }
  return multi(overload(null, from, constantly(make)));
}

function multirecord(Type, {defaults: defaults, multiple: multiple} = {
  defaults: constantly([]),
  multiple: constantly(true)
}) {
  const make = record(Type);
  function asserts(self, key) {
    return maybe(get(self, key), multiple(key) ? identity : array);
  }
  function assert(self, key, value) {
    return assoc$7(self, key, multiple(key) ? conj$b(get(self, key, defaults(key)), value) : value);
  }
  function retract3(self, key, value) {
    let copy = self;
    if (multiple(key)) {
      copy = clone$7(self);
      copy[key] = omit$3(get(self, key, defaults(key)), value);
    } else if (equiv$d(get(self, key), value)) {
      copy = clone$7(self);
      copy[key] = dissoc$5(self, key);
    }
    return copy;
  }
  function dissoc(self, key) {
    const copy = clone$7(self);
    delete copy[key];
    return includes$c(Object.keys(new Type), key) ? coerce(copy, Object) : copy;
  }
  const retract = overload(null, null, dissoc$5, retract3);
  doto(Type, implement(ITopic, {
    asserts: asserts,
    assert: assert,
    retract: retract
  }), implement(IMap, {
    dissoc: dissoc
  }));
  return make;
}

function Recurrence(start, end, step, direction) {
  this.start = start;
  this.end = end;
  this.step = step;
  this.direction = direction;
}

function emptyRecurrence() {
  return new Recurrence;
}

function recurrence1(obj) {
  return recurrence2(patch(obj, sod()), patch(obj, eod()));
}

function recurrence2(start, end) {
  return recurrence3(start, end, days(end == null || start <= end ? 1 : -1));
}

const recurrence3 = steps(Recurrence, isDate);

function recurrence4(start, end, step, f) {
  const pred = end == null ? constantly(true) : directed(start, end) > 0 ? function(dt) {
    return compare$5(start, dt) <= 0;
  } : directed(start, end) < 0 ? function(dt) {
    return compare$5(start, dt) >= 0;
  } : constantly(true);
  return filter(pred, f(recurrence3(start, end, step)));
}

const recurrence = overload(emptyRecurrence, recurrence1, recurrence2, recurrence3, recurrence4);

Recurrence.prototype[Symbol.toStringTag] = "Recurrence";

function split2(self, step) {
  var _step, _period;
  return map((_period = period, _step = step, function period(_argPlaceholder) {
    return _period(_argPlaceholder, _step);
  }), recurrence(start$1(self), end$1(self), step));
}

function split3$1(self, step, n) {
  return take(n, split2(self, step));
}

const split$1 = overload(null, null, split2, split3$1);

function add(self, dur) {
  var _dur, _p$add, _p;
  return end$1(self) ? new self.constructor(start$1(self), chain(self, end$1, (_p = p$1, 
  _p$add = _p.add, _dur = dur, function add(_argPlaceholder2) {
    return _p$add.call(_p, _argPlaceholder2, _dur);
  }))) : self;
}

function merge$3(self, other) {
  return other == null ? self : new self.constructor(min(start$1(self), start$1(other)), max(end$1(other), end$1(other)));
}

function divide(self, step) {
  return divide$1(coerce(self, Duration), step);
}

function start(self) {
  return self.start;
}

function end(self) {
  return self.end;
}

function includes$6(self, dt) {
  return dt != null && (self.start == null || compare$5(dt, self.start) >= 0) && (self.end == null || compare$5(dt, self.end) < 0);
}

function equiv$6(self, other) {
  return other != null && equiv$d(self.start, other.start) && equiv$d(self.end, other.end);
}

function compare$1(self, other) {
  return compare$5(other.start, self.start) || compare$5(other.end, self.end);
}

var behave$f = does(emptyable, keying("Period"), implement(ISplittable, {
  split: split$1
}), implement(IAddable, {
  add: add
}), implement(IMergable, {
  merge: merge$3
}), implement(IDivisible, {
  divide: divide
}), implement(IComparable, {
  compare: compare$1
}), implement(IInclusive, {
  includes: includes$6
}), implement(IBounded, {
  start: start,
  end: end
}), implement(IEquiv, {
  equiv: equiv$6
}));

behave$f(Period);

function Task(fork) {
  this.fork = fork;
}

Task.prototype[Symbol.toStringTag] = "Task";

function task(fork) {
  return new Task(fork);
}

function resolve(value) {
  return task((function(reject, resolve) {
    resolve(value);
  }));
}

function reject(value) {
  return task((function(reject, resolve) {
    reject(value);
  }));
}

Task.of = resolve;

Task.resolve = resolve;

Task.reject = reject;

function promise(handler) {
  return new Promise(handler);
}

function isPromise(self) {
  return is(self, Promise);
}

function tasked(promised) {
  return function(...args) {
    return task((function(reject, resolve) {
      promised(...args).then(resolve, reject);
    }));
  };
}

const fetch = tasked(globalThis.fetch);

var _Promise, _coerce;

const toPromise = (_coerce = coerce, _Promise = Promise, function coerce(_argPlaceholder) {
  return _coerce(_argPlaceholder, _Promise);
});

function awaits(f) {
  return function(...args) {
    if (detect(isPromise, args)) {
      return fmap$7(Promise.all(args), (function(args) {
        return f.apply(this, args);
      }));
    } else {
      return f.apply(this, args);
    }
  };
}

function fmap$1(self, resolve) {
  return self.then(resolve);
}

function fork$1(self, reject, resolve) {
  self.then(resolve, reject);
}

function otherwise(self, other) {
  return fmap$1(self, (function(value) {
    return value == null ? other : value;
  }));
}

function equiv$5(self, other) {
  return self === other;
}

var behave$e = does(keying("Promise"), implement(IEquiv, {
  equiv: equiv$5
}), implement(IOtherwise, {
  otherwise: otherwise
}), implement(IForkable, {
  fork: fork$1
}), implement(IFunctor, {
  fmap: fmap$1
}));

Object.assign(behaviors, {
  Promise: behave$e
});

behave$e(Promise);

function seq$6(self) {
  return equiv$d(self.start, self.end) || self.step == null && self.direction == null && self.start == null && self.end == null ? null : self;
}

function first$5(self) {
  return self.end == null ? self.start : compare$5(self.start, self.end) * self.direction < 0 ? self.start : null;
}

function rest$5(self) {
  if (!seq$6(self)) return null;
  const stepped = add$4(self.start, self.step);
  return self.end == null || compare$5(stepped, self.end) * self.direction < 0 ? new self.constructor(stepped, self.end, self.step, self.direction) : null;
}

function equiv$4(self, other) {
  return kin(self, other) ? alike(self, other) : equiv$c(self, other);
}

function inverse(self) {
  const start = self.end, end = self.start, step = inverse$1(self.step);
  return new self.constructor(start, end, step, directed(start, step));
}

function nth(self, idx) {
  return first$e(drop(idx, self));
}

function count$5(self) {
  let n = 0, xs = self;
  while (seq$c(xs)) {
    n++;
    xs = rest$e(xs);
  }
  return n;
}

function includes$5(self, value) {
  let xs = self;
  if (self.direction > 0) {
    while (seq$c(xs)) {
      let c = compare$5(first$e(xs), value);
      if (c === 0) return true;
      if (c > 0) break;
      xs = rest$e(xs);
    }
  } else {
    while (seq$c(xs)) {
      let c = compare$5(first$e(xs), value);
      if (c === 0) return true;
      if (c < 0) break;
      xs = rest$e(xs);
    }
  }
  return false;
}

var behave$d = does(iterable, emptyable, keying("Range"), implement(ISequential), implement(IInversive, {
  inverse: inverse
}), implement(IIndexed, {
  nth: nth
}), implement(ICounted, {
  count: count$5
}), implement(IInclusive, {
  includes: includes$5
}), implement(ISeqable, {
  seq: seq$6
}), implement(IReducible, {
  reduce: reduce$6
}), implement(IKVReducible, {
  reducekv: reducekv$6
}), implement(ISeq, {
  first: first$5,
  rest: rest$5
}), implement(IEquiv, {
  equiv: equiv$4
}));

behave$d(Range);

behave$d(Recurrence);

function isRegExp(self) {
  return is(self, RegExp);
}

const test = unbind(RegExp.prototype.test);

function reFind(re, s) {
  if (!isString(s)) {
    throw new TypeError("reFind must match against string.");
  }
  const matches = re.exec(s);
  if (matches) {
    return count$d(matches) === 1 ? first$e(matches) : matches;
  }
}

function reFindAll2(text, find) {
  const found = find(text);
  return found ? lazySeq((function() {
    return cons(found, reFindAll2(text, find));
  })) : emptyList();
}

function reFindAll(re, text) {
  var _re, _reFind;
  return reFindAll2(text, (_reFind = reFind, _re = re, function reFind(_argPlaceholder) {
    return _reFind(_re, _argPlaceholder);
  }));
}

function reMatches(re, s) {
  if (!isString(s)) {
    throw new TypeError("reMatches must match against string.");
  }
  const matches = re.exec(s);
  if (first$e(matches) === s) {
    return count$d(matches) === 1 ? first$e(matches) : matches;
  }
}

function reSeq(re, s) {
  return lazySeq((function() {
    const matchData = reFind(re, s), matchIdx = s.search(re), matchStr = isArray(matchData) ? first$e(matchData) : matchData, postIdx = matchIdx + max(1, count$d(matchStr)), postMatch = s.substring(postIdx);
    return matchData ? cons(matchData, reSeq(new RegExp(re.source, re.flags), postMatch)) : emptyList();
  }));
}

function rePattern(s) {
  if (isRegExp(s)) return s;
  if (!isString(s)) throw new TypeError("rePattern is derived from a string.");
  const found = reFind(/^\(\?([idmsux]*)\)/, s), prefix = get(found, 0), flags = get(found, 1), pattern = s.substring(count$d(prefix));
  return new RegExp(pattern, flags || "");
}

const reGroups = comp(blot, toArray, rest$e, reFind);

var behave$c = keying("RegExp");

behave$c(RegExp);

function seq$5(self) {
  return seq$c(self.items);
}

function first$4(self) {
  return first$e(self.items);
}

function rest$4(self) {
  const items = next(self.items);
  return items ? Object.assign(clone$7(self), {
    items: items
  }) : empty$3(self);
}

function append(self, other) {
  return Object.assign(clone$7(self), {
    items: append$1(self.items, other)
  });
}

function prepend$1(self, other) {
  return Object.assign(clone$7(self), {
    items: prepend$2(self.items, other)
  });
}

function includes$4(self, name) {
  return includes$c(self.items, name);
}

function count$4(self) {
  return count$d(self.items);
}

function empty$3(self) {
  return clone$7(self, {
    items: []
  });
}

function reduce$2(self, f, init) {
  return reduce$9(f, init, self.items);
}

var behave$b = does(iterable, keying("Series"), implement(ISequential), implement(ICounted, {
  count: count$4
}), implement(IInclusive, {
  includes: includes$4
}), implement(IAppendable, {
  append: append
}), implement(IPrependable, {
  prepend: prepend$1
}), implement(IEmptyableCollection, {
  empty: empty$3
}), implement(ISeqable, {
  seq: seq$5
}), implement(IReducible, {
  reduce: reduce$2
}), implement(ISeq, {
  first: first$4,
  rest: rest$4
}));

const series = behave$b;

function seq$4(self) {
  return count$3(self) ? self : null;
}

function empty$2(self) {
  return new self.constructor([]);
}

function disj$1(self, value) {
  const s = clone$4(self);
  s.delete(value);
  return s;
}

function includes$3(self, value) {
  return self.has(value);
}

function conj$4(self, value) {
  const s = clone$4(self);
  s.add(value);
  return s;
}

function first$3(self) {
  return self.values().next().value;
}

function rest$3(self) {
  const iter = self.values();
  iter.next();
  return lazyIterable(iter);
}

function count$3(self) {
  return self.size;
}

function clone$4(self) {
  return new self.constructor(Array.from(self));
}

function merge$2(self, other) {
  return new self.constructor([ ...self, ...other ]);
}

function equiv$3(self, other) {
  return count$3(self) === count$d(other) && reduce$6(self, (function(memo, value) {
    return memo && includes$c(other, value) ? true : reduced(false);
  }), true);
}

var behave$a = does(keying("Set"), implement(ISequential), implement(IEquiv, {
  equiv: equiv$3
}), implement(IMergable, {
  merge: merge$2
}), implement(IHashable, {
  hash: hashSeq
}), implement(IReducible, {
  reduce: reduce$6
}), implement(IKVReducible, {
  reducekv: reducekv$6
}), implement(ISeqable, {
  seq: seq$4
}), implement(IInclusive, {
  includes: includes$3
}), implement(ICloneable, {
  clone: clone$4
}), implement(ICounted, {
  count: count$3
}), implement(ISeq, {
  first: first$3,
  rest: rest$3
}), implement(IEmptyableCollection, {
  empty: empty$2
}), implement(ICollection, {
  conj: conj$4
}), implement(ISet, {
  disj: disj$1
}));

Object.assign(behaviors, {
  Set: behave$a
});

behave$a(Set);

function seq$3(self) {
  return lazyIterable(self.entries());
}

function keys$3(self) {
  return lazyIterable(self.keys());
}

function vals$1(self) {
  return lazyIterable(self.values());
}

function clone$3(self) {
  return new self.constructor(self);
}

function contains$1(self, key) {
  return self.has(key);
}

function conj$3(self, [key, value]) {
  return assoc$1(self, key, value);
}

function assoc$1(self, key, value) {
  const other = clone$3(self);
  other.set(key, value);
  return other;
}

function dissoc$1(self, key) {
  const other = clone$3(self);
  other.delete(key);
  return other;
}

function lookup$2(self, key) {
  return self.get(key);
}

function count$2(self) {
  return self.size;
}

const reduce$1 = reduceWith(seq$3);

const reducekv$1 = reducekvWith(seq$3);

var behave$9 = does(keying("Map"), implement(ICounted, {
  count: count$2
}), implement(ICollection, {
  conj: conj$3
}), implement(ILookup, {
  lookup: lookup$2
}), implement(IAssociative, {
  contains: contains$1,
  assoc: assoc$1
}), implement(ISeqable, {
  seq: seq$3
}), implement(ISeq, {
  first: first$d,
  rest: rest$d
}), implement(IReducible, {
  reduce: reduce$1
}), implement(IKVReducible, {
  reducekv: reducekv$1
}), implement(IMap, {
  dissoc: dissoc$1,
  keys: keys$3,
  vals: vals$1
}));

Object.assign(behaviors, {
  Map: behave$9
});

behave$9(Map);

var p = Object.freeze({
  __proto__: null,
  assoc: assoc$7,
  assocIn: assocIn,
  clone: clone$7,
  conj: conj$b,
  contains: contains$7,
  count: count$d,
  dissoc: dissoc$5,
  dissocIn: dissocIn,
  excludes: excludes,
  first: first$e,
  get: get,
  getIn: getIn,
  includes: includes$c,
  keys: keys$a,
  next: next,
  patch: patch,
  prop: prop,
  rest: rest$e,
  rewrite: rewrite,
  seq: seq$c,
  transpose: transpose,
  unconj: unconj$1,
  update: update,
  updateIn: updateIn,
  vals: vals$5
});

function getHashIndex(self, key) {
  const h = hash$7(key);
  const candidates = self.mapped[h] || null;
  const idx = detectIndex((function([k, v]) {
    return self.equals(key, k);
  }), candidates);
  return {
    h: h,
    idx: idx,
    candidates: candidates
  };
}

function clone$2(self) {
  return new HashMap(clone$7(self.mapped), self.length, self.equals);
}

const empty$1 = constantly(hashMap());

function conj$2(self, [key, value]) {
  return assoc(self, key, value);
}

function assoc(self, key, value) {
  var _param, _p$conj, _p;
  const {h: h, idx: idx, candidates: candidates} = getHashIndex(self, key);
  const mapped = !candidates ? assoc$7(self.mapped, h, [ [ key, value ] ]) : idx == null ? update(self.mapped, h, (_p = p, 
  _p$conj = _p.conj, _param = [ key, value ], function conj(_argPlaceholder) {
    return _p$conj.call(_p, _argPlaceholder, _param);
  })) : assocIn(self.mapped, [ h, idx ], [ key, value ]);
  const length = idx == null ? self.length + 1 : self.length;
  return new HashMap(mapped, length, self.equals);
}

function lookup$1(self, key) {
  const {h: h, idx: idx} = getHashIndex(self, key);
  return idx == null ? null : getIn(self.mapped, [ h, idx, 1 ]);
}

function count$1(self) {
  return self.length;
}

function dissoc(self, key) {
  const {h: h, idx: idx, candidates: candidates} = getHashIndex(self, key);
  if (idx == null) {
    return self;
  }
  if (count$d(candidates) === 1) {
    return new HashMap(dissoc$5(self.mapped, h), self.length - 1, self.equals);
  }
  return new HashMap(assoc$7(self.mapped, h, filtera((function([k, v]) {
    return !self.equals(key, k);
  }), candidates)), self.length - 1, self.equals);
}

function keys$2(self) {
  var _param2, _map;
  return mapcat((_map = map, _param2 = ([key, _]) => key, function map(_argPlaceholder2) {
    return _map(_param2, _argPlaceholder2);
  }), vals$5(self.mapped));
}

function vals(self) {
  var _param3, _map2;
  return mapcat((_map2 = map, _param3 = ([_, val]) => val, function map(_argPlaceholder3) {
    return _map2(_param3, _argPlaceholder3);
  }), vals$5(self.mapped));
}

function contains(self, key) {
  const {idx: idx} = getHashIndex(self, key);
  return idx != null;
}

function includes$2(self, [key, val]) {
  return contains(self, key) && self.equals(val, lookup$1(self, key));
}

function seq$2(self) {
  return self.length > 0 ? mapcat(identity, vals$5(self.mapped)) : null;
}

function equiv$2(self, other) {
  return count$1(self) === count$d(other) && reduce(self, (function(memo, pair) {
    return memo && includes$c(other, pair) ? true : reduced(false);
  }), true);
}

function first$2(self) {
  return first$e(seq$2(self));
}

function rest$2(self) {
  return rest$e(seq$2(self));
}

function merge$1(self, other) {
  return into(self, other);
}

const reduce = reduceWith(seq$2);

const reducekv = reducekvWith(seq$2);

var behave$8 = does(keying("HashMap"), implement(IMergable, {
  merge: merge$1
}), implement(ICollection, {
  conj: conj$2
}), implement(IEmptyableCollection, {
  empty: empty$1
}), implement(IEquiv, {
  equiv: equiv$2
}), implement(IReducible, {
  reduce: reduce
}), implement(IKVReducible, {
  reducekv: reducekv
}), implement(ICloneable, {
  clone: clone$2
}), implement(IInclusive, {
  includes: includes$2
}), implement(ISeq, {
  first: first$2,
  rest: rest$2
}), implement(ISeqable, {
  seq: seq$2
}), implement(ILookup, {
  lookup: lookup$1
}), implement(IAssociative, {
  assoc: assoc,
  contains: contains
}), implement(IMap, {
  dissoc: dissoc,
  keys: keys$2,
  vals: vals
}), implement(ICounted, {
  count: count$1
}));

behave$8(HashMap);

function HashSet(coll) {
  this.coll = coll;
}

function hashSet(xs = [], equals = equiv$d) {
  const ys = Array.from(xs);
  const set = new HashSet(hashMap([], equals));
  return ys.length ? conj$b(set, ...ys) : set;
}

const set = hashSet;

function clone$1(self) {
  return new HashSet(clone$7(self.coll));
}

const empty = constantly(hashSet());

function disj(self, value) {
  return includes$1(self, value) ? new HashSet(dissoc$5(self.coll, value)) : self;
}

function includes$1(self, value) {
  return contains$7(self.coll, value);
}

function conj$1(self, value) {
  return includes$1(self, value) ? self : new HashSet(assoc$7(self.coll, value, value));
}

function count(self) {
  return count$d(self.coll);
}

function seq$1(self) {
  return count$d(self.coll) ? map(first$e, seq$c(self.coll)) : null;
}

function equiv$1(self, other) {
  return count(self) === count$d(other) && reduce$6(self, (function(memo, value) {
    return memo && includes$c(other, value) ? true : reduced(false);
  }), true);
}

function first$1(self) {
  return first$e(seq$1(self));
}

function rest$1(self) {
  return rest$e(seq$1(self));
}

function merge(self, other) {
  return into(self, other);
}

var behave$7 = does(iterable, reductive, keying("HashSet"), implement(IMergable, {
  merge: merge
}), implement(ICollection, {
  conj: conj$1
}), implement(ISet, {
  disj: disj
}), implement(IEquiv, {
  equiv: equiv$1
}), implement(IInclusive, {
  includes: includes$1
}), implement(IReducible, {
  reduce: reduce$6
}), implement(IKVReducible, {
  reducekv: reducekv$6
}), implement(IEmptyableCollection, {
  empty: empty
}), implement(ICloneable, {
  clone: clone$1
}), implement(ISeq, {
  first: first$1,
  rest: rest$1
}), implement(ISeqable, {
  seq: seq$1
}), implement(ICounted, {
  count: count
}));

behave$7(HashSet);

var behave$6 = does(behave$9, keying("WeakMap"));

Object.assign(behaviors, {
  WeakMap: behave$6
});

behave$6(WeakMap);

var behave$5 = does(behave$a, keying("WeakSet"));

Object.assign(behaviors, {
  WeakSet: behave$5
});

behave$5(WeakSet);

var behave$4 = keying("Symbol");

Object.assign(behaviors, {
  Symbol: behave$4
});

behave$4(Symbol);

const clone = identity;

function compact(str) {
  return str.trim();
}

function split1(str) {
  return str.split("");
}

function split3(str, pattern, n) {
  const parts = [];
  while (str && n !== 0) {
    let found = str.match(pattern);
    if (!found || n < 2) {
      parts.push(str);
      break;
    }
    let pos = str.indexOf(found), part = str.substring(0, pos);
    parts.push(part);
    str = str.substring(pos + found.length);
    n = n ? n - 1 : n;
  }
  return parts;
}

const split = overload(null, split1, unbind(String.prototype.split), split3);

function compare(self, other) {
  return self === other ? 0 : self > other ? 1 : -1;
}

function conj(self, other) {
  return self + other;
}

function seq2(self, idx) {
  return idx < self.length ? lazySeq((function() {
    return cons(self[idx], seq2(self, idx + 1));
  })) : null;
}

function seq(self) {
  return seq2(self, 0);
}

function lookup(self, key) {
  return self[key];
}

function first(self) {
  return self[0] || null;
}

function rest(self) {
  return self.substring(1) || "";
}

function prepend(self, head) {
  return head + self;
}

function includes(self, str) {
  return self.includes(str);
}

function hash$1(self) {
  var hash = 0, i, chr;
  if (self.length === 0) return hash;
  for (i = 0; i < self.length; i++) {
    chr = self.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

var behave$3 = does(iindexed, keying("String"), implement(ICompactible, {
  compact: compact
}), implement(ICloneable, {
  clone: clone
}), implement(IHashable, {
  hash: hash$1
}), implement(ISplittable, {
  split: split
}), implement(ICollection, {
  conj: conj
}), implement(IReducible, {
  reduce: reduce$6
}), implement(IKVReducible, {
  reducekv: reducekv$6
}), implement(IComparable, {
  compare: compare
}), implement(IInclusive, {
  includes: includes
}), implement(IAppendable, {
  append: conj
}), implement(IPrependable, {
  prepend: prepend
}), implement(IEmptyableCollection, {
  empty: emptyString
}), implement(IFn, {
  invoke: lookup
}), implement(IIndexed, {
  nth: lookup
}), implement(ILookup, {
  lookup: lookup
}), implement(ISeqable, {
  seq: seq
}), implement(ISeq, {
  first: first,
  rest: rest
}));

Object.assign(behaviors, {
  String: behave$3
});

behave$3(String);

function fmap(self, f) {
  return task((function(reject, resolve) {
    self.fork(reject, comp(resolve, f));
  }));
}

function flatMap(self, f) {
  return task((function(reject, resolve) {
    self.fork(reject, (function(value) {
      fork$2(f(value), reject, resolve);
    }));
  }));
}

function fork(self, reject, resolve) {
  self.fork(reject, resolve);
}

var behave$2 = does(keying("Task"), implement(IFlatMappable, {
  flatMap: flatMap
}), implement(IForkable, {
  fork: fork
}), implement(IFunctor, {
  fmap: fmap
}));

behave$2(Task);

function uident(len, random = Math.random) {
  return join("", repeatedly(len, partial(pluck, random, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")));
}

function UID(id, context) {
  this.id = id;
  this.context = context;
}

UID.prototype[Symbol.toStringTag] = "UID";

UID.prototype.toString = function() {
  return this.id;
};

function uids(len, random = Math.random) {
  function uid0() {
    return uid2(uident(len, random));
  }
  function uid2(id, context = null) {
    return new UID(id, context);
  }
  return overload(uid0, uid2, uid2);
}

const uid = uids(5);

function equiv(self, other) {
  return equiv$d(self.id, other.id) && equiv$d(self.context, other.context);
}

function hash(self) {
  return hash$7(self.id + "/" + (self.context || ""));
}

var behave$1 = does(implement(IEquiv, {
  equiv: equiv
}), implement(IHashable, {
  hash: hash
}), keying("UID"));

behave$1(UID);

function keys$1(self) {
  return self.keys();
}

var iprotocol = does(implement(IMap, {
  keys: keys$1
}));

var _behaviors, _behaves, _param, _test, _days, _recurs, _ISeq, _satisfies, _join, _str, _param2, _into, _set, _into2, _param3, _into3, _param4, _into4, _p$split, _p7;

iprotocol(Protocol);

const behave = (_behaves = behaves, _behaviors = behaviors, function behaves(_argPlaceholder) {
  return _behaves(_behaviors, _argPlaceholder);
});

const numeric = (_test = test, _param = /^\d+$/i, function test(_argPlaceholder2) {
  return _test(_param, _argPlaceholder2);
});

(function() {
  function fillProp(obj, key, value) {
    if (!obj.hasOwnProperty(key)) {
      Object.defineProperty(obj, key, {
        value: value,
        writable: true,
        enumerable: false,
        configurable: true
      });
    }
  }
  function equals(other) {
    return equiv$d(this, other);
  }
  fillProp(Object.prototype, "equals", equals);
})();

function siblings(self) {
  const parent$1 = parent(self);
  if (parent$1) {
    return filter((function(sibling) {
      return sibling !== self;
    }), children(parent$1));
  } else {
    return emptyList();
  }
}

function prevSiblings(self) {
  return reverse(takeWhile((function(sibling) {
    return sibling !== self;
  }), siblings(self)));
}

function nextSiblings(self) {
  return rest$e(dropWhile((function(sibling) {
    return sibling !== self;
  }), siblings(self)));
}

const prevSibling = comp(first$e, prevSiblings$1);

const nextSibling = comp(first$e, nextSiblings$1);

const parents = upward(parent);

const root = comp(last, parents);

function closest(self, pred) {
  return detect(pred, cons(self, parents$1(self)));
}

extend(IHierarchy, {
  siblings: siblings,
  prevSibling: prevSibling,
  nextSibling: nextSibling,
  prevSiblings: prevSiblings,
  nextSiblings: nextSiblings,
  parents: parents,
  closest: closest,
  root: root
});

function recurs2(pd, step) {
  return recurrence(start$1(pd), end$1(pd), step);
}

const recurs = overload(null, (_recurs = recurs2, _days = days(1), function recurs2(_argPlaceholder3) {
  return _recurs(_argPlaceholder3, _days);
}), recurs2);

function inclusive(self) {
  return new self.constructor(self.start, add$4(self.end, self.step), self.step, self.direction);
}

function cleanlyN(f, ...args) {
  try {
    return f(...args);
  } catch {
    return null;
  }
}

const cleanly = overload(null, curry(cleanlyN, 2), cleanlyN);

function deconstruct(dur, ...units) {
  let memo = dur;
  return mapa((function(unit) {
    const n = fmap$7(divide$1(memo, unit), Math.floor);
    memo = subtract(memo, fmap$7(unit, constantly(n)));
    return n;
  }), units);
}

function distinctly(equals) {
  var _equals, _hashSet;
  function distinct0() {
    return function(rf) {
      let seen = hashSet([], equals);
      return overload(rf, rf, (function(memo, value) {
        if (includes$c(seen, value)) {
          return memo;
        }
        seen = conj$b(seen, value);
        return rf(memo, value);
      }));
    };
  }
  const distinct1 = (_hashSet = hashSet, _equals = equals, function hashSet(_argPlaceholder4) {
    return _hashSet(_argPlaceholder4, _equals);
  });
  return overload(distinct0, distinct1);
}

const distinct = distinctly(equiv$d);

const unique = distinct;

const second = branch((_satisfies = satisfies, _ISeq = ISeq, function satisfies(_argPlaceholder5) {
  return _satisfies(_ISeq, _argPlaceholder5);
}), comp(ISeq.first, ISeq.rest), prop("second"));

function expands(f) {
  function expand(...contents) {
    return detect(isFunction, contents) ? postpone(...contents) : f(...contents);
  }
  function postpone(...contents) {
    return function(value) {
      const expanded = map((function(content) {
        return isFunction(content) ? content(value) : content;
      }), contents);
      return apply(expand, expanded);
    };
  }
  return expand;
}

function filled2(f, g) {
  return function(...args) {
    return seq$c(filter(isNil, args)) ? g(...args) : f(...args);
  };
}

function filled1(f) {
  return filled2(f, noop$1);
}

const filled = overload(null, filled1, filled2);

function elapsed(self) {
  return duration(end$1(self) - start$1(self));
}

function collapse(...args) {
  return some(blottable, args) ? "" : join("", args);
}

function impartable(f) {
  return isFunction(f) && !/^[A-Z]./.test(name(f));
}

function impart2(source, f) {
  return decorating3(source, impartable, f);
}

function impart3(target, source, f) {
  return decorating4(target, source, impartable, f);
}

const impart = overload(null, null, impart2, impart3);

function decorating2(source, f) {
  return decorating3(source, identity, f);
}

function decorating3(source, pred, f) {
  return decorating4({}, source, pred, f);
}

function decorating4(target, source, pred, f) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = pred(value, key) ? f(value) : value;
  }
  return target;
}

const decorating = overload(null, null, decorating2, decorating3, decorating4);

function include2(self, value) {
  var _value, _p$conj, _p, _value2, _p$omit, _p2, _value3, _p$includes, _p3;
  return toggles((_p = p$2, _p$conj = _p.conj, _value = value, function conj(_argPlaceholder6) {
    return _p$conj.call(_p, _argPlaceholder6, _value);
  }), (_p2 = p$2, _p$omit = _p2.omit, _value2 = value, function omit(_argPlaceholder7) {
    return _p$omit.call(_p2, _argPlaceholder7, _value2);
  }), (_p3 = p$2, _p$includes = _p3.includes, _value3 = value, function includes(_argPlaceholder8) {
    return _p$includes.call(_p3, _argPlaceholder8, _value3);
  }), self);
}

function include3(self, value, want) {
  var _value4, _p$conj2, _p4, _value5, _p$omit2, _p5, _value6, _p$includes2, _p6;
  return toggles((_p4 = p$2, _p$conj2 = _p4.conj, _value4 = value, function conj(_argPlaceholder9) {
    return _p$conj2.call(_p4, _argPlaceholder9, _value4);
  }), (_p5 = p$2, _p$omit2 = _p5.omit, _value5 = value, function omit(_argPlaceholder10) {
    return _p$omit2.call(_p5, _argPlaceholder10, _value5);
  }), (_p6 = p$2, _p$includes2 = _p6.includes, _value6 = value, function includes(_argPlaceholder11) {
    return _p$includes2.call(_p6, _argPlaceholder11, _value6);
  }), self, want);
}

const include = overload(null, null, include2, include3);

const inventory = pipe(Object.keys, (_join = join, function join(_argPlaceholder12) {
  return _join(",\n", _argPlaceholder12);
}), (_str = str, function str(_argPlaceholder13) {
  return _str("{\n", _argPlaceholder13, "\n}");
}));

const fmt = expands(str);

function when(pred, ...xs) {
  return last(map(realize, pred ? xs : null));
}

function scanKey1(better) {
  return partial(scanKey, better);
}

function scanKey3(better, k, x) {
  return x;
}

function scanKey4(better, k, x, y) {
  return better(k(x), k(y)) ? x : y;
}

function scanKeyN(better, k, x, ...args) {
  return apply(reduce$9, partial(scanKey3, better), x, args);
}

const scanKey = overload(null, scanKey1, null, scanKey3, scanKey4, scanKeyN);

const maxKey = scanKey(gt);

const minKey = scanKey(lt);

function absorb2(tgt, src) {
  return reducekv$7((function(memo, key, value) {
    const was = get(memo, key);
    let absorbed;
    if (was == null) {
      absorbed = value;
    } else if (descriptive(value)) {
      absorbed = into(empty$4(was), absorb2(was, value));
    } else if (satisfies(ISequential, value)) {
      absorbed = into(empty$4(was), concat(was, value));
    } else {
      absorbed = value;
    }
    return assoc$7(memo, key, absorbed);
  }), tgt, src || empty$4(tgt));
}

const absorb = overload(constantly({}), identity, absorb2, reducing(absorb2));

function attempt(f, ...args) {
  return Promise.all(args).then((function(args) {
    try {
      return Promise.resolve(f(...args));
    } catch (ex) {
      return Promise.reject(ex);
    }
  }));
}

function unfork(self) {
  return new Promise((function(resolve, reject) {
    fork$2(self, reject, resolve);
  }));
}

addMethod(coerce, [ HashSet, Array ], (_into = into, _param2 = [], function into(_argPlaceholder14) {
  return _into(_param2, _argPlaceholder14);
}));

addMethod(coerce, [ Set, Array ], unary(Array.from));

addMethod(coerce, [ Array, HashSet ], (_into2 = into, _set = set([]), function into(_argPlaceholder15) {
  return _into2(_set, _argPlaceholder15);
}));

addMethod(coerce, [ Array, Set ], (arr => new Set(arr)));

addMethod(coerce, [ Number, String ], unary(str));

addMethod(coerce, [ Number, Date ], unary(date));

addMethod(coerce, [ Duration, Duration ], identity);

addMethod(coerce, [ Period, Duration ], (function(self) {
  return self.end == null || self.start == null ? duration(Number.POSITIVE_INFINITY) : duration(self.end - self.start);
}));

addMethod(coerce, [ Promise, Promise ], identity);

addMethod(coerce, [ Error, Promise ], unfork);

addMethod(coerce, [ Task, Promise ], unfork);

addMethod(coerce, [ Object, Object ], identity);

addMethod(coerce, [ Array, Object ], (_into3 = into, _param3 = {}, function into(_argPlaceholder16) {
  return _into3(_param3, _argPlaceholder16);
}));

addMethod(coerce, [ Array, Array ], identity);

addMethod(coerce, [ Concatenated, Array ], unary(Array.from));

addMethod(coerce, [ EmptyList, Array ], emptyArray);

addMethod(coerce, [ List, Array ], unary(Array.from));

addMethod(coerce, [ Array, List ], unary(spread(list)));

addMethod(coerce, [ Range, Array ], unary(Array.from));

addMethod(coerce, [ Nil, Array ], emptyArray);

addMethod(coerce, [ IndexedSeq, Array ], unary(Array.from));

addMethod(coerce, [ RevSeq, Array ], unary(Array.from));

addMethod(coerce, [ LazySeq, Array ], unary(Array.from));

addMethod(coerce, [ Object, Array ], (_into4 = into, _param4 = [], function into(_argPlaceholder17) {
  return _into4(_param4, _argPlaceholder17);
}));

addMethod(coerce, [ String, Array ], (_p7 = p$2, _p$split = _p7.split, function split(_argPlaceholder18) {
  return _p$split.call(_p7, _argPlaceholder18, "");
}));

export { Chance, Concatenated, Duration, EmptyList, GUID, HashMap, HashSet, IAddable, IAppendable, IAssociative, IBounded, ICloneable, ICollection, ICompactible, IComparable, ICounted, IDeref, IDisposable, IDivisible, IEmptyableCollection, IEquiv, IFind, IFlatMappable, IFn, IForkable, IFunctor, IHashable, IHierarchy, IIdentifiable, IInclusive, IIndexed, IInsertable, IInversive, IKVReducible, ILookup, IMap, IMapEntry, IMergable, IMultipliable, INamable, IOmissible, IOtherwise, IPath, IPrependable, IReducible, IReversible, IRevertible, ISeq, ISeqable, ISequential, ISet, ISplittable, ITopic, Indexed, IndexedSeq, Journal, Just, LazySeq, List, Multimethod, Nil, Nothing, Period, PostconditionError, PreconditionError, Protocol, Range, Recurrence, Reduced, RevSeq, Task, UID, absorb, add$4 as add, addMethod, after, ako, alike, all, also, ancestors, and, annually, any, append$1 as append, apply, applying, arity, array, asc, assert, asserts, assoc$7 as assoc, assocIn, assume, attach, attempt, average, awaits, before, behave, behaves, behaviors, best, between, binary, blot, blottable, bool, boolean, both, braid, branch, butlast, camelToDashed, cat, chain, chance, children, clamp, cleanly, clockHour, clone$7 as clone, closest$1 as closest, coalesce, coerce, collapse, comp, compact$3 as compact, compare$5 as compare, complement, concat, concatenated, cond, conj$b as conj, cons, constantly, construct, constructs, contains$7 as contains, count$d as count, countBy, crunch$1 as crunch, crunchable$1 as crunchable, curry, cycle, date, day, days, dec, deconstruct, decorating, dedupe, defaults, deferring, deref$5 as deref, desc, descendants, descriptive, detach, detect, detectIndex, detectKey, difference, directed, disj$2 as disj, dispose, dissoc$5 as dissoc, dissocIn, distinct, distinctly, divide$1 as divide, does, doto, dow, downward, drop, dropLast, dropWhile, duration, either, elapsed, empty$4 as empty, emptyArray, emptyList, emptyObject, emptyPeriod, emptyRange, emptyRecurrence, emptyString, end$1 as end, endsWith, entries, eod, eom, eoy, eq, equiv$d as equiv, equivalent, error, every, everyPair, everyPred, evolve, excludes, execute, expands, extend, factory, farg, fetch, filled, filter, filtera, find$1 as find, first$e as first, flat$2 as flat, flatMap$2 as flatMap, flatten, flip, float, flush$1 as flush, flushable$1 as flushable, fmap$7 as fmap, fmt, fnil, fold, folding, foldkv, fork$2 as fork, forward, generate, get, getIn, groupBy, gt, gte, guard, guid, guids, handle, hash$7 as hash, hashMap, hashSet, hashTag, hour, hours, identifier, identity, idx$3 as idx, impart, implement, inc, include, includes$c as includes, inclusive, index, indexOf, indexed, indexedSeq, initial, inside, int, integers, interleave, interleaved, interpose, intersection, into, inventory, inverse$1 as inverse, invoke$2 as invoke, invokes, is, isArray, isBoolean, isDate, isDistinct, isEmpty, isError, isEven, isFalse, isFloat, isFunction, isIdentical, isInt, isInteger, isNaN, isNative, isNeg, isNil, isNumber, isObject, isOdd, isPos, isPromise, isReduced, isRegExp, isSome, isString, isSymbol, isTrue, isValueObject, isZero, iterable, iterate$1 as iterate, join, journal, juxt, juxtVals, keep, keepIndexed, key$3 as key, keyed, keying, keys$a as keys, kin, last, lastN, lazyIterable, lazySeq, least, leaves, lift, list, lowerCase, lpad, lt, lte, ltrim, map, mapArgs, mapIndexed, mapKeys, mapSome, mapVals, mapa, mapcat, mapkv, mapvk, max, maxKey, maybe, mdow, measure, memoize, merge$7 as merge, mergeWith, method, midnight, millisecond, milliseconds, min, minKey, minute, minutes, modulus, month, monthDays, months, most, mult$2 as mult, multi, multimethod, multirecord, name, nary, negatives, next, nextSibling$1 as nextSibling, nextSiblings$1 as nextSiblings, nil, noon, noop$1 as noop, not, notAny, notEmpty, notEq, notEvery, notSome, nothing, nth$6 as nth, nullary, num, number, numeric, obj, object, omit$3 as omit, once, only, opt, or, otherwise$3 as otherwise, overlap, overload, parent, parents$1 as parents, parsedo, part, partial, partially, partition, partitionAll, partitionAll1, partitionAll2, partitionAll3, partitionBy, partly, patch, path, period, period1, pipe, pipeline, placeholder, pluck, plug, plugging, pm, positives, posn, post, pre, prepend$2 as prepend, prevSibling$1 as prevSibling, prevSiblings$1 as prevSiblings, promise, prop, protocol, quarter, quaternary, rand, randInt, randNth, range, rdow, reFind, reFindAll, reGroups, reMatches, rePattern, reSeq, realize, realized, record, recurrence, recurrence1, recurs, redo$1 as redo, redoable$1 as redoable, reduce$9 as reduce, reduced, reducekv$7 as reducekv, reducekv2, reducekv3, reducing, reifiable, remove, removeKeys, repeat, repeatedly, replace, rest$e as rest, retract, revSeq, reverse$4 as reverse, revert$1 as revert, revertible$1 as revertible, revision$1 as revision, rewrite, root$1 as root, rpad, rtrim, satisfies, scan, scanKey, second, seconds, seek, selectKeys, seq$c as seq, sequence, sequential, series, set, shuffle, siblings$1 as siblings, sift, signature, signatureHead, slice, sod, som, some, someFn, sort, sortBy, soy, specify, splice, split$2 as split, splitAt, splitWith, spread, start$1 as start, startsWith, steps, str, subj, subs, subset, subtract, sum, superset, take, takeLast, takeNth, takeWhile, task, tasked, ternary, test, thin, thrush, tick, time, titleCase, toArray, toDuration, toFunction, toObject, toPromise, toggles, transduce, transpose, treeSeq, trim, type, uid, uident, uids, unary, unbind, unconj$1 as unconj, undo$1 as undo, undoable$1 as undoable, unfork, union, unique, unite, unreduced, unspecify, unspread, untick, update, updateIn, upperCase, upward, val$2 as val, vals$5 as vals, verify, weekday, weekend, weeks, when, where, withIndex, year, years, zeros, zip };
