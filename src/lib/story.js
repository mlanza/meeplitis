import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";
import {character} from "/components/table/index.js";
import {session} from "/lib/session.js";

function json(resp){
  return resp.json();
}

function getTouches(tableId){
  return _.fmap(fetch(`https://touches.workers.yourmove.cc?table_id=${tableId}`), json);
}

export function getSeated(tableId){
  return _.fmap(fetch(`https://seated.workers.yourmove.cc?table_id=${tableId}`), json, _.reducekv(function(seated, idx, seat){
    return _.conj(seated, seat.avatar_url ? seat : _.assoc(seat, "avatar_url", session && session?.userId === seat.player_id ? "/images/standins/you.jpg" : character(idx)));
  }, [], _));
}

export function getSeat(tableId, session){
  return session ? _.fmap(fetch(`https://seat.workers.yourmove.cc?table_id=${tableId}`, {
    headers: {
      accessToken: session.accessToken
    }
  }), json) : Promise.resolve(null);
}

function getPerspective(tableId, session, eventId, seat){
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

function move(_table_id, _seat, _commands, session){
  return _.fmap(fetch("https://move.workers.yourmove.cc", {
    method: "POST",
    body: JSON.stringify({_table_id, _seat, _commands}),
    headers: {
      accessToken: session.accessToken
    }
  }), json);
}

export function Story(session, tableId, seat, seated, ready, make, $state, $story){
  Object.assign(this, {session, tableId, seat, seated, ready, make, $state, $story});
}

function stepping(self, cstory, pstory){
  const motion = cstory && pstory;
  const at = cstory?.at;
  const head  = cstory ? _.count(cstory.touches) - 1 : null;
  const curr  = cstory ? _.nth(cstory.history, cstory.at) : null,
        prior = pstory ? _.nth(pstory.history, pstory.at) : null;
  const touch = cstory ? _.nth(cstory.touches, cstory.at) : null;
  const step = motion ? cstory.at - pstory.at : null;
  const offset = cstory ? at - head : null;
  const game = _.maybe(curr, _.partial(playing, self));
  return [curr, prior, {step, at, head, offset, touch}, game];
}

export function wip(self, f = _.noop){
  const $data  = $.cell({}),
        $head  = $.pipe(self, _.map(_.comp(_.last, _.get(_, "touches"))), _.filter(_.isSome)),
        $at    = $.pipe(self, _.map(function({at, touches}){
          return _.get(touches, at);
        }), _.filter(_.isSome)),
        $snapshot = $.pipe(self, _.filter(_.isSome), _.map(function({at, history}){
          return playing(self, _.get(history, at));
        })),
        $ctx   = $.map(function(data, head, at){
          return head == at ? _.get(data, at, {}) : null;
        }, $data, $head, $at),
        $wip   = $.hist($ctx);

  function dispatch(self, command){
    _.swap($data, _.assoc(_, _.deref($at), command));
  }

  $.sub($at, _.see("$at"));
  $.sub($head, _.see("$head"));
  $.sub($snapshot, _.see("$snapshot"));
  $.sub($snapshot, f);

  _.doto($wip, _.specify(sh.IDispatch, {dispatch}));

  return $wip;
}

function playing(self, {state, event}){
  return self.make(_.toArray(_.repeat(_.count(self.seated), {})), {}, [event], state);
}

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

export function waypoint(self, how){
  const {at, touches, history} = _.deref(self.$story);
  switch(how) {
    case "last-move":
      const {events} = _.nth(history, at);
      return self.seat == null ? null : _.chain(events, _.take(at + 1, _), _.reverse, _.rest, _.detect(function({seat}){
        return seat === self.seat;
      }, _), _.get(_, "id"));

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
  if (self.seat == null) {
    throw new Error("Spectators are not permitted to issue moves");
  }

  self.ready(false); //protect users from accidentally reissuing commands; one at a time

  const {error, data} = await move(self.tableId, self.seat, [command], self.session);

  _.log(`moved @ ${self.tableId} from ${self.seat}`, command, {error, data});

  self.ready(true);

  if (error) {
    throw error;
  }
}

_.doto(Story,
  _.implement(sh.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));

export function story(session, tableId, seat, seated, ready, make){
  const $state = $.cell({touches: null, history: null, at: null});

  ready(true);

  return new Story(session, tableId, seat, seated, ready, make, $state, $.pipe($state,  _.filter(function({touches, history, at}){ //TODO cleanup
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
    return _.assoc(_, "touches", touches);
  }, _.swap(self.$state, _), ...fs);
}

export function atPresent(self){
  const {$state} = self;
  const {at, history, touches} = _.deref($state);
  const max = _.count(touches) - 1;
  return at === max;
}

export function nav(self, _at){
  const {tableId, session, seat, $state} = self;
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
      return _.fmap(getPerspective(tableId, session, touch, seat), _.array(pos, _));
    }, _), Promise.all.bind(Promise), _.fmap(_, function(results){
      _.swap($state, _.pipe(_.reduce(function(state, [pos, frame]){
        return _.update(state, "history", _.pipe(expand(pos), _.assoc(_, pos, frame)));
      }, _, results), _.assoc(_, "at", pos)));
    }));
  }
}
