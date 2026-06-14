import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";

/**
 * Creates a new signal that "ticks" at a specified interval.
 * This signal is a high-resolution timer that attempts to correct for drift,
 * making it more accurate than `setInterval` for long-running processes.
 *
 * The signal is an observable that starts ticking upon subscription and stops
 * when unsubscribed.
 *
 * @param {number} interval - The ticking interval in milliseconds.
 * @param {function} [f=Date.now] - A function to generate the value for each tick. It receives an object with details about the tick (frame, offage, target).
 * @returns {Observable} An observable that emits values at the specified interval.
 */
function ticker(interval, f = Date.now) {
  return $.observable(function(observer) {
    const self = {
      seed: performance.now(),
      target: 0,
      frame: 0,
      stopped: false,
      offage: 0
    };
    self.target = self.seed;

    function callback() {
      if (self.stopped) {
        return;
      }
      self.offage = performance.now() - self.target;
      if (self.offage >= 0) {
        $.pub(observer, f(self));
        self.frame += 1;
        self.target = self.seed + self.frame * interval;
      }
      const delay = Math.abs(Math.round(Math.min(0, self.offage)));
      if (!self.stopped) {
        setTimeout(callback, delay);
      }
    }

    setTimeout(callback, 0);

    return function() {
      self.stopped = true;
      $.complete(observer);
    };
  });
}

export function Timer(interval, f) {
  this.interval = interval;
  this.f = f;
  this.$state = $.atom({ticks: 0, starts: 0, stops: 0, status: "stopped"});
  this.unsub = null; // To hold the ticker's unsub function
}

Timer.prototype.start = function() {
  if (this.unsub === null) { // Only start if stopped
    const $state = this.$state;
    const $ticker = ticker(this.interval, this.f);
    this.unsub = $.sub($ticker, () => $.swap($state, _.update(_, "ticks", _.inc)));
    $.swap(this.$state, _.pipe(_.assoc(_, "status", "started"), _.update(_, "starts", _.inc)));
  }
};

Timer.prototype.stop = function() {
  if (this.unsub !== null) { // Only stop if running
    this.unsub();
    this.unsub = null;
    $.swap(this.$state, _.pipe(_.assoc(_, "status", "stopped"), _.update(_, "stops", _.inc)));
  }
};

function deref(self){
  return _.deref(self.$state);
}

function sub(self, observer) {
  return $.sub(self.$state, observer);
}

$.doto(Timer,
  _.implement(_.IDeref, { deref }),
  _.implement($.ISubscribe, { sub }));

export function timer(interval, f = Date.now){
  return new Timer(interval, f);
}
