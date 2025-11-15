import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as r from "./core.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";

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

const $state = $.atom(r.init("QDaitfgARpk", 0));

$.sub($state, function({table, seat, seated, cursor, touches, perspectives}){
  const {at} = cursor;
  if (at && !_.get(perspectives, at)) {
    const seatId = _.getIn(seated, [seat, "seat_id"]);
    _.fmap(getPerspective(table.id, at, seat, seatId, session?.accessToken), function(perspective){
      $.swap($state, r.addPerspective(at, perspective));
    });
  }
})

const initialized = $.sub($state, _.once(function({id}){
  //initial configurations
  const $table = table(id);
  $.sub($table, function(table){
    _.fmap(getTouches(table.id, session?.accessToken), function(touches){
      $.swap($state,
        _.pipe(
          _.assoc(_, "table", table),
          r.addTouches(touches)));
    });
  });
  //one-time data
  _.fmap(Promise.all([getSeated(id), getSeats(id, session?.accessToken)]), function([seated, seats]){
    $.swap($state, _.assoc(_, "seated", seated, "seats", seats));;
  });
  setTimeout(() => initialized(), 200);
}));

$.sub($state, console.log);
