import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";
import supabase from "./supabase.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

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

function Reel($state, $table, $seated, $seats, $seat, $pos, $at, $max, accessToken){
  this.$state = $state;
  this.$table = $table;
  this.$seated = $seated;
  this.$seats = $seats;
  this.$seat = $seat;
  this.$pos = $pos;
  this.$at = $at;
  this.$max = $max;
  this.accessToken = accessToken;
}

function deref(self){
  return _.deref(self.$state);
}

function sub(self, obs){
  return $.ISubscribe.sub(self.$state, obs);
}

function dispatch(self, cmd){
  try {
    switch (cmd.type) {
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
  _.fmap(getSeated(tableId), $.reset($seated, _));
  return $seated;
}

function seats(tableId, accessToken){
  const $seats = $.atom(null);
  _.fmap(getSeats(tableId, accessToken), $.reset($seats, _));
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

function reel(tableId, {event = null, seat = null, accessToken = null} = {}){
  const $state = $({});
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
  $.sub($table, includes($state, "table"));
  $.sub($seated, includes($state, "seated"));
  $.sub($seats, includes($state, "seats"));
  $.sub($seat, includes($state, "seat"));
  $.sub($pos, includes($state, "pos"));
  $.sub($max, includes($state, "max"));
  $.sub($at, includes($state, "at"));
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
  $.sub($table, async function(){
    $.reset($touches, await getTouches(tableId, accessToken));
  });
  $.sub($view, async function(args){
    const [tableId, eventId] = args;
    const perspective = await getPerspective(...args);
    $.swap($perspectives, _.assoc(_, eventId, perspective));
  });
  return new Reel($state, $table, $seated, $seats, $seat, $pos, $at, $max, accessToken);
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
    const r = reel(table, {event, seat, accessToken});

    $.sub(r, $.see("reel"));

    if (interactive) {
      command($.dispatch(r, _));
      console.log("HERE")
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
