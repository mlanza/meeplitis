import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "../../../lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

const div = dom.tag('div'),
      a = dom.tag('a'),
      span = dom.tag('span'),
      img = dom.tag('img'),
      ol = dom.tag('ol'),
      ul = dom.tag('ul'),
      li = dom.tag('li'),
      button = dom.tag('button');

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

function move(_table_id, _seat, _commands, session){
  return _.fmap(fetch("https://move.workers.yourmove.cc", {
    method: "POST",
    body: JSON.stringify({_table_id, _seat, _commands}),
    headers: {
      accessToken: session.accessToken
    }
  }), json);
}

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

function setAt($state, _at, getPerspective){
  const {state: {at, history, touches}} = _.deref($state);
  const pos = _.isNumber(_at) ? _at : _.indexOf(touches, _at);
  const perspective = _.nth(history, pos),
        eventId = _.nth(touches, pos);
  if (!eventId) {
    throw new Error("Unknown position");
  }
  if (perspective){
    _.swap($state, _.assoc(_, "at", pos));
  } else {
    _.fmap(getPerspective(eventId), function(perspective){
      _.swap($state,
        _.pipe(
          _.update(_, "history", _.pipe(expand(pos), _.assoc(_, pos, perspective))),
          _.assoc(_, "at", pos)));
    });
  }
}

function replay(go){
  const {state: {at, touches}} = _.deref(s.$pass),
        max = _.count(touches) - 1;

  switch(go) {
    case "back":
      location.hash = _.nth(touches, _.clamp(at - 1, 0, max));
      break;

    case "forward":
      location.hash = _.nth(touches, _.clamp(at + 1, 0, max));
      break;

    case "inception":
      location.hash = _.first(touches);
      break;

    case "present":
      location.hash = _.last(touches);
      break;
  }
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

function TablePass(session, tableId, seat, seated, state){
  Object.assign(this, {session, tableId, seat, seated, state});
}

function assoc(self, key, value){
  return new TablePass(self.session, self.tableId, self.seat, self.seated, _.assoc(self.state, key, value));
}

function lookup(self, key){ //TODO eliminate?
  return _.get(self.state, key);
}

function deref(self){
  const {history, at} =  self.state;
  return _.nth(history, at);
}

_.doto(TablePass,
  _.implement(_.IDeref, {deref}),
  _.implement(_.IAssociative, {assoc}),
  _.implement(_.ILookup, {lookup}));

function tablePass(session, tableId, seat, seated){
  return new TablePass(session, tableId, seat, seated, {
    touches: null,
    history: null,
    at: null
  });
}

const Shell = (function(){
  function Shell($pass, $table, $touch, $touches, ready){
    Object.assign(this, {$pass, $table, $touch, $touches});
  }

  function deref(self){
    return _.chain(self.$pass, _.deref);
  }

  async function dispatch(self, command){
    const pass = _.deref(self.$pass);

    if (pass.seat == null) {
      throw new Error("Spectators are not permitted to issue moves");
    }
    self.ready(false);

    const {error, data} = await move(pass.tableId, pass.seat, [command], pass.session);
    if (error) {
      throw error;
    } else {
      self.ready(true);
    }
    _.log("move", command, {error, data});
  }

  function lookup(self, key){
    return _.chain(self.$pass, _.deref, _.get(_, key));
  }

  return _.doto(Shell,
    _.implement(_.ILookup, {lookup}),
    _.implement(_.IDeref, {deref}),
    _.implement(sh.IDispatch, {dispatch}));

})();

function load(prom) {
  const $state = $.cell(null);
  _.fmap(prom, _.reset($state, _));
  return $.pipe($state, t.compact());
}

function shell(session, tableId, seated, seat, el){
  const $table = table(tableId),
        $up = $.map(_.pipe(_.get(_, "up"), _.includes(_, seat)), $table),
        $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), t.compact()),
        $pass = $.cell(tablePass(session, tableId, seat, seated)),
        $ready = $.pipe($pass,  t.filter(function(pass){ //TODO cleanup
          const {state} = pass ? pass : {state: null};
          return state?.touches != null && state?.history != null && state?.at != null;
        })),
        $snapshot = $.map(_.pipe(_.juxt(_.get(_, "history"), _.get(_, "at")), function([history, at]){
          return _.nth(history, at);
        }), $ready),
        $touches = $.pipe($.map(function(pass){
          return pass?.state?.touches;
        }, $pass), t.compact()),
        $hist = $.pipe($.hist($snapshot), t.filter(_.first));

  const ready = dom.attr(el, "data-ready", _);
  const s = new Shell($pass, $table, $touch, $touches, ready);

  $.sub($ready, _.see("$pass"));
  $.sub($table, _.see("$table"));
  $.sub($touch, _.see("$touch"));
  $.sub($hist, _.see("$hist"));
  $.sub($up, dom.attr(el, "data-up", _));

  function eventFor(event){
    return event.seat == null ? null : _.nth(seated, event.seat);
  }

  function victor(player){
    return div({class: "victor"},
      img({alt: player.username, src: `${player.avatar}?s=150`}),
      `${player.username} wins!`);
  }

  function recipient(player){
    return img({class: "recipient", alt: player.username, src: `${player.avatar}?s=50`});
  }

  function scored(player, points){
    return li(
      recipient(player),
      span(points));
  }

  function desc(event){
    switch(event.type) {
      case "start":
        return "Starts game.";

      case "deal":
        return "Deals cards.";

      case "commit":
        return "I'm done.";

      case "undo":
        return "Undoes.";

      case "redo":
        return "Redoes.";

      case "reset":
        return "Resets.";

      case "broken":
        return "Breaks trump!";

      case "bid":
        return `Bids.`;

      case "play":
        return `Plays ${event.details.card.rank} of ${event.details.card.suit}.`;

      case "scoring":
        const {scoring} = event.details;
        return ul({class: "scored"}, _.flatten(_.mapIndexed(function(idx, {points}){
          return scored(seated[idx], points);
        }, scoring)));

      case "finish":
        const {ranked} = event.details;
        const first = ranked[0].tied ? null : ranked[0];
        const winner = _.maybe(first?.seat, _.nth(seated, _));
        return ol({class: "scored"}, _.cons(victor(winner), _.flatten(_.mapIndexed(function(idx, {tie, seat, place, points}){
          return scored(seated[seat], points);
        }, ranked))));

      case "award":
        return ["Awards trick to ", recipient(_.nth(seated, event.details.winner)), "."];

      default:
        return event.type;
    }
  }

  function moveSel(move){
    const {details} = move;
    switch(move.type){
      case "bid":
        return `[data-bid="${details.bid == null ? '' : details.bid}"]`;
      default:
        return "";
    }
  }

  const getPerspectiveByTouch = getPerspective(tableId, session, _, seat);
  const [roundNum, roundMax] = dom.sel(".round b");
  const els = {
    roundNum,
    roundMax,
    game: dom.sel1("#game"),
    event: dom.sel1("#event"),
    moves: dom.sel1(".moves"),
    players: dom.sel1(".players"),
    trump: dom.sel1(".trump img"),
    cards: dom.sel1(".cards b"),
    deck: dom.sel1(".deck"),
    hand: dom.sel1(".hand"),
    touch: dom.sel1("#replay .touch"),
    touches: dom.sel1("#replay .touches")
  }

  function cardPic({suit, rank}){
    const suits = {"♥️": "H", "♦️": "D", "♣️": "C", "♠️": "S"};
    return `../../../images/deck/${rank}${suits[suit]}.svg`;
  }

  dom.attr(el, "data-seats", _.count(seated));

  _.eachIndexed(function(idx, {username, avatar}){
    dom.append(els.players,
      div({class: "zone", "data-seat": idx, "data-username": username, "data-presence": "offline"},
        div({class: "player"},
          div({class: "avatar"}, img({src: `${avatar}?s=104`})),
          div(
            a({class: "username", "href": `/profiles?username=${username}`}, username),
            div(span({class: "points"}, "0"), " pts."),
            div(span({class: "tricks"}, "-"), "/", span({class: "bid"}, "-"), span({class: "tip"}, " (taken/bid)"))),
          img({"data-action": "", src: "../../../images/pawn.svg"})),
        div({class: "played"})));
  }, seated);

  window.addEventListener('hashchange', function(){
    setAt($pass, location.hash.replace("#", ""), getPerspectiveByTouch);
  });

  const init = _.once(function(touch){
    setAt($pass, touch, getPerspectiveByTouch);
  });

  $.sub($pass, function({state: {touches, at}}){
    if (touches){
      init(location.hash.replace("#", "") || _.last(touches));
    }
  });

  $.sub($touch, function(touch){
    postTouches($pass, tableId);
  });

  $.sub($pass, t.compact(), function({state}){
    if (state) {
      const {touches, at} = state;
      dom.attr(el, "data-tense", _.count(touches) - 1 == at ? "present" : "past");
      dom.text(els.touch, at + 1);
      dom.text(els.touches, _.count(touches));
    }
  });

  $.sub($hist, function([curr, prior]){
    const {up, may, seen, events, moves, score, state, state: {trump, round, status, seated, deck, lead, broken, deals}} = curr;
    const {hand, bid} = _.nth(seated, seat) || {hand: null, bid: -1};
    const event = _.last(events);
    const player = eventFor(event);
    const cnt = _.count(state.seated);
    const leadSuit = _.maybe(seated, _.nth(_, lead), _.getIn(_, ["played", "suit"])) || "";
    const awarded = event.type == "award" ? _.toArray(_.take(cnt, _.drop(cnt - event.details.lead, _.cycle(event.details.trick)))) : null;
    const s = dom.sel1(`[data-seat="${seat}"]`);

    _.doto(els.event,
      dom.attr(_, "data-type", event.type),
      dom.addClass(_, "bounce"),
      dom.removeClass(_, "hidden"),
      dom.removeClass(_, "acknowledged"));

    _.each(_.doto(_,
      dom.removeClass(_, "active"),
      dom.removeClass(_, "selected"),
      dom.prop(_, "disabled", false)),
        dom.sel("button", els.moves));

    _.chain(moves, _.map(function(move){
      return dom.sel1(`button[data-type="${move.type}"]${moveSel(move)}`, els.moves);
    }, _), _.compact, _.each(dom.addClass(_, "active"), _));

    status == "bidding" && _.maybe(dom.sel1(`button[data-type="bid"][data-bid="${bid == null ? '' : bid}"]`),
      _.doto(_,
        dom.addClass(_, "selected"),
        dom.prop(_, "disabled", true)));

    dom.addClass(el, "initialized");
    dom.attr(el, "data-event-type", event.type);
    dom.attr(el, "data-perspective", seat);
    dom.attr(els.players, "data-lead", lead);
    dom.attr(els.players, "data-played", event.type == "play" ? event.seat : "");
    dom.toggleClass(els.event, "automatic", !player);
    if (player) {
      dom.attr(dom.sel1("img.who", els.event), "src", `${player.avatar}?=80`);
      dom.text(dom.sel1("p.who", els.event), player.username);
    }
    dom.html(dom.sel1("p", els.event), desc(event));

    _.eachIndexed(function(idx, {bid, tricks, hand, played, scored}){
      const plyd = _.nth(awarded, idx) || played;
      const seat = dom.sel1(`[data-seat="${idx}"]`);
      _.includes(seen, idx) && _.doto(seat,
        dom.addClass(_, "yours"),
        dom.attr(_, "data-presence", "online"));
      dom.text(dom.sel1(".points", seat), _.nth(score, idx));
      dom.attr(dom.sel1("[data-action]", seat), "data-action", _.includes(up, idx) ? "must" : (_.includes(may, idx) ? "may" : ""));
      dom.text(dom.sel1(".tricks", seat), _.count(tricks));
      dom.text(dom.sel1(".bid", seat), bid === null ? "?" : (bid === "" ? "X" : bid));
      dom.html(dom.sel1(".played", seat), _.maybe(plyd, cardPic, function(src){
        return img({src});
      }));
    }, seated);

    dom.text(dom.sel1("#phase", game), {"bidding": "Bidding", "playing": `Playing ${leadSuit}`, "confirming": "Playing", "finished": "Finished"}[status]);
    dom.attr(el, "data-status", status);
    dom.attr(el, "data-broken", broken);
    dom.text(els.cards, _.count(deck) || 52);
    dom.attr(els.trump, "src", _.maybe(trump, cardPic) || "");
    dom.text(els.roundNum, round + 1);
    dom.text(els.roundMax, _.count(deals));
    dom.html(els.hand, _.map(function(card){
      return li(img({src: cardPic(card), "data-suit": card.suit, "data-rank": card.rank}));
    }, hand));
  });

  $.on(el, "click", '[data-tense="present"][data-ready="true"] .moves button[data-type="bid"]', function(e){
    const bid = _.maybe(e.target, dom.attr(_, "data-bid"), _.blot, parseInt);
    sh.dispatch(s, {type: "bid", "details": {bid}});
  });

  $.on(el, "click", '[data-tense="present"][data-ready="true"] .moves button[data-type="reset"], [data-tense="present"][data-ready="true"] .moves button[data-type="undo"], [data-tense="present"][data-ready="true"] .moves button[data-type="redo"], [data-tense="present"][data-ready="true"] .moves button[data-type="commit"]', function(e){
    const type = dom.attr(e.target, "data-type");
    sh.dispatch(s, {type});
  });

  $.on(el, "click", "#event", function(e){
    const self = this;
    dom.addClass(self, "acknowledged");
    setTimeout(function(){
      dom.addClass(self, "hidden");
    }, 500);
  });

  $.on(el, "click", '[data-tense="present"][data-ready="true"] .hand img', function(e){
    const suit = dom.attr(this, "data-suit"),
          rank = dom.attr(this, "data-rank");
    sh.dispatch(s, {type: "play", details: {card: {suit, rank}}});
  });

  $.on(el, "keydown", function(e){
    if (e.key == "ArrowLeft") {
      e.preventDefault();
      replay(e.shiftKey ? "inception" : "back");
    } else if (e.key == "ArrowRight") {
      e.preventDefault();
      replay(e.shiftKey ? "present": "forward");
    }
  });

  $.on(el, "click", "#replay [data-go]", function(e){
    replay(dom.attr(e.target, "data-go"));
  });

  ready(true);

  return s;
}

async function loadShell(tableId, el){
  function toSession([{data: {user}}, {data: {session: sess}}]){
    return session(user?.id, sess?.access_token);
  }
  return Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]).then(toSession).then(function(session){
    return Promise.all([
      getSeated(tableId),
      getSeat(tableId, session)
    ]).then(function([seated, seat]){
      return shell(
        session,
        tableId,
        seated,
        seat,
        el);
    });
  });
}

if (tableId) {
  const s = await loadShell(tableId, document.body);
  Object.assign(window, {$, _, sh, s, supabase});
} else {
  document.location.href = "../";
}
