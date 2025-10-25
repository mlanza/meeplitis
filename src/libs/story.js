import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";
import supabase from "/libs/supabase.js";
import {getfn} from "/libs/session.js";
import {reg} from "/libs/cmd.js";
export {wip} from "/libs/wip.js";

function digest(result){
  const code  = result?.code,
        error = code == null ? null : result,
        data  = code == null ? result : null;
  return {error, data};
}

function getTouches(_table_id){
  return getfn('touches', {_table_id});
}

function getPerspective(table_id, event_id, seat, seat_id){
  const perspective = getfn("perspective", _.compact({table_id, event_id, seat})).then(digest);
  //const perspective = supabase.functions.invoke("perspective", {body});
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

function move(table_id, seat, commands, accessToken){
  const body = {table_id, seat, commands};
  return supabase.functions.invoke("move", {body}).then(_.get(_, "data"));
}

export function Story(accessToken, tableId, seat, seated, config, $hash, $up, $ready, $error, make, $state, $story){
  Object.assign(this, {accessToken, tableId, seat, seated, config, $hash, $up, $ready, $error, make, $state, $story});
}

function undoThru(undoables, touch){
  return _.some(function([key, vals]){
    return _.includes(vals, touch) ? key : null;
  }, undoables);
}

function stepping(self, cstory, pstory){
  const motion = cstory && pstory;
  const at = cstory?.at;
  const head  = cstory ? _.count(cstory.touches) - 1 : null;
  const present = at && at === head;
  const bwd = cstory?.at < pstory?.at;
  const curr  = cstory ? _.nth(cstory.history, cstory.at) : null,
        prior = pstory ? _.nth(pstory.history, pstory.at) : null;
  const touch = cstory ? _.nth(cstory.touches, cstory.at) : null;
  const undoable = undoThru(cstory?.undoables, touch);
  const {last_acting_seat} = cstory || {};
  const step = motion ? cstory.at - pstory.at : null;
  const offset = cstory ? at - head : null;
  const game = _.maybe(curr, _.partial(moment2, self));
  return [curr, prior, {step, at, bwd, head, present, offset, touch, undoable, last_acting_seat}, game];
}

export function snapshot(self){
  return $.pipe(self, _.filter(_.isSome), _.map(function({at, history}){
    return moment(self, _.get(history, at));
  }));
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

export function waypoint(self, how){
  const {at, touches, history, undoables} = _.deref(self.$story);
  switch(how) {
    case "do-over":
      const _table_id = self.tableId,
            _event_id = _.nth(touches, at),
            event_id = undoThru(undoables, _event_id);
      event_id && supabase.rpc('undo', {_table_id, _event_id: event_id}).then(function(undo){
        $.swap(self.$state, _.update(_, "history", _.pipe(_.take(at -1, _), _.toArray)));
      });

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
    $.reset(self.$ready, false); //protect users from accidentally reissuing commands; one at a time

    if (self.seat == null) {
      throw new Error("Spectators are not permitted to issue moves");
    }

    const {error, data} = await move(self.tableId, self.seat, [command], self.accessToken);

    $.log('moved', {tableId: self.tableId, command, seat: self.seat}, '->', {error, data});

    if (error) {
      $.pub(self.$error, error);
    }
  } finally {
    $.reset(self.$ready, true);
  }
}

$.doto(Story,
  _.implement($.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));

export function story(make, accessToken, tableId, seat, seated, config, $hash, $up, $ready, $error){
  const $state = $.atom({touches: null, history: null, at: null});

  $.reset($ready, true);

  const self = new Story(accessToken, tableId, seat, seated, config, $hash, $up, $ready, $error, make, $state, $.pipe($state, _.filter(function({touches, history, at}){ //TODO cleanup
    return touches && history && at != null;
  }), _.thin(_.mapArgs(_.get(_, "at"), _.equiv))));

  const init = _.once(function(startTouch){
    $.sub($hash, _.map(_.replace(_, "#", "")), function(touch){
      nav(self, touch || startTouch);
    });
  });

  $.sub($state, _.comp(_.map(_.get(_, "touches")), _.compact(), _.map(_.last)), init);

  return self;
}

function expand(idx){
  return function(xs){
    const more = idx + 1 - _.count(xs);
    return more > 0 ? _.chain(xs, _.concat(_, _.repeat(more, null)), _.toArray) : xs;
  }
}

export function refresh(self, ...fs){
  return _.fmap(getTouches(self.tableId), _.update(_, "undoables", _.mapVals(_, _.set)), function(touches){
    return _.merge(_, touches);
  }, $.swap(self.$state, _), ...fs);
}

let replays = 0;

export function replay(self, how){
  replays++;
  location.hash = waypoint(self, how) || location.hash;
}

export function toPresent(self, was){
  if ((was == null || was === replays) && !atPresent(self)) { //did the user navigate since timer started?
    replay(self, "forward");
    setTimeout(_.partial(toPresent, self, replays), 3000);
  }
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
  const {tableId, accessToken, seat, seated, $state} = self;
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
    _.chain([0, 1, -1], _.mapa(loaded, _), $.tee(_.pipe(_.first, function([offset, pos, touch, frame]){
      if (frame) {
        $.swap($state, _.assoc(_, "at", pos));
      }
    })), _.filter(function([offset, pos, touch, frame]){
      return touch && !frame;
    }, _), _.mapa(function([offset, pos, touch]){
      return _.fmap(getPerspective(tableId, touch, seat, seatId), _.array(pos, _));
    }, _), Promise.all.bind(Promise), _.fmap(_, function(results){
      $.swap($state, _.pipe(_.reduce(function(state, [pos, frame]){
        return _.update(state, "history", _.pipe(expand(pos), _.assoc(_, pos, frame)));
      }, _, results), _.assoc(_, "at", pos)));
    }));
  }
}
