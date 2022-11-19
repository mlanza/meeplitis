import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import dom from "/lib/atomic_/dom.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import {getPerspective, getTouches, move} from "/lib/table.js";
import supabase from "/lib/supabase.js";

export function TablePass(session, tableId, seat, seated, ready, $state, $pass, $hist, $table){
  Object.assign(this, {session, tableId, seat, seated, ready, $state, $pass, $hist, $table});
}

function deref(self){
  return _.deref(self.$pass);
}

function sub(self, obs){
  return $.ISubscribe.sub(self.$pass, obs);
}

async function dispatch(self, command){
  if (self.seat == null) {
    throw new Error("Spectators are not permitted to issue moves");
  }

  self.ready(false);

  const {error, data} = await move(self.tableId, self.seat, [command], self.session);

  _.log("move", command, {error, data});

  self.ready(true);

  if (error) {
    throw error;
  }
}

_.doto(TablePass,
  _.implement(sh.IDispatch, {dispatch}),
  _.implement($.ISubscribe, {sub}),
  _.implement(_.IDeref, {deref}));

export function tablePass(session, tableId, seat, seated, ready){
  ready(true);
  const $state = $.cell({
    touches: null,
    history: null,
    at: null
  });
  const $pass = $.pipe($state,  t.filter(function({touches, history, at}){ //TODO cleanup
    return touches && history && at != null;
  }));

  const $t = $.cell(null);
  supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .then(_.getIn(_, ["data", 0]))
    .then(_.reset($t, _));

  const channel = supabase.channel('db-messages').
    on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tables',
      filter: `id=eq.${tableId}`,
    }, function(payload){
      _.reset($t, payload.new);
    }).
    subscribe();

  const $table = $.pipe($t, t.compact()),
        $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), t.compact()),
        $snapshot = $.map(_.pipe(_.juxt(_.get(_, "history"), _.get(_, "at")), function([history, at]){
          return _.nth(history, at);
        }), $pass),
        $touches = $.pipe($.map(_.get(_, "touches"), $pass), t.compact()),
        $hist = $.pipe($.hist($snapshot), t.filter(_.first));

  const self = new TablePass(session, tableId, seat, seated, ready, $state, $pass, $hist, $table);

  $.sub($pass, _.see("$pass"));
  $.sub($table, _.see("$table"));
  $.sub($touch, _.see("$touch"));
  $.sub($hist, _.see("$hist"));

  $.sub($touch, function(){
    _.fmap(getTouches(tableId), function(touches){
      return _.assoc(_, "touches", touches);
    }, _.swap($state, _));
  });

  const init = _.once(function(startTouch){
    $.sub(dom.hash(window), t.map(_.replace(_, "#", "")), function(touch){
      setAt(self, touch || startTouch);
    });
  });

  $.sub($state, _.comp(t.map(function({touches}){
    return touches;
  }), t.compact(), t.map(_.last)), init);

  return self;
}

function expand(idx){
  return function(xs){
    const more = idx + 1 - _.count(xs);
    return more > 0 ? _.chain(xs, _.concat(_, _.repeat(more, null)), _.toArray) : xs;
  }
}

export function setAt(self, _at){
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
