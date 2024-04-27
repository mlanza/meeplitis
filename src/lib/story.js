import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";
import {session} from "/lib/session.js";

function json(resp){
  return resp.json();
}

function getTouches(tableId){
  return _.fmap(fetch(`https://touches.workers.meeplitis.com?table_id=${tableId}`), json);
}

export function getConfig(tableId){
  return supabase
    .from('tables')
    .select('config')
    .eq('id', tableId)
    .then(function({data}){
      return data[0].config;
    });
}

export function getSeated(tableId){
  return _.fmap(fetch(`https://seated.workers.meeplitis.com?table_id=${tableId}`), json);
}

export function getSeat(tableId, session){
  return session ? _.fmap(fetch(`https://seat.workers.meeplitis.com?table_id=${tableId}`, {
    headers: {
      accessToken: session.accessToken
    }
  }), json) : Promise.resolve(null);
}

function digest(result){
  const code  = result?.code,
        error = code == null ? null : result,
        data  = code == null ? result : null;
  return {error, data};
}

function getPerspective(tableId, session, eventId, seat, seatId){
  const qs = _.chain([
    `table_id=${tableId}`,
    eventId != null ? `event_id=${eventId}` : null,
    seat != null ? `seat=${seat}` : null
  ], _.compact, _.join("&", _));
  const perspective = _.fmap(fetch(`https://perspective.workers.meeplitis.com?${qs}`, session ? {
    headers: {
      accessToken: session.accessToken
    }
  } : {}), json, digest);
  const last_move = getLastMove(tableId, eventId, seatId);
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

function move(_table_id, _seat, _commands, session){
  return fetch("https://move.workers.meeplitis.com", {
    method: "POST",
    body: JSON.stringify({_table_id, _seat, _commands}),
    headers: {
      accessToken: session.accessToken
    }
  }).then(json).then(digest);
}

export function Story(session, tableId, seat, seated, config, log, $ready, fail, make, $state, $story){
  Object.assign(this, {session, tableId, seat, seated, config, log, $ready, fail, make, $state, $story});
}

function stepping(self, cstory, pstory){
  const motion = cstory && pstory;
  const at = cstory?.at;
  const head  = cstory ? _.count(cstory.touches) - 1 : null;
  const present = at && at === head;
  const curr  = cstory ? _.nth(cstory.history, cstory.at) : null,
        prior = pstory ? _.nth(pstory.history, pstory.at) : null;
  const touch = cstory ? _.nth(cstory.touches, cstory.at) : null;
  const undoable = _.includes(cstory?.undoables, touch);
  const step = motion ? cstory.at - pstory.at : null;
  const offset = cstory ? at - head : null;
  const game = _.maybe(curr, _.partial(moment2, self));
  return [curr, prior, {step, at, head, present, offset, touch, undoable}, game];
}

export function wip(self, f = _.noop){ //work in progress
  const $data  = $.cell({}),
        $head  = $.pipe(self, _.map(_.comp(_.last, _.get(_, "touches"))), _.filter(_.isSome)),
        $at    = $.pipe(self, _.map(function({at, touches}){
          return _.get(touches, at);
        }), _.filter(_.isSome)),
        $snapshot = $.pipe(self, _.filter(_.isSome), _.map(function({at, history}){
          return moment(self, _.get(history, at));
        })),
        $ctx   = $.map(function(data, head, at){
          return head == at ? _.get(data, at, {}) : null;
        }, $data, $head, $at),
        $wip   = $.hist($ctx);

  function dispatch(self, command){
    _.swap($data, _.assoc(_, _.deref($at), command));
  }

  const log = _.partial(self.log, "$wip");

  $.sub($at, _.partial(log, "$at"));
  $.sub($head, _.partial(log, "$head"));
  $.sub($snapshot, _.partial(log, "$snapshot"));
  $.sub($snapshot, f);

  _.doto($wip, _.specify(sh.IDispatch, {dispatch}));

  return $wip;
}

function moment2(self, {state, event}){
  return self.make(self.seated, self.config, [event], state);
}

function moment1(self){
  const {history, at} = _.deref(self);
  return moment2(self, _.get(history, at));
}

export const moment = _.overload(null, moment1, moment2)

export function hist(self){
  return $.pipe($.map(function(hist){
    return stepping(self, _.nth(hist, 0), _.nth(hist, 1));
  }, $.hist(self.$story)), _.filter(_.first));
}

function deref(self){
  return _.deref(self.$story);
}

function sub(self, obs){
  return $.ISubscribe.sub(self.$story, obs);
}

export function waypoint(self, up, how){
  const {at, touches, history, undoables} = _.deref(self.$story);
  switch(how) {
    case "do-over":
      const _table_id = self.tableId,
            _event_id = _.nth(touches, at);
      if (up && _.includes(undoables, _event_id)){
        supabase.rpc('undo', {_table_id, _event_id}).then(function(undo){
          self.log("undo", undo);
          _.swap(self.$state, _.update(_, "history", _.pipe(_.take(at -1, _), _.toArray)));
        });
      }
      return null;

    case "last-move":
      const {last_move} = _.nth(history, at);
      return last_move;

    case "back":
      return _.nth(touches, _.clamp(at - 1, 0, _.count(touches) - 1));

    case "forward":
      return _.nth(touches, _.clamp(at + 1, 0, _.count(touches) - 1));

    case "inception":
      return _.first(touches);

    case "present":
      return _.last(touches);
  }
  return null;
}

async function dispatch(self, command){
  try {
    _.reset(self.$ready, false); //protect users from accidentally reissuing commands; one at a time

    if (self.seat == null) {
      throw new Error("Spectators are not permitted to issue moves");
    }

    const {error, data} = await move(self.tableId, self.seat, [command], self.session);

    self.log('moved', {tableId: self.tableId, command, seat: self.seat}, '->', {error, data});

    if (error) {
      self.fail(error);
    }
  } finally {
    _.reset(self.$ready, true);
  }
}

_.doto(Story,
  _.implement(sh.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));

export function story(session, tableId, seat, seated, config, log, $ready, fail, make){
  const $state = $.cell({touches: null, history: null, at: null});

  _.reset($ready, true);

  return new Story(session, tableId, seat, seated, config, log, $ready, fail, make, $state, $.pipe($state, _.filter(function({touches, history, at}){ //TODO cleanup
    return touches && history && at != null;
  }), _.thin(_.mapArgs(_.get(_, "at"), _.equiv))));
}

function expand(idx){
  return function(xs){
    const more = idx + 1 - _.count(xs);
    return more > 0 ? _.chain(xs, _.concat(_, _.repeat(more, null)), _.toArray) : xs;
  }
}

export function refresh(self, ...fs){
  return _.fmap(getTouches(self.tableId), function(touches){
    return _.merge(_, touches);
  }, _.swap(self.$state, _), ...fs);
}

export function atPresent(self){
  const {$state} = self;
  const {at, history, touches} = _.deref($state);
  const max = _.count(touches) - 1;
  return at === max;
}

export function inPast(self, touch){
  const {$state} = self;
  const {touches} = _.deref($state);
  return _.includes(touches, touch);
}

export function nav(self, _at){
  const {tableId, session, seat, seated, $state} = self;
  const seatId = _.nth(seated, seat)?.seat_id ?? null;
  const {at, history, touches} = _.deref($state);
  const pos = _.isNumber(_at) ? _at : _.indexOf(touches, _at);

  function loaded(offset){
    const p = pos + offset,
          touch = _.nth(touches, p),
          frame = _.nth(history, p);
    return [offset, p, touch, frame];
  }

  if (pos !== at) {
    _.chain([0, 1, -1], _.mapa(loaded, _), _.tee(_.pipe(_.first, function([offset, pos, touch, frame]){
      if (frame) {
        _.swap($state, _.assoc(_, "at", pos));
      }
    })), _.filter(function([offset, pos, touch, frame]){
      return touch && !frame;
    }, _), _.mapa(function([offset, pos, touch]){
      return _.fmap(getPerspective(tableId, session, touch, seat, seatId), _.array(pos, _));
    }, _), Promise.all.bind(Promise), _.fmap(_, function(results){
      _.swap($state, _.pipe(_.reduce(function(state, [pos, frame]){
        return _.update(state, "history", _.pipe(expand(pos), _.assoc(_, pos, frame)));
      }, _, results), _.assoc(_, "at", pos)));
    }));
  }
}
