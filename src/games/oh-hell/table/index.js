import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "../../../lib/supabase.js";

const root = document.body,
      params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

const div = dom.tag('div'),
      span = dom.tag('span'),
      img = dom.tag('img'),
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
  const {state} = _.deref($state);
  const {at, history, touches} = state;
  const perspective = _.nth(history, _at),
        eventId = _.nth(touches, _at);
  if (!eventId) {
    throw new Error("Unknown position");
  }
  if (perspective){
    _.swap($state, _.assoc(_, "at", _at));
  } else {
    _.fmap(getPerspective(eventId), function(perspective){
      _.swap($state,
        _.pipe(
          _.update(_, "history", _.pipe(expand(_at), _.assoc(_, _at, perspective))),
          _.assoc(_, "at", _at)));
    });
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

function TablePass(session, tableId, seat, state){
  Object.assign(this, {session, tableId, seat, state});
}

function assoc(self, key, value){
  return new TablePass(self.session, self.tableId, self.seat, _.assoc(self.state, key, value));
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

function tablePass(session, tableId, seat){
  return new TablePass(session, tableId, seat, {
    touches: null,
    history: null,
    at: null
  });
}

const Shell = (function(){
  function Shell($pass, $table, $touch, $touches){
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

    const {error, data} = await move(pass.tableId, pass.seat, [command], pass.session);
    if (error) {
      throw error;
    }
    _.log("move", command, data);
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

function shell(session, tableId){
  const $table = table(tableId),
        $seated = _.chain(tableId, getSeated, load),
        $touch = $.pipe($.map(_.get(_, "last_touch_id"), $table), t.compact()),
        $pass = $.cell(null),
        $ready = $.pipe($pass,  t.filter(function(pass){ //TODO cleanup
          const {state} = pass ? pass : {state: null};
          return state?.touches != null && state?.history != null && state?.at != null;
        })),
        $seat = $.map(function(state){
          return state?.seat;
        }, $pass),
        $snapshot = $.map(_.pipe(_.juxt(_.get(_, "history"), _.get(_, "at")), function([history, at]){
          return _.nth(history, at);
        }), $ready),
        $touches = $.pipe($.map(function(pass){
          return pass?.state?.touches;
        }, $pass), t.compact()),
        $hist = $.pipe($.map(_.array, $seat, $.hist($snapshot)), t.filter(function([seat, hist]){
          return seat != null && _.first(hist) != null;
        }));

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

  $.sub($pass, t.compact(), function({state}){
    if (state) {
      const {touches, at} = state;
      dom.attr(root, "data-tense", _.count(touches) - 1 == at ? "present" : "past");
      dom.text(els.touch, at + 1);
      dom.text(els.touches, _.count(touches));
    }
  });

  $.sub($ready, _.see("$pass"));
  $.sub($table, _.see("$table"));
  $.sub($touch, _.see("$touch"));
  $.sub($seated, _.see("$seated"));
  $.sub($hist, _.see("$hist"));

  $.sub($seated, function(seated){
    _.eachIndexed(function(idx, {username, avatar}){
      dom.append(els.players,
        div({class: "zone", "data-seat": idx, "data-username": username, "data-presence": "offline"},
          div({class: "player"},
            div({class: "avatar"}, img({src: `${avatar}?s=104`})),
            div(
              div({class: "username"}, username),
              div(span({class: "points"}, "0"), " pts."),
              div(span({class: "tricks"}, "-"), "/", span({class: "bid"}, "-"), span({class: "tip"}, " (taken/bid)"))),
            img({"data-action": "", src: "../../../images/pawn.svg"})),
          div({class: "played"})));
    }, seated);
  });

  function eventFor(event){
    return event.seat == null ? null : _.chain($seated, _.deref, _.nth(_, event.seat));
  }

  function recipient(player){
    return img({class: "recipient", alt: player.username, src: `${player.avatar}?s=40`});
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
        const seated = _.deref($seated);
        const {scoring} = event.details;
        return _.toArray(_.flatten(_.mapIndexed(function(idx, {points}){
          const player = seated[idx];
          return [recipient(player), span(points)];
        }, scoring)));

      case "award":
        return ["Awards trick to ", recipient(_.chain($seated, _.deref, _.nth(_, event.details.winner))), "."];

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

  $.sub($hist, function([seat, [curr, prior]]){
    const {up, may, seen, events, moves, state, state: {trump, round, status, seated, deck}} = curr;
    const {hand, bid} = _.nth(seated, seat);
    const event = _.last(events);
    const player = eventFor(event);
    _.each(_.doto(_,
      dom.removeClass(_, "active"),
      dom.removeClass(_, "selected"),
      dom.prop(_, "disabled", false)),
        dom.sel("button", els.moves));
    _.chain(moves, _.map(function(move){
      return dom.sel1(`button[data-type="${move.type}"]${moveSel(move)}`, els.moves);
    }, _), _.compact, _.each(dom.addClass(_, "active"), _));
    status == "bidding" && _.doto(dom.sel1(`button[data-type="bid"][data-bid="${bid == null ? '' : bid}"]`),
      dom.addClass(_, "selected"),
      dom.prop(_, "disabled", true));

    dom.toggleClass(els.event, "automatic", !player);
    if (player) {
      dom.attr(dom.sel1("img.who", els.event), "src", `${player.avatar}?=80`);
      dom.text(dom.sel1("p.who", els.event), player.username);
    }
    dom.html(dom.sel1("p", els.event), desc(event));
    _.doto(els.event,
      dom.attr(_, "data-type", event.type),
      dom.addClass(_, "bounce"),
      dom.removeClass(_, "hidden"),
      dom.removeClass(_, "acknowledged"));

    const s = dom.sel1(`[data-seat="${seat}"]`);
    _.eachIndexed(function(idx, {bid, tricks, hand, played, scored}){
      const el = dom.sel1(`[data-seat="${idx}"]`);
      _.includes(seen, idx) && _.doto(el,
        dom.addClass(_, "yours"),
        dom.attr(_, "data-presence", "online"));
      dom.attr(dom.sel1("[data-action]", el), "data-action", _.includes(up, idx) ? "must" : (_.includes(may, idx) ? "may" : ""));
      dom.text(dom.sel1(".tricks", el), _.count(tricks));
      dom.text(dom.sel1(".bid", el), bid == null ? "?" : bid);
      dom.html(dom.sel1(".played", el), _.maybe(played, cardPic, function(src){
        return img({src});
      }));
    }, seated);
    dom.html(els.hand, _.map(function(card){
      return li(img({src: cardPic(card), "data-suit": card.suit, "data-rank": card.rank}));
    }, hand));
    dom.text(dom.sel1("#phase", game), {"bidding": "Bidding", "playing": "Playing", "confirming": "Playing"}[status]);
    dom.attr(root, "data-status", status);
    dom.text(els.cards, _.count(deck) || 52);
    dom.attr(els.trump, "src", _.maybe(trump, cardPic) || "");
    dom.text(els.roundNum, round + 1);
    dom.text(els.roundMax, 13);
  });

  $.sub($touch, function(){
    postTouches($pass, tableId);
  });
  _.fmap(getSeat(tableId, session), function(seat){
    const getPerspectiveByTouch = getPerspective(tableId, session, _, seat);
    $.sub($touches, function(touches){ //always growing
      setAt($pass, _.chain(touches, _.count, _.dec), getPerspectiveByTouch);
    });
    return tablePass(session, tableId, seat);
  }, _.reset($pass, _));
  return new Shell($pass, $table, $touch, $touches);
}

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
        user?.id,
        sess?.access_token),
      tableId);

    $.on(root, "click", "[data-tense=\"present\"] .moves button[data-type=\"bid\"]", function(e){
      const bid = _.maybe(e.target, dom.attr(_, "data-bid"), _.blot, parseInt);
      sh.dispatch(s, {type: "bid", "details": {bid}});
    });

    $.on(root, "click", "[data-tense=\"present\"] .moves button[data-type=\"reset\"], [data-tense=\"present\"] .moves button[data-type=\"undo\"], [data-tense=\"present\"] .moves button[data-type=\"redo\"], [data-tense=\"present\"] .moves button[data-type=\"commit\"]", function(e){
      const type = dom.attr(e.target, "data-type");
      sh.dispatch(s, {type});
    });

    $.on(root, "click", "#event", function(e){
      const self = this;
      dom.addClass(self, "acknowledged");
      setTimeout(function(){
        dom.addClass(self, "hidden");
      }, 500);
    });

    $.on(root, "click", "[data-tense=\"present\"] .hand img", function(e){
      const suit = dom.attr(this, "data-suit"),
            rank = dom.attr(this, "data-rank");
      sh.dispatch(s, {type: "play", details: {card: {suit, rank}}});
    });

    $.on(root, "click", "#replay [data-go]", function(e){
      const go = dom.attr(e.target, "data-go");
      const pass = _.deref(s.$pass);
      const {tableId, seat, session, state} = pass;
      const getPerspectiveByTouch = getPerspective(tableId, session, _, seat);
      const {at, history} = state;
      switch(go) {
        case "back":
          setAt(s.$pass, at - 1, getPerspectiveByTouch);
          break;

        case "forward":
          setAt(s.$pass, at + 1, getPerspectiveByTouch);
          break;

        case "inception":
          setAt(s.$pass, 0, getPerspectiveByTouch);
          break;

        case "present":
          setAt(s.$pass, _.count(history) - 1, getPerspectiveByTouch);
          break;
      }
    });

    Object.assign(window, {$, _, sh, s, supabase});
  });
} else {
  document.location.href = "../";
}
