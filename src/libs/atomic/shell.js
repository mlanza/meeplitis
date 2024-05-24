import * as _ from './core.js';
import { protocol, implement, IMergable, IReducible, does } from './core.js';
export { doto } from './core.js';
import * as $ from './shell.js';

const IEvented = _.protocol({
  on: null,
  chan: null,
  trigger: null
});

const on = IEvented.on;
const chan = IEvented.chan;
const trigger = IEvented.trigger;
function once3(self, key, callback) {
  const off = on(self, key, function (e) {
    off();
    callback.call(this, e);
  });
  return off;
}
function once4(self, key, selector, callback) {
  const off = on(self, key, selector, function (e) {
    off();
    callback.call(this, e);
  });
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
  const sink = arguments[arguments.length - 1],
    xfs = _.slice(arguments, 1, arguments.length - 1);
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
  handle: null
});

function handle2(self, message) {
  return IMiddleware.handle(self, message, _.noop);
}
const handle$6 = _.overload(null, null, handle2, IMiddleware.handle);

const IPersistent = _.protocol({
  persistent: null
});

const persistent$1 = IPersistent.persistent;

const ITransient = _.protocol({
  transient: null
});

const transient = ITransient.transient;

const IAssociative = _.protocol({
  assoc: null
});

const assoc$3 = IAssociative.assoc;

const IMap = _.protocol({
  dissoc: null
});

const dissoc$2 = IMap.dissoc;

const ISet = _.protocol({
  disj: null
});

const disj$1 = ISet.disj;

const ICollection = _.protocol({
  conj: null,
  unconj: null
});

const conj$2 = _.overload(null, _.noop, ICollection.conj, _.doing(ICollection.conj));
const unconj$1 = _.overload(null, _.noop, ICollection.unconj, _.doing(ICollection.unconj));

const IEmptyableCollection = _.protocol({
  empty: null
});

const empty$2 = IEmptyableCollection.empty;

const IAppendable = _.protocol({
  append: null
});

const append$1 = _.overload(null, _.noop, IAppendable.append, _.doing(IAppendable.append));

const IPrependable = protocol({
  prepend: null
});

const prepend$1 = _.overload(null, _.noop, IPrependable.prepend, _.doing(IPrependable.prepend, _.reverse));

const IOmissible = _.protocol({
  omit: null
});

const omit$1 = IOmissible.omit;

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
    ITransientInsertable.before(ref, el);
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
  return ISwappable.swap(self, function (state) {
    return f(state, a);
  });
}
function swap4(self, f, a, b) {
  return ISwappable.swap(self, function (state) {
    return f(state, a, b);
  });
}
function swapN(self, f, a, b, cs) {
  return ISwappable.swap(self, function (state) {
    return f.apply(null, [state, a, b, ...cs]);
  });
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

function log$1(...args) {
  ILogger.log(_.config.logger, ...args);
}
const ILogger = _.protocol({
  log: log$1
});

const log = ILogger.log;

var p = /*#__PURE__*/Object.freeze({
  __proto__: null,
  after: after$1,
  append: append$1,
  assoc: assoc$3,
  before: before$1,
  chan: chan,
  closed: closed$3,
  complete: complete$3,
  conj: conj$2,
  disj: disj$1,
  dispatch: dispatch$1,
  dissoc: dissoc$2,
  empty: empty$2,
  err: err$3,
  handle: handle$6,
  log: log,
  omit: omit$1,
  on: on,
  once: once,
  persistent: persistent$1,
  prepend: prepend$1,
  pub: pub$3,
  query: query,
  raise: raise,
  release: release,
  reset: reset$1,
  resettable: resettable,
  reverse: reverse$1,
  send: send,
  sub: sub$4,
  swap: swap$2,
  transient: transient,
  trigger: trigger,
  unconj: unconj$1
});

function hist$2(limit) {
  //transducer
  return function (rf) {
    let history = [];
    return _.overload(rf, rf, function (memo, value) {
      const revised = _.clone(history);
      revised.unshift(value);
      if (revised.length > limit) {
        revised.pop();
      }
      history = revised;
      return rf(memo, history);
    });
  };
}

//regulates message processing so, if there are side effects, each is processed before the next begins
function isolate$1() {
  //transducer
  return function (rf) {
    let queue = [];
    return _.overload(rf, rf, function (memo, value) {
      let acc = memo;
      const ready = queue.length === 0;
      queue.push(value);
      if (ready) {
        while (queue.length) {
          try {
            acc = rf(acc, queue[0]);
          } finally {
            queue.shift();
          }
        }
      }
      return acc;
    });
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
  return observable(function (observer) {
    var _observer, _p$pub, _p;
    const handle = (_p = p, _p$pub = _p.pub, _observer = observer, function pub(_argPlaceholder) {
      return _p$pub.call(_p, _observer, _argPlaceholder);
    });
    return does(sub$4(self, handle), sub$4(other, handle));
  });
}
function reduce(self, f, init) {
  var _self, _f;
  return sub$4(init, (_f = f, _self = self, function f(_argPlaceholder2) {
    return _f(_self, _argPlaceholder2);
  }));
}
const mergable = implement(IMergable, {
  merge
});
const reducible = implement(IReducible, {
  reduce
});

function Subject(observers, terminated) {
  this.observers = observers;
  this.terminated = terminated;
}
Subject.prototype[Symbol.toStringTag] = "Subject";
function subject(observers) {
  return new Subject(observers || [], null);
}

function Cell(state, observer, validate) {
  this.state = state;
  this.observer = observer;
  this.validate = validate;
}
Cell.prototype[Symbol.toStringTag] = "Cell";
function cell0() {
  return cell1(null);
}
function cell1(init) {
  return cell2(init, subject());
}
function cell2(init, observer) {
  return cell3(init, observer, null);
}
function cell3(init, observer, validate) {
  return new Cell(init, observer, validate);
}
const cell = _.overload(cell0, cell1, cell2, cell3);

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
  return observable(function (obs) {
    const step = xform(_.overload(null, _.reduced, function (memo, value) {
      pub$3(memo, value);
      return memo;
    }));
    let unsub = _.noop;
    const sink = observer(function (value) {
      const memo = step(obs, value);
      if (_.isReduced(memo)) {
        complete$3(sink);
      }
    }, function (error) {
      err$3(obs, error);
      unsub();
    }, function () {
      step(obs);
      complete$3(obs);
      unsub();
    });
    unsub = sub$4(source, sink); //might complete before returning `unsub` fn
    if (closed$3(sink)) {
      unsub();
      return _.noop;
    }
    return unsub;
  });
}
const pipe = _.overload(null, _.identity, pipe2, pipeN);
function share1(source) {
  return share2(source, subject());
}
function share2(source, sink) {
  let disconnect = _.noop,
    refs = 0;
  return observable(function (observer) {
    if (refs === 0) {
      disconnect = sub$4(source, sink);
    }
    refs++;
    let unsub = sub$4(sink, observer);
    return _.once(function () {
      refs--;
      if (refs === 0) {
        disconnect();
        disconnect = _.noop;
      }
      unsub();
    });
  });
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
  return observable(function (observer) {
    var _observer, _pub;
    const handle = (_pub = pub$3, _observer = observer, function pub(_argPlaceholder2) {
      return _pub(_observer, _argPlaceholder2);
    });
    handle(init());
    return sub$4(source, handle);
  });
}
function seed1(source) {
  return seed2(_.constantly(null), source);
}

//adds an immediate value upon subscription as with cells.
const seed = _.overload(null, seed1, seed2);
function computed$1(f, source) {
  return seed(f, pipe(source, _.map(f)));
}
function interact$1(key, f, el) {
  return computed$1(function () {
    return f(el);
  }, chan(el, key));
}
function indexed(sources) {
  return observable(function (observer) {
    var _param, _$mapIndexed, _ref;
    return _.right(sources, (_ref = _, _$mapIndexed = _ref.mapIndexed, _param = function (key, source) {
      return sub$4(source, function (value) {
        pub$3(observer, {
          key,
          value
        });
      });
    }, function mapIndexed(_argPlaceholder3) {
      return _$mapIndexed.call(_ref, _param, _argPlaceholder3);
    }), _.toArray, _.spread(_.does));
  });
}
function splay1(sources) {
  return splay2(sources, null);
}
function splay2(sources, blank) {
  const source = indexed(sources);
  return observable(function (observer) {
    let state = _.mapa(_.constantly(blank), sources);
    return sub$4(source, function (msg) {
      state = _.assoc(state, msg.key, msg.value);
      pub$3(observer, state);
    });
  });
}
const splay$1 = _.overload(null, splay1, splay2);

//sources must publish an initial value immediately upon subscription as cells do.
function latest$1(sources) {
  const nil = {},
    source = splay2(sources, nil);
  return observable(function (observer) {
    let init = false;
    return sub$4(source, function (state) {
      if (init) {
        pub$3(observer, state);
      } else if (!_.includes(state, nil)) {
        init = true;
        pub$3(observer, state);
      }
    });
  });
}
function toggles$1(el, on, off, init) {
  return seed(init, _.merge(pipe(chan(el, on), _.map(_.constantly(true))), pipe(chan(el, off), _.map(_.constantly(false)))));
}
function fixed$1(value) {
  return observable(function (observer) {
    pub$3(observer, value);
    complete$3(observer);
  });
}
function time() {
  return _.date().getTime();
}
function tick3(interval, frame = 0, f = time) {
  return observable(function (observer) {
    const seed = performance.now();
    const target = seed + frame * interval;
    const self = {
      seed,
      target,
      frame,
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
    return function () {
      self.stopped = true;
      complete$3(observer);
    };
  });
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
    return function (value) {
      if (queue[0] === prom) {
        queue.shift();
        pub$3(observer, value);
        if (queue.length) {
          //drain queue
          queue[0].then(pop(queue[0], observer));
        }
      }
    };
  }
  return observable(function (observer) {
    return sub$4(source, function (value) {
      const prom = Promise.resolve(value);
      queue.push(prom);
      prom.then(pop(prom, observer));
    });
  });
}
function hist2(size, source) {
  return pipe(source, hist$2(size));
}
const hist$1 = _.overload(null, (_hist = hist2, function hist2(_argPlaceholder5) {
  return _hist(2, _argPlaceholder5);
}), hist2);
function fromCollection(coll) {
  return observable(function (observer) {
    for (let item of coll) {
      pub$3(observer, item);
      if (closed$3(observer)) {
        return;
      }
    }
    complete$3(observer);
  });
}
function fromPromise$1(promise) {
  return observable(function (observer) {
    var _observer2, _pub2, _observer3, _err;
    promise.then((_pub2 = pub$3, _observer2 = observer, function pub(_argPlaceholder6) {
      return _pub2(_observer2, _argPlaceholder6);
    }), (_err = err$3, _observer3 = observer, function err(_argPlaceholder7) {
      return _err(_observer3, _argPlaceholder7);
    })).then(function () {
      complete$3(observer);
    });
  });
}
function fromSource(source) {
  var _source, _sub;
  //can be used to cover a source making it readonly
  return observable((_sub = sub$4, _source = source, function sub(_argPlaceholder8) {
    return _sub(_source, _argPlaceholder8);
  }));
}
function toObservable(self) {
  const f = _.satisfies(_.ICoercible, "toObservable", self);
  if (f) {
    return f(self);
  } else if (_.satisfies(ISubscribe, "sub", self)) {
    return fromSource(self);
  } else if (_.satisfies(_.ISequential, self)) {
    return fromCollection(self);
  }
}
_.extend(_.ICoercible, {
  toObservable: null
});
_.doto(Observable, _.implement(_.ICoercible, {
  toObservable: _.identity
}));
_.doto(Promise, _.implement(_.ICoercible, {
  toObservable: fromPromise$1
}));
Object.assign(Observable, {
  latest: latest$1,
  map: map$1,
  hist: hist$1,
  splay: splay$1,
  indexed,
  computed: computed$1,
  fromSource,
  fromEvent: chan,
  fromPromise: fromPromise$1,
  interact: interact$1,
  fixed: fixed$1,
  tick: tick$1,
  when: when$1,
  resolve,
  toggles: toggles$1
});

function sub$3(self, observer) {
  const unsub = self.subscribe(observer) || _.noop;
  return closed$3(observer) ? (unsub(), _.noop) : unsub;
}
function deref$2(self) {
  let value = null;
  sub$4(self, function (val) {
    value = val;
  })(); //immediate unsubscribe
  return value;
}
var behave$g = _.does(reducible, mergable, _.keying("Observable"), _.implement(_.IDeref, {
  deref: deref$2
}), _.implement(ISubscribe, {
  sub: sub$3
}));

behave$g(Observable);

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
function empty$1(self) {
  self.length = 0;
}
function reverse(self) {
  self.reverse();
}
function assoc$2(self, idx, value) {
  self[idx] = value;
}
function dissoc$1(self, idx) {
  self.splice(idx, 1);
}
function omit(self, value) {
  let pos;
  while ((pos = self.indexOf(value)) > -1) {
    self.splice(pos, 1);
  }
}
function persistent(self) {
  return self;
}
var behave$f = _.does(_.implement(IPersistent, {
  persistent
}), _.implement(IInsertable, {
  before,
  after
}), _.implement(ICollection, {
  conj: append,
  unconj
}), _.implement(IEmptyableCollection, {
  empty: empty$1
}), _.implement(IOmissible, {
  omit
}), _.implement(IAssociative, {
  assoc: assoc$2
}), _.implement(IReversible, {
  reverse
}), _.implement(IMap, {
  dissoc: dissoc$1
}), _.implement(IAppendable, {
  append
}), _.implement(IPrependable, {
  prepend
}));

behave$f(Array);

function isMap(self) {
  return _.is(self, Map);
}
function map1(obj) {
  return new Map(obj);
}
function map0() {
  return new Map();
}
_.overload(map0, map1);

function assoc$1(self, key, value) {
  self.set(key, value);
}
function dissoc(self, key, value) {
  self.delete(key, value);
}
var behave$e = _.does(_.keying("Map"), _.implement(IMap, {
  dissoc
}), _.implement(IAssociative, {
  assoc: assoc$1
}));

const behaviors = {};

Object.assign(behaviors, {
  Map: behave$e
});
behave$e(Map);

function isWeakMap(self) {
  return _.is(self, WeakMap);
}
function weakMap1(obj) {
  return new WeakMap(obj);
}
function weakMap0() {
  return new WeakMap();
}
const weakMap = _.overload(weakMap0, weakMap1);

var behave$d = _.does(behave$e, _.keying("WeakMap"));

Object.assign(behaviors, {
  WeakMap: behave$d
});
behave$d(WeakMap);

function set(entries) {
  return new Set(entries || []);
}
function emptySet() {
  return new Set();
}

function empty(self) {
  self.clear();
}
function disj(self, value) {
  self.delete(value);
}
function conj$1(self, value) {
  self.add(value);
}
var behave$c = _.does(_.implement(IEmptyableCollection, {
  empty
}), _.implement(ICollection, {
  conj: conj$1
}), _.implement(ISet, {
  disj
})); //TODO unite

Object.assign(behaviors, {
  Set: behave$c
});
behave$c(Set);

function pub$2(self, value) {
  if (value !== self.state) {
    if (!self.validate || self.validate(value)) {
      self.state = value;
      pub$3(self.observer, value);
    } else {
      throw new Error("Cell update failed - invalid value.");
    }
  }
}
function err$2(self, observer) {
  err$3(self.observer, observer);
}
const complete$2 = _.noop; //if completed, future subscribes to get the last known value would fail.

function closed$2(self) {
  return closed$3(self.observer);
}
function sub$2(self, observer) {
  pub$3(observer, self.state); //to prime subscriber state
  return sub$4(self.observer, observer); //return unsubscribe fn
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
var behave$b = _.does(reducible, mergable, _.keying("Cell"), _.implement(_.IDisposable, {
  dispose
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

behave$b(Cell);

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
  swap$2(self.source, function (state) {
    return _.assocIn(state, self.path, value);
  });
}
function swap(self, f) {
  swap$2(self.source, function (state) {
    return _.updateIn(state, self.path, f);
  });
}
function sub$1(self, observer) {
  return sub$4(self.source, function (state) {
    pub$3(observer, _.getIn(state, self.path));
  });
}
var behave$a = _.does(_.keying("Cursor"),
//_.implement(_.IDisposable, {dispose}), TODO
_.implement(_.IPath, {
  path
}), _.implement(_.IDeref, {
  deref
}), _.implement(IResettable, {
  reset
}), _.implement(ISwappable, {
  swap
}), _.implement(ISubscribe, {
  sub: sub$1
}), _.implement(IPublish, {
  pub: reset
}));

behave$a(Cursor);

function pub$1(self, message) {
  if (!self.terminated) {
    return self.pub(message); //unusual for a command but required by transducers
  }
}
function err$1(self, error) {
  if (!self.terminated) {
    self.terminated = {
      how: "error",
      error
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
var behave$9 = _.does(_.keying("Observer"), _.implement(IPublish, {
  pub: pub$1,
  err: err$1,
  complete: complete$1,
  closed: closed$1
}));

behave$9(Observer);

function sub(self, observer) {
  if (!self.terminated) {
    conj$2(self.observers, observer);
    return _.once(function () {
      unconj$1(self.observers, observer);
    });
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
      error
    };
    notify(self, (_p2 = p, _p$err = _p2.err, _error = error, function err(_argPlaceholder2) {
      return _p$err.call(_p2, _argPlaceholder2, _error);
    }));
    empty$2(self.observers); //release references
  }
}
function complete(self) {
  if (!self.terminated) {
    self.terminated = {
      how: "complete"
    };
    notify(self, complete$3);
    empty$2(self.observers); //release references
  }
}
function closed(self) {
  return self.terminated;
}
function notify(self, f) {
  _.each(f, self.observers);
}
var behave$8 = _.does(reducible, mergable, _.keying("Subject"), _.implement(ISubscribe, {
  sub
}), _.implement(IPublish, {
  pub,
  err,
  complete,
  closed
}));

behave$8(Subject);

function Bus(middlewares) {
  this.middlewares = middlewares;
}
Bus.prototype[Symbol.toStringTag] = "Bus";
function bus(middlewares) {
  return new Bus(middlewares || []);
}

function conj(self, middleware) {
  self.middlewares = _.conj(self.middlewares, middleware);
}
function handle$5(self, message, next) {
  const f = _.reduce(function (memo, middleware) {
    var _middleware, _memo, _p$handle, _p;
    return _p = p, _p$handle = _p.handle, _middleware = middleware, _memo = memo, function handle(_argPlaceholder) {
      return _p$handle.call(_p, _middleware, _argPlaceholder, _memo);
    };
  }, next || _.noop, _.reverse(self.middlewares));
  f(message);
}
function dispatch(self, message) {
  handle$5(self, message);
}
var behave$7 = _.does(_.keying("Bus"), _.implement($.ICollection, {
  conj
}), _.implement(IDispatch, {
  dispatch
}), _.implement(IMiddleware, {
  handle: handle$5
}));

behave$7(Bus);

function Command(type, attrs) {
  this.type = type;
  this.attrs = attrs;
}
Command.prototype[Symbol.toStringTag] = "Command";
function constructs(Type) {
  return function message(type) {
    return function (args, options) {
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
var behave$6 = _.does(_.record, _.keying("Command"), _.implement(_.IHashable, {
  hash
}), _.implement(_.IIdentifiable, {
  identifier
}));

behave$6(Command);

function DrainEventsMiddleware(provider, eventBus) {
  this.provider = provider;
  this.eventBus = eventBus;
}
DrainEventsMiddleware.prototype[Symbol.toStringTag] = "DrainEventsMiddleware";
const drainEventsMiddleware = _.constructs(DrainEventsMiddleware);

function handle$4(self, command, next) {
  next(command);
  _.each(function (message) {
    handle$6(self.eventBus, message, next);
  }, release(self.provider));
}
var behave$5 = _.does(_.keying("DrainEventsMiddleware"), _.implement(IMiddleware, {
  handle: handle$4
}));

behave$5(DrainEventsMiddleware);

function EventMiddleware(emitter) {
  this.emitter = emitter;
}
EventMiddleware.prototype[Symbol.toStringTag] = "EventMiddleware";
const eventMiddleware = _.constructs(EventMiddleware);

function handle$3(self, event, next) {
  $.pub(self.emitter, event);
  next(event);
}
var behave$4 = _.does(_.keying("EventMiddleware"), _.implement(IMiddleware, {
  handle: handle$3
}));

behave$4(EventMiddleware);

function Event(type, attrs) {
  this.type = type;
  this.attrs = attrs;
}
Event.prototype[Symbol.toStringTag] = "Event";
const event = constructs(Event);
function effect(message, type) {
  const e = new Event();
  return Object.assign(e, message, {
    type: type
  });
}
function alter(message, type) {
  return Object.assign(_.clone(message), {
    type: type
  });
}

var behave$3 = _.does(behave$6, _.keying("Event"));

behave$3(Event);

function HandlerMiddleware(handlers, identify, fallback) {
  this.handlers = handlers;
  this.identify = identify;
  this.fallback = fallback;
}
HandlerMiddleware.prototype[Symbol.toStringTag] = "HandlerMiddleware";
const handlerMiddleware3 = _.constructs(HandlerMiddleware);
function handlerMiddleware2(handlers, identify) {
  return handlerMiddleware3(handlers, identify);
}
function handlerMiddleware1(handlers) {
  return handlerMiddleware2(handlers, _.identifier);
}
function handlerMiddleware0() {
  return handlerMiddleware1({});
}
const handlerMiddleware = _.overload(handlerMiddleware0, handlerMiddleware1, handlerMiddleware2, handlerMiddleware3);

function assoc(self, key, handler) {
  self.handlers = _.assoc(self.handlers, key, handler);
}
function handle$2(self, message, next) {
  const handler = _.get(self.handlers, self.identify(message), self.fallback);
  if (handler) {
    handle$6(handler, message, next);
  } else {
    next(message);
  }
}
var behave$2 = _.does(_.keying("HandlerMiddleware"), _.implement($.IAssociative, {
  assoc
}), _.implement(IMiddleware, {
  handle: handle$2
}));

behave$2(HandlerMiddleware);

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
    self.handling = true;
    next(message);
    self.handling = false;
    if (self.queued.length) {
      var _self$bus, _p$dispatch, _p;
      const queued = self.queued;
      self.queued = [];
      _.log("draining queued", queued);
      _.each((_p = p, _p$dispatch = _p.dispatch, _self$bus = self.bus, function dispatch(_argPlaceholder) {
        return _p$dispatch.call(_p, _self$bus, _argPlaceholder);
      }), queued);
    }
  }
}
var behave$1 = _.does(_.keying("LockingMiddleware"), _.implement(IMiddleware, {
  handle: handle$1
}));

behave$1(LockingMiddleware);

function TeeMiddleware(effect) {
  this.effect = effect;
}
TeeMiddleware.prototype[Symbol.toStringTag] = "TeeMiddleware";
const teeMiddleware = _.constructs(TeeMiddleware);

function handle(self, message, next) {
  self.effect(message);
  next(message);
}
var behave = _.does(_.keying("TeeMiddleware"), _.implement(IMiddleware, {
  handle
}));

behave(TeeMiddleware);

var _fromPromise;

function collect(cell) {
  return function (value) {
    var _value, _$conj, _ref;
    //return observer
    swap$2(cell, (_ref = _, _$conj = _ref.conj, _value = value, function conj(_argPlaceholder) {
      return _$conj.call(_ref, _argPlaceholder, _value);
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
  const sink = arguments[arguments.length - 1],
    xforms = _.slice(arguments, 1, arguments.length - 1);
  return sub$4(pipe(source, ...xforms), sink);
}
ISubscribe.transducing = connect3;
const connect = _.overload(null, null, connect2, connect3, connectN); //returns `unsub` fn
const map = shared(cell, Observable.map);
const then = shared(cell, Observable.resolve, Observable.map);
const interact = shared(cell, Observable.interact);
const fromEvent = shared(subject, Observable.fromEvent);
const computed = shared(cell, Observable.computed);
const fixed = shared(cell, Observable.fixed);
const latest = shared(cell, Observable.latest);
const splay = shared(cell, Observable.splay);
const tick = shared(subject, Observable.tick);
const when = shared(cell, Observable.when);
const toggles = shared(cell, Observable.toggles);
const hist = shared(cell, Observable.hist);
function fmap(source, f) {
  return map(f, source);
}
_.each(_.implement(_.IFunctor, {
  fmap
}), [Cell, Subject, Observable]);
function fromPromise2(promise, init) {
  return share(Observable.fromPromise(promise), cell(init));
}
const fromPromise = _.overload(null, (_fromPromise = fromPromise2, function fromPromise2(_argPlaceholder2) {
  return _fromPromise(_argPlaceholder2, null);
}), fromPromise2);

//enforce sequential nature of operations
function isolate1(f) {
  //TODO treat operations as promises
  const queue = [];
  return function () {
    const ready = queue.length === 0;
    queue.push(arguments);
    if (ready) {
      while (queue.length) {
        const args = _.first(queue);
        try {
          f.apply(null, args);
          trigger(args[0], "mutate", {
            bubbles: true
          });
        } finally {
          queue.shift();
        }
      }
    }
  };
}
const isolate = _.overload(isolate$1, isolate1);
function render3(el, obs, f) {
  return sub$4(obs, isolate0(), function (state) {
    f(el, state);
    trigger(el, "mutate", {
      bubbles: true
    }); //TODO rename
  });
}
function render2(state, f) {
  var _state, _f, _render;
  return _render = render3, _state = state, _f = f, function render3(_argPlaceholder3) {
    return _render(_argPlaceholder3, _state, _f);
  };
}
const render = _.overload(null, null, render2, render3);
function renderDiff3(el, obs, f) {
  return sub$4(obs, isolate$1(), hist$2(2), function (history) {
    const args = [el].concat(history);
    f.apply(this, args); //overload arity 2 & 3 for initial and diff rendering
    trigger(el, "mutate", {
      bubbles: true
    }); //TODO rename
  });
}
function renderDiff2(state, f) {
  var _state2, _f2, _renderDiff;
  return _renderDiff = renderDiff3, _state2 = state, _f2 = f, function renderDiff3(_argPlaceholder4) {
    return _renderDiff(_argPlaceholder4, _state2, _f2);
  };
}

//TODO replace render after migration
const renderDiff = _.overload(null, null, renderDiff2, renderDiff3);
(function () {
  function pub(self, msg) {
    self(msg);
  }
  _.doto(Function, reducible,
  //makes fns work as observers like `cell`, e.g. `$.connect($.tick(3000), $.see("foo"))`
  _.implement(IPublish, {
    pub,
    err: _.noop,
    complete: _.noop,
    closed: _.noop
  }));
})();
function defs(construct, keys) {
  return _.reduce(function (memo, key) {
    return _.assoc(memo, key, construct(key));
  }, {}, keys);
}
function dispatchable(Cursor) {
  function dispatch(self, command) {
    dispatch$1(self.source, _.update(command, "path", function (path) {
      return _.apply(_.conj, self.path, path || []);
    }));
  }
  _.doto(Cursor, _.implement(IDispatch, {
    dispatch
  }));
}
(function () {
  function dispatch(self, args) {
    return _.apply(self, args);
  }
  _.doto(Function, _.implement(IDispatch, {
    dispatch
  }));
})();
_.ICoercible.addMethod([Set, Array], Array.from);
(function () {
  function log(self, ...args) {
    self.log(...args);
  }
  _.doto(console, _.specify(ILogger, {
    log
  }));
})();
_.doto(_.Nil, _.implement(ILogger, {
  log: _.noop
}));
function severity(logger, severity) {
  const f = logger[severity].bind(logger);
  function log(self, ...args) {
    f(...args);
  }
  return _.doto({
    logger,
    severity
  }, _.specify(ILogger, {
    log
  }));
}
function inspect(logger, ...effects) {
  function log$1(self, ...args) {
    log(logger, ...[..._.mapa(_.execute, effects), ...args]);
  }
  return _.doto({
    logger,
    effects
  }, _.specify(ILogger, {
    log: log$1
  }));
}
function label(logger, ...labels) {
  function log$1(self, ...args) {
    log(logger, ...[...labels, ...args]);
  }
  return _.doto({
    logger,
    labels
  }, _.specify(ILogger, {
    log: log$1
  }));
}

//composable logging
const logging = {
  severity,
  inspect,
  label
};

/*
const {severity, inspect, label} = $.logging;
const warn = severity(console, "warn");
const when = inspect(warn, _.date); //can interrogate current value of state container
const b = label(when, "basement");
const br = label(b, "boiler room"); //a nested part of program
$.log(br, "pressure high!");

*/

function tee(f) {
  return function (value) {
    f(value);
    return value;
  };
}
function peek(logger) {
  var _logger, _p$log, _p;
  return tee((_p = p, _p$log = _p.log, _logger = logger, function log(_argPlaceholder5) {
    return _p$log.call(_p, _logger, _argPlaceholder5);
  }));
}
function see(...labels) {
  return tee(_.partial(log, ...labels));
}
function called4(fn, message, context, logger) {
  return function () {
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
const called = _.overload(null, null, called2, called3, called4);

export { Bus, Cell, Command, Cursor, DrainEventsMiddleware, Event, EventMiddleware, HandlerMiddleware, IAppendable, IAssociative, ICollection, IDispatch, IEmptyableCollection, IEventProvider, IEvented, IInsertable, ILogger, IMap, IMiddleware, IOmissible, IPersistent, IPrependable, IPublish, IQueryable, IResettable, IReversible, ISend, ISet, ISubscribe, ISwappable, ITransient, LockingMiddleware, Observable, Observer, Subject, TeeMiddleware, after$1 as after, alter, append$1 as append, assoc$3 as assoc, before$1 as before, bus, called, cell, chan, closed$3 as closed, collect, command, complete$3 as complete, computed, conj$2 as conj, connect, constructs, cursor, defs, disj$1 as disj, dispatch$1 as dispatch, dispatchable, dissoc$2 as dissoc, drainEventsMiddleware, effect, empty$2 as empty, emptySet, err$3 as err, event, eventMiddleware, fixed, fromEvent, fromPromise, handle$6 as handle, handlerMiddleware, hist, interact, isMap, isWeakMap, isolate, latest, lockingMiddleware, log, logging, map, observable, observer, omit$1 as omit, on, once, peek, persistent$1 as persistent, pipe, prepend$1 as prepend, pub$3 as pub, query, raise, release, render, renderDiff, reset$1 as reset, resettable, reverse$1 as reverse, see, seed, send, set, share, shared, sharing, splay, sub$4 as sub, subject, swap$2 as swap, tee, teeMiddleware, then, tick, toObservable, toggles, transient, trigger, unconj$1 as unconj, weakMap, when };
