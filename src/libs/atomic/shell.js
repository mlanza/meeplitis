import * as _ from "./core.js";

import { protocol, implement, IMergable, IReducible, does } from "./core.js";

export { doto, fork, guid, implement, rand, randNth, shuffle, specify, uid } from "./core.js";

function each(f, xs) {
  let ys = _.seq(xs);
  while (ys) {
    f(_.first(ys));
    ys = _.next(ys);
  }
}

const eachIndexed = _.withIndex(each);

function doing1(f) {
  return doing2(f, _.identity);
}

function doing2(f, order) {
  return function(self, ...xs) {
    var _self, _f;
    each((_f = f, _self = self, function f(_argPlaceholder) {
      return _f(_self, _argPlaceholder);
    }), order(xs));
  };
}

const doing = _.overload(null, doing1, doing2);

function dorun1(coll) {
  let xs = _.seq(coll);
  while (xs) {
    xs = _.next(xs);
  }
}

function dorun2(n, coll) {
  let xs = _.seq(coll);
  while (xs && n > 0) {
    n--;
    xs = _.next(xs);
  }
}

const dorun = _.overload(null, dorun1, dorun2);

function doall1(coll) {
  dorun(coll);
  return coll;
}

function doall2(n, coll) {
  dorun(n, coll);
  return coll;
}

const doall = _.overload(null, doall1, doall2);

function dotimes(n, f) {
  each(f, _.range(n));
}

function eachkv(f, xs) {
  each((function([key, value]) {
    return f(key, value);
  }), _.entries(xs));
}

function eachvk(f, xs) {
  each((function([key, value]) {
    return f(value, key);
  }), _.entries(xs));
}

function doseq3(f, xs, ys) {
  each((function(x) {
    each((function(y) {
      f(x, y);
    }), ys);
  }), xs);
}

function doseq4(f, xs, ys, zs) {
  each((function(x) {
    each((function(y) {
      each((function(z) {
        f(x, y, z);
      }), zs);
    }), ys);
  }), xs);
}

function doseqN(f, xs, ...colls) {
  each((function(x) {
    if (_.seq(colls)) {
      _.apply(doseq, (function(...args) {
        _.apply(f, x, args);
      }), colls);
    } else {
      f(x);
    }
  }), xs || []);
}

const doseq = _.overload(null, null, each, doseq3, doseq4, doseqN);

const IEvented = _.protocol({
  on: null,
  chan: null,
  trigger: null
});

const on = IEvented.on;

const chan = IEvented.chan;

const trigger = IEvented.trigger;

function once3(self, key, callback) {
  const off = on(self, key, (function(e) {
    off();
    callback.call(this, e);
  }));
  return off;
}

function once4(self, key, selector, callback) {
  const off = on(self, key, selector, (function(e) {
    off();
    callback.call(this, e);
  }));
  return off;
}

const once = _.overload(null, null, null, once3, once4);

const IPublish = _.protocol({
  pub: null,
  err: null,
  complete: null,
  closed: null
});

const pub$3 = IPublish.pub;

const err$3 = IPublish.err;

const complete$3 = IPublish.complete;

const closed$3 = IPublish.closed;

const ISubscribe = protocol({
  sub: null
});

function sub3(source, xf, sink) {
  return ISubscribe.transducing(source, xf, sink);
}

function subN(source) {
  const sink = arguments[arguments.length - 1], xfs = _.slice(arguments, 1, arguments.length - 1);
  return ISubscribe.transducing(source, _.comp(...xfs), sink);
}

const sub$4 = _.overload(null, null, ISubscribe.sub, sub3, subN);

const IDispatch = _.protocol({
  dispatch: null
});

const dispatch$1 = IDispatch.dispatch;

const IEventProvider = _.protocol({
  raise: null,
  release: null
});

const raise = IEventProvider.raise;

const release = IEventProvider.release;

const IMiddleware = protocol({
  handle: null,
  addMiddleware: null,
  addHandler: null
});

function handle2(self, message) {
  return IMiddleware.handle(self, message, _.noop);
}

const handle$6 = _.overload(null, null, handle2, IMiddleware.handle);

const {addMiddleware: addMiddleware$1, addHandler: addHandler$1} = IMiddleware;

const IMap = _.protocol({
  dissoc: null
});

const IAssociative = _.protocol({
  assoc: null
});

const assoc$4 = IAssociative.assoc;

function update3(self, key, f) {
  assoc$4(self, key, f(_.get(self, key)));
}

function update4(self, key, f, a) {
  assoc$4(self, key, f(_.get(self, key), a));
}

function update5(self, key, f, a, b) {
  assoc$4(self, key, f(_.get(self, key), a, b));
}

function update6(self, key, f, a, b, c) {
  assoc$4(self, key, f(_.get(self, key), a, b, c));
}

function updateN(self, key, f, ...xs) {
  let tgt = _.get(self, key), args = [ tgt, ...xs ];
  assoc$4(self, key, f.apply(this, args));
}

const update = _.overload(null, null, null, update3, update4, update5, update6, updateN);

function updateIn3(self, keys, f) {
  let k = keys[0], ks = _.toArray(_.rest(keys));
  ks.length ? assoc$4(self, k, updateIn3(_.get(self, k), ks, f)) : update3(self, k, f);
}

function updateIn4(self, keys, f, a) {
  let k = keys[0], ks = _.toArray(_.rest(keys));
  ks.length ? assoc$4(self, k, updateIn4(_.get(self, k), ks, f, a)) : update4(self, k, f, a);
}

function updateIn5(self, keys, f, a, b) {
  let k = keys[0], ks = _.toArray(_.rest(keys));
  ks.length ? assoc$4(self, k, updateIn5(_.get(self, k), ks, f, a, b)) : update5(self, k, f, a, b);
}

function updateIn6(self, key, f, a, b, c) {
  let k = keys[0], ks = _.toArray(_.rest(keys));
  ks.length ? assoc$4(self, k, updateIn6(_.get(self, k), ks, f, a, b, c)) : update6(self, k, f, a, b, c);
}

function updateInN(self, keys, f) {
  updateIn3(self, keys, (function(...xs) {
    return f.apply(null, xs);
  }));
}

const updateIn = _.overload(null, null, null, updateIn3, updateIn4, updateIn5, updateIn6, updateInN);

function assocIn(self, keys, value) {
  let key = keys[0];
  switch (keys.length) {
   case 1:
    assoc$4(self, key, value);
    break;

   default:
    assoc$4(self, key, assocIn(_.get(self, key), _.toArray(_.rest(keys)), value));
    break;
  }
}

function dissocIn(self, keys) {
  let key = keys[0];
  switch (keys.length) {
   case 1:
    IMap.dissoc(self, key);
    break;

   default:
    const ks = _.slice(keys), k = ks.pop();
    IMap.dissoc(_.getIn(self, ks), k);
    break;
  }
}

const dissoc$4 = IMap.dissoc;

const ISet = _.protocol({
  disj: null,
  unite: null
});

const disj$2 = ISet.disj;

const unite = ISet.unite;

const ICollection = _.protocol({
  conj: null,
  unconj: null
});

const conj$4 = _.overload(null, _.noop, ICollection.conj, doing(ICollection.conj));

const unconj$1 = _.overload(null, _.noop, ICollection.unconj, doing(ICollection.unconj));

const IEmptyableCollection = _.protocol({
  empty: null
});

const empty$5 = IEmptyableCollection.empty;

const IAppendable = _.protocol({
  append: null
});

const append$1 = _.overload(null, _.noop, IAppendable.append, doing(IAppendable.append));

const IPrependable = protocol({
  prepend: null
});

const prepend$1 = _.overload(null, _.noop, IPrependable.prepend, doing(IPrependable.prepend, _.reverse));

const IOmissible = _.protocol({
  omit: null
});

const omit$1 = _.overload(null, IOmissible.omit, doing(IOmissible.omit));

const IInsertable = _.protocol({
  before: null,
  after: null
});

function afterN(self, ...els) {
  let ref = self;
  while (els.length) {
    let el = els.shift();
    IInsertable.after(ref, el);
    ref = el;
  }
}

const after$1 = _.overload(null, _.noop, IInsertable.after, afterN);

function beforeN(self, ...els) {
  let ref = self;
  while (els.length) {
    let el = els.pop();
    IInsertable.before(ref, el);
    ref = el;
  }
}

const before$1 = _.overload(null, _.noop, IInsertable.before, beforeN);

const IReversible = _.protocol({
  reverse: null
});

const reverse$1 = IReversible.reverse;

const ISwappable = _.protocol({
  swap: null
});

function swap3(self, f, a) {
  return ISwappable.swap(self, (function(state) {
    return f(state, a);
  }));
}

function swap4(self, f, a, b) {
  return ISwappable.swap(self, (function(state) {
    return f(state, a, b);
  }));
}

function swapN(self, f, a, b, cs) {
  return ISwappable.swap(self, (function(state) {
    return f.apply(null, [ state, a, b, ...cs ]);
  }));
}

const swap$2 = _.overload(null, null, ISwappable.swap, swap3, swap4, swapN);

const IResettable = _.protocol({
  reset: null,
  resettable: null
});

const reset$1 = IResettable.reset;

const resettable = IResettable.resettable;

const ISend = _.protocol({
  send: null
});

const send = ISend.send;

const IQueryable = _.protocol({
  query: null
});

const query = IQueryable.query;

var config = {
  logger: console
};

function log$1(...args) {
  ILogger.log(config.logger, ...args);
}

const ILogger = _.protocol({
  log: log$1
});

const log = ILogger.log;

function warn(...args) {
  const logger = config.logger || {};
  ILogger.log(logger["warn"], ...args);
}

function error(...args) {
  const logger = config.logger || {};
  ILogger.log(logger["error"], ...args);
}

const ITopic = _.protocol({
  assert: null,
  retract: null
});

const assert = ITopic.assert;

const retract = ITopic.retract;

const verify = _.verify;

var p = Object.freeze({
  __proto__: null,
  on: on,
  chan: chan,
  trigger: trigger,
  once: once,
  pub: pub$3,
  err: err$3,
  complete: complete$3,
  closed: closed$3,
  sub: sub$4,
  dispatch: dispatch$1,
  raise: raise,
  release: release,
  handle: handle$6,
  addMiddleware: addMiddleware$1,
  addHandler: addHandler$1,
  assoc: assoc$4,
  update: update,
  updateIn: updateIn,
  assocIn: assocIn,
  dissocIn: dissocIn,
  dissoc: dissoc$4,
  disj: disj$2,
  unite: unite,
  conj: conj$4,
  unconj: unconj$1,
  empty: empty$5,
  append: append$1,
  prepend: prepend$1,
  omit: omit$1,
  after: after$1,
  before: before$1,
  reverse: reverse$1,
  swap: swap$2,
  reset: reset$1,
  resettable: resettable,
  send: send,
  query: query,
  log: log,
  warn: warn,
  error: error,
  assert: assert,
  retract: retract,
  verify: verify
});

function hist$2(limit) {
  return function(rf) {
    let history = [];
    return _.overload(rf, rf, (function(memo, value) {
      const revised = _.clone(history);
      revised.unshift(value);
      if (revised.length > limit) {
        revised.pop();
      }
      history = revised;
      return rf(memo, history);
    }));
  };
}

function Observable(subscribe) {
  this.subscribe = subscribe;
}

Observable.prototype[Symbol.toStringTag] = "Observable";

function observable(subscribe) {
  return new Observable(subscribe);
}

function merge(self, other) {
  return observable((function(observer) {
    var _observer, _p$pub, _p;
    const handle = (_p = p, _p$pub = _p.pub, _observer = observer, function pub(_argPlaceholder) {
      return _p$pub.call(_p, _observer, _argPlaceholder);
    });
    return does(sub$4(self, handle), sub$4(other, handle));
  }));
}

function reduce(self, f, init) {
  var _self, _f;
  return sub$4(init, (_f = f, _self = self, function f(_argPlaceholder2) {
    return _f(_self, _argPlaceholder2);
  }));
}

const mergable = implement(IMergable, {
  merge: merge
});

const reducible = implement(IReducible, {
  reduce: reduce
});

function Subject(observers, terminated) {
  this.observers = observers;
  this.terminated = terminated;
}

Subject.prototype[Symbol.toStringTag] = "Subject";

function subject(observers) {
  return new Subject(observers || [], null);
}

function Atom(state, observer, validate, primingSub) {
  this.state = state;
  this.observer = observer;
  this.validate = validate;
  this.primingSub = primingSub;
}

Atom.prototype[Symbol.toStringTag] = "Atom";

function atom(init, options = {}) {
  const {observer: observer = subject(), validate: validate = null, primingSub: primingSub = true} = options;
  return new Atom(init, observer, validate, primingSub);
}

function Observer(pub, err, complete, terminated) {
  this.pub = pub;
  this.err = err;
  this.complete = complete;
  this.terminated = terminated;
}

Observer.prototype[Symbol.toStringTag] = "Observer";

function observer(pub, err, complete) {
  return new Observer(pub || _.noop, err || _.noop, complete || _.noop, null);
}

var _time, _when, _hist;

function pipeN(source, ...xforms) {
  return pipe2(source, _.comp(...xforms));
}

function pipe2(source, xform) {
  return observable((function(obs) {
    const step = xform(_.overload(null, _.reduced, (function(memo, value) {
      pub$3(memo, value);
      return memo;
    })));
    let unsub = _.noop;
    const sink = observer((function(value) {
      const memo = step(obs, value);
      if (_.isReduced(memo)) {
        complete$3(sink);
      }
    }), (function(error) {
      err$3(obs, error);
      unsub();
    }), (function() {
      step(obs);
      complete$3(obs);
      unsub();
    }));
    unsub = sub$4(source, sink);
    if (closed$3(sink)) {
      unsub();
      return _.noop;
    }
    return unsub;
  }));
}

const pipe = _.overload(null, _.identity, pipe2, pipeN);

function share1(source) {
  return share2(source, subject());
}

function share2(source, sink) {
  let disconnect = _.noop, refs = 0;
  return observable((function(observer) {
    if (refs === 0) {
      disconnect = sub$4(source, sink);
    }
    refs++;
    let unsub = sub$4(sink, observer);
    return _.once((function() {
      refs--;
      if (refs === 0) {
        disconnect();
        disconnect = _.noop;
      }
      unsub();
    }));
  }));
}

const share = _.overload(null, share1, share2);

function shared(sink, ...fs) {
  var _sink, _sharing;
  return _.comp((_sharing = sharing, _sink = sink, function sharing(_argPlaceholder) {
    return _sharing(_argPlaceholder, _sink);
  }), ...fs);
}

function sharing(source, init) {
  return share(source, init());
}

function seed2(init, source) {
  return observable((function(observer) {
    var _observer, _pub;
    const handle = (_pub = pub$3, _observer = observer, function pub(_argPlaceholder2) {
      return _pub(_observer, _argPlaceholder2);
    });
    handle(init());
    return sub$4(source, handle);
  }));
}

function seed1(source) {
  return seed2(_.constantly(null), source);
}

const seed = _.overload(null, seed1, seed2);

function computed$1(f, source) {
  return seed(f, pipe(source, _.map(f)));
}

function interact$1(key, f, el) {
  return computed$1((function() {
    return f(el);
  }), chan(el, key));
}

function indexed(sources) {
  return observable((function(observer) {
    var _param, _$mapIndexed, _ref;
    return _.chain(sources, (_ref = _, _$mapIndexed = _ref.mapIndexed, _param = function(key, source) {
      return sub$4(source, (function(value) {
        pub$3(observer, {
          key: key,
          value: value
        });
      }));
    }, function mapIndexed(_argPlaceholder3) {
      return _$mapIndexed.call(_ref, _param, _argPlaceholder3);
    }), _.toArray, _.spread(_.does));
  }));
}

function splay1(sources) {
  return splay2(sources, null);
}

function splay2(sources, blank) {
  const source = indexed(sources);
  return observable((function(observer) {
    let state = _.mapa(_.constantly(blank), sources);
    return sub$4(source, (function(msg) {
      state = _.assoc(state, msg.key, msg.value);
      pub$3(observer, state);
    }));
  }));
}

const splay$1 = _.overload(null, splay1, splay2);

function latest$1(sources) {
  const nil = {}, source = splay2(sources, nil);
  return observable((function(observer) {
    let init = false;
    return sub$4(source, (function(state) {
      if (init) {
        pub$3(observer, state);
      } else if (!_.includes(state, nil)) {
        init = true;
        pub$3(observer, state);
      }
    }));
  }));
}

function toggles$1(el, on, off, init) {
  return seed(init, _.merge(pipe(chan(el, on), _.map(_.constantly(true))), pipe(chan(el, off), _.map(_.constantly(false)))));
}

function fixed$1(value) {
  return observable((function(observer) {
    pub$3(observer, value);
    complete$3(observer);
  }));
}

function time() {
  return _.date().getTime();
}

function tick3(interval, frame = 0, f = time) {
  return observable((function(observer) {
    const seed = performance.now();
    const target = seed + frame * interval;
    const self = {
      seed: seed,
      target: target,
      frame: frame,
      stopped: false
    };
    function callback() {
      self.offage = performance.now() - self.target;
      if (self.offage >= 0) {
        pub$3(observer, f(self));
        self.frame += 1;
        self.target = self.seed + self.frame * interval;
      }
      const delay = Math.abs(Math.round(Math.min(0, self.offage), 0));
      self.stopped || setTimeout(callback, delay);
    }
    setTimeout(callback, 0);
    return function() {
      self.stopped = true;
      complete$3(observer);
    };
  }));
}

function tick2(interval, f = time) {
  return tick3(interval, 0, f);
}

const tick$1 = _.overload(null, tick2, tick2, tick3);

function when2(interval, f) {
  return seed(f, tick$1(interval, f));
}

const when$1 = _.overload(null, (_when = when2, _time = time, function when2(_argPlaceholder4) {
  return _when(_argPlaceholder4, _time);
}), when2);

function map2(f, source) {
  return pipe(source, _.map(f), _.dedupe());
}

function mapN(f, ...sources) {
  return map2(_.spread(f), latest$1(sources));
}

const map$1 = _.overload(null, null, map2, mapN);

function resolve(source) {
  const queue = [];
  function pop(prom, observer) {
    return function(value) {
      if (queue[0] === prom) {
        queue.shift();
        pub$3(observer, value);
        if (queue.length) {
          queue[0].then(pop(queue[0], observer));
        }
      }
    };
  }
  return observable((function(observer) {
    return sub$4(source, (function(value) {
      const prom = Promise.resolve(value);
      queue.push(prom);
      prom.then(pop(prom, observer));
    }));
  }));
}

function hist2(size, source) {
  return pipe(source, hist$2(size));
}

const hist$1 = _.overload(null, (_hist = hist2, function hist2(_argPlaceholder5) {
  return _hist(2, _argPlaceholder5);
}), hist2);

function fromCollection(coll) {
  return observable((function(observer) {
    for (let item of coll) {
      pub$3(observer, item);
      if (closed$3(observer)) {
        return;
      }
    }
    complete$3(observer);
  }));
}

function fromPromise$1(promise) {
  return observable((function(observer) {
    var _observer2, _pub2, _observer3, _err;
    promise.then((_pub2 = pub$3, _observer2 = observer, function pub(_argPlaceholder6) {
      return _pub2(_observer2, _argPlaceholder6);
    }), (_err = err$3, _observer3 = observer, function err(_argPlaceholder7) {
      return _err(_observer3, _argPlaceholder7);
    })).then((function() {
      complete$3(observer);
    }));
  }));
}

function fromSource(source) {
  var _source, _sub;
  return observable((_sub = sub$4, _source = source, function sub(_argPlaceholder8) {
    return _sub(_source, _argPlaceholder8);
  }));
}

const fromEvent$1 = chan;

function toObservable(self) {
  const f = _.method(_.coerce, self, Observable);
  if (f) {
    return f(self);
  } else if (_.satisfies(ISubscribe, "sub", self)) {
    return fromSource(self);
  } else if (_.satisfies(_.ISequential, self)) {
    return fromCollection(self);
  }
}

_.addMethod(_.coerce, [ Observable, Observable ], _.identity);

_.addMethod(_.coerce, [ Promise, Observable ], fromPromise$1);

Object.assign(Observable, {
  latest: latest$1,
  map: map$1,
  hist: hist$1,
  splay: splay$1,
  indexed: indexed,
  computed: computed$1,
  fromSource: fromSource,
  fromEvent: fromEvent$1,
  fromPromise: fromPromise$1,
  interact: interact$1,
  fixed: fixed$1,
  tick: tick$1,
  when: when$1,
  resolve: resolve,
  toggles: toggles$1
});

function sub$3(self, observer) {
  const unsub = self.subscribe(observer) || _.noop;
  return closed$3(observer) ? (unsub(), _.noop) : unsub;
}

function deref$2(self) {
  let value = null;
  sub$4(self, (function(val) {
    value = val;
  }))();
  return value;
}

var behave$l = _.does(reducible, mergable, _.keying("Observable"), _.implement(_.IDeref, {
  deref: deref$2
}), _.implement(ISubscribe, {
  sub: sub$3
}));

behave$l(Observable);

function before(self, reference, inserted) {
  const pos = self.indexOf(reference);
  pos === -1 || self.splice(pos, 0, inserted);
}

function after(self, reference, inserted) {
  const pos = self.indexOf(reference);
  pos === -1 || self.splice(pos + 1, 0, inserted);
}

function append(self, value) {
  self.push(value);
}

function prepend(self, value) {
  self.unshift(value);
}

function unconj(self, value) {
  const pos = self.lastIndexOf(value);
  if (pos > -1) {
    self.splice(pos, 1);
  }
}

function empty$4(self) {
  self.length = 0;
}

function reverse(self) {
  self.reverse();
}

function assoc$3(self, idx, value) {
  self[idx] = value;
}

function dissoc$3(self, idx) {
  self.splice(idx, 1);
}

function omit(self, value) {
  let pos;
  while ((pos = self.indexOf(value)) > -1) {
    self.splice(pos, 1);
  }
}

var behave$k = _.does(_.implement(IInsertable, {
  before: before,
  after: after
}), _.implement(ICollection, {
  conj: append,
  unconj: unconj
}), _.implement(IEmptyableCollection, {
  empty: empty$4
}), _.implement(IOmissible, {
  omit: omit
}), _.implement(IAssociative, {
  assoc: assoc$3
}), _.implement(IReversible, {
  reverse: reverse
}), _.implement(IMap, {
  dissoc: dissoc$3
}), _.implement(IAppendable, {
  append: append
}), _.implement(IPrependable, {
  prepend: prepend
}));

behave$k(Array);

var _Map, _$is$2, _ref$3;

const isMap = (_ref$3 = _, _$is$2 = _ref$3.is, _Map = Map, function is(_argPlaceholder) {
  return _$is$2.call(_ref$3, _argPlaceholder, _Map);
});

function map1(entries = []) {
  return new Map(_.toArray(entries));
}

function map0() {
  return new Map;
}

const nativeMap = _.overload(map0, map1);

function assoc$2(self, key, value) {
  self.set(key, value);
}

function dissoc$2(self, key, value) {
  self.delete(key, value);
}

var behave$j = _.does(_.keying("Map"), _.implement(IMap, {
  dissoc: dissoc$2
}), _.implement(IAssociative, {
  assoc: assoc$2
}));

const behaviors = {};

Object.assign(behaviors, {
  Map: behave$j
});

behave$j(Map);

var _WeakMap, _$is$1, _ref$2;

const isWeakMap = (_ref$2 = _, _$is$1 = _ref$2.is, _WeakMap = WeakMap, function is(_argPlaceholder) {
  return _$is$1.call(_ref$2, _argPlaceholder, _WeakMap);
});

function weakMap1(obj) {
  return new WeakMap(obj);
}

function weakMap0() {
  return new WeakMap;
}

const weakMap = _.overload(weakMap0, weakMap1);

var behave$i = _.does(behave$j, _.keying("WeakMap"));

Object.assign(behaviors, {
  WeakMap: behave$i
});

behave$i(WeakMap);

function set(entries) {
  return new Set(entries || []);
}

function emptySet() {
  return new Set;
}

function empty$3(self) {
  self.clear();
}

function disj$1(self, value) {
  self.delete(value);
}

function conj$3(self, value) {
  self.add(value);
}

var behave$h = _.does(_.implement(IEmptyableCollection, {
  empty: empty$3
}), _.implement(ICollection, {
  conj: conj$3
}), _.implement(ISet, {
  disj: disj$1,
  unite: conj$3
}));

Object.assign(behaviors, {
  Set: behave$h
});

behave$h(Set);

var _WeakSet, _$is, _ref$1;

const isWeakSet = (_ref$1 = _, _$is = _ref$1.is, _WeakSet = WeakSet, function is(_argPlaceholder) {
  return _$is.call(_ref$1, _argPlaceholder, _WeakSet);
});

function weakSet1(arr) {
  return new WeakSet(arr);
}

function weakSet0() {
  return new WeakSet;
}

const weakSet = _.overload(weakSet0, weakSet1);

var behave$g = _.does(behave$h, _.keying("WeakSet"));

Object.assign(behaviors, {
  WeakSet: behave$g
});

behave$g(WeakSet);

function pub$2(self, value) {
  if (value !== self.state) {
    if (!self.validate || self.validate(value)) {
      self.state = value;
      pub$3(self.observer, value);
    } else {
      throw new Error("Atom update failed - invalid value.");
    }
  }
}

function err$2(self, observer) {
  err$3(self.observer, observer);
}

const complete$2 = _.noop;

function closed$2(self) {
  return closed$3(self.observer);
}

function sub$2(self, observer) {
  self.primingSub && pub$3(observer, self.state);
  return sub$4(self.observer, observer);
}

function deref$1(self) {
  return self.state;
}

function swap$1(self, f) {
  pub$2(self, f(self.state));
}

function dispose(self) {
  _.satisfies(_.IDisposable, self.observer) && _.dispose(self.observer);
}

var behave$f = _.does(reducible, mergable, _.keying("Atom"), _.implement(_.IDisposable, {
  dispose: dispose
}), _.implement(_.IDeref, {
  deref: deref$1
}), _.implement(IResettable, {
  reset: pub$2
}), _.implement(ISwappable, {
  swap: swap$1
}), _.implement(ISubscribe, {
  sub: sub$2
}), _.implement(IPublish, {
  pub: pub$2,
  err: err$2,
  complete: complete$2,
  closed: closed$2
}));

behave$f(Atom);

function Cursor(source, path) {
  this.source = source;
  this.path = path;
}

Cursor.prototype[Symbol.toStringTag] = "Cursor";

const cursor = _.constructs(Cursor);

function path(self) {
  return self.path;
}

function deref(self) {
  return _.getIn(_.deref(self.source), self.path);
}

function reset(self, value) {
  swap$2(self.source, (function(state) {
    return _.assocIn(state, self.path, value);
  }));
}

function swap(self, f) {
  swap$2(self.source, (function(state) {
    return _.updateIn(state, self.path, f);
  }));
}

function sub$1(self, observer) {
  return sub$4(self.source, (function(state) {
    pub$3(observer, _.getIn(state, self.path));
  }));
}

var behave$e = _.does(_.keying("Cursor"), _.implement(_.IPath, {
  path: path
}), _.implement(_.IDeref, {
  deref: deref
}), _.implement(IResettable, {
  reset: reset
}), _.implement(ISwappable, {
  swap: swap
}), _.implement(ISubscribe, {
  sub: sub$1
}), _.implement(IPublish, {
  pub: reset
}));

behave$e(Cursor);

function conj$2(self, [key, value]) {
  self[key] = value;
}

function dissoc$1(self, key) {
  if (_.contains(self, key)) {
    delete self[key];
  }
}

function assoc$1(self, key, value) {
  if (!_.contains(self, key) || !_.equiv(_.get(self, key), value)) {
    self[key] = value;
  }
}

function empty$2(self) {
  for (const key of Object.keys()) {
    delete self[key];
  }
}

var behave$d = _.does(_.implement(ITopic, _.itopic(assoc$1, dissoc$1)), _.implement(ICollection, {
  conj: conj$2
}), _.implement(IEmptyableCollection, {
  empty: empty$2
}), _.implement(IAssociative, {
  assoc: assoc$1
}), _.implement(IMap, {
  dissoc: dissoc$1
}));

behave$d(Object);

function pub$1(self, message) {
  if (!self.terminated) {
    return self.pub(message);
  }
}

function err$1(self, error) {
  if (!self.terminated) {
    self.terminated = {
      how: "error",
      error: error
    };
    self.err(error);
  }
}

function complete$1(self) {
  if (!self.terminated) {
    self.terminated = {
      how: "complete"
    };
    self.complete();
  }
}

function closed$1(self) {
  return self.terminated;
}

var behave$c = _.does(_.keying("Observer"), _.implement(IPublish, {
  pub: pub$1,
  err: err$1,
  complete: complete$1,
  closed: closed$1
}));

behave$c(Observer);

function getHashIndex(self, key) {
  const h = _.hash(key);
  const candidates = self.mapped[h] || null;
  const idx = _.detectIndex((function([k, v]) {
    return _.equiv(key, k);
  }), candidates);
  return {
    h: h,
    idx: idx,
    candidates: candidates
  };
}

function assoc(self, key, value) {
  const {h: h, idx: idx, candidates: candidates} = getHashIndex(self, key);
  if (!candidates) {
    assoc$4(self.mapped, h, [ [ key, value ] ]);
  } else if (idx == null) {
    var _param, _$conj, _ref;
    update(self.mapped, h, (_ref = _, _$conj = _ref.conj, _param = [ key, value ], function conj(_argPlaceholder) {
      return _$conj.call(_ref, _argPlaceholder, _param);
    }));
  } else {
    assocIn(self.mapped, [ h, idx ], [ key, value ]);
  }
  if (idx == null) {
    self.length += 1;
  }
}

function dissoc(self, key) {
  const {h: h, idx: idx, candidates: candidates} = getHashIndex(self, key);
  if (idx == null) {
    return;
  }
  if (_.count(candidates) === 1) {
    dissoc$4(self.mapped, h);
  }
  assoc$4(self.mapped, h, _.filtera((function([k, v]) {
    return !_.equiv(key, k);
  }), candidates));
  self.length -= 1;
}

function conj$1(self, [key, value]) {
  assoc(self, key, value);
}

function empty$1(self) {
  self.mapped = {};
  self.length = 0;
}

var behave$b = _.does(_.implement(ICollection, {
  conj: conj$1
}), _.implement(IEmptyableCollection, {
  empty: empty$1
}), _.implement(IMap, {
  dissoc: dissoc
}), _.implement(IAssociative, {
  assoc: assoc
}));

behave$b(_.HashMap);

function empty(self) {
  self.coll = _.hashMap();
}

function conj(self, value) {
  if (!_.includes(self, value)) {
    assoc$4(self.coll, value, value);
  }
}

function disj(self, value) {
  if (_.includes(self, value)) {
    dissoc$4(self.coll, value);
  }
}

var behave$a = _.does(_.implement(ISet, {
  disj: disj,
  unite: conj
}), _.implement(IEmptyableCollection, {
  empty: empty
}), _.implement(ICollection, {
  conj: conj
}));

behave$a(_.HashSet);

function sub(self, observer) {
  if (!self.terminated) {
    conj$4(self.observers, observer);
    return _.once((function() {
      unconj$1(self.observers, observer);
    }));
  } else {
    throw new Error("Cannot subscribe to a terminated Subject.");
  }
}

function pub(self, message) {
  if (!self.terminated) {
    var _message, _p$pub, _p;
    notify(self, (_p = p, _p$pub = _p.pub, _message = message, function pub(_argPlaceholder) {
      return _p$pub.call(_p, _argPlaceholder, _message);
    }));
  }
}

function err(self, error) {
  if (!self.terminated) {
    var _error, _p$err, _p2;
    self.terminated = {
      how: "error",
      error: error
    };
    notify(self, (_p2 = p, _p$err = _p2.err, _error = error, function err(_argPlaceholder2) {
      return _p$err.call(_p2, _argPlaceholder2, _error);
    }));
    empty$5(self.observers);
  }
}

function complete(self) {
  if (!self.terminated) {
    self.terminated = {
      how: "complete"
    };
    notify(self, complete$3);
    empty$5(self.observers);
  }
}

function closed(self) {
  return self.terminated;
}

function notify(self, f) {
  each(f, self.observers);
}

var behave$9 = _.does(reducible, mergable, _.keying("Subject"), _.implement(ISubscribe, {
  sub: sub
}), _.implement(IPublish, {
  pub: pub,
  err: err,
  complete: complete,
  closed: closed
}));

behave$9(Subject);

function Bus(middlewares) {
  this.middlewares = middlewares;
}

Bus.prototype[Symbol.toStringTag] = "Bus";

function bus(middlewares) {
  return new Bus(middlewares || []);
}

function addMiddleware(self, middleware) {
  conj$4(self.middlewares, middleware);
}

function handle$5(self, message, next) {
  const f = _.reduce((function(memo, middleware) {
    var _middleware, _memo, _p$handle, _p;
    return _p = p, _p$handle = _p.handle, _middleware = middleware, _memo = memo, function handle(_argPlaceholder) {
      return _p$handle.call(_p, _middleware, _argPlaceholder, _memo);
    };
  }), next || _.noop, _.reverse(self.middlewares));
  f(message);
}

function dispatch(self, message) {
  handle$5(self, message);
}

var behave$8 = _.does(_.keying("Bus"), _.implement(IDispatch, {
  dispatch: dispatch
}), _.implement(IMiddleware, {
  handle: handle$5,
  addMiddleware: addMiddleware
}));

behave$8(Bus);

function Command(type, attrs) {
  this.type = type;
  this.attrs = attrs;
}

Command.prototype[Symbol.toStringTag] = "Command";

function constructs(Type) {
  return function message(type) {
    return function(args, options) {
      return new Type(type, Object.assign({
        args: args || []
      }, options));
    };
  };
}

const command = constructs(Command);

function hash(self) {
  return _.hash({
    type: self.type,
    attrs: self.attrs
  });
}

function identifier(self) {
  return self.type;
}

var behave$7 = _.does(_.record, _.keying("Command"), _.implement(_.IHashable, {
  hash: hash
}), _.implement(_.IIdentifiable, {
  identifier: identifier
}));

behave$7(Command);

function DrainEventsMiddleware(provider, eventBus) {
  this.provider = provider;
  this.eventBus = eventBus;
}

DrainEventsMiddleware.prototype[Symbol.toStringTag] = "DrainEventsMiddleware";

const drainEventsMiddleware = _.constructs(DrainEventsMiddleware);

function handle$4(self, command, next) {
  next(command);
  each((function(message) {
    handle$6(self.eventBus, message, next);
  }), release(self.provider));
}

var behave$6 = _.does(_.keying("DrainEventsMiddleware"), _.implement(IMiddleware, {
  handle: handle$4
}));

behave$6(DrainEventsMiddleware);

function EventMiddleware(emitter) {
  this.emitter = emitter;
}

EventMiddleware.prototype[Symbol.toStringTag] = "EventMiddleware";

const eventMiddleware = _.constructs(EventMiddleware);

function handle$3(self, event, next) {
  pub$3(self.emitter, event);
  next(event);
}

var behave$5 = _.does(_.keying("EventMiddleware"), _.implement(IMiddleware, {
  handle: handle$3
}));

behave$5(EventMiddleware);

function Event(type, attrs) {
  this.type = type;
  this.attrs = attrs;
}

Event.prototype[Symbol.toStringTag] = "Event";

const event = constructs(Event);

function effect(message, type) {
  const e = new Event;
  return Object.assign(e, message, {
    type: type
  });
}

function alter(message, type) {
  return Object.assign(_.clone(message), {
    type: type
  });
}

var behave$4 = _.does(behave$7, _.keying("Event"));

behave$4(Event);

function HandlerMiddleware(handlers, identify, fallback = null) {
  this.handlers = handlers;
  this.identify = identify;
  this.fallback = fallback;
}

HandlerMiddleware.prototype[Symbol.toStringTag] = "HandlerMiddleware";

const handlerMiddleware3 = _.constructs(HandlerMiddleware);

function handlerMiddleware1(identify) {
  return handlerMiddleware3({}, identify);
}

function handlerMiddleware0() {
  return handlerMiddleware1(_.identifier);
}

const handlerMiddleware = _.overload(handlerMiddleware0, handlerMiddleware1, handlerMiddleware3);

function addHandler(self, key, handler) {
  assoc$4(self.handlers, key, handler);
}

function handle$2(self, message, next) {
  const handler = _.get(self.handlers, self.identify(message), self.fallback);
  if (handler) {
    handle$6(handler, message, next);
  } else {
    next(message);
  }
}

var behave$3 = _.does(_.keying("HandlerMiddleware"), _.implement(IMiddleware, {
  handle: handle$2,
  addHandler: addHandler
}));

behave$3(HandlerMiddleware);

function LockingMiddleware(bus, queued, handling) {
  this.bus = bus;
  this.queued = queued;
  this.handling = handling;
}

LockingMiddleware.prototype[Symbol.toStringTag] = "LockingMiddleware";

function lockingMiddleware(bus) {
  return new LockingMiddleware(bus, [], false);
}

function handle$1(self, message, next) {
  if (self.handling) {
    self.queued.push(message);
  } else {
    try {
      self.handling = true;
      next(message);
    } finally {
      self.handling = false;
    }
    if (self.queued.length) {
      var _self$bus, _p$dispatch, _p;
      const queued = self.queued;
      self.queued = [];
      each((_p = p, _p$dispatch = _p.dispatch, _self$bus = self.bus, function dispatch(_argPlaceholder) {
        return _p$dispatch.call(_p, _self$bus, _argPlaceholder);
      }), queued);
    }
  }
}

var behave$2 = _.does(_.keying("LockingMiddleware"), _.implement(IMiddleware, {
  handle: handle$1
}));

behave$2(LockingMiddleware);

function TeeMiddleware(effect) {
  this.effect = effect;
}

TeeMiddleware.prototype[Symbol.toStringTag] = "TeeMiddleware";

const teeMiddleware = _.constructs(TeeMiddleware);

function handle(self, message, next) {
  self.effect(message);
  next(message);
}

var behave$1 = _.does(_.keying("TeeMiddleware"), _.implement(IMiddleware, {
  handle: handle
}));

behave$1(TeeMiddleware);

var _behaviors, _$behaves, _ref, _fromPromise;

const behave = (_ref = _, _$behaves = _ref.behaves, _behaviors = behaviors, function behaves(_argPlaceholder) {
  return _$behaves.call(_ref, _behaviors, _argPlaceholder);
});

function into2(to, from) {
  return _.reduce((function(memo, value) {
    conj$4(memo, value);
    return memo;
  }), to, from);
}

function into3(to, xform, from) {
  return _.transduce(xform, (function(memo, value) {
    conj$4(memo, value);
    return memo;
  }), to, from);
}

const into = _.overload(null, null, into2, into3);

function collect(atom) {
  return function(value) {
    var _value, _$conj, _ref2;
    swap$2(atom, (_ref2 = _, _$conj = _ref2.conj, _value = value, function conj(_argPlaceholder2) {
      return _$conj.call(_ref2, _argPlaceholder2, _value);
    }));
  };
}

function connect2(source, sink) {
  return sub$4(source, sink);
}

function connect3(source, xform, sink) {
  return sub$4(pipe(source, xform), sink);
}

function connectN(source) {
  const sink = arguments[arguments.length - 1], xforms = _.slice(arguments, 1, arguments.length - 1);
  return sub$4(pipe(source, ...xforms), sink);
}

ISubscribe.transducing = connect3;

const connect = _.overload(null, null, connect2, connect3, connectN);

const map = _.overload(nativeMap, nativeMap, shared(atom, Observable.map));

const then = shared(atom, Observable.resolve, Observable.map);

const interact = shared(atom, Observable.interact);

const fromEvent = shared(subject, Observable.fromEvent);

const computed = shared(atom, Observable.computed);

const fixed = shared(atom, Observable.fixed);

const latest = shared(atom, Observable.latest);

const splay = shared(atom, Observable.splay);

const tick = shared(subject, Observable.tick);

const when = shared(atom, Observable.when);

const toggles = shared(atom, Observable.toggles);

const hist = shared(atom, Observable.hist);

function fmap(source, f) {
  return map(f, source);
}

each(_.implement(_.IFunctor, {
  fmap: fmap
}), [ Atom, Subject, Observable ]);

function fromPromise2(promise, init) {
  return share(Observable.fromPromise(promise), atom(init));
}

const fromPromise = _.overload(null, (_fromPromise = fromPromise2, function fromPromise2(_argPlaceholder3) {
  return _fromPromise(_argPlaceholder3, null);
}), fromPromise2);

(function() {
  function pub(self, msg) {
    self(msg);
  }
  _.doto(Function, reducible, _.implement(IPublish, {
    pub: pub,
    err: _.noop,
    complete: _.noop,
    closed: _.noop
  }));
})();

function defs(construct, keys) {
  return _.reduce((function(memo, key) {
    return _.assoc(memo, key, construct(key));
  }), {}, keys);
}

function dispatchable(Cursor) {
  function dispatch(self, command) {
    dispatch$1(self.source, _.update(command, "path", (function(path) {
      return _.apply(_.conj, self.path, path || []);
    })));
  }
  _.doto(Cursor, _.implement(IDispatch, {
    dispatch: dispatch
  }));
}

(function() {
  function dispatch(self, args) {
    return _.apply(self, args);
  }
  _.doto(Function, _.implement(IDispatch, {
    dispatch: dispatch
  }));
})();

_.addMethod(_.coerce, [ Set, Array ], Array.from);

(function() {
  function log(self, ...args) {
    self.log(...args);
  }
  _.doto(console, _.specify(ILogger, {
    log: log
  }));
})();

(function() {
  function log(self, ...args) {
    self(...args);
  }
  _.doto(Function, _.implement(ILogger, {
    log: log
  }));
})();

_.doto(_.Nil, _.implement(ILogger, {
  log: _.noop
}));

function severity2(logger, severity) {
  const f = _.get(logger, severity, _.noop);
  function log(self, ...args) {
    f(...args);
  }
  return _.doto({
    logger: logger,
    severity: severity
  }, _.specify(ILogger, {
    log: log
  }));
}

function severity1(severity) {
  return severity2(config.logger, severity);
}

const severity = _.overload(null, severity1, severity2);

function inspect(logger, ...effects) {
  function log$1(self, ...args) {
    log(logger, ...[ ..._.mapa(_.execute, effects), ...args ]);
  }
  return _.doto({
    logger: logger,
    effects: effects
  }, _.specify(ILogger, {
    log: log$1
  }));
}

function label(logger, ...labels) {
  function log$1(self, ...args) {
    log(logger, ...[ ...labels, ...args ]);
  }
  return _.doto({
    logger: logger,
    labels: labels
  }, _.specify(ILogger, {
    log: log$1
  }));
}

const logging = {
  severity: severity,
  inspect: inspect,
  label: label
};

function tee(f) {
  return function(value) {
    f(value);
    return value;
  };
}

function peek(logger) {
  var _logger, _p$log, _p;
  return tee((_p = p, _p$log = _p.log, _logger = logger, function log(_argPlaceholder4) {
    return _p$log.call(_p, _logger, _argPlaceholder4);
  }));
}

function see(...labels) {
  return tee(_.partial(log, ...labels));
}

function called4(fn, message, context, logger) {
  return function() {
    const meta = Object.assign({}, context, {
      fn: fn,
      arguments: arguments
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

const called = _.overload(null, null, called2, called3, called4);

_.addMethod(_.coerce, [ Array, Object ], (arr => into({}, arr)));

_.addMethod(_.coerce, [ Object, Array ], (obj => into([], obj)));

_.addMethod(_.coerce, [ _.HashSet, Array ], (set => into([], set)));

_.addMethod(_.coerce, [ Array, _.HashSet ], (arr => into(_.set([]), arr)));

export { Atom, Bus, Command, Cursor, DrainEventsMiddleware, Event, EventMiddleware, HandlerMiddleware, IAppendable, IAssociative, ICollection, IDispatch, IEmptyableCollection, IEventProvider, IEvented, IInsertable, ILogger, IMap, IMiddleware, IOmissible, IPrependable, IPublish, IQueryable, IResettable, IReversible, ISend, ISet, ISubscribe, ISwappable, ITopic, LockingMiddleware, Observable, Observer, Subject, TeeMiddleware, addHandler$1 as addHandler, addMiddleware$1 as addMiddleware, after$1 as after, alter, append$1 as append, assert, assoc$4 as assoc, assocIn, atom, before$1 as before, behave, behaviors, bus, called, atom as cell, chan, closed$3 as closed, collect, command, complete$3 as complete, computed, config, conj$4 as conj, connect, constructs, cursor, defs, disj$2 as disj, dispatch$1 as dispatch, dispatchable, dissoc$4 as dissoc, dissocIn, doall, doing, dorun, doseq, dotimes, drainEventsMiddleware, each, eachIndexed, eachkv, eachvk, effect, empty$5 as empty, emptySet, err$3 as err, error, event, eventMiddleware, fixed, fromEvent, fromPromise, handle$6 as handle, handlerMiddleware, hist, interact, into, isMap, isWeakMap, isWeakSet, latest, lockingMiddleware, log, logging, map, nativeMap, observable, observer, omit$1 as omit, on, once, peek, pipe, prepend$1 as prepend, pub$3 as pub, query, raise, release, reset$1 as reset, resettable, retract, reverse$1 as reverse, see, seed, send, set, share, shared, sharing, splay, sub$4 as sub, subject, swap$2 as swap, tee, teeMiddleware, then, tick, toObservable, toggles, trigger, unconj$1 as unconj, unite, update, updateIn, verify, warn, weakMap, weakSet, when };
