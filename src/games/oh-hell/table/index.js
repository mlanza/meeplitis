import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
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
        $ready = $.pipe($state,  t.filter(_.and(_.get(_, "touches"), _.get(_, "history"), _.get(_, "at")))),
        $seat = $.map(function(state){
          return state?.seat;
        }, $state),
        $snapshot = $.map(_.pipe(_.juxt(_.get(_, "history"), _.get(_, "at")), function([history, at]){
          return _.nth(history, at);
        }), $ready),
        $touches = $.pipe($.map(_.get(_, "touches"), $state), t.compact()),
        $hist = $.pipe($.map(_.array, $seat, $.hist($snapshot)), t.filter(function([seat, hist]){
          return seat != null && _.first(hist) != null;
        }));

  const root = document.body;
  const players = dom.sel1(".players");
  const trumpEl = dom.sel1(".trump img");
  const [roundNum, roundMax] = dom.sel(".round b");
  const bidding = dom.sel1(".bidding");
  const handEl = dom.sel1(".hand");
  const div = dom.tag('div'), span = dom.tag('span'), img = dom.tag('img'), li = dom.tag('li');

  function cardPic({suit, rank}){
    const suits = {"♥️": "H", "♦️": "D", "♣️": "C", "♠️": "S"};
    return `../../../images/deck/${rank}${suits[suit]}.svg`;
  }

  $.sub($table, _.see("$table"));
  $.sub($touch, _.see("$touch"));
  $.sub($seated, _.see("$seated"));
  $.sub($ready, _.see("$ready"));
  $.sub($hist, _.see("$hist"));

  $.sub($seated, function(seated){
    _.eachIndexed(function(idx, {username, avatar}){
      dom.append(players,
        div({class: "zone", "data-seat": idx, "data-username": username, "data-presence": "offline"},
          div({class: "player"},
            div({class: "avatar"}, img({src: `${avatar}?s=104`})),
            div(
              div({class: "username"}, username),
              div(span({class: "points"}, "0"), " pts."),
              div(span({class: "tricks"}, "-"), "/", span({class: "bid"}, "-"), span({class: "tip"}, " (bid/taken)"))),
            img({"data-action": "", src: "../../../images/pawn.svg"})),
          div({class: "played"})));
    }, seated);
  });

  $.sub($hist, function([seat, [curr, prior]]){
    const {state, state: {trump, round, status, seated}} = curr;
    const {hand} = _.nth(seated, seat);
    const s = dom.sel1(`[data-seat="${seat}"]`);
    dom.attr(root, "data-status", status);
    dom.attr(trumpEl, "src", cardPic(trump));
    dom.text(roundNum, round + 1);
    dom.text(roundMax, 13);
    dom.attr(bidding, "data-max-bid", round + 1);
    dom.append(handEl, _.map(function(card){
      return li(img({src: cardPic(card)}));
    }, hand));
    dom.addClass(s, "yours");
    dom.attr(dom.sel1("[data-action]", s), "data-action", "must");
    dom.attr(s, "data-presence", "online");
  });

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
  Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]).then(function([
    {data: {user}},
    {data: {session: sess}}
  ]){
    const s = shell(
      session(
        user.id,
        sess.access_token),
      tableId);
    Object.assign(window, {$, _, sh, s, supabase});
  });
} else {
  document.location.href = "../";
}
