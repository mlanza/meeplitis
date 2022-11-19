import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import supabase from "/lib/supabase.js";

function json(resp){
  return resp.json();
}

export function getTouches(tableId){
  return _.fmap(fetch(`https://touches.workers.yourmove.cc?table_id=${tableId}`), json);
}

export function getSeated(tableId){
  return _.fmap(fetch(`https://seated.workers.yourmove.cc?table_id=${tableId}`), json);
}

export function getSeat(tableId, session){
  return session ? _.fmap(fetch(`https://seat.workers.yourmove.cc?table_id=${tableId}`, {
    headers: {
      accessToken: session.accessToken
    }
  }), json) : Promise.resolve(null);
}

export function getPerspective(tableId, session, eventId, seat){
  const qs = _.chain([
    `table_id=${tableId}`,
    eventId != null ? `event_id=${eventId}` : null,
    seat != null ? `seat=${seat}` : null
  ], _.compact, _.join("&", _));
  return _.fmap(fetch(`https://perspective.workers.yourmove.cc?${qs}`, session ? {
    headers: {
      accessToken: session.accessToken
    }
  } : {}), json);
}

export function move(_table_id, _seat, _commands, session){
  return _.fmap(fetch("https://move.workers.yourmove.cc", {
    method: "POST",
    body: JSON.stringify({_table_id, _seat, _commands}),
    headers: {
      accessToken: session.accessToken
    }
  }), json);
}

export function table(tableId){
  const $table = $.cell(null);
  supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .then(_.getIn(_, ["data", 0]))
    .then(_.reset($table, _));

  const channel = supabase.channel('db-messages').
    on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tables',
      filter: `id=eq.${tableId}`,
    }, function(payload){
      _.reset($table, payload.new);
    }).
    subscribe();

  return $.pipe($table, t.compact());
}
