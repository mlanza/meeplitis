import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import flick from "./flick.js";

// The Flicker object constructor
function Flicker(initialState) {
  this.$state = $.atom(initialState);
}

// --- Protocol Implementations ---

// ISubscribe: Allows `$.sub(flicker, ...)`
function sub(self, observer) {
  return $.sub(self.$state, observer);
}

// IDeref: Allows `_.deref(flicker)`
function deref(self) {
  return _.deref(self.$state);
}

// IDispatch: Allows `$.dispatch(flicker, ...)`
function dispatch(self, msg) {
  // Use swap to apply the pure reducer to the state atom
  $.swap(self.$state, flick.reducer, msg);
}

// Apply the protocols to the Flicker prototype
$.doto(Flicker,
  _.implement($.ISubscribe, { sub }),
  _.implement(_.IDeref, { deref }),
  _.implement($.IDispatch, { dispatch })
);

// Factory function to create a new Flicker instance
export function flicker(initialState) {
  return new Flicker(initialState);
}
