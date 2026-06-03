import * as _ from "./core.js";

import { protocol, first as first$2 } from "./core.js";

import * as $ from "./shell.js";

export { after, append, before, empty, omit, prepend } from "./shell.js";

const IContent = _.protocol({
  contents: null
});

function contents2(self, type) {
  return _.filter(function(node) {
    return node.nodeType === type;
  }, IContent.contents(self));
}

const contents$2 = _.overload(null, IContent.contents, contents2);

const IHideable = _.protocol({
  hide: null,
  show: null,
  toggle: null
});

const hide$1 = IHideable.hide;

const show$1 = IHideable.show;

const toggle$1 = IHideable.toggle;

const IHtml = _.protocol({
  html: null
});

const html$1 = IHtml.html;

const IEmbeddable = _.protocol({
  embeddables: null
});

const embeddables$1 = IEmbeddable.embeddables;

function embed3(add, parent, children) {
  var _embeddables, _$mapcat, _ref, _parent$ownerDocument, _embeddables2, _param, _$$each, _$;
  _.chain(children, _.flatten, (_ref = _, _$mapcat = _ref.mapcat, _embeddables = (_embeddables2 = embeddables$1, 
  _parent$ownerDocument = parent.ownerDocument, function embeddables(_argPlaceholder2) {
    return _embeddables2(_argPlaceholder2, _parent$ownerDocument);
  }), function mapcat(_argPlaceholder) {
    return _$mapcat.call(_ref, _embeddables, _argPlaceholder);
  }), (_$ = $, _$$each = _$.each, _param = function(child) {
    _.isFunction(child) ? child(parent, add) : add(parent, child);
  }, function each(_argPlaceholder3) {
    return _$$each.call(_$, _param, _argPlaceholder3);
  }));
}

function embed2(parent, children) {
  embed3(function(parent, child) {
    parent.appendChild(child);
  }, parent, children);
}

const embed = _.overload(null, null, embed2, embed3);

const IMountable = _.protocol({});

var _IMountable, _$satisfies, _ref$1;

const isMountable = (_ref$1 = _, _$satisfies = _ref$1.satisfies, _IMountable = IMountable, 
function satisfies(_argPlaceholder) {
  return _$satisfies.call(_ref$1, _IMountable, _argPlaceholder);
});

function mounts(self) {
  _.specify(IMountable, {}, self);
  const parent = _.parent(self);
  if (parent) {
    $.each(function(key) {
      $.trigger(self, key, {
        bubbles: true,
        detail: {
          parent: parent
        }
      });
    }, [ "mounting", "mounted" ]);
  }
  return self;
}

function sel1$2(self, selector) {
  return first$2(ISelectable.sel(self, selector));
}

const ISelectable = protocol({
  sel: null,
  sel1: sel1$2
});

const sel02 = _.pre(function sel02(selector, context) {
  return ISelectable.sel(context, selector);
}, _.isString);

function sel01(selector) {
  return sel02(selector, document);
}

const sel$2 = _.overload(null, sel01, sel02);

const sel12 = _.pre(function sel12(selector, context) {
  return ISelectable.sel1(context, selector);
}, _.isString);

function sel11(selector) {
  return sel12(selector, document);
}

const sel1$1 = _.overload(null, sel11, sel12);

const IText = _.protocol({
  text: null
});

const text$2 = IText.text;

const IValue = _.protocol({
  value: null
});

const value$2 = IValue.value;

function isHTMLDocument(self) {
  return _.is(self, HTMLDocument);
}

const element = _.assume(isHTMLDocument, document, _.curry(function element(document, name, ...contents) {
  var _contents, _embed;
  return _.doto(document.createElement(name), (_embed = embed, _contents = contents, 
  function embed(_argPlaceholder) {
    return _embed(_argPlaceholder, _contents);
  }));
}, 2));

const elementns = _.assume(isHTMLDocument, document, _.curry(function elementns(document, ns, name, ...contents) {
  var _contents2, _embed2;
  return _.doto(document.createElementNS(ns, name), (_embed2 = embed, _contents2 = contents, 
  function embed(_argPlaceholder2) {
    return _embed2(_argPlaceholder2, _contents2);
  }));
}, 3));

function isElement(self) {
  return _.ako(self, Element);
}

function send2(self, message) {
  send3(self, message, "log");
}

function send3(self, message, address) {
  self[address](message);
}

const send = _.overload(null, null, send2, send3);

var behave$8 = _.does(_.specify($.ISend, {
  send: send
}));

behave$8(console);

const fragment = _.assume(isHTMLDocument, document, function fragment(document, ...contents) {
  var _contents, _embed;
  return _.doto(document.createDocumentFragment(), (_embed = embed, _contents = contents, 
  function embed(_argPlaceholder) {
    return _embed(_argPlaceholder, _contents);
  }));
});

function InvalidHostElementError(el, selector) {
  this.el = el;
  this.selector = selector;
}

function toString() {
  return `Element "${this.el.tagName}" failed to match "${this.selector}".`;
}

InvalidHostElementError.prototype = Object.assign(new Error, {
  toString: toString
});

function check(self, selector) {
  return _.isString(selector);
}

const matches = _.pre(function matches(self, selector) {
  return self.matches ? self.matches(selector) : false;
}, check);

function assert(el, selector) {
  if (!matches(el, selector)) {
    throw new InvalidHostElementError(el, selector);
  }
}

function hidden(el) {
  return document.contains(el) ? window.getComputedStyle(el).display === "none" : el.style.display === "none";
}

function remove1(self) {
  self.remove();
}

function remove2(self, other) {
  if (_.isArray(other)) {
    const [key, value] = other;
    if (_.contains(self, key, value)) {
      self.removeAttribute(key);
    }
  } else {
    self.removeChild(other);
  }
}

const remove = _.overload(null, remove1, remove2);

function hide(el) {
  el.style.display = "none";
}

function show(el) {
  el.style.display = "";
}

function toggles4(on, off, want, self) {
  return want(self) ? on(self) : off(self);
}

function toggles5(on, off, _, self, want) {
  return want ? on(self) : off(self);
}

const toggles = _.overload(null, null, null, null, toggles4, toggles5);

const toggle = _.partial(toggles, show, hide, hidden);

function embeddables(self) {
  function embed(parent, add) {
    if (isMountable(self)) {
      const detail = {
        parent: parent
      };
      $.trigger(self, "mounting", {
        bubbles: true,
        detail: detail
      });
      add(parent, self);
      $.trigger(self, "mounted", {
        bubbles: true,
        detail: detail
      });
    } else {
      add(parent, self);
    }
  }
  return [ embed ];
}

function append(self, content) {
  embed(self, [ content ]);
}

function prepend(self, content) {
  embed(function(parent, child) {
    parent.insertBefore(child, parent.childNodes[0]);
  }, self, [ content ]);
}

function before(self, content) {
  embed(function(parent, child) {
    parent.insertBefore(child, self);
  }, _.parent(self), [ content ]);
}

function after(self, content) {
  const ref = _.nextSibling(self);
  embed(function(parent, child) {
    parent.insertBefore(child, ref);
  }, _.parent(self), [ content ]);
}

const conj$2 = append;

const eventConstructors = {
  click: MouseEvent,
  mousedown: MouseEvent,
  mouseup: MouseEvent,
  mouseover: MouseEvent,
  mousemove: MouseEvent,
  mouseout: MouseEvent,
  focus: FocusEvent,
  blur: FocusEvent
};

const eventDefaults = {
  bubbles: true
};

function trigger(self, key, options) {
  options = Object.assign({}, eventDefaults, options || {});
  const Event = eventConstructors[key] || CustomEvent;
  let event = null;
  try {
    event = new Event(key, options);
  } catch (ex) {
    event = self.ownerDocument.createEvent("HTMLEvents");
    event.initEvent(key, options.bubbles || false, options.cancelable || false);
    event.detail = options.detail;
  }
  self.dispatchEvent(event);
  return self;
}

function contents$1(self) {
  return self.contentDocument || _.seq(self.childNodes);
}

function assoc$1(self, key, value) {
  self.setAttribute(key, _.str(value));
}

function dissoc$1(self, key) {
  self.removeAttribute(key);
}

function keys2(self, idx) {
  return idx < self.attributes.length ? _.lazySeq(function() {
    return _.cons(self.attributes[idx].name, keys2(self, idx + 1));
  }) : _.emptyList();
}

function keys$1(self) {
  return keys2(self, 0);
}

function vals2(self, idx) {
  return idx < self.attributes.length ? _.lazySeq(function() {
    return _.cons(self.attributes[idx].value, keys2(self, idx + 1));
  }) : _.emptyList();
}

function vals$1(self) {
  return vals2(self, 0);
}

function lookup$2(self, key) {
  return self.getAttribute(key);
}

function contains2$1(self, key) {
  return self.hasAttribute(key);
}

const contains$1 = _.overload(null, _.constantly(_.looseEq), contains2$1);

function parent$1(self) {
  return self && self.parentNode;
}

const parents$1 = _.upward(function(self) {
  return self && self.parentElement;
});

const root = _.comp(_.last, _.upward(parent$1));

function closest$1(self, selector) {
  let target = self;
  while (target) {
    if (matches(target, selector)) {
      return target;
    }
    target = _.parent(target);
  }
}

function sel$1(self, selector) {
  return self.querySelectorAll(selector);
}

function sel1(self, selector) {
  return self.querySelector(selector);
}

function children$1(self) {
  return _.seq(self.children || _.filter(isElement, self.childNodes));
}

const descendants$1 = _.downward(_.children);

function nextSibling$1(self) {
  return self.nextElementSibling;
}

const nextSiblings$1 = _.upward(_.nextSibling);

function prevSibling$1(self) {
  return self.previousElementSibling;
}

const prevSiblings$1 = _.upward(_.prevSibling);

function siblings$1(self) {
  return _.concat(prevSiblings$1(self), nextSiblings$1(self));
}

function includes$1(self, target) {
  if (_.isArray(target)) {
    const [key, value] = target;
    return _.contains(self, key, value);
  } else {
    var _target, _$isIdentical, _ref;
    return !!_.detect((_ref = _, _$isIdentical = _ref.isIdentical, _target = target, 
    function isIdentical(_argPlaceholder) {
      return _$isIdentical.call(_ref, _target, _argPlaceholder);
    }), children$1(self));
  }
}

function empty(self) {
  while (self.firstChild) {
    self.removeChild(self.firstChild);
  }
}

function clone$1(self) {
  return self.cloneNode(true);
}

function value1(self) {
  switch (self.getAttribute("type")) {
   case "checkbox":
    return self.checked;

   case "number":
   case "range":
    return _.maybe(self.value, _.blot, parseFloat);

   default:
    return "value" in self ? self.value : null;
  }
}

function value2(self, value) {
  switch (self.getAttribute("type")) {
   case "checkbox":
    self.checked = !!value;
    return;

   case "number":
   case "range":
    self.value = _.maybe(value, _.blot, parseFloat);
    return;

   default:
    if ("value" in self) {
      value = value == null ? "" : value;
      if (self.value != value) {
        self.value = value;
      }
    } else {
      throw new TypeError("Type does not support value property.");
    }
  }
}

const value$1 = _.overload(null, value1, value2);

function text1(self) {
  return self.textContent;
}

function text2(self, text) {
  self.textContent = text == null ? "" : text;
}

const text$1 = _.overload(null, text1, text2);

function html1(self) {
  return self.innerHTML;
}

function html2(self, html) {
  if (_.isString(html)) {
    self.innerHTML = html;
  } else {
    empty(self);
    embed(self, [ html ]);
  }
  return self;
}

const html = _.overload(null, html1, html2);

function reduce$2(self, f, init) {
  return _.reduce(f, init, _.descendants(self));
}

function chan2(el, key) {
  return $.observable(function(observer) {
    var _observer, _$$pub, _$;
    return on3(el, key, (_$ = $, _$$pub = _$.pub, _observer = observer, function pub(_argPlaceholder2) {
      return _$$pub.call(_$, _observer, _argPlaceholder2);
    }));
  });
}

function chan3(el, key, selector) {
  return $.observable(function(observer) {
    var _observer2, _$$pub2, _$2;
    return on4(el, key, selector, (_$2 = $, _$$pub2 = _$2.pub, _observer2 = observer, 
    function pub(_argPlaceholder3) {
      return _$$pub2.call(_$2, _observer2, _argPlaceholder3);
    }));
  });
}

const chan = _.overload(null, null, chan2, chan3);

function on3(el, key, callback) {
  if (key.indexOf(" ") > -1) {
    var _el, _callback, _on;
    return _.does(..._.mapa((_on = on3, _el = el, _callback = callback, function on3(_argPlaceholder4) {
      return _on(_el, _argPlaceholder4, _callback);
    }), key.split(" ")));
  } else {
    el.addEventListener(key, callback);
    return function() {
      el.removeEventListener(key, callback);
    };
  }
}

function on4(el, key, selector, callback) {
  return on3(el, key, function(e) {
    if (e.target.matches(selector)) {
      callback.call(e.target, e);
    } else {
      const target = _.closest(e.target, selector);
      if (target && el.contains(target)) {
        callback.call(target, e);
      }
    }
  });
}

const on = _.overload(null, null, null, on3, on4);

const ihierarchy = _.implement(_.IHierarchy, {
  root: root,
  parent: parent$1,
  parents: parents$1,
  closest: closest$1,
  children: children$1,
  descendants: descendants$1,
  nextSibling: nextSibling$1,
  nextSiblings: nextSiblings$1,
  prevSibling: prevSibling$1,
  prevSiblings: prevSiblings$1,
  siblings: siblings$1
});

const icontents = _.implement(IContent, {
  contents: contents$1
});

const ievented = _.implement($.IEvented, {
  on: on,
  chan: chan,
  trigger: trigger
});

const iselectable = _.implement(ISelectable, {
  sel: sel$1,
  sel1: sel1
});

var ielement = _.does(ihierarchy, icontents, ievented, iselectable, _.implement($.ITopic, _.itopic(assoc$1, dissoc$1, {
  equals: _.looseEq
})), _.keying("Element"), _.implement(_.IReducible, {
  reduce: reduce$2
}), _.implement(IValue, {
  value: value$1
}), _.implement(IText, {
  text: text$1
}), _.implement(IHtml, {
  html: html
}), _.implement(IEmbeddable, {
  embeddables: embeddables
}), _.implement($.IEmptyableCollection, {
  empty: empty
}), _.implement($.IInsertable, {
  before: before,
  after: after
}), _.implement(_.IInclusive, {
  includes: includes$1
}), _.implement(IHideable, {
  show: show,
  hide: hide,
  toggle: toggle
}), _.implement($.IOmissible, {
  omit: remove
}), _.implement(_.ICloneable, {
  clone: clone$1
}), _.implement($.IAppendable, {
  append: append
}), _.implement($.IPrependable, {
  prepend: prepend
}), _.implement($.ICollection, {
  conj: conj$2
}), _.implement(_.ILookup, {
  lookup: lookup$2
}), _.implement(_.IMap, {
  keys: keys$1,
  vals: vals$1
}), _.implement($.IMap, {
  dissoc: dissoc$1
}), _.implement(_.IAssociative, {
  contains: contains$1
}), _.implement($.IAssociative, {
  assoc: assoc$1
}));

var behave$7 = _.does(ielement, _.keying("DocumentFragment"), _.implement(_.IHierarchy, {
  nextSibling: _.constantly(null),
  nextSiblings: _.emptyList,
  prevSibling: _.constantly(null),
  prevSiblings: _.emptyList,
  siblings: _.emptyList,
  parent: _.constantly(null),
  parents: _.emptyList
}), _.implement(_.ISeq, {
  first: _.identity,
  rest: _.emptyList
}), _.implement(_.ISeqable, {
  seq: _.cons
}));

const behaviors = {};

Object.assign(behaviors, {
  DocumentFragment: behave$7
});

behave$7(DocumentFragment);

function replaceWith(self, other) {
  const parent = _.parent(self), replacement = _.isString(other) ? self.ownerDocument.createTextNode(other) : other;
  parent.replaceChild(replacement, self);
}

function wrap(self, other) {
  replaceWith(self, other);
  $.append(other, self);
}

function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function enable(self, enabled) {
  self.disabled = !enabled;
  return self;
}

Object.assign(behaviors, {
  Window: ielement,
  Element: ielement,
  Text: ielement
});

ielement(Window);

ielement(Element);

ielement(Text);

function seq2(self, idx) {
  return idx < self.length ? _.lazySeq(function() {
    return _.cons(self.item(idx), seq2(self, idx + 1));
  }) : null;
}

function seq$1(self) {
  return seq2(self, 0);
}

function lookup$1(self, idx) {
  return self[idx];
}

const first$1 = _.comp(_.first, seq$1);

const rest$1 = _.comp(_.rest, seq$1);

_.comp(_.next, seq$1);

const children = _.comp(_.children, seq$1);

const descendants = _.comp(_.descendants, seq$1);

const nextSibling = _.comp(_.nextSibling, seq$1);

const nextSiblings = _.comp(_.nextSiblings, seq$1);

const prevSibling = _.comp(_.prevSibling, seq$1);

const prevSiblings = _.comp(_.prevSiblings, seq$1);

const siblings = _.comp(_.siblings, seq$1);

const parent = _.comp(_.parent, seq$1);

const parents = _.comp(_.parents, seq$1);

const contents = _.comp(IContent.contents, seq$1);

function sel(self, selector) {
  var _matches, _$filter, _ref, _selector, _matches2;
  return _.maybe(self, seq$1, (_ref = _, _$filter = _ref.filter, _matches = (_matches2 = matches, 
  _selector = selector, function matches(_argPlaceholder2) {
    return _matches2(_argPlaceholder2, _selector);
  }), function filter(_argPlaceholder) {
    return _$filter.call(_ref, _matches, _argPlaceholder);
  }));
}

function closest(self, selector) {
  var _selector2, _$closest, _ref2;
  return _.maybe(self, seq$1, (_ref2 = _, _$closest = _ref2.closest, _selector2 = selector, 
  function closest(_argPlaceholder3) {
    return _$closest.call(_ref2, _argPlaceholder3, _selector2);
  }));
}

function reduce$1(self, f, init) {
  return _.reduce(f, init, seq$1(self));
}

function count$1(self) {
  return self.length;
}

var behave$6 = _.does(_.iterable, _.keying("NodeList"), _.implement(_.ILookup, {
  lookup: lookup$1
}), _.implement(_.IIndexed, {
  nth: lookup$1
}), _.implement(_.ICounted, {
  count: count$1
}), _.implement(_.ISeq, {
  first: first$1,
  rest: rest$1
}), _.implement(_.IReducible, {
  reduce: reduce$1
}), _.implement(_.IHierarchy, {
  parent: parent,
  parents: parents,
  closest: closest,
  nextSiblings: nextSiblings,
  nextSibling: nextSibling,
  prevSiblings: prevSiblings,
  prevSibling: prevSibling,
  siblings: siblings,
  children: children,
  descendants: descendants
}), _.implement(_.ISequential), _.implement(_.ISeqable, {
  seq: seq$1
}), _.implement(IContent, {
  contents: contents
}), _.implement(ISelectable, {
  sel: sel
}));

Object.assign(behaviors, {
  HTMLCollection: behave$6
});

behave$6(HTMLCollection);

var behave$5 = _.does(ielement, _.keying("HTMLDocument"), _.implement(_.IHierarchy, {
  closest: _.constantly(null),
  nextSibling: _.constantly(null),
  nextSiblings: _.emptyList,
  prevSibling: _.constantly(null),
  prevSiblings: _.emptyList,
  siblings: _.emptyList,
  parent: _.constantly(null),
  parents: _.emptyList
}));

Object.assign(behaviors, {
  HTMLDocument: behave$5
});

behave$5(HTMLDocument);

var behave$4 = _.noop;

Object.assign(behaviors, {
  HTMLInputElement: behave$4
});

behave$4(HTMLInputElement);

var _$either, _ref2;

function conj$1(self, entry) {
  self.append(isElement(entry) ? entry : element("option", {
    value: _.key(entry)
  }, _.val(entry)));
}

function access(f) {
  function value1(self) {
    var _param, _$detect, _ref;
    return _.maybe(sel$2("option", self), (_ref = _, _$detect = _ref.detect, _param = function(option) {
      return option.selected;
    }, function detect(_argPlaceholder) {
      return _$detect.call(_ref, _param, _argPlaceholder);
    }), f);
  }
  function value2(self, value) {
    const options = sel$2("option", self);
    const chosen = _.detect(function(option) {
      return f(option) == value;
    }, options);
    if (chosen) {
      $.each(function(option) {
        const selected = f(option) == value;
        if (option.selected != selected) {
          option.selected = selected;
        }
      }, options);
    } else {
      throw new Error("Cannot set value — it is not an option.");
    }
  }
  return _.overload(null, value1, value2);
}

const text = _.comp((_ref2 = _, _$either = _ref2.either, function either(_argPlaceholder2) {
  return _$either.call(_ref2, _argPlaceholder2, "");
}), access(text$2)), value = access(value$2);

var behave$3 = _.does(_.keying("HTMLSelectElement"), _.implement($.ICollection, {
  conj: conj$1
}), _.implement($.IAppendable, {
  append: conj$1
}), _.implement(IValue, {
  value: value
}), _.implement(IText, {
  text: text
}));

Object.assign(behaviors, {
  HTMLSelectElement: behave$3
});

behave$3(HTMLSelectElement);

var behave$2 = _.keying("Location");

Object.assign(behaviors, {
  Location: behave$2
});

behave$2(Location);

Object.assign(behaviors, {
  NodeList: behave$6
});

behave$6(NodeList);

const urlSearchParams = _.constructs(URLSearchParams);

function equiv(self, other) {
  return other.constructor === URLSearchParams && _.eq(_.into({}, self), _.into({}, other));
}

function clone(self) {
  const params = new URLSearchParams;
  for (const [key, value] of self.entries()) {
    params.set(key, value);
  }
  return params;
}

function conj(self, [key, value]) {
  const other = clone(self);
  other.set(key, value);
  return other;
}

function count(self) {
  return self.size;
}

function lookup(self, key) {
  return self.get(key);
}

function assoc(self, key, value) {
  self.set(key, value);
}

function dissoc(self, key) {
  self.delete(key);
}

function seq(self) {
  return count(self) ? self : null;
}

function reduce(self, f, init) {
  let memo = init;
  for (const entry of self.entries()) {
    if (_.isReduced(memo)) break;
    memo = f(memo, entry);
  }
  return _.unreduced(memo);
}

function reducekv(self, f, init) {
  let memo = init;
  for (const [key, value] of self.entries()) {
    if (_.isReduced(memo)) break;
    memo = f(memo, key, value);
  }
  return _.unreduced(memo);
}

function first(self) {
  const ks = keys(self), k = _.first(ks);
  return k ? [ k, lookup(self, k) ] : null;
}

function rest(self) {
  const iter = self.entries();
  iter.next();
  return _.lazyIterable(iter);
}

function keys(self) {
  return _.lazyIterable(self.keys());
}

function vals(self) {
  return _.lazyIterable(self.values());
}

function contains2(self, key) {
  return self.has(key);
}

const contains = _.overload(null, _.constantly(_.looseEq), contains2);

function includes(self, [key, value]) {
  return _.contains(self, key, value);
}

var behave$1 = _.does(_.keying("URLSearchParams"), _.implement(_.IEquiv, {
  equiv: equiv
}), _.implement(_.ICloneable, {
  clone: clone
}), _.implement(_.ICounted, {
  count: count
}), _.implement(_.ISeqable, {
  seq: seq
}), _.implement(_.ISeq, {
  first: first,
  rest: rest
}), _.implement(_.IMap, {
  keys: keys,
  vals: vals
}), _.implement(_.IInclusive, {
  includes: includes
}), _.implement(_.IAssociative, {
  contains: contains
}), _.implement(_.ILookup, {
  lookup: lookup
}), _.implement(_.IReducible, {
  reduce: reduce
}), _.implement(_.IKVReducible, {
  reducekv: reducekv
}), _.implement(_.ICollection, {
  conj: conj
}), _.implement($.IMap, {
  dissoc: dissoc
}), _.implement($.IAssociative, {
  assoc: assoc
}));

behave$1(URLSearchParams);

Object.assign(behaviors, {
  XMLDocument: behave$5
});

behave$5(XMLDocument);

var _behaviors, _$behaves, _ref, _param, _$into, _ref3, _DocumentFragment, _$coerce, _ref4, _param2, _$into2, _ref5;

const behave = (_ref = _, _$behaves = _ref.behaves, _behaviors = behaviors, function behaves(_argPlaceholder) {
  return _$behaves.call(_ref, _behaviors, _argPlaceholder);
});

const ready = _.assume(isHTMLDocument, document, function ready(document, callback) {
  if (document.readyState !== "loading") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback);
  }
});

const hash = $.shared($.atom, function(window) {
  return $.computed(function(e) {
    return window.location.hash;
  }, $.chan(window, "hashchange"));
});

const focus = $.shared($.atom, function(el) {
  return $.toggles(el, "focus", "blur", function() {
    return el === el.ownerDocument.activeElement;
  });
});

const click = $.shared($.subject, function(el) {
  return $.chan(el, "click");
});

const hover = $.shared($.atom, function(el) {
  return $.toggles(el, "mouseenter", "mouseleave", _.constantly(false));
});

function scan(step, init) {
  return function(rf) {
    let acc = init;
    return _.overload(rf, rf, function(memo, value) {
      acc = step(acc, value);
      return rf(memo, acc);
    });
  };
}

const depressed = $.shared($.atom, function(el) {
  return $.seed(_.constantly([]), $.pipe($.chan(el, "keydown keyup"), scan(function(memo, e) {
    if (e.type === "keyup") {
      var _e$key, _$notEq, _ref2;
      memo = _.filtera((_ref2 = _, _$notEq = _ref2.notEq, _e$key = e.key, function notEq(_argPlaceholder2) {
        return _$notEq.call(_ref2, _e$key, _argPlaceholder2);
      }), memo);
    } else if (!_.includes(memo, e.key)) {
      memo = _.conj(memo, e.key);
    }
    return memo;
  }, []), _.dedupe()));
});

function attr2(self, key) {
  if (_.isString(key)) {
    return self.getAttribute(key);
  } else {
    const entries = key;
    $.each(([key, value]) => attr3(self, key, value), entries);
  }
}

function attr3(self, key, value) {
  if (_.isFunction(value)) {
    self.setAttribute(key, value(self.getAttribute(key)));
  } else {
    self.setAttribute(key, _.str(value));
  }
}

function attrN(self, ...kvps) {
  const stop = kvps.length - 1;
  for (let i = 0; i <= stop; i += 2) {
    attr3(self, kvps[i], kvps[i + 1]);
  }
}

const attr = _.overload(null, _.comp((_ref3 = _, _$into = _ref3.into, _param = {}, 
function into(_argPlaceholder3) {
  return _$into.call(_ref3, _param, _argPlaceholder3);
}), $.assert), attr2, attr3, attrN);

function removeAttr2(self, key) {
  self.removeAttribute(key);
}

const removeAttr = _.overload(null, null, removeAttr2, $.doing(removeAttr2));

function prop3(self, key, value) {
  self[key] = value;
}

function prop2(self, key) {
  return self[key];
}

const prop = _.overload(null, null, prop2, prop3);

function addStyle(self, key, value) {
  self.style[key] = value;
}

function removeStyle2(self, key) {
  self.style.removeProperty(key);
}

function removeStyle3(self, key, value) {
  if (self.style[key] === value) {
    self.style.removeProperty(key);
  }
}

const removeStyle = _.overload(null, null, removeStyle2, removeStyle3);

function addClass(self, ...names) {
  self.classList.add(...names);
}

function removeClass(self, ...names) {
  self.classList.remove(...names);
}

function toggleClass2(self, name) {
  toggleClass3(self, name, !self.classList.contains(name));
}

function toggleClass3(self, name, want) {
  self.classList[want ? "add" : "remove"](name);
}

const toggleClass = _.overload(null, null, toggleClass2, toggleClass3);

function hasClass(self, name) {
  return self.classList.contains(name);
}

const markup = _.obj(function(name, ...contents) {
  const attrs = _.map(function(entry) {
    return _.template('{0}="{1}"', _.key(entry), _.replace(_.val(entry), /"/g, "&quot;"));
  }, _.apply(_.merge, _.filter(_.isObject, contents)));
  const content = _.map(_.str, _.remove(_.isObject, contents));
  return _.join("", _.concat([ "<" + name + " " + _.join(" ", attrs) + ">" ], content, "</" + name + ">"));
}, Infinity);

function tags0() {
  return _.factory(element(document));
}

function tags1(keys) {
  return tags2(element(document), keys);
}

function tags2(engine, keys) {
  return tags3(engine, _.identity, keys);
}

function tags3(engine, f, keys) {
  const tag = _.factory(engine);
  return _.fold(function(memo, key) {
    memo[key] = f(tag(key));
    return memo;
  }, {}, keys);
}

function svg(doc = document, tags = [ "svg", "g", "symbol", "defs", "clipPath", "metadata", "path", "line", "circle", "rect", "ellipse", "polygon", "polyline", "image", "text", "tspan" ]) {
  function use(link, ...contents) {
    const ns = elementns(doc, "http://www.w3.org/2000/svg"), el = ns("use", contents);
    el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", link);
    return el;
  }
  return Object.assign(tags2(element(document), tags), {
    use: use
  });
}

const tags = _.overload(tags0, tags1, tags2, tags3);

const tag = tags();

const option = _.assume(isHTMLDocument, document, _.overload(null, null, function option(document, entry) {
  return element(document, "option", {
    value: _.key(entry)
  }, _.val(entry));
}, function(document, key, value) {
  return element(document, "option", {
    value: key
  }, value);
}));

const toFragment = (_ref4 = _, _$coerce = _ref4.coerce, _DocumentFragment = DocumentFragment, 
function coerce(_argPlaceholder4) {
  return _$coerce.call(_ref4, _argPlaceholder4, _DocumentFragment);
});

(function() {
  function embeddables(self, doc) {
    return [ (doc || document).createTextNode(self) ];
  }
  function toFragment(self, doc) {
    return (doc || document).createRange().createContextualFragment(self);
  }
  _.addMethod(_.coerce, [ String, DocumentFragment ], toFragment);
  _.doto(String, _.implement(IEmbeddable, {
    embeddables: embeddables
  }));
})();

(function() {
  function embeddables(self, doc) {
    return [ (doc || document).createTextNode(self) ];
  }
  _.doto(Number, _.implement(IEmbeddable, {
    embeddables: embeddables
  }));
})();

(function() {
  function embeddables(self, doc) {
    function embed(el) {
      $.each(function(entry) {
        $.assoc(el, _.key(entry), _.val(entry));
      }, self);
    }
    return [ embed ];
  }
  _.doto(Object, _.implement(IEmbeddable, {
    embeddables: embeddables
  }));
})();

(function() {
  function toFragment(self, doc) {
    return (doc || document).createRange().createContextualFragment("");
  }
  _.addMethod(_.coerce, [ _.Nil, DocumentFragment ], toFragment);
  _.doto(_.Nil, _.implement(IEmbeddable, {
    embeddables: _.emptyList
  }));
})();

_.addMethod(_.coerce, [ NodeList, Array ], Array.from);

_.addMethod(_.coerce, [ URLSearchParams, Object ], (_ref5 = _, _$into2 = _ref5.into, 
_param2 = {}, function into(_argPlaceholder5) {
  return _$into2.call(_ref5, _param2, _argPlaceholder5);
}));

_.addMethod(_.coerce, [ Object, URLSearchParams ], function(obj) {
  const params = new URLSearchParams;
  for (const [key, value] of Object.entries(obj)) {
    params.set(key, value);
  }
  return params;
});

function stylesheet2(href, document) {
  if (!sel1$1(`link[href='${href}']`, document)) {
    const stylesheet = element(document, "link", {
      type: "text/css",
      rel: "stylesheet",
      href: href
    });
    $.append(document.body, stylesheet);
  }
}

function stylesheet1(href) {
  stylesheet2(href, document);
}

const stylesheet = _.overload(null, stylesheet1, stylesheet2);

export { IContent, IEmbeddable, IHideable, IHtml, IMountable, ISelectable, IText, IValue, InvalidHostElementError, addClass, addStyle, assert, attr, behave, behaviors, click, contents$2 as contents, depressed, element, elementns, embed, embeddables$1 as embeddables, enable, focus, fragment, hasClass, hash, hidden, hide$1 as hide, hover, html$1 as html, isElement, isHTMLDocument, isMountable, isVisible, markup, matches, mounts, option, prop, ready, remove, removeAttr, removeClass, removeStyle, replaceWith, sel$2 as sel, sel1$1 as sel1, show$1 as show, stylesheet, svg, tag, tags, text$2 as text, toFragment, toggle$1 as toggle, toggleClass, urlSearchParams, value$2 as value, wrap };
