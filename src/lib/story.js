import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";

function json(resp){
  return resp.json();
}

function getTouches(tableId){
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

export function Story(session, tableId, seat, seated, ready, $state, $story){
  Object.assign(this, {session, tableId, seat, seated, ready, $state, $story});
}

export function hist(self){
  const $snapshot = $.map(function({history, at}){
    return _.nth(history, at);
  }, self.$story);
  return $.pipe($.hist($snapshot), t.filter(_.first));
}

function deref(self){
  return _.deref(self.$story);
}

function sub(self, obs){
  return $.ISubscribe.sub(self.$story, obs);
}

export function waypoint(self, how){
  const {at, touches} = _.deref(self.$story);
  switch(how) {
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

export function story(session, tableId, seat, seated, ready){
  const $state = $.cell({touches: null, history: null, at: null});

  ready(true);

  return new Story(session, tableId, seat, seated, ready, $state, $.pipe($state,  t.filter(function({touches, history, at}){ //TODO cleanup
    return touches && history && at != null;
  })));
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
