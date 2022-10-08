// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

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
function comp() {
    const fs = arguments, start1 = fs.length - 2, f1 = fs[fs.length - 1];
    return function() {
        let memo = f1.apply(this, arguments);
        for(let i = start1; i > -1; i--){
            const f = fs[i];
            memo = f.call(this, memo);
        }
        return memo;
    };
}
function pipeN(f2, ...fs) {
    return function() {
        let memo = f2.apply(this, arguments);
        for(let i = 0; i < fs.length; i++){
            const f = fs[i];
            memo = f.call(this, memo);
        }
        return memo;
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
        for (let handler of handlers){
            const check = handler[0];
            if (check.apply(this, arguments)) {
                const fn = handler[1];
                return fn.apply(this, arguments);
            }
        }
        return fallback.apply(this, arguments);
    };
}
function assume(pred, obj1, f) {
    return handle([
        pred,
        f
    ], partial(f, obj1));
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
    return function() {
        const applied = arguments.length ? slice(arguments) : [
            undefined
        ];
        if (applied.length >= minimum) {
            return f.apply(this, applied);
        } else {
            return curry2(function() {
                return f.apply(this, applied.concat(slice(arguments)));
            }, minimum - applied.length);
        }
    };
}
const curry = overload(null, curry1, curry2);
const placeholder = {};
function plug(f) {
    const xs = slice(arguments, 1), n = xs.length;
    return xs.indexOf(placeholder) < 0 ? f.apply(null, xs) : function() {
        const ys = slice(arguments), zs = [];
        for(let i = 0; i < n; i++){
            let x = xs[i];
            zs.push(x === placeholder && ys.length ? ys.shift() : x);
        }
        return plug.apply(null, [
            f
        ].concat(zs).concat(ys));
    };
}
function partial(f, ...applied) {
    return function(...args) {
        return f.apply(this, applied.concat(args));
    };
}
function partly(f) {
    return Object.assign(partial(plug, f), {
        partly: f
    });
}
function unpartly(f) {
    return f && f.partly ? f.partly : f;
}
function deferring(f) {
    return function(...args) {
        return partial(f, ...args);
    };
}
function factory(f, ...args) {
    return deferring(partial(f, ...args));
}
function multi(dispatch1) {
    return function(...args) {
        const f = dispatch1.apply(this, args);
        if (!f) {
            throw Error("Failed dispatch");
        }
        return f.apply(this, args);
    };
}
function tee(f) {
    return function(value) {
        f(value);
        return value;
    };
}
function see(...labels) {
    return tee(partial(console.log, ...labels));
}
function doto(obj2, ...effects) {
    const len = effects.length;
    for(let i = 0; i < len; i++){
        const effect = effects[i];
        effect(obj2);
    }
    return obj2;
}
function does(...effects) {
    const len = effects.length;
    return function doing(...args) {
        for(let i = 0; i < len; i++){
            const effect = effects[i];
            effect(...args);
        }
    };
}
function unspread(f) {
    return function(...args) {
        return f(args);
    };
}
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
        return new (Function.prototype.bind.apply(Type, [
            null
        ].concat(args)))();
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
    var _value;
    return _value = value, guard2(pred, f)(_value);
}
const guard = overload(null, guard1, guard2, guard3);
function memoize1(f) {
    return memoize2(f, function(...args) {
        return JSON.stringify(args);
    });
}
function memoize2(f, hash1) {
    const cache1 = {};
    return function() {
        const key1 = hash1.apply(this, arguments);
        if (cache1.hasOwnProperty(key1)) {
            return cache1[key1];
        } else {
            const result = f.apply(this, arguments);
            cache1[key1] = result;
            return result;
        }
    };
}
const memoize = overload(null, memoize1, memoize2);
function isNative(f) {
    return /\{\s*\[native code\]\s*\}/.test('' + f);
}
function toggles4(on, off, want, self) {
    return want(self) ? on(self) : off(self);
}
function toggles5(on, off, _, self, want) {
    return want ? on(self) : off(self);
}
const toggles = overload(null, null, null, null, toggles4, toggles5);
function detach(method) {
    return function(obj3, ...args) {
        return obj3[method](...args);
    };
}
function attach(f) {
    return function(...args) {
        return f.apply(null, [
            this
        ].concat(args));
    };
}
function PreconditionError(f, pred, args) {
    this.f = f;
    this.pred = pred;
    this.args = args;
}
PreconditionError.prototype = new Error();
function PostconditionError(f, pred, args, result) {
    this.f = f;
    this.pred = pred;
    this.args = args;
    this.result = result;
}
PostconditionError.prototype = new Error();
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
    return function(a) {
        return f(a);
    };
}
function binary(f) {
    return function(a, b) {
        return f(a, b);
    };
}
function ternary(f) {
    return function(a, b, c) {
        return f(a, b, c);
    };
}
function quaternary(f) {
    return function(a, b, c, d) {
        return f(a, b, c, d);
    };
}
function nary(f, length) {
    return function() {
        return f(...slice(arguments, 0, length));
    };
}
function arity(f, length) {
    return ([
        nullary,
        unary,
        binary,
        ternary,
        quaternary
    ][length] || nary)(f, length);
}
function fold(f, init, xs) {
    let memo = init, to = xs.length - 1, r = {};
    for(let i = 0; i <= to; i++){
        if (memo === r) break;
        memo = f(memo, xs[i], function(reduced) {
            return r = reduced;
        });
    }
    return memo;
}
function foldkv(f, init, xs) {
    let memo = init, len = xs.length, r = {};
    for(let i = 0; i < len; i++){
        if (memo === r) break;
        memo = f(memo, i, xs[i], function(reduced) {
            return r = reduced;
        });
    }
    return memo;
}
function posn(...xfs) {
    return function(arr) {
        return foldkv(function(memo, idx1, xf) {
            const val1 = arr[idx1];
            memo.push(xf ? xf(val1) : val1);
            return memo;
        }, [], xfs);
    };
}
function signature(...preds) {
    return function(...values) {
        return foldkv(function(memo, idx4, pred, reduced) {
            return memo ? !pred || pred(values[idx4]) : reduced(memo);
        }, preds.length === values.length, preds);
    };
}
function signatureHead(...preds) {
    return function(...values) {
        return foldkv(function(memo, idx5, value, reduced) {
            let pred = preds[idx5];
            return memo ? !pred || pred(value) : reduced(memo);
        }, true, values);
    };
}
function and(...preds) {
    return function(...args) {
        return fold(function(memo, pred, reduced) {
            return memo ? pred(...args) : reduced(memo);
        }, true, preds);
    };
}
function or(...preds) {
    return function(...args) {
        return fold(function(memo, pred, reduced) {
            return memo ? reduced(memo) : pred(...args);
        }, false, preds);
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
        return fold(function(memo1, arg) {
            return fold(function(memo, pred, reduced) {
                let result = memo && pred(arg);
                return result ? result : reduced(result);
            }, memo1, preds);
        }, true, slice(arguments));
    };
}
function someFn1(p1) {
    function f1(x) {
        return p1(x);
    }
    function f2(x, y) {
        return p1(x) || p1(y);
    }
    function f3(x, y, z) {
        return p1(x) || p1(y) || p1(z);
    }
    function fn(x, y, z, ...args) {
        return f3(x, y, z) || some(p1, args);
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
    let every1 = xs.length > 0;
    while(every1 && xs.length > 1){
        every1 = pred(xs[0], xs[1]);
        xs = slice(xs, 1);
    }
    return every1;
}
function addMeta(target, key2, value) {
    try {
        Object.defineProperty(target, key2, {
            configurable: true,
            enumerable: false,
            writable: true,
            value: value
        });
    } catch (ex) {
        target[key2] = value;
    }
}
const TEMPLATE = Symbol("@protocol-template"), INDEX = Symbol("@protocol-index"), MISSING = Symbol("@protocol-missing");
function protocol(template1) {
    const p3 = new Protocol({}, {});
    p3.extend(template1);
    return p3;
}
function Protocol(template2, index1) {
    this[INDEX] = index1;
    this[TEMPLATE] = template2;
}
function extend$1(template3) {
    for(let method in template3){
        this[method] = this.dispatch(method);
    }
    Object.assign(this[TEMPLATE], template3);
}
function dispatch(method) {
    const protocol1 = this;
    return function(self, ...args) {
        const f = satisfies2.call(protocol1, method, self);
        if (!f) {
            throw new ProtocolLookupError(protocol1, method, self, args);
        }
        return f.apply(null, [
            self
        ].concat(args));
    };
}
function generate$1() {
    const index5 = this[INDEX];
    return function(method) {
        const sym = index5[method] || Symbol(method);
        index5[method] = sym;
        return sym;
    };
}
function keys$c() {
    return Object.keys(this[TEMPLATE]);
}
function specify1(behavior) {
    const protocol2 = this;
    return function(target) {
        specify2.call(protocol2, behavior, target);
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
    for(let method in behavior){
        if (!this[method]) {
            throw new Error("Foreign behavior specified: " + method);
        }
        addMeta(target, keys(method), behavior[method]);
    }
}
const specify$1 = overload(null, specify1, specify2);
function unspecify1(behavior) {
    const protocol3 = this;
    return function(target) {
        unspecify2.call(protocol3, behavior, target);
    };
}
function unspecify2(behavior, target) {
    const keys = this.generate();
    addMeta(target, keys("__marker__"), undefined);
    for(let method in behavior){
        addMeta(target, keys(method), undefined);
    }
}
const unspecify$1 = overload(null, unspecify1, unspecify2);
function implement0() {
    return implement1.call(this, {});
}
function implement1(obj4) {
    const behavior = obj4.behaves ? obj4.behaves(this) : obj4;
    if (obj4.behaves && !behavior) {
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
function satisfies1(obj5) {
    const target = obj5 == null ? new Nil() : obj5, key3 = this[INDEX]["__marker__"] || MISSING;
    return target[key3] || (target.constructor === Object ? target.constructor[key3] : null);
}
function satisfies2(method, obj6) {
    const target = obj6 == null ? new Nil() : obj6, key4 = this[INDEX][method] || MISSING;
    return target[key4] || (target.constructor === Object ? target.constructor[key4] : null) || this[TEMPLATE][method];
}
const satisfies$1 = overload(satisfies0, satisfies1, satisfies2);
Object.assign(Protocol.prototype, {
    extend: extend$1,
    dispatch,
    generate: generate$1,
    keys: keys$c,
    specify: specify$1,
    unspecify: unspecify$1,
    implement: implement$1,
    satisfies: satisfies$1
});
Protocol.prototype[Symbol.toStringTag] = "Protocol";
function ProtocolLookupError(protocol4, method, subject, args) {
    this.protocol = protocol4;
    this.method = method;
    this.subject = subject;
    this.args = args;
}
ProtocolLookupError.prototype = new Error();
ProtocolLookupError.prototype.toString = function() {
    return `Protocol lookup for ${this.method} failed.`;
};
ProtocolLookupError.prototype[Symbol.toStringTag] = "ProtocolLookupError";
const extend = unbind(Protocol.prototype.extend);
const satisfies = unbind(Protocol.prototype.satisfies);
const specify = unbind(Protocol.prototype.specify);
const unspecify = unbind(Protocol.prototype.unspecify);
const implement = unbind(Protocol.prototype.implement);
function reifiable(properties1) {
    function Reifiable(properties) {
        Object.assign(this, properties);
    }
    return new Reifiable(properties1 || {});
}
function behaves(behaviors1, env, callback) {
    for(let key5 in behaviors1){
        if (key5 in env) {
            const type1 = env[key5], behave1 = behaviors1[key5];
            callback && callback(type1, key5, behave1);
            behave1(type1);
        }
    }
}
function forward1(key6) {
    return function forward(f) {
        return function(self, ...args) {
            return f.apply(this, [
                self[key6],
                ...args
            ]);
        };
    };
}
function forwardN(target, ...protocols) {
    const fwd = forward1(target);
    const behavior = fold(function(memo2, protocol5) {
        memo2.push(implement(protocol5, fold(function(memo, key7) {
            memo[key7] = fwd(protocol5[key7]);
            return memo;
        }, {}, protocol5.keys() || [])));
        return memo2;
    }, [], protocols);
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
const blank$5 = constantly(false);
const IBlankable = protocol({
    blank: blank$5
});
const IBounded = protocol({
    start: null,
    end: null
});
function clone$5(self) {
    return Object.assign(Object.create(self.constructor.prototype), self);
}
const IClonable = protocol({
    clone: clone$5
});
const IFn = protocol({
    invoke: null
});
const IDeref = protocol({
    deref: null
});
const ISwappable = protocol({
    swap: null
});
const invoke$3 = IFn.invoke;
function invokable(obj7) {
    let state = obj7;
    function invoke1(self, ...args) {
        return IFn.invoke(state, ...args);
    }
    function swap1(self, f) {
        state = f(state);
    }
    function deref1(self) {
        return state;
    }
    return doto(partial(invoke1, null), specify(IFn, {
        invoke: invoke1
    }), specify(ISwappable, {
        swap: swap1
    }), specify(IDeref, {
        deref: deref1
    }));
}
const IMapEntry = protocol({
    key: null,
    val: null
});
const IHashable = protocol({
    hash: null
});
function equiv$b(x, y) {
    return x === y;
}
const IEquiv = protocol({
    equiv: equiv$b
});
const cache = Symbol("hashcode");
function hashTag() {
    const tag = Math.random(0);
    return function(self) {
        if (!self[cache]) {
            self[cache] = tag;
        }
    };
}
function hash$7(self) {
    if (self == null) {
        return 0;
    } else if (self.hashCode) {
        return self.hashCode();
    } else if (self[cache]) {
        return self[cache];
    }
    const hash2 = satisfies(IHashable, "hash", self);
    if (hash2) {
        const hashcode = hash2(self);
        return Object.isFrozen(self) ? hashcode : self[cache] = hashcode;
    } else {
        hashTag()(self);
        return self[cache];
    }
}
function _IsValueObject(maybeValue) {
    return Boolean(maybeValue && typeof maybeValue.equals === 'function' && typeof maybeValue.hashCode === 'function');
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
function unkeyed(Type) {
    return specify(IMapEntry, {
        key: constantly(Type),
        val: constantly(Type)
    }, Type);
}
function keying(label) {
    if (label && !isString(label)) {
        throw new Error("Label must be a string");
    }
    return does(unkeyed, hashTag(), label ? function(Type) {
        Type[Symbol.toStringTag] = label;
    } : noop);
}
function Multimethod(dispatch2, methods, fallback) {
    this.dispatch = dispatch2;
    this.methods = methods;
    this.fallback = fallback;
}
function multimethod(dispatch3, fallback) {
    return new Multimethod(dispatch3, {}, fallback);
}
function addMethod(self, key8, handler) {
    const hashcode = hash$7(key8);
    const potentials = self.methods[hashcode] = self.methods[hashcode] || [];
    potentials.push([
        key8,
        handler
    ]);
    return self;
}
var _mm, _invoke;
function key$2(self) {
    if (satisfies(IMapEntry, "key", self)) {
        return key$3(self);
    } else {
        return self;
    }
}
const mm = multimethod(function(source, Type) {
    return [
        key$2(type(source)),
        key$2(Type)
    ];
});
const coerce$2 = (_invoke = invoke$3, _mm = mm, function invoke(_argPlaceholder, _argPlaceholder2) {
    return _invoke(_mm, _argPlaceholder, _argPlaceholder2);
});
const ICoercible = protocol({
    coerce: coerce$2
});
ICoercible.addMethod = function addMethod$1(match, f) {
    if (match == null) {
        return mm;
    } else if (typeof match === "function") {
        return function(Type) {
            addMethod$1(match(Type), f);
        };
    } else {
        const [from, to] = match;
        addMethod(mm, [
            key$2(from),
            key$2(to)
        ], f);
    }
};
const ICollection = protocol({
    conj: null,
    unconj: null
});
const ICompactible = protocol({
    compact: null
});
function compare$7(x, y) {
    return x > y ? 1 : x < y ? -1 : 0;
}
const IComparable = protocol({
    compare: compare$7
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
function reduce2$1(f, coll) {
    return reduce3$1(f, ISeq.first(coll), ISeq.rest(coll));
}
function reduce3$1(f, init, coll) {
    return IReducible.reduce(coll, f, init);
}
const reduce$e = overload(null, null, reduce2$1, reduce3$1);
function reducing1(f) {
    return reducing2(f, identity);
}
function reducing2(f, order) {
    return function(x, ...xs) {
        return reduce3$1(f, x, order(xs));
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
const IDisposable = protocol({
    dispose: null
});
const IDivisible = protocol({
    divide: null
});
const IEmptyableCollection = protocol({
    empty: null
});
const IFind = protocol({
    find: null
});
const IFlatMappable = protocol({
    flatMap: null
});
const IForkable = protocol({
    fork: null
});
const IFunctor = protocol({
    fmap: null
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
var _config = {
    logger: console
};
function log$1(...args) {
    ILogger.log(_config.logger, ...args);
}
const ILogger = protocol({
    log: log$1
});
function lookup$9(self, key9) {
    return self && self[key9];
}
const ILookup = protocol({
    lookup: lookup$9
});
const IMap = protocol({
    dissoc: null,
    keys: null,
    vals: null
});
const coerce$1 = ICoercible.coerce;
var _Array, _coerce$1;
function isArray(self) {
    return is(self, Array);
}
const toArray = (_coerce$1 = coerce$1, _Array = Array, function coerce(_argPlaceholder) {
    return _coerce$1(_argPlaceholder, _Array);
});
function reducekv2(f, coll) {
    return IKVReducible.reducekv(coll, f, f());
}
function reducekv3(f, init, coll) {
    return IKVReducible.reducekv(coll, f, init);
}
const reducekv$a = overload(null, null, reducekv2, reducekv3);
const first$d = ISeq.first;
const rest$d = ISeq.rest;
function get(self, key10, notFound) {
    const found = ILookup.lookup(self, key10);
    return found == null ? notFound == null ? null : notFound : found;
}
function getIn(self, keys, notFound) {
    const found = reduce$e(get, self, keys);
    return found == null ? notFound == null ? null : notFound : found;
}
function assocN(self, key11, value, ...args) {
    const instance = IAssociative.assoc(self, key11, value);
    return args.length > 0 ? assocN(instance, ...args) : instance;
}
const assoc$8 = overload(null, null, null, IAssociative.assoc, assocN);
function assocIn(self, keys, value) {
    let key12 = keys[0];
    switch(keys.length){
        case 0:
            return self;
        case 1:
            return IAssociative.assoc(self, key12, value);
        default:
            return IAssociative.assoc(self, key12, assocIn(get(self, key12), toArray(rest$d(keys)), value));
    }
}
function update3(self, key13, f) {
    return IAssociative.assoc(self, key13, f(get(self, key13)));
}
function update4(self, key14, f, a) {
    return IAssociative.assoc(self, key14, f(get(self, key14), a));
}
function update5(self, key15, f, a, b) {
    return IAssociative.assoc(self, key15, f(get(self, key15), a, b));
}
function update6(self, key16, f, a, b, c) {
    return IAssociative.assoc(self, key16, f(get(self, key16), a, b, c));
}
function updateN(self, key17, f) {
    let tgt = get(self, key17), args = [
        tgt
    ].concat(slice(arguments, 3));
    return IAssociative.assoc(self, key17, f.apply(this, args));
}
const update = overload(null, null, null, update3, update4, update5, update6, updateN);
function updateIn3(self, keys, f) {
    let k = keys[0], ks = toArray(rest$d(keys));
    return ks.length ? IAssociative.assoc(self, k, updateIn3(get(self, k), ks, f)) : update3(self, k, f);
}
function updateIn4(self, keys, f, a) {
    let k = keys[0], ks = toArray(rest$d(keys));
    return ks.length ? IAssociative.assoc(self, k, updateIn4(get(self, k), ks, f, a)) : update4(self, k, f, a);
}
function updateIn5(self, keys, f, a, b) {
    let k = keys[0], ks = toArray(rest$d(keys));
    return ks.length ? IAssociative.assoc(self, k, updateIn5(get(self, k), ks, f, a, b)) : update5(self, k, f, a, b);
}
function updateIn6(self, key, f, a, b, c) {
    let k = keys[0], ks = toArray(rest$d(keys));
    return ks.length ? IAssociative.assoc(self, k, updateIn6(get(self, k), ks, f, a, b, c)) : update6(self, k, f, a, b, c);
}
function updateInN(self, keys, f) {
    return updateIn3(self, keys, function(obj8, ...args) {
        return f.apply(null, [
            obj8
        ].concat(args));
    });
}
function contains3(self, key18, value) {
    return IAssociative.contains(self, key18) && get(self, key18) === value;
}
const contains$8 = overload(null, null, IAssociative.contains, contains3);
const updateIn = overload(null, null, null, updateIn3, updateIn4, updateIn5, updateIn6, updateInN);
const rewrite = branch(IAssociative.contains, update, identity);
const prop = overload(null, function(key19) {
    return overload(null, function(v) {
        return get(v, key19);
    }, function(v) {
        return assoc$8(v, key19, v);
    });
}, get, assoc$8);
function patch2(target, source) {
    return reducekv$a(function(memo, key20, value) {
        return assoc$8(memo, key20, typeof value === "function" ? value(get(memo, key20)) : value);
    }, target, source);
}
const patch = overload(null, identity, patch2, reducing(patch2));
function merge$5(target, source) {
    return reducekv$a(assoc$8, target, source);
}
function mergeWith3(f, init, x) {
    return reducekv$a(function(memo, key21, value) {
        return assoc$8(memo, key21, contains$8(memo, key21) ? f(get(memo, key21), value) : f(value));
    }, init, x);
}
function mergeWithN(f, init, ...xs) {
    var _f, _mergeWith;
    return reduce$e((_mergeWith = mergeWith3, _f = f, function mergeWith3(_argPlaceholder, _argPlaceholder2) {
        return _mergeWith(_f, _argPlaceholder, _argPlaceholder2);
    }), init, xs);
}
const mergeWith = overload(null, null, null, mergeWith3, mergeWithN);
const IMergable = protocol({
    merge: merge$5
});
const INamable = protocol({
    name: null
});
const INext = protocol({
    next: null
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
const IResettable = protocol({
    reset: null,
    resettable: null
});
const IReversible = protocol({
    reverse: null
});
const IRevertible = protocol({
    undo: null,
    redo: null,
    flush: null,
    undoable: null,
    redoable: null,
    flushable: null,
    revision: null
});
const ISend = protocol({
    send: null
});
const ISeqable = protocol({
    seq: null
});
const ISequential$1 = protocol();
const IOmissible = protocol({
    omit: null
});
const omit$3 = IOmissible.omit;
const conj$8 = overload(function() {
    return [];
}, identity, ICollection.conj, reducing(ICollection.conj));
const unconj$1 = overload(null, identity, ICollection.unconj, reducing(ICollection.unconj));
function excludes2(self, value) {
    return !IInclusive.includes(self, value);
}
function includesN(self, ...args) {
    for (let arg of args){
        if (!IInclusive.includes(self, arg)) {
            return false;
        }
    }
    return true;
}
function excludesN(self, ...args) {
    for (let arg of args){
        if (IInclusive.includes(self, arg)) {
            return false;
        }
    }
    return true;
}
const includes$9 = overload(null, constantly(true), IInclusive.includes, includesN);
const excludes = overload(null, constantly(false), excludes2, excludesN);
const transpose = branch(IInclusive.includes, omit$3, conj$8);
function unite$1(self, value) {
    return includes$9(self, value) ? self : conj$8(self, value);
}
const ISet = protocol({
    unite: unite$1,
    disj: null
});
const ISplittable = protocol({
    split: null
});
const ITemplate = protocol({
    fill: null
});
function EmptyList() {}
function emptyList() {
    return new EmptyList();
}
EmptyList.prototype[Symbol.toStringTag] = "EmptyList";
EmptyList.prototype.hashCode = function() {
    return -0;
};
const count$b = ICounted.count;
const next$a = INext.next;
function Reduced(value) {
    this.value = value;
}
Reduced.prototype[Symbol.toStringTag] = "Reduced";
Reduced.prototype.valueOf = function() {
    return this.value;
};
function reduced$1(value) {
    return new Reduced(value);
}
function kin(self, other) {
    return is(other, self.constructor);
}
function equiv$a(self, other) {
    return self === other || IEquiv.equiv(self, other);
}
function alike2(self, other) {
    return alike3(self, other, Object.keys(self));
}
function alike3(self, other, keys) {
    return reduce$e(function(memo, key22) {
        return memo ? equiv$a(self[key22], other[key22]) : reduced$1(memo);
    }, true, keys);
}
const alike = overload(null, null, alike2, alike3);
function equivalent() {
    function equiv1(self, other) {
        return kin(self, other) && alike(self, other);
    }
    return implement(IEquiv, {
        equiv: equiv1
    });
}
function eqN(...args) {
    return everyPair(equiv$a, args);
}
const eq = overload(constantly(true), constantly(true), equiv$a, eqN);
const notEq = complement(eq);
function reduce$d(self, f, init) {
    return init;
}
function append$6(self, x) {
    return [
        x
    ];
}
const prepend$5 = append$6;
function equiv$9(xs, ys) {
    return !!satisfies(ISequential$1, xs) === !!satisfies(ISequential$1, ys) && count$b(xs) === count$b(ys) && equiv$a(first$d(xs), first$d(ys)) && equiv$a(next$a(xs), next$a(ys));
}
const iequiv = implement(IEquiv, {
    equiv: equiv$9
});
var behave$G = does(iequiv, keying("EmptyList"), implement(ISequential$1), implement(IPrependable, {
    prepend: prepend$5
}), implement(IAppendable, {
    append: append$6
}), implement(IBlankable, {
    blank: constantly(true)
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
    reducekv: reduce$d
}), implement(IReducible, {
    reduce: reduce$d
}), implement(ISeq, {
    first: constantly(null),
    rest: emptyList
}), implement(INext, {
    next: constantly(null)
}), implement(ISeqable, {
    seq: constantly(null)
}));
behave$G(EmptyList);
function compare$6(x, y) {
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
    return compare$6(a, b) < 0;
}
function ltN(...args) {
    return everyPair(lt2, args);
}
const lt = overload(constantly(false), constantly(true), lt2, ltN);
const lte2 = or(lt2, equiv$a);
function lteN(...args) {
    return everyPair(lte2, args);
}
const lte = overload(constantly(false), constantly(true), lte2, lteN);
function gt2(a, b) {
    return compare$6(a, b) > 0;
}
function gtN(...args) {
    return everyPair(gt2, args);
}
const gt = overload(constantly(false), constantly(true), gt2, gtN);
const gte2 = or(equiv$a, gt2);
function gteN(...args) {
    return everyPair(gte2, args);
}
const gte = overload(constantly(false), constantly(true), gte2, gteN);
var _, _IAddable$add, _IAddable, _2, _IAddable$add2, _IAddable2;
function directed(start2, step) {
    return compare$6(IAddable.add(start2, step), start2);
}
function steps(Type, pred) {
    return function(start3, end1, step) {
        if (start3 == null && end1 == null) {
            return new Type();
        }
        if (start3 != null && !pred(start3)) {
            throw Error(Type.name + " passed invalid start value.");
        }
        if (end1 != null && !pred(end1)) {
            throw Error(Type.name + " passed invalid end value.");
        }
        if (start3 == null && end1 != null) {
            throw Error(Type.name + " cannot get started without a beginning.");
        }
        const direction = directed(start3, step);
        if (direction === 0) {
            throw Error(Type.name + " lacks direction.");
        }
        return new Type(start3, end1, step, direction);
    };
}
function subtract2(self, n) {
    return IAddable.add(self, IInversive.inverse(n));
}
const subtract = overload(constantly(0), identity, subtract2, reducing(subtract2));
const add$3 = overload(constantly(0), identity, IAddable.add, reducing(IAddable.add));
const inc = overload(constantly(+1), (_IAddable = IAddable, _IAddable$add = _IAddable.add, _ = +1, function add(_argPlaceholder) {
    return _IAddable$add.call(_IAddable, _argPlaceholder, _);
}));
const dec = overload(constantly(-1), (_IAddable2 = IAddable, _IAddable$add2 = _IAddable2.add, _2 = -1, function add(_argPlaceholder2) {
    return _IAddable$add2.call(_IAddable2, _argPlaceholder2, _2);
}));
const number = constructs(Number);
const num = unary(number);
const __int = parseInt;
const __float = parseFloat;
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
    return compare$6(x, y) < 0 ? x : y;
}
function max2(x, y) {
    return compare$6(x, y) > 0 ? x : y;
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
function clamp(self, min1, max1) {
    return self < min1 ? min1 : self > max1 ? max1 : self;
}
function rand0() {
    return Math.random();
}
function rand1(n) {
    return Math.random() * n;
}
const rand = overload(rand0, rand1);
function randInt(n) {
    return Math.floor(rand(n));
}
function sum(ns) {
    return reduce$e(add$3, 0, ns);
}
function least(ns) {
    return reduce$e(min, Number.POSITIVE_INFINITY, ns);
}
function most$1(ns) {
    return reduce$e(max, Number.NEGATIVE_INFINITY, ns);
}
function average$1(ns) {
    return sum(ns) / count$b(ns);
}
function measure(ns) {
    return {
        count: count$b(ns),
        sum: sum(ns),
        least: least(ns),
        most: most$1(ns),
        average: average$1(ns)
    };
}
function compare$5(self, other) {
    return self === other ? 0 : self - other;
}
function add$2(self, other) {
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
const start$3 = identity, end$3 = identity, hash$6 = identity;
var behave$F = does(keying("Number"), implement(IHashable, {
    hash: hash$6
}), implement(IDivisible, {
    divide: divide$3
}), implement(IMultipliable, {
    mult: mult$1
}), implement(IBounded, {
    start: start$3,
    end: end$3
}), implement(IComparable, {
    compare: compare$5
}), implement(IInversive, {
    inverse: inverse$3
}), implement(IAddable, {
    add: add$2
}));
const behaviors = {};
Object.assign(behaviors, {
    Number: behave$F
});
behave$F(Number);
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
function __boolean(...args) {
    return Boolean(...args);
}
const bool = __boolean;
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
function compare$4(self, other) {
    return self === other ? 0 : self === true ? 1 : -1;
}
function inverse$2(self) {
    return !self;
}
function hash$5(self) {
    return self ? 1 : 0;
}
var behave$E = does(keying("Boolean"), implement(IHashable, {
    hash: hash$5
}), implement(IComparable, {
    compare: compare$4
}), implement(IInversive, {
    inverse: inverse$2
}));
Object.assign(behaviors, {
    Boolean: behave$E
});
behave$E(Boolean);
function List(head, tail) {
    this.head = head;
    this.tail = tail;
}
function cons2(head, tail) {
    return new List(head, tail || emptyList());
}
const _consN = reducing(cons2);
function consN(...args) {
    return _consN.apply(this, args.concat([
        emptyList()
    ]));
}
const cons = overload(emptyList, cons2, cons2, consN);
List.prototype[Symbol.toStringTag] = "List";
function list(...args) {
    return reduce$e(function(memo, value) {
        return cons(value, memo);
    }, emptyList(), args.reverse());
}
const merge$4 = overload(null, identity, IMergable.merge, reducing(IMergable.merge));
function assoc$7(self, key23, value) {
    const obj9 = {};
    obj9[key23] = value;
    return obj9;
}
function reduce$c(self, f, init) {
    return init;
}
function equiv$8(self, other) {
    return null == other;
}
function otherwise$5(self, other) {
    return other;
}
function conj$7(self, value) {
    return cons(value);
}
function merge$3(self, ...xs) {
    return count$b(xs) ? merge$4.apply(null, Array.from(xs)) : null;
}
function hash$4(self) {
    return 0;
}
var behave$D = does(keying("Nil"), implement(IHashable, {
    hash: hash$4
}), implement(IClonable, {
    clone: identity
}), implement(ICompactible, {
    compact: identity
}), implement(ICollection, {
    conj: conj$7
}), implement(IBlankable, {
    blank: constantly(true)
}), implement(IMergable, {
    merge: merge$3
}), implement(IMap, {
    keys: nil,
    vals: nil,
    dissoc: nil
}), implement(IEmptyableCollection, {
    empty: identity
}), implement(IOtherwise, {
    otherwise: otherwise$5
}), implement(IEquiv, {
    equiv: equiv$8
}), implement(ILookup, {
    lookup: identity
}), implement(IInclusive, {
    includes: constantly(false)
}), implement(IAssociative, {
    assoc: assoc$7,
    contains: constantly(false)
}), implement(INext, {
    next: identity
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
    reducekv: reduce$c
}), implement(IReducible, {
    reduce: reduce$c
}));
behave$D(Nil);
const deref$b = IDeref.deref;
const fmap$b = overload(constantly(identity), IFunctor.fmap, reducing(IFunctor.fmap));
function thrushN(unit1, init, ...fs) {
    return deref$b(reduce$e(IFunctor.fmap, unit1(init), fs));
}
function thrush1(f) {
    return overload(null, f, partial(thrushN, f));
}
const thrush = overload(null, thrush1, thrushN);
function pipeline1(unit2) {
    return partial(pipelineN, unit2);
}
function pipelineN(unit3, ...fs) {
    return function(init) {
        return thrush(unit3, init, ...fs);
    };
}
const pipeline = overload(null, pipeline1, pipelineN);
function Nothing() {}
Nothing.prototype[Symbol.toStringTag] = "Nothing";
const nothing = new Nothing();
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
const seq$a = ISeqable.seq;
function Range(start4, end2, step, direction) {
    this.start = start4;
    this.end = end2;
    this.step = step;
    this.direction = direction;
}
function emptyRange() {
    return new Range();
}
function range0() {
    return range1(Number.POSITIVE_INFINITY);
}
function range1(end3) {
    return range3(0, end3, 1);
}
function range2(start5, end4) {
    return range3(start5, end4, 1);
}
const range3 = steps(Range, isNumber);
const range = overload(range0, range1, range2, range3);
Range.prototype[Symbol.toStringTag] = "Range";
function emptyString() {
    return "";
}
var _param$2, _upperCase, _replace;
function isBlank(str3) {
    return str3 == null || typeof str3 === "string" && str3.trim().length === 0;
}
function str1(x) {
    return x == null ? "" : x.toString();
}
function str2(x, y) {
    return str1(x) + str1(y);
}
function camelToDashed(str4) {
    return str4.replace(/[A-Z]/, function(x) {
        return "-" + x.toLowerCase();
    });
}
const startsWith = unbind(String.prototype.startsWith);
const endsWith = unbind(String.prototype.endsWith);
const replace = unbind(String.prototype.replace);
const subs = unbind(String.prototype.substring);
const lowerCase = unbind(String.prototype.toLowerCase);
const upperCase = unbind(String.prototype.toUpperCase);
const titleCase = (_replace = replace, _param$2 = /(^|\s|\.)(\S|\.)/g, _upperCase = upperCase, function replace(_argPlaceholder) {
    return _replace(_argPlaceholder, _param$2, _upperCase);
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
function spread(f) {
    return function(args) {
        return f(...toArray(args));
    };
}
function parsedo(re, xf, callback) {
    return opt(re, xf, spread(callback));
}
function realize(g) {
    return isFunction(g) ? g() : g;
}
function realized(f) {
    return function(...args) {
        return apply(f, reduce$e(function(memo, arg) {
            memo.push(realize(arg));
            return memo;
        }, [], args));
    };
}
function juxt(...fs) {
    return function(...args) {
        return reduce$e(function(memo, f) {
            return memo.concat([
                f.apply(this, args)
            ]);
        }, [], fs);
    };
}
function apply2(f, args) {
    return f.apply(null, toArray(args));
}
function apply3(f, a, args) {
    return f.apply(null, [
        a
    ].concat(toArray(args)));
}
function apply4(f, a, b, args) {
    return f.apply(null, [
        a,
        b
    ].concat(toArray(args)));
}
function apply5(f, a, b, c, args) {
    return f.apply(null, [
        a,
        b,
        c
    ].concat(toArray(args)));
}
function applyN(f, a, b, c, d, args) {
    return f.apply(null, [
        a,
        b,
        c,
        d
    ].concat(toArray(args)));
}
const apply = overload(null, null, apply2, apply3, apply4, apply5, applyN);
function flip(f) {
    return function(b, a, ...args) {
        return f.apply(this, [
            a,
            b
        ].concat(args));
    };
}
function farg(f, ...fs) {
    return function(...args) {
        for(let x = 0; x < args.length; x++){
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
        for(let x = 0; x < substitutes.length; x++){
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
const keys$b = IMap.keys;
const vals$5 = IMap.vals;
function dissocN(obj10, ...keys) {
    return reduce$e(IMap.dissoc, obj10, keys);
}
const dissoc$5 = overload(null, identity, IMap.dissoc, dissocN);
const nth$6 = IIndexed.nth;
const idx$3 = IIndexed.idx;
const reverse$4 = IReversible.reverse;
function concatenated(xs) {
    const colls = filter(seq$a, xs);
    return seq$a(colls) ? new Concatenated(colls) : emptyList();
}
const concat = overload(emptyList, seq$a, unspread(concatenated));
function map2(f, xs) {
    return seq$a(xs) ? lazySeq(function() {
        return cons(f(first$d(xs)), map2(f, rest$d(xs)));
    }) : emptyList();
}
function map3(f, c1, c2) {
    const s1 = seq$a(c1), s2 = seq$a(c2);
    return s1 && s2 ? lazySeq(function() {
        return cons(f(first$d(s1), first$d(s2)), map3(f, rest$d(s1), rest$d(s2)));
    }) : emptyList();
}
function mapN(f, ...tail) {
    const seqs = map(seq$a, tail);
    return notAny(isNil, seqs) ? lazySeq(function() {
        return cons(apply(f, mapa(first$d, seqs)), apply(mapN, f, mapa(rest$d, seqs)));
    }) : emptyList();
}
const map = overload(null, null, map2, map3, mapN);
const mapa = comp(toArray, map);
function mapArgs(xf, f) {
    return function() {
        var _xf, _maybe;
        return apply(f, mapa((_maybe = maybe, _xf = xf, function maybe(_argPlaceholder) {
            return _maybe(_argPlaceholder, _xf);
        }), slice(arguments)));
    };
}
function keyed(f, keys) {
    return reduce$e(function(memo, key24) {
        return assoc$8(memo, key24, f(key24));
    }, {}, keys);
}
function transduce3(xform, f, coll) {
    return transduce4(xform, f, f(), coll);
}
function transduce4(xform, f, init, coll) {
    const step = xform(f);
    return step(reduce$e(step, init, coll));
}
const transduce = overload(null, null, null, transduce3, transduce4);
function into2(to, from) {
    return reduce$e(conj$8, to, from);
}
function into3(to, xform, from) {
    return transduce(xform, conj$8, to, from);
}
const into = overload(emptyArray, identity, into2, into3);
function doing1(f) {
    return doing2(f, identity);
}
function doing2(f, order) {
    return function(self, ...xs) {
        var _self, _f;
        each((_f = f, _self = self, function f(_argPlaceholder2) {
            return _f(_self, _argPlaceholder2);
        }), order(xs));
    };
}
const doing = overload(null, doing1, doing2);
function each(f, xs) {
    let ys = seq$a(xs);
    while(ys){
        f(first$d(ys));
        ys = next$a(ys);
    }
}
function doseq3(f, xs, ys) {
    each(function(x) {
        each(function(y) {
            f(x, y);
        }, ys);
    }, xs);
}
function doseq4(f, xs, ys, zs) {
    each(function(x) {
        each(function(y) {
            each(function(z) {
                f(x, y, z);
            }, zs);
        }, ys);
    }, xs);
}
function doseqN(f, xs, ...colls) {
    each(function(x) {
        if (seq$a(colls)) {
            apply(doseq, function(...args) {
                apply(f, x, args);
            }, colls);
        } else {
            f(x);
        }
    }, xs || []);
}
const doseq = overload(null, null, each, doseq3, doseq4, doseqN);
function eachkv(f, xs) {
    each(function([key25, value]) {
        return f(key25, value);
    }, entries(xs));
}
function eachvk(f, xs) {
    each(function([key26, value]) {
        return f(value, key26);
    }, entries(xs));
}
function entries2(xs, keys) {
    return seq$a(keys) ? lazySeq(function() {
        return cons([
            first$d(keys),
            get(xs, first$d(keys))
        ], entries2(xs, rest$d(keys)));
    }) : emptyList();
}
function entries1(xs) {
    return entries2(xs, keys$b(xs));
}
const entries = overload(null, entries1, entries2);
function mapkv(f, xs) {
    return map(function([key27, value]) {
        return f(key27, value);
    }, entries(xs));
}
function mapvk(f, xs) {
    return map(function([key28, value]) {
        return f(value, key28);
    }, entries(xs));
}
function seek(...fs) {
    return function(...args) {
        return reduce$e(function(memo, f) {
            return memo == null ? f(...args) : reduced$1(memo);
        }, null, fs);
    };
}
function some$1(f, coll) {
    let xs = seq$a(coll);
    while(xs){
        const value = f(first$d(xs));
        if (value) {
            return value;
        }
        xs = next$a(xs);
    }
    return null;
}
const notSome = comp(not, some$1);
const notAny = notSome;
function every(pred, coll) {
    let xs = seq$a(coll);
    while(xs){
        if (!pred(first$d(xs))) {
            return false;
        }
        xs = next$a(xs);
    }
    return true;
}
const notEvery = comp(not, every);
function mapSome(f, pred, coll) {
    return map(function(value) {
        return pred(value) ? f(value) : value;
    }, coll);
}
function mapcat(f, colls) {
    return concatenated(map(f, colls));
}
function filter(pred, xs) {
    return seq$a(xs) ? lazySeq(function() {
        let ys = xs;
        while(seq$a(ys)){
            const head = first$d(ys), tail = rest$d(ys);
            if (pred(head)) {
                return cons(head, lazySeq(function() {
                    return filter(pred, tail);
                }));
            }
            ys = tail;
        }
        return emptyList();
    }) : emptyList();
}
const detect = comp(first$d, filter);
function cycle(coll) {
    return seq$a(coll) ? lazySeq(function() {
        return cons(first$d(coll), concat(rest$d(coll), cycle(coll)));
    }) : emptyList();
}
function treeSeq(branch1, children1, root1) {
    function walk(node) {
        return cons(node, branch1(node) ? mapcat(walk, children1(node)) : emptyList());
    }
    return walk(root1);
}
function flatten(coll) {
    return filter(complement(satisfies(ISequential$1)), rest$d(treeSeq(satisfies(ISequential$1), seq$a, coll)));
}
function zip(...colls) {
    return mapcat(identity, map(seq$a, ...colls));
}
const filtera = comp(toArray, filter);
function remove(pred, xs) {
    return filter(complement(pred), xs);
}
function keep(f, xs) {
    return filter(isSome, map(f, xs));
}
function drop(n, coll) {
    let i = n, xs = seq$a(coll);
    while(i > 0 && xs){
        xs = rest$d(xs);
        i = i - 1;
    }
    return xs;
}
function dropWhile(pred, xs) {
    return seq$a(xs) ? pred(first$d(xs)) ? dropWhile(pred, rest$d(xs)) : xs : emptyList();
}
function dropLast(n, coll) {
    return map(function(x, _) {
        return x;
    }, coll, drop(n, coll));
}
function take(n, coll) {
    const xs = seq$a(coll);
    return n > 0 && xs ? lazySeq(function() {
        return cons(first$d(xs), take(n - 1, rest$d(xs)));
    }) : emptyList();
}
function takeWhile(pred, xs) {
    return seq$a(xs) ? lazySeq(function() {
        const item = first$d(xs);
        return pred(item) ? cons(item, lazySeq(function() {
            return takeWhile(pred, rest$d(xs));
        })) : emptyList();
    }) : emptyList();
}
function takeNth(n, xs) {
    return seq$a(xs) ? lazySeq(function() {
        return cons(first$d(xs), takeNth(n, drop(n, xs)));
    }) : emptyList();
}
function takeLast(n, coll) {
    return n ? drop(count$b(coll) - n, coll) : emptyList();
}
function interleave2(xs, ys) {
    const as = seq$a(xs), bs = seq$a(ys);
    return as != null && bs != null ? cons(first$d(as), lazySeq(function() {
        return cons(first$d(bs), interleave2(rest$d(as), rest$d(bs)));
    })) : emptyList();
}
function interleaveN(...colls) {
    return concatenated(interleaved(colls));
}
function interleaved(colls) {
    return seq$a(filter(isNil, colls)) ? emptyList() : lazySeq(function() {
        return cons(map(first$d, colls), interleaved(map(next$a, colls)));
    });
}
const interleave = overload(null, null, interleave2, interleaveN);
function interpose(sep, xs) {
    return drop(1, interleave2(repeat1(sep), xs));
}
function partition2(n, xs) {
    return partition3(n, n, xs);
}
function partition3(n, step, xs) {
    const coll = seq$a(xs);
    if (!coll) return xs;
    const part = take(n, coll);
    return n === count$b(part) ? cons(part, partition3(n, step, drop(step, coll))) : emptyList();
}
function partition4(n, step, pad, xs) {
    const coll = seq$a(xs);
    if (!coll) return xs;
    const part = take(n, coll);
    return n === count$b(part) ? cons(part, partition4(n, step, pad, drop(step, coll))) : cons(take(n, concat(part, pad)));
}
const partition = overload(null, null, partition2, partition3, partition4);
function partitionAll1(n) {
    return partial(partitionAll, n);
}
function partitionAll2(n, xs) {
    return partitionAll3(n, n, xs);
}
function partitionAll3(n, step, xs) {
    const coll = seq$a(xs);
    if (!coll) return xs;
    return cons(take(n, coll), partitionAll3(n, step, drop(step, coll)));
}
const partitionAll = overload(null, partitionAll1, partitionAll2, partitionAll3);
function partitionBy(f, xs) {
    const coll = seq$a(xs);
    if (!coll) return xs;
    const head = first$d(coll), val2 = f(head), run1 = cons(head, takeWhile(function(x) {
        return val2 === f(x);
    }, next$a(coll)));
    return cons(run1, partitionBy(f, seq$a(drop(count$b(run1), coll))));
}
function last1(coll) {
    let xs = coll, ys = null;
    while(ys = next$a(xs)){
        xs = ys;
    }
    return first$d(xs);
}
function last2(n, coll) {
    let xs = coll, ys = [];
    while(seq$a(xs)){
        ys.push(first$d(xs));
        while(ys.length > n){
            ys.shift();
        }
        xs = next$a(xs);
    }
    return ys;
}
const last = overload(null, last1, last2);
function dedupe1(coll) {
    return dedupe2(identity, coll);
}
function dedupe2(f, coll) {
    return dedupe3(f, equiv$a, coll);
}
function dedupe3(f, equiv2, coll) {
    return seq$a(coll) ? lazySeq(function() {
        let xs = seq$a(coll);
        const last3 = first$d(xs);
        while(next$a(xs) && equiv2(f(first$d(next$a(xs))), f(last3))){
            xs = next$a(xs);
        }
        return cons(last3, dedupe2(f, next$a(xs)));
    }) : coll;
}
const dedupe = overload(null, dedupe1, dedupe2, dedupe3);
function repeatedly1(f) {
    return lazySeq(function() {
        return cons(f(), repeatedly1(f));
    });
}
function repeatedly2(n, f) {
    return take(n, repeatedly1(f));
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
    return !seq$a(coll);
}
function notEmpty(coll) {
    return isEmpty(coll) ? null : coll;
}
function asc2(compare1, f) {
    return function(a, b) {
        return compare1(f(a), f(b));
    };
}
function asc1(f) {
    return asc2(compare$6, f);
}
const asc = overload(constantly(compare$6), asc1, asc2);
function desc0() {
    return function(a, b) {
        return compare$6(b, a);
    };
}
function desc2(compare2, f) {
    return function(a, b) {
        return compare2(f(b), f(a));
    };
}
function desc1(f) {
    return desc2(compare$6, f);
}
const desc = overload(desc0, desc1, desc2);
function sort1(coll) {
    return sort2(compare$6, coll);
}
function sort2(compare3, coll) {
    return into([], coll).sort(compare3);
}
function sortN(...args) {
    const compares = initial(args), coll = last(args);
    function compare4(x, y) {
        return reduce$e(function(memo, compare5) {
            return memo === 0 ? compare5(x, y) : reduced$1(memo);
        }, 0, compares);
    }
    return sort2(compare4, coll);
}
const sort = overload(null, sort1, sort2, sortN);
function sortBy2(keyFn, coll) {
    return sortBy3(keyFn, compare$6, coll);
}
function sortBy3(keyFn, compare, coll) {
    return sort(function(x, y) {
        return compare$6(keyFn(x), keyFn(y));
    }, coll);
}
const sortBy = overload(null, null, sortBy2, sortBy3);
function withIndex(iter) {
    return function(f, xs) {
        let idx6 = -1;
        return iter(function(x) {
            return f(++idx6, x);
        }, xs);
    };
}
const butlast = partial(dropLast, 1);
const initial = butlast;
const eachIndexed = withIndex(each);
const mapIndexed = withIndex(map);
const keepIndexed = withIndex(keep);
const splitAt = juxt(take, drop);
const splitWith = juxt(takeWhile, dropWhile);
function braid3(f, xs, ys) {
    return mapcat(function(x) {
        return map(function(y) {
            return f(x, y);
        }, ys);
    }, xs);
}
function braid4(f, xs, ys, zs) {
    return mapcat(function(x) {
        return mapcat(function(y) {
            return map(function(z) {
                return f(x, y, z);
            }, zs);
        }, ys);
    }, xs);
}
function braidN(f, xs, ...colls) {
    if (seq$a(colls)) {
        return mapcat(function(x) {
            return apply(braid, function(...args) {
                return apply(f, x, args);
            }, colls);
        }, xs);
    } else {
        return map(f, xs || []);
    }
}
const braid = overload(null, null, map, braid3, braid4, braidN);
function best2(better, xs) {
    const coll = seq$a(xs);
    return coll ? reduce$e(function(a, b) {
        return better(a, b) ? a : b;
    }, first$d(coll), rest$d(coll)) : null;
}
function best3(f, better, xs) {
    const coll = seq$a(xs);
    return coll ? reduce$e(function(a, b) {
        return better(f(a), f(b)) ? a : b;
    }, first$d(coll), rest$d(coll)) : null;
}
const best = overload(null, best2, best3);
function scan1(xs) {
    return scan2(2, xs);
}
function scan2(n, xs) {
    return lazySeq(function() {
        const ys = take(n, xs);
        return count$b(ys) === n ? cons(ys, scan2(n, rest$d(xs))) : emptyList();
    });
}
const scan = overload(null, scan1, scan2);
function isDistinct1(coll) {
    let seen = new Set();
    return reduce$e(function(memo, x) {
        if (memo && seen.has(x)) {
            return reduced$1(false);
        }
        seen.add(x);
        return memo;
    }, true, coll);
}
function isDistinctN(...xs) {
    return isDistinct1(xs);
}
const isDistinct = overload(null, constantly(true), function(a, b) {
    return a !== b;
}, isDistinctN);
function dorun1(coll) {
    let xs = seq$a(coll);
    while(xs){
        xs = next$a(xs);
    }
}
function dorun2(n, coll) {
    let xs = seq$a(coll);
    while(xs && n > 0){
        n++;
        xs = next$a(xs);
    }
}
const dorun = overload(null, dorun1, dorun2);
function doall1(coll) {
    dorun(coll);
    return coll;
}
function doall2(n, coll) {
    dorun(n, coll);
    return coll;
}
const doall = overload(null, doall1, doall2);
function iterate$1(f, x) {
    return lazySeq(function() {
        return cons(x, iterate$1(f, f(x)));
    });
}
const integers = range(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1);
const positives = range(1, Number.MAX_SAFE_INTEGER, 1);
const negatives = range(-1, Number.MIN_SAFE_INTEGER, -1);
function dotimes(n, f) {
    each(f, range(n));
}
function randNth(coll) {
    return nth$6(coll, randInt(count$b(coll)));
}
function cond(...xs) {
    const conditions = isEven(count$b(xs)) ? xs : Array.from(concat(butlast(xs), [
        constantly(true),
        last(xs)
    ]));
    return function(...args) {
        return reduce$e(function(memo, condition) {
            const pred = first$d(condition);
            return pred(...args) ? reduced$1(first$d(rest$d(condition))) : memo;
        }, null, partition(2, conditions));
    };
}
function join1(xs) {
    return into("", map2(str, xs));
}
function join2(sep, xs) {
    return join1(interpose(sep, xs));
}
const join = overload(null, join1, join2);
function shuffle(coll) {
    let a = Array.from(coll);
    let j, x, i;
    for(i = a.length - 1; i > 0; i--){
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
function generate(iterable1) {
    let iter = iterable1[Symbol.iterator]();
    return function() {
        return iter.done ? null : iter.next().value;
    };
}
function splice4(self, start6, nix, coll) {
    return concat(take(start6, self), coll, drop(start6 + nix, self));
}
function splice3(self, start7, coll) {
    return splice4(self, start7, 0, coll);
}
const splice = overload(null, null, null, splice3, splice4);
function also(f, xs) {
    return concat(xs, mapcat(function(x) {
        const result = f(x);
        return satisfies(ISequential$1, result) ? result : [
            result
        ];
    }, xs));
}
function countBy(f, coll) {
    return reduce$e(function(memo, value) {
        let by = f(value), n = memo[by];
        memo[by] = n ? inc(n) : 1;
        return memo;
    }, {}, coll);
}
function groupBy3(init, f, coll) {
    return reduce$e(function(memo, value) {
        return update(memo, f(value), function(group) {
            return conj$8(group || [], value);
        });
    }, init, coll);
}
function groupBy2(f, coll) {
    return groupBy3({}, f, coll);
}
const groupBy = overload(null, null, groupBy2, groupBy3);
function index4(init, key29, val3, coll) {
    return reduce$e(function(memo, x) {
        return assoc$8(memo, key29(x), val3(x));
    }, init, coll);
}
function index3(key30, val4, coll) {
    return index4({}, key30, val4, coll);
}
function index2(key31, coll) {
    return index4({}, key31, identity, coll);
}
const index = overload(null, null, index2, index3, index4);
function coalesce(...fs) {
    return function(...args) {
        return detect(isSome, map(applying(...args), fs));
    };
}
function lazyIterable1(iter) {
    return lazyIterable2(iter, emptyList());
}
function lazyIterable2(iter, done) {
    const res = iter.next();
    return res.done ? done : lazySeq(function() {
        return cons(res.value, lazyIterable1(iter));
    });
}
const lazyIterable = overload(null, lazyIterable1, lazyIterable2);
function isReduced(self) {
    return is(self, Reduced);
}
function unreduced(self) {
    return isReduced(self) ? self.valueOf() : self;
}
function deref$a(self) {
    return self.valueOf();
}
var behave$C = does(keying("Reduced"), implement(IDeref, {
    deref: deref$a
}));
behave$C(Reduced);
const compact1$1 = partial(filter, identity);
function compact2$1(self, pred) {
    return remove(pred, self);
}
const compact$2 = overload(null, compact1$1, compact2$1);
function fmap$a(self, f) {
    return map(f, self);
}
function conj$6(self, value) {
    return cons(value, self);
}
function seq$9(self) {
    return seq$a(self.perform());
}
function blank$4(self) {
    return seq$9(self) == null;
}
function iterate(self) {
    let state = self;
    return {
        next: function() {
            let result = seq$a(state) ? {
                value: first$d(state),
                done: false
            } : {
                done: true
            };
            state = next$a(state);
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
function find$4(coll, key32) {
    return reducekv$9(coll, function(memo, k, v) {
        return key32 === k ? reduced$1([
            k,
            v
        ]) : memo;
    }, null);
}
function first$c(self) {
    return first$d(self.perform());
}
function rest$c(self) {
    return rest$d(self.perform());
}
function next$9(self) {
    return seq$a(rest$d(self));
}
function nth$5(self, n) {
    let xs = self, idx7 = 0;
    while(xs){
        let x = first$d(xs);
        if (idx7 === n) {
            return x;
        }
        idx7++;
        xs = next$a(xs);
    }
    return null;
}
function idx$2(self, x) {
    let xs = seq$a(self), n = 0;
    while(xs){
        if (x === first$d(xs)) {
            return n;
        }
        n++;
        xs = next$a(xs);
    }
    return null;
}
function reduce$b(xs, f, init) {
    let memo = init, ys = seq$a(xs);
    while(ys && !isReduced(memo)){
        memo = f(memo, first$d(ys));
        ys = next$a(ys);
    }
    return unreduced(memo);
}
function reducekv$9(xs, f, init) {
    let memo = init, ys = seq$a(xs), idx8 = 0;
    while(ys && !isReduced(memo)){
        memo = f(memo, idx8++, first$d(ys));
        ys = next$a(ys);
    }
    return unreduced(memo);
}
function count$a(self) {
    return reduce$b(self, function(memo) {
        return memo + 1;
    }, 0);
}
function append$5(self, other) {
    return concat(self, [
        other
    ]);
}
function omit$2(self, value) {
    return remove(function(x) {
        return x === value;
    }, self);
}
function includes$8(self, value) {
    return detect(function(x) {
        return x === value;
    }, self);
}
const reverse$3 = comp(reverse$4, toArray);
const reductive = does(implement(IReducible, {
    reduce: reduce$b
}), implement(IKVReducible, {
    reducekv: reducekv$9
}));
var lazyseq = does(iterable, iequiv, reductive, keying("LazySeq"), implement(ISequential$1), implement(IIndexed, {
    nth: nth$5,
    idx: idx$2
}), implement(IReversible, {
    reverse: reverse$3
}), implement(IBlankable, {
    blank: blank$4
}), implement(ICompactible, {
    compact: compact$2
}), implement(IInclusive, {
    includes: includes$8
}), implement(IOmissible, {
    omit: omit$2
}), implement(IFunctor, {
    fmap: fmap$a
}), implement(ICollection, {
    conj: conj$6
}), implement(IAppendable, {
    append: append$5
}), implement(IPrependable, {
    prepend: conj$6
}), implement(ICounted, {
    count: count$a
}), implement(IFind, {
    find: find$4
}), implement(IEmptyableCollection, {
    empty: emptyList
}), implement(ISeq, {
    first: first$c,
    rest: rest$c
}), implement(ISeqable, {
    seq: seq$9
}), implement(INext, {
    next: next$9
}));
lazyseq(LazySeq);
function Multimap(attrs, empty1) {
    this.attrs = attrs;
    this.empty = empty1;
}
function multimap(attrs, empty2) {
    return new Multimap(attrs || {}, empty2 || function() {
        return [];
    });
}
Multimap.prototype[Symbol.toStringTag] = "Multimap";
const clone$4 = IClonable.clone;
function coerce(self, Type) {
    return is(Type, Object) ? self.attrs : coerce$1(self.attrs, Type);
}
function contains$7(self, key33) {
    return self.attrs.hasOwnProperty(key33);
}
function lookup$8(self, key34) {
    return get(self.attrs, key34);
}
function seq$8(self) {
    return seq$a(self.attrs);
}
function count$9(self) {
    return count$b(self.attrs);
}
function first$b(self) {
    return first$d(seq$8(self));
}
function rest$b(self) {
    return rest$d(seq$8(self));
}
function keys$a(self) {
    return keys$b(self.attrs);
}
function vals$4(self) {
    return vals$5(self.attrs);
}
function assoc$6(self, key35, value) {
    return Object.assign(clone$4(self), {
        attrs: assoc$8(self.attrs, key35, value)
    });
}
function dissoc$4(self, key36) {
    return Object.assign(clone$4(self), {
        attrs: dissoc$5(self.attrs, key36)
    });
}
function equiv$7(self, other) {
    return count$b(self) === count$b(other) && reducekv$8(self, function(memo, key37, value) {
        return memo ? equiv$a(get(other, key37), value) : reduced$1(memo);
    }, true);
}
function empty$2(self) {
    return Object.assign(clone$4(self), {
        attrs: {}
    });
}
function reduce$a(self, f, init) {
    return reduce$e(function(memo, key38) {
        return f(memo, [
            key38,
            lookup$8(self, key38)
        ]);
    }, init, keys$b(self));
}
function reducekv$8(self, f, init) {
    return reduce$e(function(memo, key39) {
        return f(memo, key39, lookup$8(self, key39));
    }, init, keys$b(self));
}
function construct(Type) {
    return function record(attrs) {
        return Object.assign(Object.create(Type.prototype), {
            attrs: attrs
        });
    };
}
function emptyable(Type) {
    function empty3() {
        return new Type();
    }
    implement(IEmptyableCollection, {
        empty: empty3
    }, Type);
}
var behave$B = does(emptyable, implement(IReducible, {
    reduce: reduce$a
}), implement(IKVReducible, {
    reducekv: reducekv$8
}), implement(IEquiv, {
    equiv: equiv$7
}), implement(ICoercible, {
    coerce
}), implement(IEmptyableCollection, {
    empty: empty$2
}), implement(IAssociative, {
    assoc: assoc$6,
    contains: contains$7
}), implement(ILookup, {
    lookup: lookup$8
}), implement(IMap, {
    dissoc: dissoc$4,
    keys: keys$a,
    vals: vals$4
}), implement(ISeq, {
    first: first$b,
    rest: rest$b
}), implement(ICounted, {
    count: count$9
}), implement(ISeqable, {
    seq: seq$8
}));
function keys$9(self) {
    return Object.keys(self.attrs);
}
function count$8(self) {
    return count$b(seq$7(self));
}
function seq$7(self) {
    return concatenated(map(function(key40) {
        return map(function(value) {
            return [
                key40,
                value
            ];
        }, seq$a(get(self, key40)) || emptyList());
    }, keys$9(self)));
}
function first$a(self) {
    return first$d(seq$7(self));
}
function rest$a(self) {
    return rest$d(seq$7(self));
}
function lookup$7(self, key41) {
    return get(self.attrs, key41);
}
function assoc$5(self, key42, value) {
    const values = lookup$7(self, key42) || self.empty(key42);
    return new self.constructor(assoc$8(self.attrs, key42, conj$8(values, value)), self.empty);
}
function contains$6(self, key43) {
    return contains$8(self.attrs, key43);
}
function reduce$9(self, f, init) {
    return reduce$e(function(memo, pair) {
        return f(memo, pair);
    }, init, seq$7(self));
}
function reducekv$7(self, f, init) {
    return reduce$9(self, function(memo, [key44, value]) {
        return f(memo, key44, value);
    }, init);
}
var behave$A = does(behave$B, keying("Multimap"), implement(IMap, {
    keys: keys$9
}), implement(IReducible, {
    reduce: reduce$9
}), implement(IKVReducible, {
    reducekv: reducekv$7
}), implement(ICounted, {
    count: count$8
}), implement(ISeqable, {
    seq: seq$7
}), implement(ILookup, {
    lookup: lookup$7
}), implement(IAssociative, {
    assoc: assoc$5,
    contains: contains$6
}), implement(ISeq, {
    first: first$a,
    rest: rest$a
}));
behave$A(Multimap);
function IndexedSeq(seq1, start8) {
    this.seq = seq1;
    this.start = start8;
}
function indexedSeq1(seq3) {
    return indexedSeq2(seq3, 0);
}
function indexedSeq2(seq4, start9) {
    return start9 < count$b(seq4) ? new IndexedSeq(seq4, start9) : emptyList();
}
const indexedSeq = overload(null, indexedSeq1, indexedSeq2);
IndexedSeq.prototype[Symbol.toStringTag] = "IndexedSeq";
function RevSeq(coll, idx9) {
    this.coll = coll;
    this.idx = idx9;
}
RevSeq.prototype[Symbol.toStringTag] = "RevSeq";
function revSeq(coll, idx10) {
    return new RevSeq(coll, idx10);
}
function hashSeq(hs) {
    return reduce$e(function(h1, h2) {
        return 3 * h1 + h2;
    }, 0, map(hash$7, hs));
}
function hashKeyed(self) {
    return reduce$e(function(memo, key45) {
        return hashSeq([
            memo,
            key45,
            get(self, key45)
        ]);
    }, 0, sort(keys$b(self)));
}
function reverse$2(self) {
    let c = count$7(self);
    return c > 0 ? revSeq(self, c - 1) : null;
}
function key$1(self) {
    return lookup$6(self, 0);
}
function val$1(self) {
    return lookup$6(self, 1);
}
function find$3(self, key46) {
    return contains$5(self, key46) ? [
        key46,
        lookup$6(self, key46)
    ] : null;
}
function contains$5(self, key47) {
    return key47 < count$b(self.seq) - self.start;
}
function lookup$6(self, key48) {
    return get(self.seq, self.start + key48);
}
function append$4(self, x) {
    return concat(self, [
        x
    ]);
}
function prepend$4(self, x) {
    return concat([
        x
    ], self);
}
function next$8(self) {
    const pos = self.start + 1;
    return pos < count$b(self.seq) ? indexedSeq(self.seq, pos) : null;
}
function nth$4(self, idx11) {
    return nth$6(self.seq, idx11 + self.start);
}
function idx2(self, x) {
    return idx3(self, x, 0);
}
function idx3(self, x, idx12) {
    if (first$9(self) === x) {
        return idx12;
    }
    const nxt = next$8(self);
    return nxt ? idx3(nxt, x, idx12 + 1) : null;
}
const idx$1 = overload(null, null, idx2, idx3);
function first$9(self) {
    return nth$4(self, 0);
}
function rest$9(self) {
    return indexedSeq(self.seq, self.start + 1);
}
function count$7(self) {
    return count$b(self.seq) - self.start;
}
function reduce$8(self, f, init) {
    let memo = init, coll = seq$a(self);
    while(coll && !isReduced(memo)){
        memo = f(memo, first$d(coll));
        coll = next$a(coll);
    }
    return unreduced(memo);
}
function reducekv$6(self, f, init) {
    let idx13 = 0;
    return reduce$8(self, function(memo, value) {
        memo = f(memo, idx13, value);
        idx13 += 1;
        return memo;
    }, init);
}
function includes$7(self, x) {
    return detect(function(y) {
        return y === x;
    }, drop(self.start, self.seq));
}
var behave$z = does(iterable, iequiv, keying("IndexedSeq"), implement(ISequential$1), implement(IHashable, {
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
    includes: includes$7
}), implement(IFind, {
    find: find$3
}), implement(IAssociative, {
    contains: contains$5
}), implement(IAppendable, {
    append: append$4
}), implement(IPrependable, {
    prepend: prepend$4
}), implement(IEmptyableCollection, {
    empty: emptyArray
}), implement(IReducible, {
    reduce: reduce$8
}), implement(IKVReducible, {
    reducekv: reducekv$6
}), implement(IFn, {
    invoke: lookup$6
}), implement(ILookup, {
    lookup: lookup$6
}), implement(ICollection, {
    conj: append$4
}), implement(INext, {
    next: next$8
}), implement(ISeq, {
    first: first$9,
    rest: rest$9
}), implement(ISeqable, {
    seq: identity
}), implement(ICounted, {
    count: count$7
}));
behave$z(IndexedSeq);
function clone$3(self) {
    return new revSeq(self.coll, self.idx);
}
function count$6(self) {
    return count$b(self.coll);
}
function keys$8(self) {
    return range(count$6(self));
}
function vals$3(self) {
    var _self, _nth;
    return map((_nth = nth$3, _self = self, function nth(_argPlaceholder) {
        return _nth(_self, _argPlaceholder);
    }), keys$8(self));
}
function nth$3(self, idx14) {
    return nth$6(self.coll, count$6(self) - 1 - idx14);
}
function first$8(self) {
    return nth$6(self.coll, self.idx);
}
function rest$8(self) {
    return next$a(self) || emptyList();
}
function next$7(self) {
    return self.idx > 0 ? revSeq(self.coll, self.idx - 1) : null;
}
function conj$5(self, value) {
    return cons(value, self);
}
function reduce2(coll, f) {
    let xs = seq$a(coll);
    return xs ? reduce$e(f, first$d(xs), next$a(xs)) : f();
}
function reduce3(coll, f, init) {
    let memo = init, xs = seq$a(coll);
    while(xs){
        memo = f(memo, first$d(xs));
        if (isReduced(memo)) {
            break;
        }
        xs = next$a(xs);
    }
    return unreduced(memo);
}
const reduce$7 = overload(null, null, reduce2, reduce3);
var behave$y = does(iterable, keying("RevSeq"), implement(ISequential$1), implement(ICounted, {
    count: count$6
}), implement(IIndexed, {
    nth: nth$3
}), implement(ILookup, {
    lookup: nth$3
}), implement(IMap, {
    keys: keys$8,
    vals: vals$3
}), implement(IEmptyableCollection, {
    empty: emptyList
}), implement(IReducible, {
    reduce: reduce$7
}), implement(ICollection, {
    conj: conj$5
}), implement(ISeq, {
    first: first$8,
    rest: rest$8
}), implement(INext, {
    next: next$7
}), implement(ISeqable, {
    seq: identity
}), implement(IClonable, {
    clone: clone$3
}));
behave$y(RevSeq);
function clone$2(self) {
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
function keys$7(self) {
    return range(count$5(self));
}
function _dissoc(self, idx15) {
    self.splice(idx15, 1);
}
function dissoc$3(self, idx16) {
    let arr = Array.from(self);
    _dissoc(arr, idx16);
    return arr;
}
function reduce$6(xs, f, init) {
    let memo = init, to = xs.length - 1;
    for(let i = 0; i <= to; i++){
        if (isReduced(memo)) break;
        memo = f(memo, xs[i]);
    }
    return unreduced(memo);
}
function reducekv$5(xs, f, init) {
    let memo = init, len = xs.length;
    for(let i = 0; i < len; i++){
        if (isReduced(memo)) break;
        memo = f(memo, i, xs[i]);
    }
    return unreduced(memo);
}
function omit$1(self, value) {
    return filter(function(x) {
        return x !== value;
    }, self);
}
function reverse$1(self) {
    let c = count$5(self);
    return c > 0 ? revSeq(self, c - 1) : null;
}
function key(self) {
    return self[0];
}
function val(self) {
    return self[1];
}
function find$2(self, key49) {
    return contains$4(self, key49) ? [
        key49,
        lookup$5(self, key49)
    ] : null;
}
function lookup$5(self, key50) {
    return key50 in self ? self[key50] : null;
}
function assoc$4(self, key51, value) {
    if (key51 < 0 || key51 > count$5(self)) {
        throw new Error(`Index ${key51} out of bounds`);
    }
    if (lookup$5(self, key51) === value) {
        return self;
    }
    const arr = Array.from(self);
    arr.splice(key51, 1, value);
    return arr;
}
function contains$4(self, key52) {
    return key52 > -1 && key52 < self.length;
}
function seq$6(self) {
    return self.length ? self : null;
}
function unconj(self, x) {
    let arr = Array.from(self);
    const pos = arr.lastIndexOf(x);
    arr.splice(pos, 1);
    return arr;
}
function append$3(self, x) {
    return self.concat([
        x
    ]);
}
function prepend$3(self, x) {
    return [
        x
    ].concat(self);
}
function next$6(self) {
    return self.length > 1 ? rest$7(self) : null;
}
function first$7(self) {
    return self[0];
}
function rest$7(self) {
    return indexedSeq(self, 1);
}
function includes$6(self, x) {
    return self.indexOf(x) > -1;
}
function count$5(self) {
    return self.length;
}
const nth$2 = lookup$5;
function idx(self, x) {
    const n = self.indexOf(x);
    return n === -1 ? null : n;
}
function fmap$9(self, f) {
    return mapa(f, self);
}
const blank$3 = complement(seq$6);
const iindexed = does(implement(IIndexed, {
    nth: nth$2,
    idx
}), implement(ICounted, {
    count: count$5
}));
function flatMap$4(self, f) {
    return self.flat().map(f);
}
var behave$x = does(iequiv, iindexed, keying("Array"), implement(ISequential$1), implement(IFlatMappable, {
    flatMap: flatMap$4
}), implement(IHashable, {
    hash: hashSeq
}), implement(IMap, {
    dissoc: dissoc$3,
    keys: keys$7,
    vals: identity
}), implement(IMergable, {
    merge: concat
}), implement(IInsertable, {
    before: before$1,
    after: after$1
}), implement(IFunctor, {
    fmap: fmap$9
}), implement(IOmissible, {
    omit: omit$1
}), implement(IReversible, {
    reverse: reverse$1
}), implement(IFind, {
    find: find$2
}), implement(IMapEntry, {
    key,
    val
}), implement(IInclusive, {
    includes: includes$6
}), implement(IAppendable, {
    append: append$3
}), implement(IPrependable, {
    prepend: prepend$3
}), implement(IClonable, {
    clone: clone$2
}), implement(IFn, {
    invoke: lookup$5
}), implement(IEmptyableCollection, {
    empty: emptyArray
}), implement(IReducible, {
    reduce: reduce$6
}), implement(IKVReducible, {
    reducekv: reducekv$5
}), implement(ILookup, {
    lookup: lookup$5
}), implement(IAssociative, {
    assoc: assoc$4,
    contains: contains$4
}), implement(IBlankable, {
    blank: blank$3
}), implement(ISeqable, {
    seq: seq$6
}), implement(ICollection, {
    conj: append$3,
    unconj
}), implement(INext, {
    next: next$6
}), implement(ISeq, {
    first: first$7,
    rest: rest$7
}));
Object.assign(behaviors, {
    Array: behave$x
});
behave$x(Array);
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
    const day1 = dow1(self);
    return day1 == null ? null : day1 == 0 || day1 == 6;
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
    let dt = clone$4(self);
    while(n < 0){
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
function time(hour1, minute1, second1, millisecond1) {
    return {
        hour: hour1 || 0,
        minute: minute1 || 0,
        second: second1 || 0,
        millisecond: millisecond1 || 0
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
function annually(month1, day2) {
    return {
        month: month1,
        day: day2,
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
const start$2 = IBounded.start;
const end$2 = IBounded.end;
function chronology(item) {
    const s = start$2(item), e = end$2(item);
    return s == null || e == null ? [
        s,
        e
    ] : [
        s,
        e
    ].sort(compare$6);
}
function inside(sr, er, b) {
    if (b == null) {
        return false;
    }
    if (sr == null && er == null) {
        return true;
    }
    return (sr == null || compare$6(b, sr) >= 0) && (er == null || compare$6(b, er) < 0);
}
function between(a, b) {
    const [sa, ea] = chronology(a), [sb, eb] = chronology(b);
    return inside(sa, ea, sb) && inside(sa, ea, eb);
}
function overlap(self, other) {
    const make = constructs(self.constructor), ss = start$2(self), es = end$2(self), so = start$2(other), eo = end$2(other), sn = isNil(ss) || isNil(so) ? ss || so : gt(ss, so) ? ss : so, en = isNil(es) || isNil(eo) ? es || eo : lt(es, eo) ? es : eo;
    return lte(sn, en) ? make(sn, en) : null;
}
const divide$2 = overload(null, identity, IDivisible.divide, reducing(IDivisible.divide));
var p$4 = Object.freeze({
    __proto__: null,
    start: start$2,
    end: end$2,
    inside: inside,
    between: between,
    overlap: overlap,
    directed: directed,
    steps: steps,
    subtract: subtract,
    add: add$3,
    inc: inc,
    dec: dec,
    divide: divide$2,
    coerce: coerce$1,
    compare: compare$6,
    lt: lt,
    lte: lte,
    gt: gt,
    gte: gte,
    kin: kin,
    equiv: equiv$a,
    alike: alike,
    equivalent: equivalent,
    eq: eq,
    notEq: notEq
});
function Period(start10, end5) {
    this.start = start10;
    this.end = end5;
}
function emptyPeriod() {
    return new Period();
}
function period1(obj11) {
    return period2(patch(obj11, sod()), patch(obj11, eod()));
}
function period2(start11, end6) {
    const pd = new Period(start11, end6 == null || isDate(end6) ? end6 : add$3(start11, end6));
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
function Benchmark(operation, result, period3, duration1) {
    this.operation = operation;
    this.result = result;
    this.period = period3;
    this.duration = duration1;
}
Benchmark.prototype[Symbol.toStringTag] = "Benchmark";
function benchmark1(operation) {
    const start12 = new Date();
    return Promise.resolve(operation()).then(function(result) {
        const end7 = new Date();
        return new Benchmark(operation, result, period(start12, end7), end7 - start12);
    });
}
function benchmark2(n, operation) {
    return benchmark3(n, operation, []).then(function(xs) {
        return sort(asc(duration$1), xs);
    }).then(function(xs) {
        return Object.assign({
            source: xs,
            operation: first$d(xs).operation
        }, measure(mapa(duration$1, xs)));
    });
}
function benchmark3(n, operation, benchmarked) {
    return n ? benchmark1(operation).then(function(bm) {
        return benchmark3(n - 1, operation, benchmarked.concat(bm));
    }) : benchmarked;
}
const benchmark = overload(null, benchmark1, benchmark2);
function duration$1(x) {
    return x.duration;
}
function race1(operations) {
    return race2(10, operations);
}
function race2(n, operations) {
    return race3(n, operations, []).then(function(measures) {
        return sort(asc(average), asc(most), measures);
    });
}
function race3(n, operations, measures1) {
    return Promise.all([
        measures1,
        benchmark(n, first$d(operations))
    ]).then(function([xs, x]) {
        const measures = xs.concat(x);
        return next$a(operations) ? race3(n, next$a(operations), measures) : measures;
    });
}
const race = overload(null, race1, race2, race3);
function average(x) {
    return x.average;
}
function most(x) {
    return x.most;
}
function start$1(self) {
    return start$2(self.period);
}
function end$1(self) {
    return end$2(self.period);
}
var behave$w = does(keying("Benchmark"), implement(IBounded, {
    start: start$1,
    end: end$1
}));
behave$w(Benchmark);
function conj$4(self, x) {
    return new self.constructor(conj$8(self.colls, [
        x
    ]));
}
function next$5(self) {
    const tail = rest$d(self);
    return seq$a(tail) ? tail : null;
}
function first$6(self) {
    return first$d(first$d(self.colls));
}
function rest$6(self) {
    return apply(concat, rest$d(first$d(self.colls)), rest$d(self.colls));
}
function reduce$5(self, f, init) {
    let memo = init, remaining = self;
    while(!isReduced(memo) && seq$a(remaining)){
        memo = f(memo, first$d(remaining));
        remaining = next$a(remaining);
    }
    return unreduced(memo);
}
function reducekv$4(self, f, init) {
    let memo = init, remaining = self, idx17 = 0;
    while(!isReduced(memo) && seq$a(remaining)){
        memo = f(memo, idx17, first$d(remaining));
        remaining = next$a(remaining);
        idx17++;
    }
    return unreduced(memo);
}
function count$4(self) {
    return reduce$5(self, function(memo, value) {
        return memo + 1;
    }, 0);
}
var behave$v = does(iterable, keying("Concatenated"), implement(IKVReducible, {
    reducekv: reducekv$4
}), implement(IReducible, {
    reduce: reduce$5
}), implement(IHashable, {
    hash: hashSeq
}), implement(ISequential$1), implement(IEmptyableCollection, {
    empty: emptyList
}), implement(ICollection, {
    conj: conj$4
}), implement(INext, {
    next: next$5
}), implement(ISeq, {
    first: first$6,
    rest: rest$6
}), implement(ISeqable, {
    seq: identity
}), implement(ICounted, {
    count: count$4
}));
behave$v(Concatenated);
function date7(year1, month2, day3, hour2, minute2, second2, millisecond2) {
    return new Date(year1, month2 || 0, day3 || 1, hour2 || 0, minute2 || 0, second2 || 0, millisecond2 || 0);
}
const create = constructs(Date);
const date = overload(create, create, date7);
Date.prototype[Symbol.toStringTag] = "Date";
var p$3 = Object.freeze({
    __proto__: null,
    directed: directed,
    steps: steps,
    subtract: subtract,
    add: add$3,
    inc: inc,
    dec: dec,
    get: get,
    getIn: getIn,
    reduce: reduce$e,
    reducing: reducing,
    includes: includes$9,
    excludes: excludes,
    transpose: transpose,
    assoc: assoc$8,
    assocIn: assocIn,
    update: update,
    contains: contains$8,
    updateIn: updateIn,
    rewrite: rewrite,
    prop: prop,
    patch: patch,
    keys: keys$b,
    vals: vals$5,
    dissoc: dissoc$5,
    coerce: coerce$1
});
var _Duration, _p$coerce$1, _p$1, _mult;
const toDuration = (_p$1 = p$3, _p$coerce$1 = _p$1.coerce, _Duration = Duration, function coerce(_argPlaceholder) {
    return _p$coerce$1.call(_p$1, _argPlaceholder, _Duration);
});
function Duration(units) {
    this.units = units;
}
function valueOf() {
    const units = this.units;
    return (units.year || 0) * 1000 * 60 * 60 * 24 * 365.25 + (units.month || 0) * 1000 * 60 * 60 * 24 * 30.4375 + (units.day || 0) * 1000 * 60 * 60 * 24 + (units.hour || 0) * 1000 * 60 * 60 + (units.minute || 0) * 1000 * 60 + (units.second || 0) * 1000 + (units.millisecond || 0);
}
function unit(key53) {
    return function(n) {
        return new Duration(assoc$8({}, key53, n));
    };
}
const years = unit("year");
const months = unit("month");
const days = unit("day");
const hours = unit("hour");
const minutes = unit("minute");
const seconds = unit("second");
const milliseconds = unit("millisecond");
const duration = overload(null, branch(isNumber, milliseconds, constructs(Duration)), function(start13, end8) {
    return milliseconds(end8 - start13);
});
const weeks = comp(days, (_mult = mult$2, function mult(_argPlaceholder2) {
    return _mult(_argPlaceholder2, 7);
}));
Duration.prototype[Symbol.toStringTag] = "Duration";
Duration.prototype.valueOf = valueOf;
Duration.units = [
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "millisecond"
];
function reducekv$3(self, f, init) {
    return reduce$e(function(memo, key54) {
        return f(memo, key54, lookup$4(self, key54));
    }, init, keys$6(self));
}
const merge$2 = partial(mergeWith, add$3);
function mult(self, n) {
    return fmap$8(self, function(value) {
        return value * n;
    });
}
function fmap$8(self, f) {
    return new self.constructor(reducekv$3(self, function(memo, key55, value) {
        return assoc$8(memo, key55, f(value));
    }, {}));
}
function keys$6(self) {
    return keys$b(self.units);
}
function dissoc$2(self, key56) {
    return new self.constructor(dissoc$5(self.units, key56));
}
function lookup$4(self, key57) {
    if (!includes$9(Duration.units, key57)) {
        throw new Error("Invalid unit.");
    }
    return get(self.units, key57);
}
function contains$3(self, key58) {
    return contains$8(self.units, key58);
}
function assoc$3(self, key59, value) {
    if (!includes$9(Duration.units, key59)) {
        throw new Error("Invalid unit.");
    }
    return new self.constructor(assoc$8(self.units, key59, value));
}
function divide$1(a, b) {
    return a.valueOf() / b.valueOf();
}
var behave$u = does(keying("Duration"), implement(IKVReducible, {
    reducekv: reducekv$3
}), implement(IAddable, {
    add: merge$2
}), implement(IMergable, {
    merge: merge$2
}), implement(IFunctor, {
    fmap: fmap$8
}), implement(IAssociative, {
    assoc: assoc$3,
    contains: contains$3
}), implement(ILookup, {
    lookup: lookup$4
}), implement(IMap, {
    keys: keys$6,
    dissoc: dissoc$2
}), implement(IDivisible, {
    divide: divide$1
}), implement(IMultipliable, {
    mult
}));
behave$u(Duration);
function add$1(self, other) {
    return mergeWith(add$3, self, isNumber(other) ? days(other) : other);
}
function lookup$3(self, key60) {
    switch(key60){
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
function InvalidKeyError(key61, target) {
    this.key = key61;
    this.target = target;
}
function contains$2(self, key62) {
    return keys$5().indexOf(key62) > -1;
}
function keys$5(self) {
    return [
        "year",
        "month",
        "day",
        "hour",
        "minute",
        "second",
        "millisecond"
    ];
}
function vals$2(self) {
    return reduce$e(function(memo, key63) {
        memo.push(get(self, key63));
        return memo;
    }, [], keys$5());
}
function conj$3(self, [key64, value]) {
    return assoc$2(self, key64, value);
}
function assoc$2(self, key65, value) {
    const dt = new Date(self.valueOf());
    switch(key65){
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
            throw new InvalidKeyError(key65, self);
    }
    return dt;
}
function clone$1(self) {
    return new Date(self.valueOf());
}
function equiv$6(self, other) {
    return other != null && deref$9(self) === deref$b(other);
}
function compare$3(self, other) {
    return other == null ? -1 : deref$9(self) - deref$b(other);
}
function reduce$4(self, f, init) {
    return reduce$e(function(memo, key66) {
        const value = get(self, key66);
        return f(memo, [
            key66,
            value
        ]);
    }, init, keys$5());
}
function reducekv$2(self, f, init) {
    return reduce$4(self, function(memo, [key67, value]) {
        return f(memo, key67, value);
    }, init);
}
function deref$9(self) {
    return self.valueOf();
}
function hash$3(self) {
    return self.valueOf();
}
var behave$t = does(keying("Date"), implement(IHashable, {
    hash: hash$3
}), implement(IAddable, {
    add: add$1
}), implement(IDeref, {
    deref: deref$9
}), implement(IBounded, {
    start: identity,
    end: identity
}), implement(ISeqable, {
    seq: identity
}), implement(IReducible, {
    reduce: reduce$4
}), implement(IKVReducible, {
    reducekv: reducekv$2
}), implement(IEquiv, {
    equiv: equiv$6
}), implement(IMap, {
    keys: keys$5,
    vals: vals$2
}), implement(IComparable, {
    compare: compare$3
}), implement(ICollection, {
    conj: conj$3
}), implement(IAssociative, {
    assoc: assoc$2,
    contains: contains$2
}), implement(ILookup, {
    lookup: lookup$3
}), implement(IClonable, {
    clone: clone$1
}));
Object.assign(behaviors, {
    Date: behave$t
});
behave$t(Date);
const error = constructs(Error);
function isError(self) {
    return ako(self, Error);
}
var behave$s = keying("Error");
behave$s(Error);
Function.prototype[Symbol.toStringTag] = "Function";
function append$2(f, ...applied) {
    return function(...args) {
        return f.apply(this, args.concat(applied));
    };
}
function invoke$2(self, ...args) {
    return self.apply(null, args);
}
function name$1(self) {
    return self.name ? self.name : get(/function (.+)\s?\(/.exec(self.toString()), 1);
}
var behave$r = does(keying("Function"), implement(INamable, {
    name: name$1
}), implement(IAppendable, {
    append: append$2
}), implement(IPrependable, {
    prepend: partial
}), implement(IFn, {
    invoke: invoke$2
}));
behave$r(Function);
function GUID(id) {
    this.id = id;
}
GUID.prototype[Symbol.toStringTag] = "GUID";
GUID.prototype.toString = function() {
    return this.id;
};
function s4() {
    return Math.floor((1 + rand()) * 0x10000).toString(16).substring(1);
}
function guid1(id) {
    return new GUID(id);
}
function guid0() {
    return guid1(s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}
const guid = overload(guid0, guid1);
function equiv$5(self, other) {
    return kin(self, other) && self.id === other.id;
}
function hash$2(self) {
    return hash$7(self.id);
}
var behave$q = does(keying("GUID"), implement(IHashable, {
    hash: hash$2
}), implement(IEquiv, {
    equiv: equiv$5
}));
behave$q(GUID);
function Indexed(obj12) {
    this.obj = obj12;
}
Indexed.prototype[Symbol.toStringTag] = "Indexed";
function indexed(obj13) {
    return new Indexed(obj13);
}
function count$3(self) {
    return self.obj.length;
}
function nth$1(self, idx18) {
    return self.obj[idx18];
}
function first$5(self) {
    return nth$1(self, 0);
}
function rest$5(self) {
    return next$4(self) || emptyList();
}
function next$4(self) {
    return count$3(self) > 1 ? indexedSeq(self, 1) : null;
}
function seq$5(self) {
    return count$3(self) ? self : null;
}
function includes$5(self, value) {
    return !!some$1(function(x) {
        return x === value;
    }, self);
}
function keys$4(self) {
    return range(count$3(self));
}
var behave$p = does(iterable, reductive, keying("Indexed"), implement(IHashable, {
    hash: hashKeyed
}), implement(IMap, {
    keys: keys$4
}), implement(ISequential$1), implement(IInclusive, {
    includes: includes$5
}), implement(IIndexed, {
    nth: nth$1
}), implement(ILookup, {
    lookup: nth$1
}), implement(INext, {
    next: next$4
}), implement(ISeq, {
    first: first$5,
    rest: rest$5
}), implement(ISeqable, {
    seq: seq$5
}), implement(ICounted, {
    count: count$3
}));
behave$p(Indexed);
function Journal(pos, max3, history, state) {
    this.pos = pos;
    this.max = max3;
    this.history = history;
    this.state = state;
}
Journal.prototype[Symbol.toStringTag] = "Journal";
function journal2(max4, state) {
    return new Journal(0, max4, [
        state
    ], state);
}
function journal1(state) {
    return journal2(Infinity, state);
}
const journal = overload(null, journal1, journal2);
const append$1 = overload(null, identity, IAppendable.append, reducing(IAppendable.append));
const blank$2 = IBlankable.blank;
function blot(self) {
    return blank$2(self) ? null : self;
}
const flatMap$3 = IFlatMappable.flatMap;
function compact$1(self) {
    return satisfies(ICompactible, self) ? ICompactible.compact(self) : filter(identity, self);
}
const only = unspread(compact$1);
const dispose = IDisposable.dispose;
const empty$1 = IEmptyableCollection.empty;
const find$1 = IFind.find;
var _noop, _IForkable$fork, _IForkable;
const fork$5 = overload(null, null, (_IForkable = IForkable, _IForkable$fork = _IForkable.fork, _noop = noop$1, function fork(_argPlaceholder, _argPlaceholder2) {
    return _IForkable$fork.call(_IForkable, _argPlaceholder, _noop, _argPlaceholder2);
}), IForkable.fork);
const path$1 = IPath.path;
function Lens(root2, path1) {
    this.root = root2;
    this.path = path1;
}
Lens.prototype[Symbol.toStringTag] = "Lens";
function lens(root3, path2) {
    return new Lens(root3, path2 || []);
}
var _juxt, _map;
function downward(f) {
    return function down(self) {
        const xs = f(self), ys = mapcat(down, xs);
        return concat(xs, ys);
    };
}
function upward(f) {
    return function up2(self) {
        const other = f(self);
        return other ? cons(other, up2(other)) : emptyList();
    };
}
const root$2 = IHierarchy.root;
const parent$1 = IHierarchy.parent;
const parents$2 = IHierarchy.parents;
const closest$2 = IHierarchy.closest;
const ancestors = IHierarchy.parents;
const children$1 = IHierarchy.children;
const descendants$1 = IHierarchy.descendants;
const nextSibling$2 = IHierarchy.nextSibling;
const prevSibling$2 = IHierarchy.prevSibling;
const nextSiblings$2 = IHierarchy.nextSiblings;
const prevSiblings$2 = IHierarchy.prevSiblings;
const siblings$2 = IHierarchy.siblings;
function leaves(self) {
    return remove(comp(count$b, children$1), descendants$1(self));
}
const asLeaves = comp((_map = map, _juxt = juxt(path$1, deref$b), function map(_argPlaceholder) {
    return _map(_juxt, _argPlaceholder);
}), leaves, lens);
const identifier = IIdentifiable.identifier;
function afterN(self, ...els) {
    let ref = self;
    while(els.length){
        let el = els.shift();
        IInsertable.after(ref, el);
        ref = el;
    }
}
const after = overload(null, identity, IInsertable.after, afterN);
function beforeN(self, ...els) {
    let ref = self;
    while(els.length){
        let el = els.pop();
        IInsertable.before(ref, el);
        ref = el;
    }
}
const before = overload(null, identity, IInsertable.before, beforeN);
const log = ILogger.log;
const name = INamable.name;
const otherwise$4 = IOtherwise.otherwise;
const prepend$2 = overload(null, identity, IPrependable.prepend, reducing(IPrependable.prepend, reverse$4));
const reset$2 = IResettable.reset;
const resettable$1 = IResettable.resettable;
const undo$1 = IRevertible.undo;
const undoable$1 = IRevertible.undoable;
const redo$1 = IRevertible.redo;
const redoable$1 = IRevertible.redoable;
const flush$1 = IRevertible.flush;
const flushable$1 = IRevertible.flushable;
const revision$1 = overload(null, function(self) {
    return IRevertible.revision(self, self.pos);
}, IRevertible.revision);
const send = ISend.send;
function sequential(items) {
    return satisfies(ISequential$1, items) ? items : cons(items);
}
var _ISet$unite, _reduce;
const disj = overload(null, identity, ISet.disj, reducing(ISet.disj));
const union2 = (_reduce = reduce$e, _ISet$unite = ISet.unite, function reduce(_argPlaceholder, _argPlaceholder2) {
    return _reduce(_ISet$unite, _argPlaceholder, _argPlaceholder2);
});
function intersection2(xs, ys) {
    return reduce$e(function(memo, x) {
        return includes$9(ys, x) ? conj$8(memo, x) : memo;
    }, empty$1(xs), xs);
}
function difference2(xs, ys) {
    return reduce$e(function(memo, x) {
        return includes$9(ys, x) ? memo : conj$8(memo, x);
    }, empty$1(xs), xs);
}
function subset(self, other) {
    var _other, _includes;
    return every((_includes = includes$9, _other = other, function includes(_argPlaceholder3) {
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
function swap3(self, f, a) {
    return ISwappable.swap(self, function(state) {
        return f(state, a);
    });
}
function swap4(self, f, a, b) {
    return ISwappable.swap(self, function(state) {
        return f(state, a, b);
    });
}
function swapN(self, f, a, b, cs) {
    return ISwappable.swap(self, function(state) {
        return f.apply(null, [
            state,
            a,
            b,
            ...cs
        ]);
    });
}
const swap$1 = overload(null, null, ISwappable.swap, swap3, swap4, swapN);
const fill$2 = ITemplate.fill;
function template(self, ...args) {
    return fill$2(self, args);
}
var p$2 = Object.freeze({
    __proto__: null,
    directed: directed,
    steps: steps,
    subtract: subtract,
    add: add$3,
    inc: inc,
    dec: dec,
    append: append$1,
    assoc: assoc$8,
    assocIn: assocIn,
    update: update,
    contains: contains$8,
    updateIn: updateIn,
    rewrite: rewrite,
    prop: prop,
    patch: patch,
    blank: blank$2,
    blot: blot,
    start: start$2,
    end: end$2,
    inside: inside,
    between: between,
    overlap: overlap,
    flatMap: flatMap$3,
    clone: clone$4,
    coerce: coerce$1,
    conj: conj$8,
    unconj: unconj$1,
    compact: compact$1,
    only: only,
    compare: compare$6,
    lt: lt,
    lte: lte,
    gt: gt,
    gte: gte,
    inverse: inverse$1,
    count: count$b,
    deref: deref$b,
    dispose: dispose,
    divide: divide$2,
    empty: empty$1,
    kin: kin,
    equiv: equiv$a,
    alike: alike,
    equivalent: equivalent,
    eq: eq,
    notEq: notEq,
    find: find$1,
    invoke: invoke$3,
    invokable: invokable,
    fork: fork$5,
    fmap: fmap$b,
    thrush: thrush,
    pipeline: pipeline,
    hashTag: hashTag,
    hash: hash$7,
    isValueObject: isValueObject,
    downward: downward,
    upward: upward,
    root: root$2,
    parent: parent$1,
    parents: parents$2,
    closest: closest$2,
    ancestors: ancestors,
    children: children$1,
    descendants: descendants$1,
    nextSibling: nextSibling$2,
    prevSibling: prevSibling$2,
    nextSiblings: nextSiblings$2,
    prevSiblings: prevSiblings$2,
    siblings: siblings$2,
    leaves: leaves,
    asLeaves: asLeaves,
    identifier: identifier,
    nth: nth$6,
    idx: idx$3,
    includes: includes$9,
    excludes: excludes,
    transpose: transpose,
    after: after,
    before: before,
    reducekv2: reducekv2,
    reducekv3: reducekv3,
    reducekv: reducekv$a,
    log: log,
    get: get,
    getIn: getIn,
    keys: keys$b,
    vals: vals$5,
    dissoc: dissoc$5,
    key: key$3,
    val: val$2,
    is: is,
    ako: ako,
    keying: keying,
    merge: merge$4,
    mult: mult$2,
    name: name,
    next: next$a,
    otherwise: otherwise$4,
    path: path$1,
    prepend: prepend$2,
    reduce: reduce$e,
    reducing: reducing,
    reset: reset$2,
    resettable: resettable$1,
    reverse: reverse$4,
    undo: undo$1,
    undoable: undoable$1,
    redo: redo$1,
    redoable: redoable$1,
    flush: flush$1,
    flushable: flushable$1,
    revision: revision$1,
    send: send,
    first: first$d,
    rest: rest$d,
    seq: seq$a,
    sequential: sequential,
    disj: disj,
    subset: subset,
    superset: superset,
    unite: unite,
    union: union,
    intersection: intersection,
    difference: difference,
    split: split$2,
    swap: swap$1,
    fill: fill$2,
    template: template,
    omit: omit$3
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
    return new Journal(0, self.max, [
        self.state
    ], self.state);
}
function flushable(self) {
    return count$b(self.history) > 1;
}
function undoable(self) {
    return self.pos + 1 < count$b(self.history);
}
function redoable(self) {
    return self.pos > 0;
}
function reset$1(self) {
    const at = count$b(self.history) - 1, state = nth$6(self.history, at);
    return new Journal(at, self.max, self.history, state);
}
function resettable(self) {
    return self.pos !== count$b(self.history) - 1;
}
function deref$8(self) {
    return self.state;
}
function fmap$7(self, f) {
    const revised = f(self.state);
    return new Journal(0, self.max, prepend$2(self.pos ? slice(self.history, self.pos) : self.history, revised), revised);
}
function revision(self, pos) {
    return [
        self.history[pos],
        self.history[pos + 1] || null
    ];
}
var behave$o = does(keying("Journal"), implement(IDeref, {
    deref: deref$8
}), implement(IFunctor, {
    fmap: fmap$7
}), implement(IResettable, {
    reset: reset$1,
    resettable
}), implement(IRevertible, {
    undo,
    redo,
    flush,
    flushable,
    undoable,
    redoable,
    revision
}));
behave$o(Journal);
function monadic(construct1) {
    function fmap1(self, f) {
        return construct1(f(self.value));
    }
    function flatMap1(self, f) {
        return f(self.value);
    }
    function deref2(self) {
        return self.value;
    }
    return does(implement(IDeref, {
        deref: deref2
    }), implement(IFlatMappable, {
        flatMap: flatMap1
    }), implement(IFunctor, {
        fmap: fmap1
    }));
}
function otherwise$3(self) {
    return self.value;
}
var behave$n = does(keying("Just"), monadic(maybe), implement(IOtherwise, {
    otherwise: otherwise$3
}));
behave$n(Just);
function Left(value) {
    this.value = value;
}
Left.prototype[Symbol.toStringTag] = "Left";
const left = thrush(constructs(Left));
const fmap$6 = identity;
const flatMap$2 = identity;
function fork$4(self, reject1, resolve) {
    reject1(self.value);
}
function deref$7(self) {
    return self.value;
}
var behave$m = does(keying("Left"), implement(IDeref, {
    deref: deref$7
}), implement(IForkable, {
    fork: fork$4
}), implement(IFlatMappable, {
    flatMap: flatMap$2
}), implement(IFunctor, {
    fmap: fmap$6
}));
behave$m(Left);
var p$1 = Object.freeze({
    __proto__: null,
    keys: keys$b,
    vals: vals$5,
    dissoc: dissoc$5,
    assoc: assoc$8,
    assocIn: assocIn,
    update: update,
    contains: contains$8,
    updateIn: updateIn,
    rewrite: rewrite,
    prop: prop,
    patch: patch,
    seq: seq$a,
    get: get,
    getIn: getIn,
    includes: includes$9,
    excludes: excludes,
    transpose: transpose,
    first: first$d,
    rest: rest$d,
    coerce: coerce$1,
    reverse: reverse$4,
    downward: downward,
    upward: upward,
    root: root$2,
    parent: parent$1,
    parents: parents$2,
    closest: closest$2,
    ancestors: ancestors,
    children: children$1,
    descendants: descendants$1,
    nextSibling: nextSibling$2,
    prevSibling: prevSibling$2,
    nextSiblings: nextSiblings$2,
    prevSiblings: prevSiblings$2,
    siblings: siblings$2,
    leaves: leaves,
    asLeaves: asLeaves,
    conj: conj$8,
    unconj: unconj$1,
    clone: clone$4
});
function path(self) {
    return self.path;
}
function deref$6(self) {
    return getIn(self.root, self.path);
}
function conj$2(self, value) {
    var _value, _p$conj, _p1;
    return swap(self, (_p1 = p$1, _p$conj = _p1.conj, _value = value, function conj(_argPlaceholder) {
        return _p$conj.call(_p1, _argPlaceholder, _value);
    }));
}
function lookup$2(self, key68) {
    return Object.assign(clone$4(self), {
        path: conj$8(self.path, key68)
    });
}
function assoc$1(self, key69, value) {
    var _key, _value2, _p$assoc, _p2;
    return swap(self, (_p2 = p$1, _p$assoc = _p2.assoc, _key = key69, _value2 = value, function assoc(_argPlaceholder2) {
        return _p$assoc.call(_p2, _argPlaceholder2, _key, _value2);
    }));
}
function contains$1(self, key70) {
    return includes$9(keys$3(self), key70);
}
function dissoc$1(self, key71) {
    var _key2, _p$dissoc, _p3;
    return swap(self, (_p3 = p$1, _p$dissoc = _p3.dissoc, _key2 = key71, function dissoc(_argPlaceholder3) {
        return _p$dissoc.call(_p3, _argPlaceholder3, _key2);
    }));
}
function reset(self, value) {
    return Object.assign(clone$4(self), {
        root: assocIn(self.root, self.path, value)
    });
}
function swap(self, f) {
    return Object.assign(clone$4(self), {
        root: updateIn(self.root, self.path, f)
    });
}
function fmap$5(self, f) {
    return Object.assign(clone$4(self), {
        path: f(self.path)
    });
}
function root$1(self) {
    return Object.assign(clone$4(self), {
        path: []
    });
}
function children(self) {
    return map(function(key72) {
        return Object.assign(clone$4(self), {
            path: conj$8(self.path, key72)
        });
    }, keys$3(self));
}
function keys$3(self) {
    const value = deref$6(self);
    return satisfies(IMap, value) ? keys$b(value) : emptyList();
}
function vals$1(self) {
    var _value3, _p$get, _p4;
    const value = deref$6(self);
    return map((_p4 = p$1, _p$get = _p4.get, _value3 = value, function get(_argPlaceholder4) {
        return _p$get.call(_p4, _value3, _argPlaceholder4);
    }), keys$3(self));
}
function siblings$1(self) {
    const p4 = parent(self), ctx = toArray(butlast(self.path)), key73 = last(self.path);
    return map(function(key74) {
        return Object.assign(p4.clone(self), {
            path: p4.conj(ctx, key74)
        });
    }, remove(function(k) {
        return k === key73;
    }, p4 ? keys$3(p4) : []));
}
function prevSiblings$1(self) {
    const p5 = parent(self), ctx = toArray(butlast(self.path)), key75 = last(self.path);
    return map(function(key76) {
        return Object.assign(p5.clone(self), {
            path: p5.conj(ctx, key76)
        });
    }, p5.reverse(toArray(take(1, takeWhile(function(k) {
        return k !== key75;
    }, p5 ? keys$3(p5) : [])))));
}
function nextSiblings$1(self) {
    const p6 = parent(self), ctx = toArray(butlast(self.path)), key77 = last(self.path);
    return map(function(key78) {
        return Object.assign(p6.clone(self), {
            path: p6.conj(ctx, key78)
        });
    }, drop(1, dropWhile(function(k) {
        return k !== key77;
    }, p6 ? keys$3(p6) : [])));
}
const prevSibling$1 = comp(first$d, prevSiblings$1);
const nextSibling$1 = comp(first$d, nextSiblings$1);
function parent(self) {
    return seq$a(self.path) ? Object.assign(clone$4(self), {
        path: toArray(butlast(self.path))
    }) : null;
}
function parents$1(self) {
    return lazySeq(function() {
        const p7 = parent(self);
        return p7 ? cons(p7, parents$1(p7)) : emptyList();
    });
}
function closest$1(self, pred) {
    return detect(comp(pred, deref$6), cons(self, parents$1(self)));
}
const descendants = downward(children);
var behave$l = does(keying("Lens"), implement(IPath, {
    path
}), implement(ICollection, {
    conj: conj$2
}), implement(ILookup, {
    lookup: lookup$2
}), implement(IAssociative, {
    assoc: assoc$1,
    contains: contains$1
}), implement(IMap, {
    keys: keys$3,
    vals: vals$1,
    dissoc: dissoc$1
}), implement(IFunctor, {
    fmap: fmap$5
}), implement(ISwappable, {
    swap
}), implement(IResettable, {
    reset
}), implement(IHierarchy, {
    root: root$1,
    children,
    parents: parents$1,
    parent,
    closest: closest$1,
    descendants,
    siblings: siblings$1,
    nextSiblings: nextSiblings$1,
    nextSibling: nextSibling$1,
    prevSiblings: prevSiblings$1,
    prevSibling: prevSibling$1
}), implement(IDeref, {
    deref: deref$6
}));
behave$l(Lens);
function first$4(self) {
    return self.head;
}
function rest$4(self) {
    return self.tail;
}
var behave$k = does(lazyseq, keying("List"), implement(IHashable, {
    hash: hashSeq
}), implement(ISeqable, {
    seq: identity
}), implement(ISeq, {
    first: first$4,
    rest: rest$4
}));
behave$k(List);
function Members(items, f) {
    this.items = items;
    this.f = f;
}
function members(f) {
    const g = comp(f, sequential);
    return thrush(function construct(items) {
        return new Members(g(items), g);
    });
}
function seq$4(self) {
    return seq$a(self.items);
}
function first$3(self) {
    return first$d(self.items);
}
function rest$3(self) {
    return next$3(self) || empty(self);
}
function next$3(self) {
    const items = next$a(self.items);
    return items ? Object.assign(clone$4(self), {
        items
    }) : null;
}
function append(self, other) {
    return Object.assign(clone$4(self), {
        items: append$1(self.items, other)
    });
}
function prepend$1(self, other) {
    return Object.assign(clone$4(self), {
        items: prepend$2(self.items, other)
    });
}
function includes$4(self, name1) {
    return includes$9(self.items, name1);
}
function count$2(self) {
    return count$b(self.items);
}
function empty(self) {
    return clone$4(self, {
        items: []
    });
}
function reduce$3(self, f, init) {
    return reduce$e(f, init, self.items);
}
var behave$j = does(iterable, keying("Series"), implement(ISequential$1), implement(ICounted, {
    count: count$2
}), implement(IInclusive, {
    includes: includes$4
}), implement(IAppendable, {
    append
}), implement(IPrependable, {
    prepend: prepend$1
}), implement(IEmptyableCollection, {
    empty
}), implement(ISeqable, {
    seq: seq$4
}), implement(INext, {
    next: next$3
}), implement(IReducible, {
    reduce: reduce$3
}), implement(ISeq, {
    first: first$3,
    rest: rest$3
}));
function fmap$4(self, f) {
    return new self.constructor(self.f(mapcat(comp(sequential, f), self.items)), self.f);
}
function seq$3(self) {
    return seq$a(self.items);
}
function deref$5(self) {
    return self.items;
}
var behave$i = does(behave$j, keying("Members"), implement(IDeref, {
    deref: deref$5
}), implement(ISeqable, {
    seq: seq$3
}), implement(IFunctor, {
    fmap: fmap$4
}));
behave$i(Members);
function Mutable(state) {
    this.state = state;
}
function mutable(state) {
    return new Mutable(state);
}
Mutable.prototype[Symbol.toStringTag] = "Mutable";
function mutate(self, effect) {
    effect(self.state);
    return self.state;
}
function deref$4(self) {
    return self.state;
}
var behave$h = does(keying("Mutable"), implement(IDeref, {
    deref: deref$4
}));
behave$h(Mutable);
function invoke$1(self, ...args) {
    const key79 = self.dispatch.apply(this, args);
    const hashcode = hash$7(key79);
    const potentials = self.methods[hashcode];
    const f = some$1(function([k, h]) {
        return equiv$a(k, key79) ? h : null;
    }, potentials) || self.fallback || function() {
        throw new Error("Unable to locate appropriate method.");
    };
    return f.apply(this, args);
}
var behave$g = does(keying("Multimethod"), implement(IFn, {
    invoke: invoke$1
}));
behave$g(Multimethod);
function otherwise$2(self, other) {
    return other;
}
const deref$3 = constantly(null);
var behave$f = does(keying("Nothing"), implement(IDeref, {
    deref: deref$3
}), implement(IOtherwise, {
    otherwise: otherwise$2
}), implement(IFlatMappable, {
    flatMap: identity
}), implement(IFunctor, {
    fmap: identity
}));
behave$f(Nothing);
const object = constructs(Object);
function emptyObject() {
    return {};
}
var p = Object.freeze({
    __proto__: null,
    compare: compare$6,
    lt: lt,
    lte: lte,
    gt: gt,
    gte: gte,
    kin: kin,
    equiv: equiv$a,
    alike: alike,
    equivalent: equivalent,
    eq: eq,
    notEq: notEq,
    reduce: reduce$e,
    reducing: reducing,
    reducekv2: reducekv2,
    reducekv3: reducekv3,
    reducekv: reducekv$a,
    get: get,
    getIn: getIn,
    keys: keys$b,
    vals: vals$5,
    dissoc: dissoc$5,
    key: key$3,
    val: val$2,
    is: is,
    ako: ako,
    keying: keying,
    assoc: assoc$8,
    assocIn: assocIn,
    update: update,
    contains: contains$8,
    updateIn: updateIn,
    rewrite: rewrite,
    prop: prop,
    patch: patch,
    clone: clone$4,
    count: count$b,
    next: next$a,
    first: first$d,
    rest: rest$d,
    seq: seq$a,
    includes: includes$9,
    excludes: excludes,
    transpose: transpose,
    empty: empty$1,
    invoke: invoke$3,
    invokable: invokable,
    coerce: coerce$1
});
var _Object, _p$coerce, _p;
const toObject = (_p = p, _p$coerce = _p.coerce, _Object = Object, function coerce(_argPlaceholder) {
    return _p$coerce.call(_p, _argPlaceholder, _Object);
});
function isObject(self) {
    return is(self, Object);
}
function descriptive$1(self) {
    return satisfies(ILookup, self) && satisfies(IMap, self) && !satisfies(IIndexed, self);
}
function subsumes(self, other) {
    return reducekv$a(function(memo, key80, value) {
        return memo ? contains$8(self, key80, value) : reduced(memo);
    }, true, other);
}
const emptied = branch(satisfies(IEmptyableCollection), empty$1, emptyObject);
function juxtVals(self, value) {
    return reducekv$a(function(memo, key81, f) {
        return assoc$8(memo, key81, isFunction(f) ? f(value) : f);
    }, emptied(self), self);
}
function selectKeys(self, keys) {
    return reduce$e(function(memo, key82) {
        return assoc$8(memo, key82, get(self, key82));
    }, emptied(self), keys);
}
function removeKeys(self, keys) {
    return reducekv$a(function(memo, key83, value) {
        return includes$9(keys, key83) ? memo : assoc$8(memo, key83, value);
    }, emptied(self), self);
}
function mapKeys(self, f) {
    return reducekv$a(function(memo, key84, value) {
        return assoc$8(memo, f(key84), value);
    }, emptied(self), self);
}
function mapVals2(self, f) {
    return reducekv$a(function(memo, key85, value) {
        return assoc$8(memo, key85, f(value));
    }, self, self);
}
function mapVals3(init, f, pred) {
    return reduce$e(function(memo, key86) {
        return pred(key86) ? assoc$8(memo, key86, f(get(memo, key86))) : memo;
    }, init, keys$b(init));
}
const mapVals = overload(null, null, mapVals2, mapVals3);
function defaults2(self, defaults1) {
    return reducekv$a(assoc$8, defaults1, self);
}
const defaults = overload(null, null, defaults2, reducing(defaults2));
function compile(self) {
    return isFunction(self) ? self : function(...args) {
        return apply(invoke$3, self, args);
    };
}
const keys$2 = Object.keys;
const vals = Object.values;
function fill$1(self, params) {
    return reducekv$a(function(memo, key87, value) {
        var _value, _params, _p$fill, _p5, _params2, _fill;
        return assoc$8(memo, key87, (_value = value, branch(isString, (_p5 = p, _p$fill = _p5.fill, _params = params, function fill(_argPlaceholder) {
            return _p$fill.call(_p5, _argPlaceholder, _params);
        }), isObject, (_fill = fill$1, _params2 = params, function fill(_argPlaceholder2) {
            return _fill(_argPlaceholder2, _params2);
        }), identity)(_value)));
    }, {}, self);
}
function merge$1(...maps) {
    return reduce$e(function(memo3, map1) {
        return reduce$e(function(memo, [key88, value]) {
            memo[key88] = value;
            return memo;
        }, memo3, seq$a(map1));
    }, {}, maps);
}
function blank$1(self) {
    return keys$2(self).length === 0;
}
function compact1(self) {
    return compact2(self, function([_, value]) {
        return value == null;
    });
}
function compact2(self, pred) {
    return reducekv$a(function(memo, key89, value) {
        return pred([
            key89,
            value
        ]) ? memo : assoc$8(memo, key89, value);
    }, {}, self);
}
const compact = overload(null, compact1, compact2);
function omit(self, entry) {
    const key90 = key$3(entry);
    if (includes$3(self, entry)) {
        const result = clone(self);
        delete result[key90];
        return result;
    } else {
        return self;
    }
}
function compare$2(self, other) {
    return equiv$a(self, other) ? 0 : descriptive$1(other) ? reduce$e(function(memo, key91) {
        return memo == 0 ? compare$6(get(self, key91), get(other, key91)) : reduced$1(memo);
    }, 0, keys$b(self)) : -1;
}
function conj$1(self, entry) {
    const key92 = key$3(entry), val5 = val$2(entry);
    const result = clone$4(self);
    result[key92] = val5;
    return result;
}
function equiv$4(self, other) {
    return self === other ? true : descriptive$1(other) && count$b(keys$b(self)) === count$b(keys$b(other)) && reduce$e(function(memo, key93) {
        return memo ? equiv$a(get(self, key93), get(other, key93)) : reduced$1(memo);
    }, true, keys$b(self));
}
function find(self, key94) {
    return contains(self, key94) ? [
        key94,
        lookup$1(self, key94)
    ] : null;
}
function includes$3(self, entry) {
    const key95 = key$3(entry), val6 = val$2(entry);
    return self[key95] === val6;
}
function lookup$1(self, key96) {
    return self[key96];
}
function first$2(self) {
    const key97 = first$d(keys$2(self));
    return key97 ? [
        key97,
        lookup$1(self, key97)
    ] : null;
}
function rest$2(self) {
    return next$2(self) || {};
}
function next2(self, keys) {
    if (seq$a(keys)) {
        return lazySeq(function() {
            const key98 = first$d(keys);
            return cons([
                key98,
                lookup$1(self, key98)
            ], next2(self, next$a(keys)));
        });
    } else {
        return null;
    }
}
function next$2(self) {
    return next2(self, next$a(keys$2(self)));
}
function dissoc(self, key99) {
    if (contains$8(self, key99)) {
        const result = clone(self);
        delete result[key99];
        return result;
    } else {
        return self;
    }
}
function assoc(self, key100, value) {
    if (get(self, key100) === value) {
        return self;
    } else {
        const result = clone(self);
        result[key100] = value;
        return result;
    }
}
function contains(self, key101) {
    return self.hasOwnProperty(key101);
}
function seq$2(self) {
    if (!count$1(self)) return null;
    return map(function(key102) {
        return [
            key102,
            lookup$1(self, key102)
        ];
    }, keys$2(self));
}
function count$1(self) {
    return keys$2(self).length;
}
function clone(self) {
    return Object.assign({}, self);
}
function reduce$2(self, f, init) {
    return reduce$e(function(memo, key103) {
        return f(memo, [
            key103,
            lookup$1(self, key103)
        ]);
    }, init, keys$2(self));
}
function reducekv$1(self, f, init) {
    return reduce$e(function(memo, key104) {
        return f(memo, key104, lookup$1(self, key104));
    }, init, keys$2(self));
}
var behave$e = does(keying("Object"), implement(IHashable, {
    hash: hashKeyed
}), implement(ITemplate, {
    fill: fill$1
}), implement(IBlankable, {
    blank: blank$1
}), implement(IMergable, {
    merge: merge$1
}), implement(ICompactible, {
    compact
}), implement(IEquiv, {
    equiv: equiv$4
}), implement(IFind, {
    find
}), implement(IOmissible, {
    omit
}), implement(IInclusive, {
    includes: includes$3
}), implement(ICollection, {
    conj: conj$1
}), implement(IClonable, {
    clone
}), implement(IComparable, {
    compare: compare$2
}), implement(IReducible, {
    reduce: reduce$2
}), implement(IKVReducible, {
    reducekv: reducekv$1
}), implement(IMap, {
    dissoc,
    keys: keys$2,
    vals
}), implement(IFn, {
    invoke: lookup$1
}), implement(ISeq, {
    first: first$2,
    rest: rest$2
}), implement(INext, {
    next: next$2
}), implement(ILookup, {
    lookup: lookup$1
}), implement(IEmptyableCollection, {
    empty: emptyObject
}), implement(IAssociative, {
    assoc,
    contains
}), implement(ISeqable, {
    seq: seq$2
}), implement(ICounted, {
    count: count$1
}));
Object.assign(behaviors, {
    Object: behave$e
});
behave$e(Object);
function Okay(value) {
    this.value = value;
}
Okay.prototype[Symbol.toStringTag] = "Okay";
const okay = thrush(constructs(Okay));
function fmap$3(self, f) {
    try {
        return okay(f(self.value));
    } catch (ex) {
        return left(ex);
    }
}
function flatMap$1(self, f) {
    try {
        return f(self.value);
    } catch (ex) {
        return left(ex);
    }
}
function fork$3(self, reject, resolve1) {
    resolve1(self);
}
function deref$2(self) {
    return self.value;
}
var behave$d = does(keying("Okay"), implement(IDeref, {
    deref: deref$2
}), implement(IForkable, {
    fork: fork$3
}), implement(IFlatMappable, {
    flatMap: flatMap$1
}), implement(IFunctor, {
    fmap: fmap$3
}));
behave$d(Okay);
function Recurrence(start14, end9, step, direction) {
    this.start = start14;
    this.end = end9;
    this.step = step;
    this.direction = direction;
}
function emptyRecurrence() {
    return new Recurrence();
}
function recurrence1(obj14) {
    return recurrence2(patch(obj14, sod()), patch(obj14, eod()));
}
function recurrence2(start15, end10) {
    return recurrence3(start15, end10, days(end10 == null || start15 <= end10 ? 1 : -1));
}
const recurrence3 = steps(Recurrence, isDate);
function recurrence4(start16, end11, step, f) {
    const pred = end11 == null ? constantly(true) : directed(start16, end11) > 0 ? function(dt) {
        return compare$6(start16, dt) <= 0;
    } : directed(start16, end11) < 0 ? function(dt) {
        return compare$6(start16, dt) >= 0;
    } : constantly(true);
    return filter(pred, f(recurrence3(start16, end11, step)));
}
const recurrence = overload(emptyRecurrence, recurrence1, recurrence2, recurrence3, recurrence4);
Recurrence.prototype[Symbol.toStringTag] = "Recurrence";
function split2(self, step) {
    var _step, _period;
    return map((_period = period, _step = step, function period(_argPlaceholder) {
        return _period(_argPlaceholder, _step);
    }), recurrence(start$2(self), end$2(self), step));
}
function split3$1(self, step, n) {
    return take(n, split2(self, step));
}
const split$1 = overload(null, null, split2, split3$1);
function add(self, dur) {
    var _ref, _self, _dur, _p$add, _p6;
    return end$2(self) ? new self.constructor(start$2(self), (_ref = (_self = self, end$2(_self)), (_p6 = p$4, _p$add = _p6.add, _dur = dur, function add(_argPlaceholder2) {
        return _p$add.call(_p6, _argPlaceholder2, _dur);
    })(_ref))) : self;
}
function merge(self, other) {
    return other == null ? self : new self.constructor(min(start$2(self), start$2(other)), max(end$2(other), end$2(other)));
}
function divide(self, step) {
    return divide$2(coerce$1(self, Duration), step);
}
function start(self) {
    return self.start;
}
function end(self) {
    return self.end;
}
function includes$2(self, dt) {
    return dt != null && (self.start == null || compare$6(dt, self.start) >= 0) && (self.end == null || compare$6(dt, self.end) < 0);
}
function equiv$3(self, other) {
    return other != null && equiv$a(self.start, other.start) && equiv$a(self.end, other.end);
}
function compare$1(self, other) {
    return compare$6(other.start, self.start) || compare$6(other.end, self.end);
}
var behave$c = does(emptyable, keying("Period"), implement(ISplittable, {
    split: split$1
}), implement(IAddable, {
    add
}), implement(IMergable, {
    merge
}), implement(IDivisible, {
    divide
}), implement(IComparable, {
    compare: compare$1
}), implement(IInclusive, {
    includes: includes$2
}), implement(IBounded, {
    start,
    end
}), implement(IEquiv, {
    equiv: equiv$3
}));
behave$c(Period);
function promise(handler) {
    return new Promise(handler);
}
function isPromise(self) {
    return is(self, Promise);
}
var _Promise, _coerce;
const toPromise = (_coerce = coerce$1, _Promise = Promise, function coerce(_argPlaceholder) {
    return _coerce(_argPlaceholder, _Promise);
});
function awaits(f) {
    return function(...args1) {
        if (detect(isPromise, args1)) {
            return fmap$b(Promise.all(args1), function(args) {
                return f.apply(this, args);
            });
        } else {
            return f.apply(this, args1);
        }
    };
}
function fmap$2(self, resolve2) {
    return self.then(resolve2);
}
function fork$2(self, reject2, resolve3) {
    self.then(resolve3, reject2);
}
function otherwise$1(self, other) {
    return fmap$2(self, function(value) {
        return value == null ? other : value;
    });
}
function equiv$2(self, other) {
    return self === other;
}
var behave$b = does(keying("Promise"), implement(IEquiv, {
    equiv: equiv$2
}), implement(IOtherwise, {
    otherwise: otherwise$1
}), implement(IForkable, {
    fork: fork$2
}), implement(IFunctor, {
    fmap: fmap$2
}));
Object.assign(behaviors, {
    Promise: behave$b
});
behave$b(Promise);
function seq$1(self) {
    return equiv$a(self.start, self.end) || self.step == null && self.direction == null && self.start == null && self.end == null ? null : self;
}
function first$1(self) {
    return self.end == null ? self.start : compare$6(self.start, self.end) * self.direction < 0 ? self.start : null;
}
function rest$1(self) {
    return next$a(self) || new self.constructor(self.end, self.end, self.step, self.direction);
}
function next$1(self) {
    if (!seq$1(self)) return null;
    const stepped = add$3(self.start, self.step);
    return self.end == null || compare$6(stepped, self.end) * self.direction < 0 ? new self.constructor(stepped, self.end, self.step, self.direction) : null;
}
function equiv$1(self, other) {
    return kin(self, other) ? alike(self, other) : equiv$9(self, other);
}
function reduce$1(self, f, init) {
    let memo = init, coll = seq$1(self);
    while(!isReduced(memo) && coll){
        memo = f(memo, first$d(coll));
        coll = next$a(coll);
    }
    return unreduced(memo);
}
function reducekv(self, f, init) {
    let memo = init, coll = seq$1(self), n = 0;
    while(!isReduced(memo) && coll){
        memo = f(memo, n++, first$d(coll));
        coll = next$a(coll);
    }
    return unreduced(memo);
}
function inverse(self) {
    const start17 = self.end, end12 = self.start, step = inverse$1(self.step);
    return new self.constructor(start17, end12, step, directed(start17, step));
}
function nth(self, idx19) {
    return first$d(drop(idx19, self));
}
function count(self) {
    let n = 0, xs = self;
    while(seq$a(xs)){
        n++;
        xs = rest$d(xs);
    }
    return n;
}
function includes$1(self, value) {
    let xs = self;
    if (self.direction > 0) {
        while(seq$a(xs)){
            let c = compare$6(first$d(xs), value);
            if (c === 0) return true;
            if (c > 0) break;
            xs = rest$d(xs);
        }
    } else {
        while(seq$a(xs)){
            let c = compare$6(first$d(xs), value);
            if (c === 0) return true;
            if (c < 0) break;
            xs = rest$d(xs);
        }
    }
    return false;
}
var behave$a = does(iterable, emptyable, keying("Range"), implement(ISequential$1), implement(IInversive, {
    inverse
}), implement(IIndexed, {
    nth
}), implement(ICounted, {
    count
}), implement(IInclusive, {
    includes: includes$1
}), implement(ISeqable, {
    seq: seq$1
}), implement(IReducible, {
    reduce: reduce$1
}), implement(IKVReducible, {
    reducekv
}), implement(INext, {
    next: next$1
}), implement(ISeq, {
    first: first$1,
    rest: rest$1
}), implement(IEquiv, {
    equiv: equiv$1
}));
behave$a(Range);
const record = behave$B;
behave$a(Recurrence);
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
        return count$b(matches) === 1 ? first$d(matches) : matches;
    }
}
function reFindAll2(text, find1) {
    const found = find1(text);
    return found ? lazySeq(function() {
        return cons(found, reFindAll2(text, find1));
    }) : emptyList();
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
    if (first$d(matches) === s) {
        return count$b(matches) === 1 ? first$d(matches) : matches;
    }
}
function reSeq(re, s) {
    return lazySeq(function() {
        const matchData = reFind(re, s), matchIdx = s.search(re), matchStr = isArray(matchData) ? first$d(matchData) : matchData, postIdx = matchIdx + max(1, count$b(matchStr)), postMatch = s.substring(postIdx);
        return matchData ? cons(matchData, reSeq(new RegExp(re.source, re.flags), postMatch)) : emptyList();
    });
}
function rePattern(s) {
    if (isRegExp(s)) return s;
    if (!isString(s)) throw new TypeError("rePattern is derived from a string.");
    const found = reFind(/^\(\?([idmsux]*)\)/, s), prefix = get(found, 0), flags = get(found, 1), pattern = s.substring(count$b(prefix));
    return new RegExp(pattern, flags || "");
}
const reGroups = comp(blot, toArray, rest$d, reFind);
var behave$9 = keying("RegExp");
behave$9(RegExp);
function Right(value) {
    this.value = value;
}
Right.prototype[Symbol.toStringTag] = "Right";
const right = thrush(constructs(Right));
function otherwise(self, other) {
    return self.value;
}
function fork$1(self, reject, resolve4) {
    resolve4(self.value);
}
var behave$8 = does(keying("Right"), monadic(right), implement(IForkable, {
    fork: fork$1
}), implement(IOtherwise, {
    otherwise
}));
behave$8(Right);
function Router(handlers, fallback, f) {
    this.handlers = handlers;
    this.fallback = fallback;
    this.f = f;
}
Router.prototype[Symbol.toStringTag] = "Router";
function router(handler) {
    const h = handler || noop$1;
    return new Router([], h, h);
}
function addRoute3(self, pred, f) {
    return addRoute2(self, guard(pred, f));
}
function addRoute2(self, handler) {
    const handlers = append$1(self.handlers, handler);
    return new Router(handlers, self.fallback, apply(coalesce, concat(handlers, [
        self.fallback
    ])));
}
function addRoute4(self, re, xf, f) {
    var _re, _reGroups;
    return addRoute2(self, parsedo((_reGroups = reGroups, _re = re, function reGroups(_argPlaceholder) {
        return _reGroups(_re, _argPlaceholder);
    }), xf, f));
}
const addRoute = overload(null, null, addRoute2, addRoute3, addRoute4);
function invoke(self, ...args) {
    return self.f(...args);
}
var behave$7 = does(keying("Router"), implement(IFn, {
    invoke
}));
behave$7(Router);
const series = behave$j;
var behave$6 = keying("Symbol");
Object.assign(behaviors, {
    Symbol: behave$6
});
behave$6(Symbol);
function split1(str5) {
    return str5.split("");
}
function split3(str6, pattern, n) {
    const parts = [];
    while(str6 && n !== 0){
        let found = str6.match(pattern);
        if (!found || n < 2) {
            parts.push(str6);
            break;
        }
        let pos = str6.indexOf(found), part = str6.substring(0, pos);
        parts.push(part);
        str6 = str6.substring(pos + found.length);
        n = n ? n - 1 : n;
    }
    return parts;
}
const split = overload(null, split1, unbind(String.prototype.split), split3);
function fill(self, params) {
    return reducekv$a(function(text, key105, value) {
        return replace(text, new RegExp("\\{" + key105 + "\\}", 'ig'), value);
    }, self, params);
}
function blank(self) {
    return self.trim().length === 0;
}
function compare(self, other) {
    return self === other ? 0 : self > other ? 1 : -1;
}
function conj(self, other) {
    return self + other;
}
function seq2(self, idx20) {
    return idx20 < self.length ? lazySeq(function() {
        return cons(self[idx20], seq2(self, idx20 + 1));
    }) : null;
}
function seq(self) {
    return seq2(self, 0);
}
function lookup(self, key106) {
    return self[key106];
}
function first(self) {
    return self[0] || null;
}
function rest(self) {
    return next(self) || "";
}
function next(self) {
    return self.substring(1) || null;
}
function prepend(self, head) {
    return head + self;
}
function includes(self, str7) {
    return self.indexOf(str7) > -1;
}
function reduce(self, f, init) {
    let memo = init;
    let coll = seq$a(self);
    while(coll && !isReduced(memo)){
        memo = f(memo, first$d(coll));
        coll = next$a(coll);
    }
    return unreduced(memo);
}
function hash$1(self) {
    var hash3 = 0, i, chr;
    if (self.length === 0) return hash3;
    for(i = 0; i < self.length; i++){
        chr = self.charCodeAt(i);
        hash3 = (hash3 << 5) - hash3 + chr;
        hash3 |= 0;
    }
    return hash3;
}
var behave$5 = does(iindexed, keying("String"), implement(IHashable, {
    hash: hash$1
}), implement(ISplittable, {
    split
}), implement(IBlankable, {
    blank
}), implement(ITemplate, {
    fill
}), implement(ICollection, {
    conj
}), implement(IReducible, {
    reduce
}), implement(IComparable, {
    compare
}), implement(IInclusive, {
    includes
}), implement(IAppendable, {
    append: conj
}), implement(IPrependable, {
    prepend
}), implement(IEmptyableCollection, {
    empty: emptyString
}), implement(IFn, {
    invoke: lookup
}), implement(IIndexed, {
    nth: lookup
}), implement(ILookup, {
    lookup
}), implement(ISeqable, {
    seq
}), implement(ISeq, {
    first,
    rest
}), implement(INext, {
    next
}));
Object.assign(behaviors, {
    String: behave$5
});
behave$5(String);
function Task(fork1) {
    this.fork = fork1;
}
Task.prototype[Symbol.toStringTag] = "Task";
function task(fork2) {
    return new Task(fork2);
}
function resolve(value) {
    return task(function(reject, resolve5) {
        resolve5(value);
    });
}
function reject(value) {
    return task(function(reject3, resolve) {
        reject3(value);
    });
}
Task.of = resolve;
Task.resolve = resolve;
Task.reject = reject;
function fmap$1(self, f) {
    return task(function(reject4, resolve6) {
        self.fork(reject4, comp(resolve6, f));
    });
}
function flatMap(self, f) {
    return task(function(reject5, resolve7) {
        self.fork(reject5, function(value) {
            fork$5(f(value), reject5, resolve7);
        });
    });
}
function fork(self, reject6, resolve8) {
    self.fork(reject6, resolve8);
}
var behave$4 = does(keying("Task"), implement(IFlatMappable, {
    flatMap
}), implement(IForkable, {
    fork
}), implement(IFunctor, {
    fmap: fmap$1
}));
behave$4(Task);
function pluck(coll) {
    return nth$6(coll, randInt(count$b(coll)));
}
function uident(len) {
    return join("", repeatedly(len, partial(pluck, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")));
}
function UID(id, context) {
    this.id = id;
    this.context = context;
}
UID.prototype[Symbol.toStringTag] = "UID";
UID.prototype.toString = function() {
    return this.id;
};
function uid0() {
    return uid(uident(5));
}
function uid2(id, context = null) {
    return new UID(id, context);
}
const uid = overload(uid0, uid2, uid2);
function equiv(self, other) {
    return equiv$a(self.id, other.id) && equiv$a(self.context, other.context);
}
function hash(self) {
    return hash$7(self.id + "/" + (self.context || ""));
}
var behave$3 = does(implement(IEquiv, {
    equiv
}), implement(IHashable, {
    hash
}), keying("UID"));
behave$3(UID);
var _param$1, _verified;
function Verified(value, pred) {
    this.value = value;
    this.pred = pred;
}
Verified.prototype[Symbol.toStringTag] = "Verified";
function verified(value, pred) {
    if (!pred(value)) {
        throw new Error("Initial state could not be verified.");
    }
    return new Verified(value, pred);
}
const fluent = thrush((_verified = verified, _param$1 = function(value) {
    return value !== undefined;
}, function verified(_argPlaceholder) {
    return _verified(_argPlaceholder, _param$1);
}));
function fmap(self, f) {
    const value = f(self.value);
    return new Verified(self.pred(value) ? value : self.value, self.pred);
}
function deref$1(self) {
    return self.value;
}
var behave$2 = does(keying("Verified"), implement(IDeref, {
    deref: deref$1
}), implement(IFunctor, {
    fmap
}));
behave$2(Verified);
function Volatile(state) {
    this.state = state;
}
function __volatile(state) {
    return new Volatile(state);
}
Volatile.prototype[Symbol.toStringTag] = "Volatile";
function vreset(self, state) {
    return self.state = state;
}
function vswap(self, f) {
    return self.state = f(self.state);
}
function deref(self) {
    return self.state;
}
var behave$1 = does(keying("Volatile"), implement(IDeref, {
    deref
}));
behave$1(Volatile);
function keys$1(self) {
    return self.keys();
}
var iprotocol = does(implement(IMap, {
    keys: keys$1
}));
var _behaviors, _behaves, _param, _test, _days, _recurs, _str, _mapkv, _str2, _join, _collapse, _ISeq, _satisfies;
const config = _config;
iprotocol(Protocol);
const behave = (_behaves = behaves, _behaviors = behaviors, function behaves(_argPlaceholder) {
    return _behaves(_behaviors, _argPlaceholder);
});
function called4(fn, message, context, logger) {
    return function() {
        const meta = Object.assign({}, context, {
            fn,
            arguments
        });
        log(logger, message, meta);
        return meta.results = fn.apply(this, arguments);
    };
}
function called3(fn, message, context) {
    return called4(fn, message, context, config.logger);
}
function called2(fn, message) {
    return called3(fn, message, {});
}
const called = overload(null, null, called2, called3, called4);
function fillProp(obj15, key107, value) {
    if (!obj15.hasOwnProperty(key107)) {
        Object.defineProperty(obj15, key107, {
            value,
            writable: true,
            enumerable: false,
            configurable: true
        });
    }
}
function equals(other) {
    return equiv$a(this, other);
}
fillProp(Object.prototype, "equals", equals);
const yank = called(omit$3, "`yank` is deprecated — use `omit` instead.");
const numeric = (_test = test, _param = /^\d+$/i, function test(_argPlaceholder2) {
    return _test(_param, _argPlaceholder2);
});
(function() {
    function log1(self, ...args) {
        self.log(...args);
    }
    doto(console, specify(ILogger, {
        log: log1
    }));
    doto(Nil, implement(ILogger, {
        log: noop$1
    }));
})();
function severityLogger(logger, severity) {
    const f = logger[severity].bind(logger);
    function log2(self, ...args) {
        f(...args);
    }
    return doto({
        logger,
        severity
    }, specify(ILogger, {
        log: log2
    }));
}
function metaLogger(logger, ...meta) {
    function log$11(self, ...args) {
        log(logger, ...[
            ...mapa(execute, meta),
            ...args
        ]);
    }
    return doto({
        logger,
        meta
    }, specify(ILogger, {
        log: log$11
    }));
}
function labelLogger(logger, ...labels) {
    function log$12(self, ...args) {
        log(logger, ...[
            ...labels,
            ...args
        ]);
    }
    return doto({
        logger,
        labels
    }, specify(ILogger, {
        log: log$12
    }));
}
function peek(logger) {
    var _logger, _p$log, _p7;
    return tee((_p7 = p$2, _p$log = _p7.log, _logger = logger, function log(_argPlaceholder3) {
        return _p$log.call(_p7, _logger, _argPlaceholder3);
    }));
}
function siblings(self) {
    const parent1 = parent$1(self);
    if (parent1) {
        return filter(function(sibling) {
            return sibling !== self;
        }, children$1(parent1));
    } else {
        return emptyList();
    }
}
function prevSiblings(self) {
    return reverse(takeWhile(function(sibling) {
        return sibling !== self;
    }, siblings(self)));
}
function nextSiblings(self) {
    return rest$d(dropWhile(function(sibling) {
        return sibling !== self;
    }, siblings(self)));
}
const prevSibling = comp(first$d, prevSiblings$2);
const nextSibling = comp(first$d, nextSiblings$2);
const parents = upward(parent$1);
const root = comp(last, parents);
function closest(self, pred) {
    return detect(pred, cons(self, parents$2(self)));
}
extend(IHierarchy, {
    siblings,
    prevSibling,
    nextSibling,
    prevSiblings,
    nextSiblings,
    parents,
    closest,
    root
});
const forwardTo = called(forward, "`forwardTo` is deprecated — use `forward` instead.");
function recurs2(pd, step) {
    return recurrence(start$2(pd), end$2(pd), step);
}
const recurs = overload(null, (_recurs = recurs2, _days = days(1), function recurs2(_argPlaceholder4) {
    return _recurs(_argPlaceholder4, _days);
}), recurs2);
function inclusive(self) {
    return new self.constructor(self.start, add$3(self.end, self.step), self.step, self.direction);
}
function cleanlyN(f, ...args) {
    try {
        return f(...args);
    } catch  {
        return null;
    }
}
const cleanly = overload(null, curry(cleanlyN, 2), cleanlyN);
function mod3(obj16, key108, f) {
    if (key108 in obj16) {
        obj16[key108] = f(obj16[key108]);
    }
    return obj16;
}
function modN(obj17, key109, value, ...args) {
    return args.length > 0 ? modN(mod3(obj17, key109, value), ...args) : mod3(obj17, key109, value);
}
function edit(obj18, ...args) {
    const copy = clone$4(obj18);
    args.unshift(copy);
    return modN.apply(copy, args);
}
function deconstruct(dur, ...units) {
    let memo = dur;
    return mapa(function(unit4) {
        const n = fmap$b(divide$2(memo, unit4), Math.floor);
        memo = subtract(memo, fmap$b(unit4, constantly(n)));
        return n;
    }, units);
}
const toQueryString = opt((_mapkv = mapkv, _str = (_str2 = str, function str(_argPlaceholder6, _argPlaceholder7) {
    return _str2(_argPlaceholder6, "=", _argPlaceholder7);
}), function mapkv(_argPlaceholder5) {
    return _mapkv(_str, _argPlaceholder5);
}), (_join = join, function join(_argPlaceholder8) {
    return _join("&", _argPlaceholder8);
}), (_collapse = collapse, function collapse(_argPlaceholder9) {
    return _collapse("?", _argPlaceholder9);
}));
function fromQueryString(url) {
    const params = {};
    each(function(match) {
        const key110 = decodeURIComponent(match[1]), val7 = decodeURIComponent(match[2]);
        params[key110] = val7;
    }, reFindAll(/[?&]([^=&]*)=([^=&]*)/g, url));
    return params;
}
function unique(xs) {
    return coerce$1(new Set(coerce$1(xs, Array)), Array);
}
const second = branch((_satisfies = satisfies, _ISeq = ISeq, function satisfies(_argPlaceholder10) {
    return _satisfies(_ISeq, _argPlaceholder10);
}), comp(ISeq.first, ISeq.rest), prop("second"));
function expands(f) {
    function expand(...contents) {
        return detect(isFunction, contents) ? postpone(...contents) : f(...contents);
    }
    function postpone(...contents) {
        return function(value) {
            const expanded = map(function(content) {
                return isFunction(content) ? content(value) : content;
            }, contents);
            return apply(expand, expanded);
        };
    }
    return expand;
}
function filled2(f, g) {
    return function(...args) {
        return seq$a(filter(isNil, args)) ? g(...args) : f(...args);
    };
}
function filled1(f) {
    return filled2(f, noop$1);
}
const filled = overload(null, filled1, filled2);
function elapsed(self) {
    return duration(end$2(self) - start$2(self));
}
function collapse(...args) {
    return some$1(isBlank, args) ? "" : join("", args);
}
function impartable(f) {
    return isFunction(f) && !/^[A-Z]./.test(name(f));
}
function impart(self, f) {
    return decorating3(self, impartable, f);
}
function decorating2(self, f) {
    return decorating3(self, identity, f);
}
function decorating3(self, pred, f) {
    const memo = {};
    for (const [key111, value] of Object.entries(self)){
        memo[key111] = pred(value, key111) ? f(value) : value;
    }
    return memo;
}
const decorating = overload(null, null, decorating2, decorating3);
function include2(self, value) {
    var _value, _p$conj, _p2, _value2, _p$omit, _p3, _value3, _p$includes, _p4;
    return toggles((_p2 = p$2, _p$conj = _p2.conj, _value = value, function conj(_argPlaceholder11) {
        return _p$conj.call(_p2, _argPlaceholder11, _value);
    }), (_p3 = p$2, _p$omit = _p3.omit, _value2 = value, function omit(_argPlaceholder12) {
        return _p$omit.call(_p3, _argPlaceholder12, _value2);
    }), (_p4 = p$2, _p$includes = _p4.includes, _value3 = value, function includes(_argPlaceholder13) {
        return _p$includes.call(_p4, _argPlaceholder13, _value3);
    }), self);
}
function include3(self, value, want) {
    var _value4, _p$conj2, _p5, _value5, _p$omit2, _p6, _value6, _p$includes2, _p7;
    return toggles((_p5 = p$2, _p$conj2 = _p5.conj, _value4 = value, function conj(_argPlaceholder14) {
        return _p$conj2.call(_p5, _argPlaceholder14, _value4);
    }), (_p6 = p$2, _p$omit2 = _p6.omit, _value5 = value, function omit(_argPlaceholder15) {
        return _p$omit2.call(_p6, _argPlaceholder15, _value5);
    }), (_p7 = p$2, _p$includes2 = _p7.includes, _value6 = value, function includes(_argPlaceholder16) {
        return _p$includes2.call(_p7, _argPlaceholder16, _value6);
    }), self, want);
}
const include = overload(null, null, include2, include3);
function inventory(obj19) {
    var _ref, _ref2, _obj, _join2, _str3;
    return _ref = (_ref2 = (_obj = obj19, Object.keys(_obj)), (_join2 = join, function join(_argPlaceholder17) {
        return _join2(",\n", _argPlaceholder17);
    })(_ref2)), (_str3 = str, function str(_argPlaceholder18) {
        return _str3("{\n", _argPlaceholder18, "\n}");
    })(_ref);
}
const fmt = expands(str);
function when(pred, ...xs) {
    return last(map(realize, pred ? xs : null));
}
function readable(keys) {
    const lookup1 = keys ? function(self, key112) {
        if (!includes$9(keys, key112)) {
            throw new Error("Cannot read from " + key112);
        }
        return self[key112];
    } : function(self, key113) {
        return self[key113];
    };
    return implement(ILookup, {
        lookup: lookup1
    });
}
function writable(keys) {
    function clone1(self) {
        return Object.assign(Object.create(self.constructor.prototype), self);
    }
    function contains1(self, key114) {
        return self.hasOwnProperty(key114);
    }
    const assoc1 = keys ? function(self, key115, value) {
        if (!includes$9(keys, key115) || !contains1(self, key115)) {
            throw new Error("Cannot write to " + key115);
        }
        const tgt = clone1(self);
        tgt[key115] = value;
        return tgt;
    } : function(self, key116, value) {
        if (!contains1(self, key116)) {
            throw new Error("Cannot write to " + key116);
        }
        const tgt = clone1(self);
        tgt[key116] = value;
        return tgt;
    };
    return does(implement(IClonable, {
        clone: clone1
    }), implement(IAssociative, {
        assoc: assoc1,
        contains: contains1
    }));
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
    return apply(reduce$e, partial(scanKey3, better), x, args);
}
const scanKey = overload(null, scanKey1, null, scanKey3, scanKey4, scanKeyN);
const maxKey = scanKey(gt);
const minKey = scanKey(lt);
function absorb2(tgt, src) {
    return reducekv$a(function(memo, key117, value) {
        const was = get(memo, key117);
        let absorbed;
        if (was == null) {
            absorbed = value;
        } else if (descriptive(value)) {
            absorbed = into(empty$1(was), absorb(was, value));
        } else if (satisfies(ISequential, value)) {
            absorbed = into(empty$1(was), concat(was, value));
        } else {
            absorbed = value;
        }
        return assoc$8(memo, key117, absorbed);
    }, tgt, src || empty$1(tgt));
}
const absorb = overload(constantly({}), identity, absorb2, reducing(absorb2));
function unfork(self) {
    return new Promise(function(resolve9, reject7) {
        fork$5(self, reject7, resolve9);
    });
}
function reduceToArray(self) {
    return reduce$e(function(memo, value) {
        memo.push(value);
        return memo;
    }, [], self);
}
ICoercible.addMethod([
    Set,
    Array
], unary(Array.from));
ICoercible.addMethod([
    Array,
    Set
], function(coll) {
    return new Set(coll);
});
ICoercible.addMethod([
    Number,
    String
], unary(str));
ICoercible.addMethod([
    Number,
    Date
], unary(date));
ICoercible.addMethod([
    Duration,
    Duration
], identity);
ICoercible.addMethod([
    Period,
    Duration
], function(self) {
    return self.end == null || self.start == null ? duration(Number.POSITIVE_INFINITY) : duration(self.end - self.start);
});
ICoercible.addMethod([
    Promise,
    Promise
], identity);
ICoercible.addMethod([
    Right,
    Promise
], unfork);
ICoercible.addMethod([
    Left,
    Promise
], unfork);
ICoercible.addMethod([
    Error,
    Promise
], unfork);
ICoercible.addMethod([
    Okay,
    Promise
], unfork);
ICoercible.addMethod([
    Task,
    Promise
], unfork);
ICoercible.addMethod([
    Object,
    Object
], identity);
ICoercible.addMethod([
    Array,
    Object
], function(self) {
    return reduce$e(function(memo, [key118, value]) {
        memo[key118] = value;
        return memo;
    }, {}, self);
});
ICoercible.addMethod([
    Array,
    Array
], identity);
ICoercible.addMethod([
    Multimap,
    Array
], comp(Array.from, seq$a));
ICoercible.addMethod([
    Concatenated,
    Array
], reduceToArray);
ICoercible.addMethod([
    EmptyList,
    Array
], emptyArray);
ICoercible.addMethod([
    List,
    Array
], reduceToArray);
ICoercible.addMethod([
    Range,
    Array
], reduceToArray);
ICoercible.addMethod([
    Nil,
    Array
], emptyArray);
ICoercible.addMethod([
    IndexedSeq,
    Array
], reduceToArray);
ICoercible.addMethod([
    RevSeq,
    Array
], unary(Array.from));
ICoercible.addMethod([
    LazySeq,
    Array
], function(xs) {
    let ys = xs;
    const zs = [];
    while(seq$a(ys) != null){
        zs.push(first$d(ys));
        ys = rest$d(ys);
    }
    return zs;
});
ICoercible.addMethod([
    Multimap,
    Array
], comp(Array.from, seq$a));
ICoercible.addMethod([
    Object,
    Array
], reduceToArray);
ICoercible.addMethod([
    String,
    Array
], function(self) {
    return self.split("");
});
const mod = {
    Benchmark: Benchmark,
    Concatenated: Concatenated,
    Duration: Duration,
    EmptyList: EmptyList,
    GUID: GUID,
    IAddable: IAddable,
    IAppendable: IAppendable,
    IAssociative: IAssociative,
    IBlankable: IBlankable,
    IBounded: IBounded,
    IClonable: IClonable,
    ICoercible: ICoercible,
    ICollection: ICollection,
    ICompactible: ICompactible,
    IComparable: IComparable,
    ICounted: ICounted,
    IDeref: IDeref,
    IDisposable: IDisposable,
    IDivisible: IDivisible,
    IEmptyableCollection: IEmptyableCollection,
    IEquiv: IEquiv,
    IFind: IFind,
    IFlatMappable: IFlatMappable,
    IFn: IFn,
    IForkable: IForkable,
    IFunctor: IFunctor,
    IHashable: IHashable,
    IHierarchy: IHierarchy,
    IIdentifiable: IIdentifiable,
    IInclusive: IInclusive,
    IIndexed: IIndexed,
    IInsertable: IInsertable,
    IInversive: IInversive,
    IKVReducible: IKVReducible,
    ILogger: ILogger,
    ILookup: ILookup,
    IMap: IMap,
    IMapEntry: IMapEntry,
    IMergable: IMergable,
    IMultipliable: IMultipliable,
    INamable: INamable,
    INext: INext,
    IOmissible: IOmissible,
    IOtherwise: IOtherwise,
    IPath: IPath,
    IPrependable: IPrependable,
    IReducible: IReducible,
    IResettable: IResettable,
    IReversible: IReversible,
    IRevertible: IRevertible,
    ISend: ISend,
    ISeq: ISeq,
    ISeqable: ISeqable,
    ISequential: ISequential$1,
    ISet: ISet,
    ISplittable: ISplittable,
    ISwappable: ISwappable,
    ITemplate: ITemplate,
    Indexed: Indexed,
    IndexedSeq: IndexedSeq,
    Journal: Journal,
    Just: Just,
    LazySeq: LazySeq,
    Left: Left,
    Lens: Lens,
    List: List,
    Members: Members,
    Multimap: Multimap,
    Multimethod: Multimethod,
    Mutable: Mutable,
    Nil: Nil,
    Nothing: Nothing,
    Okay: Okay,
    Period: Period,
    PostconditionError: PostconditionError,
    PreconditionError: PreconditionError,
    Protocol: Protocol,
    ProtocolLookupError: ProtocolLookupError,
    Range: Range,
    Recurrence: Recurrence,
    Reduced: Reduced,
    RevSeq: RevSeq,
    Right: Right,
    Router: Router,
    Task: Task,
    UID: UID,
    Verified: Verified,
    Volatile: Volatile,
    absorb: absorb,
    add: add$3,
    addMethod: addMethod,
    addRoute: addRoute,
    after: after,
    ako: ako,
    alike: alike,
    all: all,
    also: also,
    ancestors: ancestors,
    and: and,
    annually: annually,
    any: any,
    append: append$1,
    apply: apply,
    applying: applying,
    arity: arity,
    array: array,
    asLeaves: asLeaves,
    asc: asc,
    assoc: assoc$8,
    assocIn: assocIn,
    assume: assume,
    attach: attach,
    average: average$1,
    awaits: awaits,
    before: before,
    behave: behave,
    behaves: behaves,
    behaviors: behaviors,
    benchmark: benchmark,
    best: best,
    between: between,
    binary: binary,
    blank: blank$2,
    blot: blot,
    bool: bool,
    boolean: __boolean,
    both: both,
    braid: braid,
    branch: branch,
    butlast: butlast,
    called: called,
    camelToDashed: camelToDashed,
    chain: chain,
    children: children$1,
    clamp: clamp,
    cleanly: cleanly,
    clockHour: clockHour,
    clone: clone$4,
    closest: closest$2,
    coalesce: coalesce,
    coerce: coerce$1,
    collapse: collapse,
    comp: comp,
    compact: compact$1,
    compare: compare$6,
    compile: compile,
    complement: complement,
    concat: concat,
    concatenated: concatenated,
    cond: cond,
    config: config,
    conj: conj$8,
    cons: cons,
    constantly: constantly,
    construct: construct,
    constructs: constructs,
    contains: contains$8,
    count: count$b,
    countBy: countBy,
    curry: curry,
    cycle: cycle,
    date: date,
    day: day,
    days: days,
    dec: dec,
    deconstruct: deconstruct,
    decorating: decorating,
    dedupe: dedupe,
    defaults: defaults,
    deferring: deferring,
    deref: deref$b,
    desc: desc,
    descendants: descendants$1,
    descriptive: descriptive$1,
    detach: detach,
    detect: detect,
    difference: difference,
    directed: directed,
    disj: disj,
    dispose: dispose,
    dissoc: dissoc$5,
    divide: divide$2,
    doall: doall,
    does: does,
    doing: doing,
    dorun: dorun,
    doseq: doseq,
    dotimes: dotimes,
    doto: doto,
    dow: dow,
    downward: downward,
    drop: drop,
    dropLast: dropLast,
    dropWhile: dropWhile,
    duration: duration,
    each: each,
    eachIndexed: eachIndexed,
    eachkv: eachkv,
    eachvk: eachvk,
    edit: edit,
    either: either,
    elapsed: elapsed,
    empty: empty$1,
    emptyArray: emptyArray,
    emptyList: emptyList,
    emptyObject: emptyObject,
    emptyPeriod: emptyPeriod,
    emptyRange: emptyRange,
    emptyRecurrence: emptyRecurrence,
    emptyString: emptyString,
    end: end$2,
    endsWith: endsWith,
    entries: entries,
    eod: eod,
    eom: eom,
    eoy: eoy,
    eq: eq,
    equiv: equiv$a,
    equivalent: equivalent,
    error: error,
    every: every,
    everyPair: everyPair,
    everyPred: everyPred,
    excludes: excludes,
    execute: execute,
    expands: expands,
    extend: extend,
    factory: factory,
    farg: farg,
    fill: fill$2,
    filled: filled,
    filter: filter,
    filtera: filtera,
    find: find$1,
    first: first$d,
    flatMap: flatMap$3,
    flatten: flatten,
    flip: flip,
    float: __float,
    fluent: fluent,
    flush: flush$1,
    flushable: flushable$1,
    fmap: fmap$b,
    fmt: fmt,
    fnil: fnil,
    fold: fold,
    folding: folding,
    foldkv: foldkv,
    fork: fork$5,
    forward: forward,
    forwardTo: forwardTo,
    fromQueryString: fromQueryString,
    generate: generate,
    get: get,
    getIn: getIn,
    groupBy: groupBy,
    gt: gt,
    gte: gte,
    guard: guard,
    guid: guid,
    handle: handle,
    hash: hash$7,
    hashTag: hashTag,
    hour: hour,
    hours: hours,
    identifier: identifier,
    identity: identity,
    idx: idx$3,
    impart: impart,
    implement: implement,
    inc: inc,
    include: include,
    includes: includes$9,
    inclusive: inclusive,
    index: index,
    indexOf: indexOf,
    indexed: indexed,
    indexedSeq: indexedSeq,
    initial: initial,
    inside: inside,
    int: __int,
    integers: integers,
    interleave: interleave,
    interleaved: interleaved,
    interpose: interpose,
    intersection: intersection,
    into: into,
    inventory: inventory,
    inverse: inverse$1,
    invokable: invokable,
    invoke: invoke$3,
    invokes: invokes,
    is: is,
    isArray: isArray,
    isBlank: isBlank,
    isBoolean: isBoolean,
    isDate: isDate,
    isDistinct: isDistinct,
    isEmpty: isEmpty,
    isError: isError,
    isEven: isEven,
    isFalse: isFalse,
    isFloat: isFloat,
    isFunction: isFunction,
    isIdentical: isIdentical,
    isInt: isInt,
    isInteger: isInteger,
    isNaN: isNaN,
    isNative: isNative,
    isNeg: isNeg,
    isNil: isNil,
    isNumber: isNumber,
    isObject: isObject,
    isOdd: isOdd,
    isPos: isPos,
    isPromise: isPromise,
    isReduced: isReduced,
    isRegExp: isRegExp,
    isSome: isSome,
    isString: isString,
    isSymbol: isSymbol,
    isTrue: isTrue,
    isValueObject: isValueObject,
    isZero: isZero,
    iterable: iterable,
    iterate: iterate$1,
    join: join,
    journal: journal,
    juxt: juxt,
    juxtVals: juxtVals,
    keep: keep,
    keepIndexed: keepIndexed,
    key: key$3,
    keyed: keyed,
    keying: keying,
    keys: keys$b,
    kin: kin,
    labelLogger: labelLogger,
    last: last,
    lazyIterable: lazyIterable,
    lazySeq: lazySeq,
    least: least,
    leaves: leaves,
    left: left,
    lens: lens,
    list: list,
    log: log,
    lowerCase: lowerCase,
    lpad: lpad,
    lt: lt,
    lte: lte,
    ltrim: ltrim,
    map: map,
    mapArgs: mapArgs,
    mapIndexed: mapIndexed,
    mapKeys: mapKeys,
    mapSome: mapSome,
    mapVals: mapVals,
    mapa: mapa,
    mapcat: mapcat,
    mapkv: mapkv,
    mapvk: mapvk,
    max: max,
    maxKey: maxKey,
    maybe: maybe,
    mdow: mdow,
    measure: measure,
    members: members,
    memoize: memoize,
    merge: merge$4,
    mergeWith: mergeWith,
    metaLogger: metaLogger,
    midnight: midnight,
    millisecond: millisecond,
    milliseconds: milliseconds,
    min: min,
    minKey: minKey,
    minute: minute,
    minutes: minutes,
    modulus: modulus,
    month: month,
    monthDays: monthDays,
    months: months,
    most: most$1,
    mult: mult$2,
    multi: multi,
    multimap: multimap,
    multimethod: multimethod,
    mutable: mutable,
    mutate: mutate,
    name: name,
    nary: nary,
    negatives: negatives,
    next: next$a,
    nextSibling: nextSibling$2,
    nextSiblings: nextSiblings$2,
    nil: nil,
    noon: noon,
    noop: noop$1,
    not: not,
    notAny: notAny,
    notEmpty: notEmpty,
    notEq: notEq,
    notEvery: notEvery,
    notSome: notSome,
    nothing: nothing,
    nth: nth$6,
    nullary: nullary,
    num: num,
    number: number,
    numeric: numeric,
    obj: obj,
    object: object,
    okay: okay,
    omit: omit$3,
    once: once,
    only: only,
    opt: opt,
    or: or,
    otherwise: otherwise$4,
    overlap: overlap,
    overload: overload,
    parent: parent$1,
    parents: parents$2,
    parsedo: parsedo,
    partial: partial,
    partition: partition,
    partitionAll: partitionAll,
    partitionAll1: partitionAll1,
    partitionAll2: partitionAll2,
    partitionAll3: partitionAll3,
    partitionBy: partitionBy,
    partly: partly,
    patch: patch,
    path: path$1,
    peek: peek,
    period: period,
    period1: period1,
    pipe: pipe,
    pipeline: pipeline,
    placeholder: placeholder,
    pluck: pluck,
    plug: plug,
    pm: pm,
    positives: positives,
    posn: posn,
    post: post,
    pre: pre,
    prepend: prepend$2,
    prevSibling: prevSibling$2,
    prevSiblings: prevSiblings$2,
    promise: promise,
    prop: prop,
    protocol: protocol,
    quarter: quarter,
    quaternary: quaternary,
    race: race,
    rand: rand,
    randInt: randInt,
    randNth: randNth,
    range: range,
    rdow: rdow,
    reFind: reFind,
    reFindAll: reFindAll,
    reGroups: reGroups,
    reMatches: reMatches,
    rePattern: rePattern,
    reSeq: reSeq,
    readable: readable,
    realize: realize,
    realized: realized,
    record: record,
    recurrence: recurrence,
    recurrence1: recurrence1,
    recurs: recurs,
    redo: redo$1,
    redoable: redoable$1,
    reduce: reduce$e,
    reduced: reduced$1,
    reducekv: reducekv$a,
    reducekv2: reducekv2,
    reducekv3: reducekv3,
    reducing: reducing,
    reifiable: reifiable,
    remove: remove,
    removeKeys: removeKeys,
    repeat: repeat,
    repeatedly: repeatedly,
    replace: replace,
    reset: reset$2,
    resettable: resettable$1,
    rest: rest$d,
    revSeq: revSeq,
    reverse: reverse$4,
    revision: revision$1,
    rewrite: rewrite,
    right: right,
    root: root$2,
    router: router,
    rpad: rpad,
    rtrim: rtrim,
    satisfies: satisfies,
    scan: scan,
    scanKey: scanKey,
    second: second,
    seconds: seconds,
    see: see,
    seek: seek,
    selectKeys: selectKeys,
    send: send,
    seq: seq$a,
    sequential: sequential,
    series: series,
    severityLogger: severityLogger,
    shuffle: shuffle,
    siblings: siblings$2,
    signature: signature,
    signatureHead: signatureHead,
    slice: slice,
    sod: sod,
    som: som,
    some: some$1,
    someFn: someFn,
    sort: sort,
    sortBy: sortBy,
    soy: soy,
    specify: specify,
    splice: splice,
    split: split$2,
    splitAt: splitAt,
    splitWith: splitWith,
    spread: spread,
    start: start$2,
    startsWith: startsWith,
    steps: steps,
    str: str,
    subj: subj,
    subs: subs,
    subset: subset,
    subsumes: subsumes,
    subtract: subtract,
    sum: sum,
    superset: superset,
    swap: swap$1,
    take: take,
    takeLast: takeLast,
    takeNth: takeNth,
    takeWhile: takeWhile,
    task: task,
    tee: tee,
    template: template,
    ternary: ternary,
    test: test,
    thrush: thrush,
    tick: tick,
    time: time,
    titleCase: titleCase,
    toArray: toArray,
    toDuration: toDuration,
    toObject: toObject,
    toPromise: toPromise,
    toQueryString: toQueryString,
    toggles: toggles,
    transduce: transduce,
    transpose: transpose,
    treeSeq: treeSeq,
    trim: trim,
    type: type,
    uid: uid,
    uident: uident,
    unary: unary,
    unbind: unbind,
    unconj: unconj$1,
    undo: undo$1,
    undoable: undoable$1,
    unfork: unfork,
    union: union,
    unique: unique,
    unite: unite,
    unpartly: unpartly,
    unreduced: unreduced,
    unspecify: unspecify,
    unspread: unspread,
    untick: untick,
    update: update,
    updateIn: updateIn,
    upperCase: upperCase,
    upward: upward,
    val: val$2,
    vals: vals$5,
    verified: verified,
    volatile: __volatile,
    vreset: vreset,
    vswap: vswap,
    weekday: weekday,
    weekend: weekend,
    weeks: weeks,
    when: when,
    withIndex: withIndex,
    writable: writable,
    yank: yank,
    year: year,
    years: years,
    zeros: zeros,
    zip: zip
};
const __default = Object.assign(mod.placeholder, mod.impart(mod, mod.partly));
const IGame = __default.protocol({
    perspective: null,
    up: null,
    seats: null,
    events: null,
    moves: null,
    irreversible: null,
    execute: null,
    fold: null,
    score: null
});
const irreversible = IGame.irreversible;
const up = IGame.up;
const seats = IGame.seats;
const fold1 = IGame.fold;
const events = IGame.events;
const score = IGame.score;
const perspective = __default.chain(IGame.perspective, __default.post(__default, __default.and(__default.contains(__default, "seen"), __default.contains(__default, "seated"), __default.contains(__default, "state"), __default.contains(__default, "events"), __default.contains(__default, "moves"), __default.contains(__default, "score"), __default.contains(__default, "up"))));
function seated(self) {
    return __default.chain(self, numSeats, __default.range, __default.toArray);
}
function numSeats(self) {
    return __default.chain(self, seats, __default.count);
}
function incidental({ seat  }) {
    return seat == null;
}
function crunch(self) {
    const history = __default.clone(self.history);
    history.splice(__default.count(history) - 1, 1);
    return new __default.Journal(self.pos, self.max, history, self.state);
}
function reversibility(self) {
    const state = __default.deref(self);
    const seat = state.up;
    const undoable2 = __default.undoable(self), redoable2 = __default.redoable(self), flushable2 = __default.flushable(self), resettable2 = __default.resettable(self);
    return __default.compact([
        resettable2 ? {
            type: "reset",
            seat
        } : null,
        undoable2 ? {
            type: "undo",
            seat
        } : null,
        redoable2 ? {
            type: "redo",
            seat
        } : null,
        flushable2 && !redoable2 ? {
            type: "commit",
            seat
        } : null
    ]);
}
function execute3(self, command, s) {
    const { type: type2  } = command;
    const event = Object.assign({
        seat: s
    }, command);
    const { seat  } = event;
    if (seat == null) {} else if (!__default.isInt(seat)) {
        throw new Error("Seat must be an integer");
    } else if (!__default.includes(everyone(self), seat)) {
        throw new Error("Invalid seat");
    }
    switch(type2){
        case "start":
        case "finish":
            if (__default.detect(__default.pipe(__default.get(__default, "type"), __default.eq(__default, type2)), events(self))) {
                throw new Error(`Cannot ${type2} more than once!`);
            }
            break;
        case "undo":
            if (!__default.undoable(self)) {
                throw new Error("Undo not possible.");
            }
            break;
        case "redo":
            if (!__default.redoable(self)) {
                throw new Error("Redo not possible.");
            }
            break;
        case "commit":
            if (!__default.flushable(self)) {
                throw new Error("Commit not possible.");
            }
            break;
        case "~":
            return __default.maybe(self, up, __default.first, __default.array, (x)=>moves(self, x)
            , __default.last, (x)=>execute1(self, x, seat)
            ) || self;
    }
    return IGame.execute(self, event, seat);
}
const execute1 = __default.overload(null, null, execute3, execute3);
function finish(self) {
    return execute1(self, {
        type: "finish"
    });
}
function load(self, events1) {
    return __default.reduce(fold1, self, events1);
}
function run(self, commands, seat) {
    return __default.reduce((x, y)=>execute1(x, y, seat)
    , self, commands);
}
function whatif(self, commands, seat) {
    const prior = self;
    const curr = __default.reduce((x, y)=>execute1(x, y, seat)
    , prior, commands);
    return {
        added: added(curr, prior),
        up: up(curr),
        notify: notify(curr, prior)
    };
}
function batch($state, f, xs) {
    __default.each(function(x) {
        __default.swap($state, f(__default, [
            x
        ]));
    }, xs);
}
function transact($state, f, xs) {
    __default.swap($state, f(__default, xs));
}
function added(curr, prior) {
    return prior ? __default.chain(events(curr), __default.last(__default.count(events(curr)) - __default.count(events(prior)), __default), __default.toArray) : [];
}
function moves2(self, seats1) {
    return __default.chain(self, IGame.moves, __default.filter(__default.pipe(__default.get(__default, "seat"), __default.includes(seats1, __default)), __default));
}
const moves = __default.overload(null, IGame.moves, moves2);
function perspectives(self) {
    return __default.chain(self, seated, __default.mapa(__default.pipe(__default.array, __default.partial(perspective, self)), __default));
}
function notify(curr, prior) {
    return __default.difference(up(curr), prior ? up(prior) : []);
}
function everyone(self) {
    return __default.toArray(__default.mapIndexed(__default.identity, seated(self)));
}
function summarize([curr, prior]) {
    return {
        up: up(curr),
        notify: notify(curr, prior),
        added: added(curr, prior),
        perspectives: perspectives(curr),
        reality: __default.compact(perspective(curr, everyone(curr))),
        game: curr
    };
}
function singular(xs) {
    const n = __default.count(xs);
    if (n !== 1) {
        throw new Error("Singular value expected");
    }
    return __default.first(xs);
}
function simulate(self, events2, commands, seen) {
    return __default.chain(self, (x)=>load(x, events2)
    , __default.seq(commands) ? (x)=>whatif(x, commands, singular(seen))
     : (x)=>perspective(x, seen)
    );
}
const mod1 = {
    IGame: IGame,
    irreversible: irreversible,
    up: up,
    seats: seats,
    fold: fold1,
    events: events,
    score: score,
    perspective: perspective,
    seated: seated,
    numSeats: numSeats,
    incidental: incidental,
    crunch: crunch,
    reversibility: reversibility,
    execute: execute1,
    finish: finish,
    load: load,
    run: run,
    whatif: whatif,
    batch: batch,
    transact: transact,
    added: added,
    moves: moves,
    perspectives: perspectives,
    notify: notify,
    everyone: everyone,
    summarize: summarize,
    simulate: simulate
};
const __default1 = impart(mod1, partly);
const IGame1 = __default1.IGame;
const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "K",
    "Q",
    "A"
];
const suits = [
    "♥️",
    "♠️",
    "♦️",
    "♣️"
];
const handSizes = upAndDown(1, 2);
function upAndDown(min3, max5) {
    return __default.toArray(__default.dedupe(__default.concat(__default.range(min3, max5 + 1), __default.range(max5, min3 - 1, -1))));
}
function card(rank1, suit) {
    return {
        rank: rank1,
        suit
    };
}
function rank(card1, trump, lead) {
    const n = __default.indexOf(ranks, card1.rank);
    return (card1.suit === trump ? 100 : 0) + (card1.suit === lead ? 0 : -50) + n;
}
function ranked(cards, trump) {
    const lead = __default.first(cards).suit;
    function compare6(a, b) {
        return rank(b, trump, lead) - rank(a, trump, lead);
    }
    return __default.chain(cards, __default.filter(function(card2) {
        return card2.suit === lead || card2.suit === trump;
    }, __default), __default.sort(compare6, __default));
}
function deck() {
    return __default.braid(card, ranks, suits);
}
function OhHell(seats1, config1, events1, journal3) {
    this.seats = seats1;
    this.config = config1;
    this.events = events1;
    this.journal = journal3;
}
function ohHell(seats2, config2, events2, journal4) {
    if (!__default.count(seats2)) {
        throw new Error("Cannot play a game with no one seated at the table");
    }
    return new OhHell(__default.toArray(seats2), config2, events2 || [], journal4 || __default.journal({}));
}
function deal(self) {
    return __default1.execute(self, {
        type: "deal"
    });
}
function award(winner, trick) {
    return function(self) {
        return __default1.execute(self, {
            type: "award",
            details: {
                winner,
                trick
            }
        });
    };
}
function ordered(seats3, lead) {
    return __default.chain(seats3, __default.range, __default.cycle, __default.dropWhile(__default.notEq(__default, lead), __default), __default.take(seats3, __default), __default.toArray);
}
function follow(state) {
    return state.seated[state.lead].played || null;
}
function tight(hand) {
    return __default.chain(hand, __default.map(__default.get(__default, "suit"), __default), __default.unique, __default.count, __default.eq(__default, 1));
}
function bidding(state) {
    return __default.count(__default.filter(__default.isSome, __default.map(__default.get(__default, "bid"), state.seated))) !== __default.count(state.seated);
}
function handsEmpty(state) {
    return __default.chain(state, __default.get(__default, "seated"), __default.mapa(__default.get(__default, "hand"), __default), __default.flatten, __default.compact, __default.seq, __default.not);
}
function up1(self) {
    const state = __default.deref(self);
    return __default.chain(state.seated, __default.mapIndexed(function(seat, data) {
        return {
            seat,
            bid: data.bid
        };
    }, __default), __default.filter(function(seat) {
        return seat.bid == null;
    }, __default), __default.mapa(__default.get(__default, "seat"), __default), __default.seq) || (state.up == null ? [] : [
        state.up
    ]);
}
function score1(self) {
    const state = __default.deref(self);
    return __default.chain(state.seated, __default.mapa(function(seat) {
        return __default.sum(__default.map(__default.get(__default, "points"), seat.scored));
    }, __default));
}
function bids(state) {
    const size = handSizes[state.round] || 0;
    const bids1 = __default.cons(null, __default.range(0, size + 1));
    return __default.chain(state.seated, __default.mapIndexed(function(idx21, seat) {
        return __default.chain(bids1, __default.mapa(function(bid) {
            return {
                type: "bid",
                details: {
                    bid
                },
                seat: idx21
            };
        }, __default), __default.remove(__default.pipe(__default.getIn(__default, [
            "details",
            "bid"
        ]), __default.eq(__default, seat.bid)), __default));
    }, __default), __default.flatten, __default.compact);
}
function playable(state, seat) {
    const seated1 = state.seated[seat];
    const lead = follow(state);
    const trump = state.trump;
    const hand = seated1.hand;
    const follows = lead ? __default.pipe(__default.get(__default, "suit"), __default.eq(__default, lead.suit)) : __default.identity;
    const cards = lead ? __default.seq(__default.filter(follows, hand)) || hand : state.broken || tight(hand) ? hand : __default.filter(__default.pipe(__default.get(__default, "suit"), __default.notEq(__default, trump.suit)), hand);
    return seated1.played ? [] : __default.map(function(card3) {
        return {
            type: "play",
            seat,
            details: {
                card: card3
            }
        };
    }, cards);
}
function moves1(self) {
    const state = __default.deref(self), reversibility1 = __default1.reversibility(self);
    if (state.up != null) {
        switch(state.status){
            case "confirming":
                return reversibility1;
            case "bidding":
                return __default.concat(reversibility1, bids(state));
            case "playing":
                return __default.concat(reversibility1, state.trick ? [] : playable(state, state.up));
        }
    }
    return [];
}
function irreversible1(self, command) {
    return __default.includes([
        "start",
        "deal",
        "bid",
        "commit",
        "finish"
    ], command.type);
}
function execute2(self1, command, seat1) {
    const state1 = __default.deref(self1);
    const valid = __default.detect(__default.eq(__default, __default.dissoc(command, "id")), __default1.moves(self1, [
        seat1
    ]));
    const { type: type3 , details  } = command;
    const automatic = __default.includes([
        "start",
        "award",
        "scoring",
        "finish",
        "deal"
    ], type3);
    if (!automatic && !valid) {
        throw new Error(`Invalid ${type3}`);
    }
    if (automatic && seat1 != null) {
        throw new Error(`Cannot invoke automatic command ${type3}`);
    }
    if (!__default.seq(__default1.events(self1)) && type3 != "start") {
        throw new Error(`Cannot ${type3} unless the game is first started.`);
    }
    switch(type3){
        case "start":
            return __default.chain(self1, __default1.fold(__default, command), deal);
        case "deal":
            if (!handsEmpty(state1)) {
                throw new Error("Hands are not yet empty!");
            }
            return function() {
                const round = state1.round + 1;
                const numHands = __default1.numSeats(self1);
                const numCards = handSizes[round];
                const dealt = numCards * numHands;
                const cards = __default.chain(deck(), __default.shuffle);
                const hands = __default.chain(cards, __default.take(dealt, __default), __default.mapa(function(card4, hand) {
                    return [
                        card4,
                        hand
                    ];
                }, __default, __default.cycle(__default.range(numHands))), __default.reduce(function(memo, [card5, hand]) {
                    return __default.update(memo, hand, __default.conj(__default, card5));
                }, Array.from(__default.repeat(numHands, [])), __default));
                const undealt = __default.chain(cards, __default.drop(dealt, __default));
                const trump = __default.chain(undealt, __default.first);
                return __default1.fold(self1, __default.assoc(command, "details", {
                    deck: __default.chain(undealt, __default.rest, __default.toArray),
                    hands,
                    trump,
                    round
                }));
            }();
        case "play":
            const breaks = details.card.suit == state1.trump.suit && !state1.broken;
            return __default.chain(self1, __default1.fold(__default, command), breaks ? __default1.fold(__default, {
                type: "broken"
            }) : __default.identity, function(self) {
                const state = __default.deref(self);
                const ord = ordered(__default1.numSeats(self), state.lead);
                const trick = __default.mapa(__default.pipe(__default.array(__default, "played"), __default.getIn(state.seated, __default)), ord);
                const complete = __default.count(__default.filter(__default.isSome, trick)) == __default1.numSeats(self);
                if (complete) {
                    const ranking = ranked(trick, state.trump.suit);
                    const best1 = __default.first(ranking);
                    const winner = __default.indexOf(trick, best1);
                    return __default.chain(self, award(winner, trick));
                }
                return self;
            }, __default.branch(__default.pipe(__default.deref, handsEmpty), scoring, __default.identity));
        case "finish":
            return function() {
                const scores = __default1.score(self1);
                const places = __default.chain(scores, __default.unique, __default.sort, __default.reverse, __default.toArray);
                const ranked1 = __default.chain(state1.seated, __default.mapIndexed(function(seat) {
                    const points = __default.nth(scores, seat);
                    const place = __default.indexOf(places, points);
                    const tie = __default.count(__default.filter(__default.eq(__default, points), scores)) > 1;
                    return {
                        seat,
                        points,
                        place,
                        tie
                    };
                }, __default), __default.sort(__default.asc(__default.get(__default, "place")), __default));
                return __default1.fold(self1, __default.assoc(command, "details", {
                    ranked: ranked1
                }));
            }();
        case "commit":
            return __default.chain(self1, __default1.fold(__default, command), function(self) {
                const empty4 = __default.chain(self, __default.deref, handsEmpty);
                const over = !handSizes[state1.round + 1];
                return empty4 ? (over ? __default1.finish : deal)(self) : self;
            });
        case "bid":
        case "award":
        case "scoring":
        case "undo":
        case "redo":
        case "reset":
            return __default1.fold(self1, command);
        default:
            throw new Error(`Unknown command ${type3}`);
    }
}
function compel1(self) {
    const seat = __default.chain(self, up1, __default.first);
    const options = seat == null ? [] : __default1.moves(self, [
        seat
    ]);
    const compelled = __default.count(options) === 1;
    const command = __default.first(options);
    return compelled ? compel3(self, command, seat) : self;
}
function compel3(self, command, seat) {
    return __default.chain(self, __default1.execute(__default, command, seat), __default1.execute(__default, {
        type: "commit"
    }, seat));
}
const compel = __default.overload(null, compel1, null, compel3);
function events1(self) {
    return self.events;
}
function scoring(self) {
    const state = __default.deref(self);
    const scoring1 = __default.chain(state, __default.get(__default, "seated"), __default.mapa(function(seat) {
        const tricks = __default.count(seat.tricks), bid = seat.bid, points = tricks === bid ? 10 + tricks : 0;
        return {
            bid,
            tricks,
            points
        };
    }, __default));
    return __default1.execute(self, {
        type: "scoring",
        details: {
            scoring: scoring1
        }
    }, null);
}
function fold2(self, event) {
    const state2 = __default.deref(self);
    const { type: type4 , details: details1 , seat: seat2  } = event;
    switch(type4){
        case "start":
            return function() {
                const details = {
                    status: "wait",
                    round: -1,
                    seated: __default.chain(self, __default1.numSeats, __default.repeat(__default, {
                        scored: []
                    }), __default.toArray)
                };
                return __default1.fold(self, event, __default.fmap(__default, __default.constantly(details)));
            }();
        case "deal":
            return function() {
                const lead = details1.round % __default1.numSeats(self);
                return __default1.fold(self, event, __default.fmap(__default, __default.pipe(__default.assoc(__default, "status", "bidding"), __default.assoc(__default, "lead", lead), __default.assoc(__default, "up", lead), __default.assoc(__default, "broken", false), __default.assoc(__default, "trump", details1.trump), __default.assoc(__default, "deck", details1.deck), __default.assoc(__default, "round", details1.round), __default.foldkv(function(memo, seat, hand) {
                    return __default.updateIn(memo, [
                        "seated",
                        seat
                    ], function(seated2) {
                        return Object.assign({}, seated2, {
                            hand,
                            tricks: [],
                            bid: null,
                            played: null
                        });
                    });
                }, __default, details1.hands))));
            }();
        case "broken":
            return __default1.fold(self, event, __default.fmap(__default, __default.assoc(__default, "broken", true)));
        case "bid":
            return __default1.fold(self, event, __default.fmap(__default, __default.pipe(__default.assocIn(__default, [
                "seated",
                seat2,
                "bid"
            ], details1.bid), function(state) {
                return bidding(state) ? state : __default.assoc(state, "status", "playing");
            })));
        case "play":
            return __default1.fold(self, event, __default.fmap(__default, __default.pipe(__default.assocIn(__default, [
                "seated",
                seat2,
                "trick"
            ], null), __default.assocIn(__default, [
                "seated",
                seat2,
                "played"
            ], details1.card), __default.updateIn(__default, [
                "seated",
                seat2,
                "hand"
            ], __default.pipe(__default.remove(__default.eq(__default, details1.card), __default), __default.toArray)))));
        case "award":
            return __default1.fold(self, event, __default.fmap(__default, __default.pipe(__default.assoc(__default, "status", "confirming"), __default.update(__default, "seated", __default.mapa(function(seat) {
                return __default.assoc(seat, "played", null);
            }, __default)), __default.updateIn(__default, [
                "seated",
                details1.winner,
                "tricks"
            ], __default.conj(__default, details1.trick)), __default.assoc(__default, "lead", details1.winner))));
        case "undo":
            return __default1.fold(self, event, __default.undo);
        case "redo":
            return __default1.fold(self, event, __default.redo);
        case "reset":
            return __default1.fold(self, event, __default.reset);
        case "commit":
            const empty5 = handsEmpty(state2);
            const up11 = empty5 ? null : __default.second(ordered(__default.count(state2.seated), state2.up));
            return __default1.fold(self, event, __default.pipe(__default.fmap(__default, __default.pipe(__default.assoc(__default, "status", "playing"), __default.assoc(__default, "up", up11))), __default.flush));
        case "scoring":
            return __default1.fold(self, event, __default.fmap(__default, __default.update(__default, "seated", __default.foldkv(function(memo, idx22, seat) {
                return __default.assoc(memo, idx22, __default.update(seat, "scored", __default.conj(__default, event.details.scoring[idx22])));
            }, [], __default))));
        case "finish":
            return __default1.fold(self, event, __default.fmap(__default, __default.pipe(__default.dissoc(__default, "up"), __default.assoc(__default, "status", "finished"))));
        default:
            throw new Error("Unknown event");
    }
}
function fold3(self, event, f) {
    return ohHell(self.seats, self.config, event ? __default.append(self.events, event) : self.events, __default.chain(self.journal, f, __default1.incidental(event) ? __default1.crunch : __default.identity, __default1.irreversible(self, event) ? __default.flush : __default.identity));
}
const fold4 = __default.overload(null, null, fold2, fold3);
function seats1(self) {
    return self.seats;
}
const obscureCards = __default.mapa(__default.constantly({}), __default);
function obscure(seen) {
    return function(event) {
        const { type: type5  } = event;
        switch(type5){
            case "deal":
                return __default.chain(event, __default.updateIn(__default, [
                    "details",
                    "hands"
                ], __default.pipe(__default.mapIndexed(function(idx23, cards) {
                    return __default.includes(seen, idx23) ? cards : obscureCards(cards);
                }, __default), __default.toArray)), __default.updateIn(__default, [
                    "details",
                    "deck"
                ], obscureCards));
            default:
                return event;
        }
    };
}
function perspective1(self, _seen) {
    const seen = __default.chain(_seen, __default.compact, __default.toArray);
    const up2 = __default1.up(self);
    const seated1 = __default1.seated(self);
    const score11 = __default1.score(self);
    const all1 = __default.eq(seen, __default1.everyone(self));
    const state = __default.chain(self, __default.deref, all1 ? __default.identity : __default.pipe(__default.update(__default, "deck", obscureCards), __default.update(__default, "seated", __default.pipe(__default.mapIndexed(function(idx24, seated3) {
        return __default.includes(seen, idx24) ? seated3 : __default.update(seated3, "hand", obscureCards);
    }, __default), __default.toArray))));
    const moves11 = __default.chain(self, __default1.moves(__default, seen), __default.toArray);
    const events3 = all1 ? self.events : __default.mapa(obscure(seen), self.events);
    return {
        seen,
        seated: seated1,
        up: up2,
        state,
        moves: moves11,
        events: events3,
        score: score11
    };
}
function deref1(self) {
    return __default.deref(self.journal);
}
function undoable1(self) {
    return __default.undoable(self.journal);
}
function redoable1(self) {
    return __default.redoable(self.journal);
}
function flushable1(self) {
    return __default.flushable(self.journal);
}
function resettable1(self) {
    return __default.resettable(self.journal);
}
__default.doto(OhHell, __default.implement(__default.IDeref, {
    deref: deref1
}), __default.implement(__default.IResettable, {
    resettable: resettable1
}), __default.implement(__default.IRevertible, {
    undoable: undoable1,
    redoable: redoable1,
    flushable: flushable1
}), __default.implement(IGame1, {
    perspective: perspective1,
    up: up1,
    seats: seats1,
    moves: moves1,
    events: events1,
    irreversible: irreversible1,
    execute: __default.comp(compel, execute2),
    fold: fold4,
    score: score1
}));
function simulate1(seats4, config3, events4, commands, seen) {
    return simulate(ohHell(seats4, config3), events4, commands, seen);
}
export { simulate1 as simulate };
