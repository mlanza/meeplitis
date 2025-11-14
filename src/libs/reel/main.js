import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import * as w from "./core.js";
import { reg } from "../cmd.js";
import { registry } from "../cmd.js";
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

function getSeated(_table_id){
  const qs = new URLSearchParams({_table_id}).toString();
  return getfn("seated", {_table_id});
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

  // When the timeline is loaded, fetch the initial perspective
  const sub = $.sub($.pipe($.map(_.get(_, "timeline"), $state), _.distinct()), function(timeline) {
    if (!timeline) return;
    sub(); // Run this subscription only once

    const state = _.deref($state);
    const at = state.cursor.at;

    if (at && !_.get(state.perspectives, at)) {
      $.swap($state, _.assoc(_, "ready", false));
      getPerspective(state.id, at, state.seat, null, accessToken).then(function(perspective) {
        $.swap($state, w.loadPerspective, at, perspective);
        $.swap($state, _.assoc(_, "ready", true));
      });
    }
  });

  // Perform the initial side-effect of fetching the timeline
  getTouches(id, accessToken).then(function(timeline) {
    $.swap($state, w.loadTimeline, timeline);
  });


  // Pre-caching subscription
  $.sub($.pipe($.map(_.get(_, "cursor"), $state), _.distinct()), function(cursor) {
    if (!cursor || cursor.pos == null) return;

    const state = _.deref($state);
    const nextPos = cursor.pos + cursor.direction;

    if (nextPos >= 0 && nextPos <= cursor.max) {
      const nextAt = _.nth(state.timeline.touches, nextPos);
      if (nextAt && !_.get(state.perspectives, nextAt)) {
        getPerspective(state.id, nextAt, state.seat, null, Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN") || null)
          .then(function(perspective) {
            $.swap($state, w.loadPerspective, nextAt, perspective);
          });
      }
    }
  });

  reg({ $state, w });
  return $state;
}

function navigateTo(targetPos) {
  const $state = registry.$state;
  const state = _.deref($state);
  const { w } = registry;

  if (targetPos == null || targetPos < 0 || targetPos > state.cursor.max) {
    return;
  }

  if (w.isPosValid(state, targetPos)) {
    $.swap($state, w.to_pos, targetPos);
  } else {
    const at = _.nth(state.timeline.touches, targetPos);
    if (!at) return;

    $.swap($state, _.assoc(_, "ready", false));
    getPerspective(state.id, at, state.seat, null, Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN") || null)
      .then(function(perspective) {
        $.swap($state, w.loadPerspective, at, perspective);
        $.swap($state, w.to_pos, targetPos);
        $.swap($state, _.assoc(_, "ready", true));
      });
  }
}

export function dispatch(command, arg) {
  const $state = registry.$state;
  const state = _.deref($state);
  const { w } = registry;

  if (command === "last-move") {
    const perspective = state.perspectives[state.cursor.at];
    if (!perspective || !perspective.last_move) return;
    const targetPos = _.indexOf(state.timeline.touches, perspective.last_move);
    navigateTo(targetPos);
    return;
  }

  let targetPos;
  if (command === "at") {
    targetPos = _.indexOf(state.timeline.touches, arg);
    // The 'at' command also sets direction, so we handle it separately for now
    if (targetPos == null || targetPos < 0) return;
    if (w.isPosValid(state, targetPos)) {
      $.swap($state, w.at, targetPos);
    } else {
      const at = _.nth(state.timeline.touches, targetPos);
      if (!at) return;

      $.swap($state, _.assoc(_, "ready", false));
      getPerspective(state.id, at, state.seat, null, Deno.env.get("SUPABASE_SESSION_ACCESS_TOKEN") || null)
        .then(function(perspective) {
          $.swap($state, w.loadPerspective, at, perspective);
          $.swap($state, w.at, targetPos);
          $.swap($state, _.assoc(_, "ready", true));
        });
    }
  } else {
    const commandMap = {
      "forward": () => state.cursor.pos + 1,
      "backward": () => state.cursor.pos - 1,
      "inception": () => 0,
      "present": () => state.cursor.max
    };
    targetPos = commandMap[command] ? commandMap[command]() : null;
    navigateTo(targetPos);
  }
}
