import _ from "/lib/@atomic/core.js";
import $ from "/lib/@atomic/reactives.js";
import t from "/lib/@atomic/transducers.js";
import sh from "/lib/@atomic/shell.js";
import supabase from "../../../lib/supabase.js";

function json(resp){
  return resp.json();
}

function getTouches(tableId){
  return fetch(`https://touches.workers.yourmove.cc?table_id=${tableId}`).then(json);
}

function getSeated(tableId){
  return fetch(`https://seated.workers.yourmove.cc?table_id=${tableId}`).then(json);
}

function getSeat(tableId, accessToken){
  return accessToken ? fetch(`https://seat.workers.yourmove.cc?table_id=${tableId}`, {
    headers: {
      accessToken
    }
  }).then(json) : Promise.resolve(null);
}

function getPerspective(tableId, accessToken, eventId, seat){
  return fetch(`https://perspective.workers.yourmove.cc?table_id=${tableId}&event_id=${eventId}&seat=${seat}`, {
    headers: {
      accessToken
    }
  }).then(json);
}

function watchTable($state, tableId){
  function postTouches(){
    getTouches(tableId)
    .then(function(touches){
      return _.assoc(_, "touches", touches);
    })
    .then(_.swap($state, _));
  }

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
      debugger;
      switch (payload.eventType) {
        case "UPDATE":
          _.swap($state, _.assoc(_, "table", payload.new));
          postTouches();
          break;
        default:
          _.log("payload", payload);
          break;
      }
    })
    .subscribe();

    postTouches();
}

function expand(idx){
  return function(xs){
    const more = idx + 1 - _.count(xs);
    return more > 0 ? _.chain(xs, _.concat(_, _.repeat(more, null)), _.toArray) : xs;
  }
}

function setAt($state, tableId, accessToken, seat, at){
  const perspective = _.chain($state, _.deref, _.get(_, "history"), _.nth(_, at)),
        eventId = _.chain($state, _.deref, _.get(_, "touches"), _.nth(_, at));
  if (!eventId) {
    throw new Error("Unknown position");
  }
  if (perspective){
    _.swap($state, _.assoc(_, "at", at));
  } else {
    getPerspective(tableId, accessToken, eventId, seat).then(function(perspective){
      _.swap($state, _.update(_, "history", _.pipe(expand(at), _.assoc(_, at, perspective))));
      _.swap($state, _.assoc(_, "at", at));
    });
  }
}

function postMove(tableId, accessToken, seat, commands){
  return fetch(`https://move.workers.yourmove.cc?table_id=${tableId}&seat=${seat}`, {
    method: "POST",
    headers: {
      accessToken
    }
  }).then(json);
}

function TablePass(userId, accessToken, tableId, seat, seated, $state){
  this.userId = userId;
  this.accessToken = accessToken;
  this.tableId = tableId;
  this.seat = seat;
  this.seated = seated;
  this.$state = $state;
}

function dispatch(self, command){

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
  const $touches = $.map(_.get(_, "touches"), $state);
  $.sub($touches, t.filter(_.identity), function(touches){
    const at = _.chain(touches, _.count, _.dec);
    setAt($state, tableId, accessToken, seat, at);
  });
  getTouches(tableId)
    .then(function(touches){
      return _.assoc(_, "touches", touches);
    })
    .then(_.swap($state, _));
  watchTable($state, tableId);
  return new TablePass(userId, accessToken, tableId, seat, seated, $state);
}

const userId = supabase.auth?.currentUser?.id,
      accessToken = supabase.auth?.currentSession?.access_token;
const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

tableId && Promise.all([
  getSeat(tableId, accessToken),
  getSeated(tableId)
]).then(function([seat, seated]){
  const pass = tablePass(userId, accessToken, tableId, seat, seated);

  if (!pass){
    document.location.href = "../";
  }

  Object.assign(window, {pass});
});
Object.assign(window, {$, _, sh, supabase});
