import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import t from "/lib/@atomic/transducers.js";
import sh from "/lib/@atomic/shell.js";
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

function getSeat(tableId, accessToken){
  return accessToken ? _.fmap(fetch(`https://seat.workers.yourmove.cc?table_id=${tableId}`, {
    headers: {
      accessToken
    }
  }), json) : Promise.resolve(null);
}

const getPerspective = _.partly(function getPerspective(tableId, accessToken, eventId, seat){
  return _.fmap(fetch(`https://perspective.workers.yourmove.cc?table_id=${tableId}&event_id=${eventId}&seat=${seat}`, {
    headers: {
      accessToken
    }
  }), json);
});

function watchTable($state, tableId){
  supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .then(function(resp){
      return resp.body[0];
    })
    .then(function(table){
      return _.assoc(_, "table", table);
    })
    .then(_.swap($state, _));

  supabase
    .from('tables')
    .on('*',function(payload){
      switch (payload.eventType) {
        case "UPDATE":
          _.swap($state, _.assoc(_, "table", payload.new));
          break;
        default:
          _.log("payload", payload);
          break;
      }
    })
    .subscribe();
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

function TablePass(userId, accessToken, tableId, seat, seated, $state){
  Object.assign(this, {userId, accessToken, tableId, seat, seated, $state});
}

async function dispatch(self, command){
  const {error, data} = await move(self.tableId, self.seat, [command]);
  if (error) {
    throw error;
  }
  _.log("move", command, data);
}

function deref(self){
  return _.deref(self.$state);
}

_.doto(TablePass,
  _.implement(sh.IDispatch, {dispatch}),
  _.implement(_.IDeref, {deref}));

function tablePass(userId, accessToken, tableId, seat, seated){
  const $state = $.cell({
    table: null,
    touches: null,
    history: [],
    at: null
  });
  $.sub($state, _.see("$state"));
  const $lasttouch = $.map(_.getIn(_, ["table", "last_touch_id"]), $state);
  const getPerspectiveByTouch = getPerspective(tableId, accessToken, _, seat);
  const $touches = $.map(_.get(_, "touches"), $state);
  $.sub($touches, t.filter(_.identity), function(touches){ //always growing
    setAt($state, _.chain(touches, _.count, _.dec), getPerspectiveByTouch);
  });
  postTouches($state, tableId);
  watchTable($state, tableId);
  $.sub($lasttouch, function(touch){
    postTouches($state, tableId);
  });
  return new TablePass(userId, accessToken, tableId, seat, seated, $state);
}

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

if (tableId) {
  const userId = supabase.auth?.currentUser?.id,
        accessToken = supabase.auth?.currentSession?.access_token;
  _.fmap(Promise.all([
    getSeat(tableId, accessToken),
    getSeated(tableId)
  ]), function([seat, seated]){
    return tablePass(userId, accessToken, tableId, seat, seated);
  }, function(pass){
    Object.assign(window, {pass});
  });
  Object.assign(window, {$, _, sh, supabase});
} else {
  document.location.href = "../";
}
