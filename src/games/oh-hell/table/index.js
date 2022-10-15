import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "../../../lib/supabase.js";

function json(resp){
  return resp.json();
}

function getTouches(tableId){
  return _.fmap(fetch(`https://touches.workers.yourmove.cc?table_id=${tableId}`), json);
}

function getSeated(tableId){
  return _.fmap(fetch(`https://seated.workers.yourmove.cc?table_id=${tableId}`), json);
}

function getSeat(tableId, session){
  return session ? _.fmap(fetch(`https://seat.workers.yourmove.cc?table_id=${tableId}`, {
    headers: {
      accessToken: session.accessToken
    }
  }), json) : Promise.resolve(null);
}

const getPerspective = _.partly(function getPerspective(tableId, session, eventId, seat){
  return session && seat ? _.fmap(fetch(`https://perspective.workers.yourmove.cc?table_id=${tableId}&event_id=${eventId}&seat=${seat}`, {
    headers: {
      accessToken: session.accessToken
    }
  }), json) : _.fmap(fetch(`https://perspective.workers.yourmove.cc?table_id=${tableId}&event_id=${eventId}`), json);
});

function table(tableId){
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

function expand(idx){
  return function(xs){
    const more = idx + 1 - _.count(xs);
    return more > 0 ? _.chain(xs, _.concat(_, _.repeat(more, null)), _.toArray) : xs;
  }
}

function setAt($state, at, getPerspective){
  const perspective = _.chain($state, _.deref, _.get(_, "history"), _.nth(_, at)),
        eventId = _.chain($state, _.deref, _.get(_, "touches"), _.nth(_, at));
  if (!eventId) {
    throw new Error("Unknown position");
  }
  if (perspective){
    _.swap($state, _.assoc(_, "at", at));
  } else {
    _.fmap(getPerspective(eventId), function(perspective){
      _.swap($state,
        _.pipe(
          _.update(_, "history", _.pipe(expand(at), _.assoc(_, at, perspective))),
          _.assoc(_, "at", at)));
    });
  }
}

function move(tableId, seat, commands){
  return supabase
    .rpc('move', {
      _commands: commands,
      _seat: seat,
      _table_id: tableId
    });
}

function postTouches($state, tableId){
  _.fmap(getTouches(tableId), function(touches){
    return _.assoc(_, "touches", touches);
  }, _.swap($state, _));
}

function Session(userId, accessToken){
  Object.assign(this, {userId, accessToken});
}

function session(userId, accessToken){
  return userId && accessToken ? new Session(userId, accessToken) : null;
}

function TablePass(session, tableId, seat, state){
  Object.assign(this, {session, tableId, seat, state});
}

function assoc(self, key, value){
  return new TablePass(self.session, self.tableId, self.seat, _.assoc(self.state, key, value));
}

function lookup(self, key){
  return _.get(self.state, key);
}

function deref(self){
  return self.state;
}

_.doto(TablePass,
  _.implement(_.IDeref, {deref}),
  _.implement(_.IAssociative, {assoc}),
  _.implement(_.ILookup, {lookup}));

function tablePass(session, tableId, seat){
  return new TablePass(session, tableId, seat, {
    touches: null,
    history: null,
    at: null
  });
}

const Shell = (function(){
  function Shell($state, $table, $touch, $touches){
    Object.assign(this, {$state, $table, $touch, $touches});
  }

  function deref(self){
    const {history, at} = _.chain(self.$state, _.deref, _.deref);
    return _.nth(history, at);
  }

  async function dispatch(self, command){
    const state = _.deref(self.$state);

    if (!state.seat) {
      throw new Error("Spectators are not permitted to issue moves");
    }

    const {error, data} = await move(state.tableId, state.seat, [command]);
    if (error) {
      throw error;
    }
    _.log("move", command, data);
  }

  return _.doto(Shell,
    _.implement(_.IDeref, {deref}),
    _.implement(sh.IDispatch, {dispatch}));

})();

function load(prom) {
  const $state = $.cell(null);
  _.fmap(prom, _.reset($state, _));
  return $.pipe($state, t.compact());
}

function shell(session, tableId){
  const $table = table(tableId),
        $seated = _.chain(tableId, getSeated, load),
        $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), t.compact()),
        $state = $.cell(null),
        $touches = $.pipe($.map(_.get(_, "touches"), $state), t.compact());
  $.sub($table, _.see("$table"));
  $.sub($touch, _.see("$touch"));
  $.sub($seated, _.see("$seated"));
  $.sub($state, t.filter(_.and(_.get(_, "touches"), _.get(_, "history"), _.get(_, "at"))), _.see("$state"));
  $.sub($touch, function(){
    postTouches($state, tableId);
  });
  _.fmap(getSeat(tableId, session), function(seat){
    const getPerspectiveByTouch = getPerspective(tableId, session, _, seat);
    $.sub($touches, function(touches){ //always growing
      setAt($state, _.chain(touches, _.count, _.dec), getPerspectiveByTouch);
    });
    return tablePass(session, tableId, seat);
  }, _.reset($state, _));
  return new Shell($state, $table, $touch, $touches);
}

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

if (tableId) {
  const s = shell(
    session(
      supabase.auth?.currentUser?.id,
      supabase.auth?.currentSession?.access_token),
    tableId);
  Object.assign(window, {$, _, sh, s, supabase});
} else {
  document.location.href = "../";
}
