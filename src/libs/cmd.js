import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import imm from "./atomic_/immutables.js";

export const registry = {};
const params = new URLSearchParams(globalThis.location ? location.search : "");
const monitor = _.maybe(params.get("monitor"), _.split(_, ","));
const nomonitor = _.maybe(params.get("nomonitor"), _.split(_, ","));

const monitors = monitor ? function(key){
  return monitor.includes("*") || monitor.includes(key);
} : nomonitor ? function(key){
  return !nomonitor.includes(key);
} : _.noop;

function monitoring(symbol, object, log = $.log){
  if (monitors(symbol) && _.satisfies($.ISubscribe, object)) {
    $.sub(object, _.partial(log, symbol));
  }
}

function register(symbols){
  Object.assign(registry, symbols);
}

function registerWithMonitoring(symbols, log = $.log){
  register(symbols);
  for(const [symbol, object] of Object.entries(symbols)){
    monitoring(symbol, object, log);
  }
}

export const reg = monitors === _.noop ? register : registerWithMonitoring;

function cmd1(target = globalThis){
  Object.assign(target, registry);
  $.log("Loaded", registry);
}

async function cmd4(symbol, path, target = globalThis, log = $.log){
  const obj = await import(path);
  target[symbol] = Object.keys(obj).length == 1 && obj.default != null ? obj.default : obj;
  log(`Loaded: ${symbol}`, obj);
}

export const cmd = _.overload(cmd1, cmd1, cmd4, cmd4, cmd4);

export default cmd;

const dom = globalThis.document ? (await import("./atomic_/dom.js")).default : null;

_.chain({_, $, imm, dom}, _.compact, reg);

Object.assign(globalThis, {cmd});
