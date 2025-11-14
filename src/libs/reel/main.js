import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as w from "./core.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";

// Copied from original reel.js
function digest(result){
  const code  = result?.code,
        error = code == null ? null : result,
        data  = code == null ? result : null;
  return {error, data};
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

function getTouches(_table_id, accessToken){
  return getfn('touches', {_table_id}, accessToken);
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

function getPerspective(table_id, event_id, seat, seat_id, accessToken){
  const perspective = getfn("perspective", _.compact({table_id, event_id, seat}), accessToken).then(digest);
  const last_move = getLastMove(table_id, event_id, seat_id);
  return Promise.all([perspective, last_move]).then(function([{data, error}, last_move]){
    return Object.assign({}, error || data, last_move);
  });
}


export function bootstrap(id, seat, accessToken) {
  const $state = $.atom(w.init(id, seat));

  // Perform the initial side-effect of fetching the timeline
  getTouches(id, accessToken).then(function(timeline) {
    $.swap($state, w.loadTimeline, timeline);
  });

  // When the position changes, fetch the new perspective
  $.sub($.pipe($.map(_.get(_, "at"), $state), _.distinct()), function(at) {
    const state = _.deref($state);
    if (at && !_.get(state.perspectives, at)) {
      // Set ready to false before fetching
      $.swap($state, _.assoc(_, "ready", false));
      getPerspective(state.id, at, state.seat, null, accessToken).then(function(perspective) {
        $.swap($state, w.loadPerspective, perspective);
        // Set ready to true after loading
        $.swap($state, _.assoc(_, "ready", true));
      });
    }
  });

  reg({ $state, w });
  return $state;
}
