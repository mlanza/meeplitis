import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import supabase from "./supabase.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";
import { Input } from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";

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
  if (this.unsub === null) { // Only start if stopped
    const $p = pacemaker(this.interval, this.f);
    this.unsub = $.sub($p, (tick) => $.pub(this.$emitter, tick));
  }
};

Timer.prototype.stop = function() {
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


function log(obj){
  $.log(Deno.inspect(obj, { colors: true, compact: true, depth: Infinity, iterableLimit: Infinity }));
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

function Reel({$state, $table, $up, $seated, $seats, $seat, $perspectives, $pos, $at, $max, $ready, $error, $timer}, accessToken){
  this.$state = $state;
  this.$table = $table;
  this.$up = $up;
  this.$seated = $seated;
  this.$seats = $seats;
  this.$seat = $seat;
  this.$perspectives = $perspectives;
  this.$pos = $pos;
  this.$at = $at;
  this.$max = $max;
  this.$ready = $ready;
  this.$error = $error;
  this.$timer = $timer;
  this.accessToken = accessToken;
}

function deref(self){
  return _.deref(self.$state);
}

function sub(self, obs){
  return $.ISubscribe.sub(self.$state, obs);
}

async function issueMove(self, cmd){
  try {
    if (_.deref(self.$seat) == null) {
      throw new Error("Spectators are not permitted to issue moves");
    }
    $.reset(self.$ready, false);
    const table_id = _.chain(self.$table, _.deref, _.getIn(_, ["table", "id"]));
    const seat = _.chain(self.$seat, _.deref);
    const commands = [cmd];
    const moved = await move(table_id, seat, commands, self.accessToken);
    log({moved});
  } catch (ex) {
    $.reset(self.$error, ex);
  } finally {
    $.reset(self.$ready, true);
  }
}

function toMoment(self, at) {
  if (_.isNumber(at)) {
    $.reset(self.$pos, at);
  } else {
    _.chain(self.$touches, _.deref, _.get(_, "touches"), _.indexOf(_, at), $.reset(self.$pos, _));
  }
}

function dispatch(self, cmd){
  try {
    //whenever the user does something, the timer aborts
    self.$timer.stop();
    switch (cmd.type) {
      case "at":
        const {details} = cmd;
        const {at} = details;
        toMoment(self, at);
        break;

      case "ffwd":
        self.$timer.start();
        break;

      case "inception":
        $.reset(self.$pos, 0);
        break;

      case "back":
        _.chain(self.$at, _.deref, _.dec, $.reset(self.$pos, _));
        break;

      case "forward":
        _.chain(self.$at, _.deref, _.inc, $.reset(self.$pos, _));
        break;

      case "present":
        _.chain(self.$max, _.deref, $.reset(self.$pos, _));
        break;

      case "last-move":
        _.chain(self.$state, _.deref, getLastMoveAt, $.reset(self.$pos, _));
        break;

      case "move":
        issueMove(self, cmd);
        break;

      default:
        throw cmd;
    }
  } catch (ex) {
    log({ex});
  }
}

$.doto(Reel,
  _.implement($.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));

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

function seated(tableId){
  const $seated = $.atom(null);
  _.fmap(getSeated(tableId),
    check("seated"),
    $.reset($seated, _));
  return $seated;
}

function check(op){
  return $.tee(function(error){
    if (error?.code) {
      throw {error, op: "seats"};
    }
  });
}

function seats(tableId, accessToken){
  const $seats = $.atom(null);
  _.fmap(getSeats(tableId, accessToken),
    check("seats"),
    $.reset($seats, _));
  return $seats;
}

function includes($state, key){
  return function(value){
    $.swap($state, _.assoc(_, key, value));
  }
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

function getTouches(_table_id, accessToken){
  return getfn('touches', {_table_id}, accessToken);
}

function getLastMoveAt(state){
  const {perspectives, at, touches} = state;
  const touch = _.get(touches, at);
  const perspective = _.get(perspectives, touch);
  const lastMove = _.get(perspective, "last_move");
  const idx = _.indexOf(touches, lastMove);
  return idx === -1 ? at : idx;
}

function move(table_id, seat, commands, accessToken){
  const body = {table_id, seat, commands};
  return supabase.functions.invoke("move", {body}).then(_.get(_, "data"));
}

function reel(tableId, {event = null, seat = null, accessToken = null} = {}){
  const $state = $({});
  const $ready = $(true);
  const $error = $(null);
  const $tableId = $.fixed(tableId);
  const $accessToken = $.fixed(accessToken);
  const $seat = $.fixed(seat);
  const $table = table(tableId);
  const $seated = seated(tableId);
  const $seats = seats(tableId, accessToken);
  const $touches = $(null);
  const $pos = $(null);
  const $min = $.fixed(0);
  const $max = $.pipe($(function(touches){
    return _.maybe(touches?.touches, _.count, _.dec);
  }, $touches), _.filter(_.isSome));
  const $at = $.pipe($(function(pos, min, max){
    const at = _.maybe(pos, _.clamp(_, min, max));
    return at == null ? max : at;
  }, $pos, $min, $max), _.filter(_.isSome));
  const $perspectives = $({});
  const $seatId = $(function(seated, seat){
    return _.getIn(seated, [seat, "seat_id"]);
  }, $seated, $seat);
  const $up = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table);
  const $present = $.map(_.eq, $at, $max);
  const $timer = new Timer(1000, Date.now);

  $.sub($timer, function(){
    if (_.deref($present)) {
      $timer.stop();
    } else {
      _.chain($at, _.deref, _.inc, $.reset($pos, _));
    }
  });

  $.sub($table, includes($state, "table"));
  $.sub($error, includes($state, "error"));
  $.sub($ready, includes($state, "ready"));
  $.sub($seated, includes($state, "seated"));
  $.sub($seats, includes($state, "seats"));
  $.sub($seat, includes($state, "seat"));
  $.sub($pos, includes($state, "pos"));
  $.sub($max, includes($state, "max"));
  $.sub($at, includes($state, "at"));
  $.sub($up, includes($state, "up"));
  $.sub($present, includes($state, "present"));
  $.sub($perspectives, includes($state, "perspectives"));

  const $touch = $.pipe($.map(function(touches, at, perspectives){
    const touch = _.getIn(touches, ["touches", at]);
    const found = !!_.get(perspectives, touch);
    return found ? null : touch;
  }, $touches, $at, $perspectives), _.filter(_.isSome));
  const $view = $.pipe($.map(_.array, $tableId, $touch, $seat, $seatId, $accessToken), _.filter(function(what){
    const [tableId, touch, seat, seatId, accessToken] = what || [];
    return touch
  }));
  $.sub($touches, function(touches){
    $.swap($state, _.merge(touches, _));
  });
  $.sub($table, async function({last_touch_id}){
    const present = _.deref($present);
    $.reset($touches, await getTouches(tableId, accessToken));
    if (present) {
      //if the user was in the current present the moment the table was touched, catch him up with what happened.
      $timer.start();
    }
  });
  $.sub($view, async function(args){
    const [tableId, eventId] = args;
    const perspective = await getPerspective(...args);
    $.swap($perspectives, _.assoc(_, eventId, perspective));
  });
  return new Reel({$state, $table, $up, $seated, $seats, $seat, $perspectives, $pos, $at, $max, $ready, $error, $timer}, accessToken);
}

await new Command()
  .name("reel")
  .description("Reel")
  .arguments("<table:string>")
  .option("--event <event:string>", "Event ID")
  .option("--seat <seat:number>", "Seat number (integer)")
  .option("-i, --interactive", "Keep the program open for further input.")
  .action(function (opts, table){
    const event = opts.event || null;
    const seat = _.maybe(opts.seat, parseInt);
    const interactive = !!opts.interactive;
    const accessToken =  Deno.env.get("SUPABASE_TEMP_ACCESS_TOKEN") || null;
    const $reel = reel(table, {event, seat, accessToken});

    $.sub($reel, function({table, min, max, at}){
      $.log(`\x1b]0;Table ${table?.id}: ${at + 1} of ${max + 1} \x07`);
    });
    $.sub($reel, $.see("reel"));

    if (interactive) {
      command($.dispatch($reel, _));
    }
  })
  .parse(Deno.args);

async function command(run){
  for await (const event of keypress()) {
    try {
      switch (event.key) {
        case "left":
          run({type: event.shiftKey ? "inception" : "back"});
          break;

        case "right":
          run({type: event.shiftKey ? "present" : "forward"});
          break;

        case "l":
          run({type: "last-move"});
          break;

        case "m":
          const json = await Input.prompt("What move?");
          run({type: "move", details: {move: JSON.parse(json)}});
          break;

        case "f":
          run({type: "ffwd"});
          break;

        case "q":
          Deno.exit();

        default:
          break;
      }
    } catch (ex) {
      $.error(ex);
    }
  }
}
