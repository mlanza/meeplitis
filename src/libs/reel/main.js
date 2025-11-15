import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as r from "./core.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";

const [tableId, seat] = Deno.args.length ? [Deno.args[0], parseInt(Deno.args[1])] : ["QDaitfgARpk", 0];

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

function getLastMoveAt(state){
  const {perspectives, at, touches} = state;
  const touch = _.get(touches, at);
  const perspective = _.get(perspectives, touch);
  const lastMove = _.get(perspective, "last_move");
  const idx = _.indexOf(touches, lastMove);
  return idx === -1 ? at : idx;
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

const $timeline = $.atom(r.init(tableId, seat));

const $table = table(tableId);

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

//seated is everyone's info.
const $seated = $.fromPromise(getSeated(tableId));

//seats answers which seats are yours? (1 seat per player, except at dummy tables)
const $seats = $.fromPromise(getSeats(tableId, session?.accessToken));

const $state = $.pipe($.map(function(table, seated, seats, make, ready, act, timeline){
  return {...timeline, table, seated, seats, make, ready, act};
}, $table, $seated, $seats, $.pipe($make, _.compact()), $ready, $act, $timeline), _.filter(_.and(_.get(_, "make"), _.get(_, "table"))));

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
  _.fmap(getTouches(table.id, session?.accessToken),
    _.pipe(r.addTouches, $.swap($timeline, _)));
});

//perspective caching
$.sub($state, function(state){
  const {table, make, seat, seated, cursor, touches, perspectives} = state;
  const {at, direction, max} = cursor;
  const nextAt = _.maybe(pos + direction, _.clamp(_, 0, max), _.get(touches, _));
  const player = seat;
  const ats = _.chain([at, nextAt], _.compact, _.remove(_.get(perspectives, _), _), _.toArray);
  console.log({ats});
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

function elideWith(keys, f){
  const elide = _.includes(keys, _);
  return function(state){
    return _.reducekv(function(memo, key, value){
      return _.assoc(memo, key, elide(key) ? f(value, key) : value);
    }, {}, state);
  }
}

function keeping(keys){
  const keep = _.includes(keys, _);
  return function(state){
    return _.reducekv(function(memo, key, value){
      return keep(key) ? _.assoc(memo, key, value) : memo;
    }, {}, state);
  }
}

const abbr = _.pipe(
  elideWith(["touches","perspectives","seated"], (value) => `<${_.count(value)} entries>`),
  elideWith(["table"], keeping(["up","release","last_touch_id"])));

const log = _.comp(console.log, abbr);

$.sub($state, log);

async function interactiveMode() {
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      Deno.exit();
    } else if (event.key === "right") {
      $.swap($timeline, r.forward);
    } else if (event.key === "left") {
      $.swap($timeline, r.backward);
    } else if (event.key === "i") {
      $.swap($timeline, r.inception);
    } else if (event.key === "p") {
      $.swap($timeline, r.present);
    }
  }
}

await interactiveMode();
