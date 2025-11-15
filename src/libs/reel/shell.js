import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as r from "./core.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";


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
function pacemaker(interval, f = Date.now) {
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

function Timer(interval, f) {
  this.interval = interval;
  this.f = f;
  this.$emitter = $.subject(); // Persistent subject for subscribers
  this.unsub = null; // To hold the pacemaker's unsub function
}

Timer.prototype.start = function() {
  console.log("START TIMER")
  if (this.unsub === null) { // Only start if stopped
    const $p = pacemaker(this.interval, this.f);
    this.unsub = $.sub($p, (tick) => $.pub(this.$emitter, tick));
  }
};

Timer.prototype.stop = function() {
  console.log("STOP TIMER")
  if (this.unsub !== null) { // Only stop if running
    this.unsub();
    this.unsub = null;
  }
};

(function(){
  function sub(self, observer) {
    return $.sub(self.$emitter, observer);
  }
  $.doto(Timer,
    _.implement($.ISubscribe, { sub })
  );
})();

function keeping(keys){
  const keep = _.includes(keys, _);
  return function(state){
    return _.reducekv(function(memo, key, value){
      return keep(key) ? _.assoc(memo, key, value) : memo;
    }, {}, state);
  }
}

export function getfn(name, params, accessToken){
  const apikey = supabase.supabaseKey;
  const headers = {
    apikey,
    authorization: `Bearer ${accessToken ?? apikey}`,
    accept: 'application/json'
  }
  const qs = params ? new URLSearchParams(params).toString() : null;
  return fetch(`${supabase.functionsUrl.href}/${name}?${qs}`, {
    method: 'GET',
    headers
  }).then(resp => resp.json());
}

function getSeated(_table_id){
  const qs = new URLSearchParams({_table_id}).toString();
  return getfn("seated", {_table_id});
}

function getSeats(_table_id, accessToken){ //TODO test w/ and w/o accessToken
  return accessToken ? getfn("seats", {_table_id}, accessToken) : Promise.resolve([]);
}

function getTouches(_table_id, accessToken){
  return getfn('touches', {_table_id}, accessToken);
}

function digest(result){
  const code  = result?.code,
        error = code == null ? null : result,
        data  = code == null ? result : null;
  return {error, data};
}

function getPerspective(table_id, event_id, seat, seat_id, accessToken){
  const perspective = getfn("perspective", _.compact({table_id, event_id, seat}), accessToken).then(digest);
  const last_move = getLastMove(table_id, event_id, seat_id);
  return Promise.all([perspective, last_move]).then(function([{data, error}, last_move]){
    return Object.assign({}, error || data, last_move);
  });
}

function getLastMove(_table_id, _event_id, _seat_id){
  return supabase.rpc('last_move', {
    _table_id,
    _event_id,
    _seat_id
  }).then(function({data}){
    return {last_move: data};
  });
}

function table(tableId){
  const $t = $.atom(null);

  supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .then(_.getIn(_, ["data", 0]))
    .then($.reset($t, _));

  const channel = supabase.channel('db-messages').
    on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tables',
      filter: `id=eq.${tableId}`,
    }, function(payload){
      $.reset($t, payload.new);
    }).
    subscribe();

  return $.pipe($t, _.compact());
}

function undoThru(undoables, touch){
  return _.some(function([key, vals]){
    return _.includes(vals, touch) ? key : null;
  }, undoables);
}

export function reel(tableId, seat){

  const $timeline = $.atom(r.init(tableId, seat));

  const $table = table(tableId);

  //const $table = $.pipe($.map(keeping(["up","release","game_id","last_touch_id","remarks","scored","status"]), $tbl), _.compact());

  const $make = $.atom(null);

  const $ready = $.atom(true);

  const $act = $.map(function(timeline, table, ready){
    if (!table || !ready) {
      return false;
    }
    const {seat, seated, cursor, touches, perspectives} = timeline;
    const {at, pos, max} = cursor;
    const {status} = table;
    const started = status === "started";
    const present = pos !== null && pos === max;
    const perspective = _.maybe(at, _.get(perspectives, _));
    if (!perspective) {
      return false;
    }
    const {actionable} = perspective;
    return present && actionable && ready && started;
  }, $timeline, $table, $ready);

  const $up = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table);

  //seated is everyone's info.
  const $seated = $.fromPromise(getSeated(tableId));

  //seats answers which seats are yours? (1 seat per player, except at dummy tables)
  const $seats = $.fromPromise(getSeats(tableId, session?.accessToken));

  const $undoable = $.map(function({undoables, cursor}){
    const {at} = cursor;
    return _.maybe(at, at => undoThru(undoables, at));
  }, $timeline);

  const $state = $.pipe($.map(function(table, seated, seats, up, undoable, make, ready, act, timeline){
    return {...timeline, table, seated, seats, up, undoable, make, ready, act};
  }, $table, $seated, $seats, $up, $undoable, $.pipe($make, _.compact()), $ready, $act, $timeline), _.filter(_.and(_.get(_, "make"), _.get(_, "table"))));

  const $timer = new Timer(1000, Date.now);

  $.sub($timer, function(){
    const {cursor} = _.deref($timeline);
    if (cursor.pos === null) {
      return;
    }
    if (cursor.pos === cursor.max) {
      $timer.stop();
    } else {
      $.swap($timeline, r.forward);
    }
  });

  $.sub($table, _.once(function(table){
    supabase
      .from('games')
      .select('slug')
      .eq('id', table.game_id)
      .then(_.getIn(_, ["data", 0]))
      .then(function({slug}){
        const url = `../../games/${slug}/table/${table.release}/core.js`;
        _.fmap(import(url), ({make}) => $.reset($make, make));
      })
  }));

  $.sub($table, function(table){
    const {cursor} = _.deref($timeline);
    const {pos, max} = cursor || {};
    if (pos === max) {
      //if the user was in the current present the moment the table was touched, catch him up with what happened.
      $timer.start();
    }
    _.fmap(getTouches(table.id, session?.accessToken),
      _.pipe(r.addTouches, $.swap($timeline, _)));
  });

  //perspective caching; includes anticipated next step
  $.sub($state, function(state){
    const {table, make, seat, seated, cursor, touches, perspectives} = state;
    const {pos, at, direction, max} = cursor;
    const nextAt = _.maybe(pos + direction, _.clamp(_, 0, max), _.get(touches, _));
    const player = seat;
    const ats = _.chain([at, nextAt], _.compact, _.remove(_.get(perspectives, _), _), _.toArray);
    if (table && _.seq(ats) && make && _.seq(seated) && seat != null) {
      const seatId = _.getIn(seated, [seat, "seat_id"]);
      $.each(function(at){
        _.fmap(getPerspective(table.id, at, seat, seatId, session?.accessToken), function(perspective){
          const {up, may, event, state} = perspective;
          const {seat} = event;
          const actionable = _.includes(up, player) || _.includes(may, player);
          const game = make(seated, table.config, [event], state);
          const actor = _.get(seated, seat);
          $.swap($timeline, r.addPerspective(at, _.assoc(perspective, "actionable", actionable, "game", game, "actor", actor)));
        });
      }, ats);
    }
  });

  return new Reel($timeline, $table, $make, $ready, $act, $up, $seated, $seats, $undoable, $state, $timer);
}

function Reel($timeline, $table, $make, $ready, $act, $up, $seated, $seats, $undoable, $state, $timer){
  this.$timeline = $timeline;
  this.$table = $table;
  this.$make = $make;
  this.$ready = $ready;
  this.$act = $act;
  this.$up = $up;
  this.$seated = $seated;
  this.$seats = $seats;
  this.$undoable = $undoable;
  this.$state = $state;
  this.$timer = $timer;
}

function chan(self, key){
  return self[`$${key}`];
}

function on(self, key, callback){
  return $.sub($.chan(self, key), callback);
}

function dispatch(self, command){
  const {type, details} = command;

  //whenever the user acts, the timer stops
  self.$timer.stop();

  switch (type) {
    case "backward":
      $.swap(self.$timeline, r.backward);
      break;

    case "forward":
      $.swap(self.$timeline, r.forward);
      break;

    case "inception":
      $.swap(self.$timeline, r.inception);
      break;

    case "present":
      $.swap(self.$timeline, r.present);
      break;

    case "last-move":
      $.swap(self.$timeline, r.toLastMove);
      break;

    case "ffwd":
      self.$timer.start();
      break;

    default:
      break;
  }
}

function sub(self, callback){
  return $.sub(self.$state, callback);
}

function deref(self){
  return _.deref(self.$state);
}

$.doto(Reel,
  _.implement($.IEvented, {on, chan}),
  _.implement($.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));

