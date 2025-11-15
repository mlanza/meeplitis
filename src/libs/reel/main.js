import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as r from "./core.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";
import { keypress } from "https://deno.land/x/cliffy@v0.25.4/keypress/mod.ts";

const [tableId, seat] = Deno.args.length ? Deno.args : ["QDaitfgARpk", 0];

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

const $state = $.atom(r.init(tableId, seat));

const $table = table(tableId);

$.sub($table, _.once(function(table){
  supabase
    .from('games')
    .select('slug')
    .eq('id', table.game_id)
    .then(_.getIn(_, ["data", 0]))
    .then(function({slug}){
      const url = `../../games/${slug}/table/${table.release}/core.js`;
      _.fmap(import(url), function({make}){
        $.swap($state, _.assoc(_, "make", make));
      });
    })
}));

$.sub($table, function(table){
  _.fmap(getTouches(table.id, session?.accessToken), function(touches){
    $.swap($state,
      _.pipe(
        r.table(table),
        r.addTouches(touches)));
  });
});

_.fmap(Promise.all([getSeated(tableId), getSeats(tableId, session?.accessToken)]), function([seated, seats]){
  $.swap($state, r.addSeating(seated, seats));
});

$.sub($state, function(state){
  const {table, make, seat, seated, cursor, touches, perspectives} = state;
  const {at} = cursor;
  if (table && at && make && _.seq(seated) && !_.get(perspectives, at)) {
    const seatId = _.getIn(seated, [seat, "seat_id"]);
    _.fmap(getPerspective(table.id, at, seat, seatId, session?.accessToken), function(perspective){
      const {up, may, event, state} = perspective;
      const {seat} = event;
      const actionable = _.includes(up, state.seat) || _.includes(may, state.seat);
      const game = make(seated, table.config, [event], state);
      const actor = _.get(seated, seat);
      $.swap($state, r.addPerspective(at, _.assoc(perspective, "actionable", actionable, "game", game, "actor", actor)));
    });
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

$.sub($state, console.log);

async function interactiveMode() {
  for await (const event of keypress()) {
    if (event.key === "q" || event.key === "escape") {
      Deno.exit();
    } else if (event.key === "right") {
      $.swap($state, r.forward);
    } else if (event.key === "left") {
      $.swap($state, r.backward);
    } else if (event.key === "i") {
      $.swap($state, r.inception);
    } else if (event.key === "p") {
      $.swap($state, r.present);
    } else if (event.key === "l") {
      //dispatch("last-move");
    } else if (event.key === "a") {
      //const at = await Input.prompt("Go to event id:");
      //dispatch("at", at);
    } else if (event.key === "p") {
      //const pos = await Input.prompt("Go to position:");
      // Note: to_pos is not fully supported by the new proactive navigation
      // This is a simplification for now.
      //const $state = registry.$state;
      //const { w } = registry;
      //$.swap($state, w.to_pos, parseInt(pos));
    } else if (event.key === "tab") {
      //fullView = !fullView;
      //logCurrentState(); // Re-log with new view setting
    }
  }
}

await interactiveMode();
