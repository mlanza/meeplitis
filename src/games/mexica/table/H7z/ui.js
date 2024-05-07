import _ from "/libs/atomic_/core.js";
import dom from "/libs/atomic_/dom.js";
import $ from "/libs/atomic_/reactives.js";
import sh from "/libs/atomic_/shell.js";
import supabase from "/libs/supabase.js";
import * as c from "./core.js";
import {describe} from "./ancillary.js";
import * as g from "/libs/game.js";
import {session, $online} from "/libs/session.js";
import {table, diff, ui, outcome, subject} from "/libs/table.js";
import {getSeated, getSeats, getConfig, story, nav, waypoint, hist, moment, wip} from "/libs/story.js";

function closestAttr(el, attr){
  return _.maybe(el, _.closest(_, `[${attr}]`), dom.attr(_, attr));
}

const retainAttr = _.partly(function retainAttr(el, key, value){
  value == null ? dom.removeAttr(el, key) : dom.attr(el, key, value);
});

function which($latest){ //which entry index changed?
  return $.share($.pipe($.hist($latest),
    _.filter(_.isArray),
    _.filter(function([curr, prior]){
      return _.isArray(curr);
    }),
    _.map(function([curr, prior]){
      return _.conj(curr, _.detectIndex(_.not, _.map(_.isIdentical, curr, prior)));
    })));
}

async function svg(what){
  return await fetch(import.meta.resolve(`./images/${what}.svg`)).then(function(resp){
    return resp.text();
  });
}

const _temple = [await svg(1), await svg(2), await svg(3), await svg(4)],
      _pilli = await svg("pilli"),
      _emperor = await svg("tonacacihuatl");

function temple({size, seat}){
  const parser = new DOMParser();
  const el = parser.parseFromString(_temple[size - 1], "image/svg+xml").childNodes[1];
  dom.attr(el, "data-seat", seat);
  dom.attr(el, "data-piece", "temple");
  return el;
}

function pilli({seat}){
  const parser = new DOMParser();
  const el = parser.parseFromString(_pilli, "image/svg+xml").childNodes[0];
  dom.attr(el, "data-seat", seat);
  dom.attr(el, "data-piece", "pilli");
  return el;
}

function emperor(){
  const parser = new DOMParser();
  const el = parser.parseFromString(_emperor, "image/svg+xml").childNodes[0];
  dom.attr(el, "data-piece", "emperor");
  return el; //TODO need next bit?
  return _.doto(pilli({seat: -1}),
    dom.removeAttr(_, "data-seat"),
    dom.attr(_, "data-piece", "emperor"));
}

function canal({size, orientation}){
  return img({src: `./images/canal${size}.png`, "data-piece": "canal", "data-size": size, "data-orientation": orientation});
}

function bridge({orientation}){
  return img({src: "./images/bridge.svg", "data-piece": "bridge", "data-orientation": orientation});
}

function token(){
  return img({src: "./images/token.png", "data-piece": "token"});
}

function capulli({size}){
  return img({src: `./images/c${size}.png`, "data-piece": "capulli", "data-size": size});
}

function demand(pos){
  return li({"data-demand": pos});
}

function at(spot){
  return dom.sel1(`[data-spot='${spot}'] .contents`, el);
}

function spot([spot, terrain]){
  return div({"data-spot": spot, "data-terrain": terrain},
    div({class: "contents"}),
    div({class: "propose"}));
}

const {img, ol, li, div, kbd, span} = dom.tags(['img', 'ol', 'li', 'div', 'kbd', 'span']);

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

if (!tableId) {
  document.location.href = "../";
}

const el = dom.sel1("#table");
const board = dom.sel1("#board", el);
const actions = dom.sel1("#actions", el);
const supplies = dom.sel1("#supplies", el);
const demands = dom.sel1("#demands", el);

const [seated, seats] = await Promise.all([
  getSeated(tableId),
  getSeats(tableId, session)
]);
const seat = _.first(seats);

function resources(title, resource, _attrs, supply){
  const attrs = Object.assign({orientation: "vertical", size: 1}, _attrs);
  const {size} = attrs;
  return div({class: title, "data-size": size, "data-remaining": supply},
    div(_.map(span, _.range(0, supply + 1))),
    ol({title}, _.repeatedly(supply, function(){
      return li(resource(attrs));
    })));
}

const supply = {
  canal2: _.partial(resources, "canals", canal, {size: 2}, 35),
  canal1: _.partial(resources, "canals", canal, {size: 1}, 6),
  bridges: _.partial(resources, "bridges", bridge, {size: 1}, 11),
  tokens: _.partial(resources, "tokens", token, null, 12),
  temples: _.partial(resources, "temples", temple)
}

dom.append(supplies,
  supply.canal2(),
  supply.canal1(),
  supply.bridges(),
  supply.tokens());

const els = {
  board,
  supplies,
  demands,
  actions,
  tokens: dom.sel1(".tokens", supplies),
  bridges: dom.sel1(".bridges", supplies),
  canal2: dom.sel1(".canals[data-size='2']", supplies),
  canal1: dom.sel1(".canals[data-size='1']", supplies)
}

dom.append(els.board,
  _.map(spot, c.boardSpots),
  emperor());

dom.append(els.board, _.map(_.pipe(_.add(_, 64), String.fromCharCode, function(letter){
  return div({"data-column": letter}, letter);
}), _.range(0, 23)))

dom.append(els.board, _.map(function(number){
  return div({"data-row": number}, number);
}, _.range(1, 15)))

dom.append(els.demands,
  _.map(demand, _.range(8)));

function desc({type, details}){
  switch(type) {
    case "started":
      return "Starts game.";
    case "dealt-capulli":
      return "Deals capulli tiles.";
    case "scattered-temples":
      return "Scattered nonplayer temples.";
    case "placed-pilli":
      return `Places Pilli Mexica at ${details.at}.`;
    case "constructed-canal":
        return `Constructs canal at ${_.join(' & ', details.at)}.`;
    case "constructed-bridge":
      return `Constructs bridge at ${details.at}.`;
    case "relocated-bridge":
      return `Relocates bridge from ${details.from} to ${details.to}.`;
    case "banked":
      return "Banks an action point.";
    case "founded-district":
      return `Founds ${details.size} district at ${details.at}.`;
    case "built-temple":
      return `Builds level ${details.level} temple at ${details.at}.`;
    case "committed":
      return "I'm done.";
    case "scored-grandeur":
      const game = _.chain($story, moment);
      return [
        "Emperor awards spiritual grandeur!",
        scores(g.seats(game), details, _.deref(game))
      ];
    case "concluded-period":
      return "The 2nd period begins!";
    case "removed-unfoundables":
      return `Removes ${details.removed.length} unfoundable capulli tile(s).`;
    case "passed":
      return "Passed.";
    case "finished":
      return outcome(seated, details);
    case "moved":
      switch(details.by){
        case "foot":
          return `Moves from ${details.from} to ${details.to}.`;
        case "boat":
          return `Moves by boat from ${details.from} to ${details.to}.`;
        case "teleport":
          return `Teleports from ${details.from} to ${details.to}.`;
        default:
          return "Moved";
      }
    default:
      return type;
  }
}

function fail(error){
  const {message} = error;
  sh.dispatch($wip, null);
  dom.text(dom.sel1("#error p", el), message);
  dom.addClass(el, "error");
  dom.removeClass(el, "ack");
}

const placePilli = {type: "place-pilli"};

const log    = _.log,
      $table = table(tableId),
      $ready = $.cell(false),
      $story = story(session, tableId, seat, seated, await getConfig(tableId), _.partial(log, "story"), $ready, fail, c.mexica),
      $hist  = hist($story),
      $wip   = wip($story, function(game){
        const {seated} = _.deref(game);
        const pilli = _.chain(seated, _.nth(_, seat), _.get(_, "pilli"));
        if (_.isSome(seat) && _.isNil(pilli) && _.includes(g.up(game), seat)) {
          sh.dispatch($wip, placePilli);
        }
      }),
      $both  = which($.latest([$hist, $wip]));

$.sub($ready, function(ready){
  if (!ready){ //upon issuing a move...
    sh.dispatch($wip, null); //...clear any work in progress
  }
});

$.sub($both, _.partial(log, "$both"));

function template(seat){
  return {
    stats: div(span({class: "points"}, "0"), " pts."),
    resources: [
      supply.temples({size: 1, seat}, 6),
      supply.temples({size: 2, seat}, 5),
      supply.temples({size: 3, seat}, 4),
      supply.temples({size: 4, seat}, 3),
      supply.tokens()
    ]
  };
}

//universal ui
ui($table, $story, $ready, $hist, $online, describe, _.partial(log, "ui"), seated, seat, desc, template, el);

function remaining(slots){
  return _.count(_.filter(_.isNil, slots));
}

function indices(xs){
  return _.range(0, _.count(xs));
}

function omit(el){
  el && dom.addClass(el, "gone");
}

function reconcileTemples(seat, level){
  return function(curr, prior){
    _.each(function(n){
      diff(curr, prior, [n], function(curr, prior){
        if (curr){
          dom.append(at(curr), temple({size: level, seat}));
        }
        if (prior){
          omit(dom.sel1("[data-piece='temple']", at(prior)));
        }
      });
    }, indices(curr || prior));
  }
}

function phase(status){
  const overall = _.first(status);
  if (overall === "finished") {
    return "Finished";
  } else {
    const [period, round, phase] = _.chain(status, _.rest, _.toArray)
    switch(phase) {
      case "placing-pilli":
        return `Choose Starting Spaces`;
      case "actions":
        return `Period ${period} : Round ${round}`;
    }
    return "";
  }
}

function workingCommand([curr, prior], seat, {contents}, game, el){
  const type = curr?.type;
  const attrs = {
    "data-command-type": type,
    "data-command-spots": null,
    "data-command-horizontal-spots": null,
    "data-command-vertical-spots": null,
    "data-command-size": null,
    "data-command-from": null,
    "data-command-to": null,
    "data-command-destinations": null,
    "data-command-at": null
  };
  switch (type) { //only multi-step commands appear here
    case "place-pilli": {
      attrs["data-command-at"] = _.chain(g.moves(game, {type, seat}), _.map(_.getIn(_, ["details", "at"]), _), _.join(" ", _));
      break;
    }
    case "construct-canal": {
      const {details} = curr;
      const spots = _.filter(_.partial(c.dry, c.board, contents), c.spots);
      attrs["data-command-spots"] = _.join(" ", spots);
      attrs["data-command-size"] = details.size;
      attrs["data-command-at"] = details.at;
      break;
    }
    case "move":
      const {details} = curr;
      const moves = g.moves(game, {type, seat});
      const to = _.maybe(moves, _.filter(_.comp(_.includes(["foot", "boat"], _), _.getIn(_, ["details", "by"])), _), _.mapa(_.getIn(_, ["details", "to"]), _), _.seq, _.join(" ", _));
      const teleport = _.chain(moves, _.detect(_.comp(_.eq(_, "teleport"), _.getIn(_, ["details", "by"])), _), _.not, _.not);
      const destinations = teleport ? _.join(" ", c.destinations(contents)) : null;
      attrs["data-command-from"] = details.from;
      attrs["data-command-to"] = to;
      attrs["data-command-destinations"] = destinations;
      break;
    case "construct-bridge": {
      const {horizontal, vertical} = c.bridgePlacements(contents);
      attrs["data-command-horizontal-spots"] = _.join(" ", horizontal);
      attrs["data-command-vertical-spots"] = _.join(" ", vertical);
      break;
    }
    case "relocate-bridge": {
      const {details} = curr;
      const {horizontal, vertical} = c.bridgePlacements(contents);
      attrs["data-command-from"] = details.from;
      attrs["data-command-horizontal-spots"] = _.join(" ", horizontal);
      attrs["data-command-vertical-spots"] = _.join(" ", vertical);
      break;
    }
    case "build-temple": {
      const {details} = curr;
      attrs["data-command-size"] = details.size;
      break;
    }
  }
  _.eachkv(retainAttr(el, _, _), attrs);
}

$.sub($both, function([[curr, prior, motion, game], wip, which]){
  const {state, up} = curr;
  const {seated, tokens, canal1, canal2, bridges, period, contents, status, round, spent} = state;
  const {step, present} = motion;
  const moves = present ? g.moves(game, {type: ["pass", "commit"], seat}) : null;
  const foundables = present ? g.moves(game, {type: "found-district", seat}) : null;

  dom.attr(el, "data-status", status);
  dom.removeClass(el, "error");

  if (which === 1) {
    return present ? workingCommand(wip, seat, state, game, el) : null;
  }

  _.chain(moves, _.map(_.get(_, "type"), _), _.distinct, _.join(" ", _), dom.attr(el, "data-allow-commands", _));

  _.each(dom.removeClass(_, "foundable"), dom.sel(".foundable", demands));

  dom.toggleClass(el, "scoring-round", _.get(state, "scoring-round"));
  dom.text(dom.sel1("#phase", el), phase(g.status(game)));
  dom.attr(els.actions, "data-remaining", status == "actions" ? _.max(6 - spent, 0) : 0);

  _.doseq(function(level){
    diff(curr, prior, ["state", "nonplayer", "temples", level], reconcileTemples(2, level));
  }, _.range(1, 5));

  _.doseq(function(period, seat, level){
    diff(curr, prior, ["state", "seated", seat, "temples", period, level], reconcileTemples(seat, level));
  }, [0, 1], indices(seated), _.range(1, 5));

  const cCapulli = _.getIn(curr, ["state", "capulli", curr?.state?.period]),
        pCapulli = _.getIn(prior, ["state", "capulli", prior?.state?.period]);
  _.each(function(pos){
    diff(cCapulli, pCapulli, [pos], function(curr, prior){
      dom.html(
        dom.sel1(`[data-demand='${pos}']`, el),
        curr && !curr.at ? capulli(curr) : null);
    });
  }, _.range(0, 8));

  _.doseq(function(period, pos){
    diff(curr, prior, ["state", "capulli", period, pos], function(curr, prior){
      if (curr?.at && !prior?.at){
        dom.append(at(curr.at), capulli(curr));
      }
      if (prior?.at && !curr?.at) {
        omit(dom.sel1("[data-piece='capulli']", at(prior.at)));
      }
    });
  }, _.range(0, 2), _.range(0, 8));

  const foundable = _.maybe(foundables, _.filter(_.includes(_, ["type", "found-district"]), _), _.first, _.getIn(_, ["details", "size"]));
  _.maybe(dom.sel1(`img[data-piece='capulli'][data-size='${foundable}']`, demands), dom.addClass(_, "foundable"));
  retainAttr(el, "data-foundable", foundable);
  _.chain(foundables, _.map(_.getIn(_, ["details", "at"]), _), _.seq, _.join(" ", _), _.blot, retainAttr(el, "data-found-at", _));

  _.chain(bridges, _.compact, _.join(" ", _), dom.attr(el, "data-bridges-at", _));
  _.chain(state, _.getIn(_, ["seated", seat, "pilli"]), dom.attr(el, "data-pilli-at", _));

  diff(curr, prior, ["state", "canal2"], function(curr, prior){
    _.each(function(n){
      diff(curr, prior, [n], function(curr, prior){
        if (prior) {
          omit(dom.sel1("[data-piece='canal']", at(prior[0])));
        }
        if (curr) {
          const orientation = c.below(curr[0]) == curr[1] ? "vertical" : "horizontal";
          dom.append(at(curr[0]), canal({size: 2, orientation}));
        }
      });
    }, indices(curr || prior));
  });

  diff(curr, prior, ["state", "canal1"], function(curr, prior){
    _.each(function(n){
      diff(curr, prior, [n], function(curr, prior){
        if (prior) {
          omit(dom.sel1("[data-piece='canal']", at(prior[0])));
        }
        if (curr) {
          dom.append(at(curr[0]), canal({size: 1}));
        }
      });
    }, indices(curr || prior));
  });

  diff(curr, prior, ["state", "bridges"], function(curr, prior){
    _.each(function(n){
      diff(curr, prior, [n], function(curr, prior){
        if (prior) {
          omit(dom.sel1("[data-piece='bridge']", at(prior)));
        }
        if (curr) {
          const orientation = c.dry(c.board, contents, c.above(curr)) && c.dry(c.board, contents, c.below(curr)) ? "vertical" : "horizontal";
          dom.append(at(curr), bridge({orientation}));
        }
      });
    }, indices(curr || prior));
  });

  dom.attr(els.tokens, "data-remaining", tokens);
  dom.attr(els.bridges, "data-remaining", remaining(bridges));
  dom.attr(els.canal1, "data-remaining", remaining(canal1));
  dom.attr(els.canal2, "data-remaining", remaining(canal2));

  _.eachkv(function(seat, {bank, temples, points}){
    const zone = dom.sel1(`[data-seat='${seat}']`, el),
          area = dom.sel1(".area", zone);

    dom.text(dom.sel1(".points", zone), points);
    dom.attr(dom.sel1(".tokens", area), "data-remaining", bank);

    _.chain(temples, _.take(period + 1, _), c.consolidateTemples, _.eachkv(function(level, spots){
      dom.attr(dom.sel1(`.temples[data-size='${level}'`, area), "data-remaining", remaining(spots));
    }, _));

    diff(curr, prior, ["state", "seated", seat, "pilli"], function(curr, prior){
      if (prior){
        omit(dom.sel1("[data-piece='pilli']", at(prior)));
      }
      if (curr){
        dom.append(at(curr), pilli({seat}));
      }
    });
  }, seated);

  _.each(dom.removeClass(_, "scored"), dom.sel(".zone[data-seat] .scored", el));
  if (step === 1) {
    _.each(function(seat){
      diff(curr, prior, ["state", "seated", seat, "points"], function(curr, prior){
        if (prior != null && curr != null && curr > prior) {
          dom.addClass(dom.sel1(`.zone[data-seat='${seat}'] div.player`, el), "scored");
        }
      });
    }, indices(seated));
  }
});

function focal(options, what, target){
  _.each(function(id){
    _.maybe(el, dom.sel1(`#${id}`, _), dom.removeAttr(_, "id"));
  }, options);
  _.maybe(what, dom.attr(target, "id", _));
}

function scores(seats, {districts, palace}, {board, contents}){
  const {img, ol, li, div, span, table, thead, tbody, tfoot, tr, th, td, sup, figure} = dom.tags(['small', 'img', 'ol', 'li', 'div', 'span', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'sup', 'figure']);

  function ranking(rank, tied){
    const suffix = rank === 1 ? "st" : rank === 2 ? "nd" : "rd";
    return div({class: "rank"}, rank, sup(suffix, tied ? "*" : ""));
  }

  const n = _.chain(districts, _.getIn(_, [0, "points"]), _.count);
  const heads = _.map(function(idx){
    const seat = _.nth(seats, idx);
    const {avatar_url} = seat || {avatar_url: "./images/shaman.png"};
    return th({class: seat ? "" : "nonplayer"}, figure({class: "avatar"}, img({src: avatar_url})));
  }, _.range(0, n));

  const bonuses = palace ? _.mapa(function(idx){
    return _.chain(palace, _.nth(_, idx), span, th);
  }, _.range(0, n)) : null;

  const totals = _.mapa(function(idx){
    return _.chain(districts, _.map(_.getIn(_, ["points", idx]), _), _.sum, span, th);
  }, _.range(0, n));

  const rows = _.chain(districts, _.sort(_.desc(_.get(_, "size")), _), _.map(function({at, size, points}){
    const ranked = _.chain(points, _.unique, _.sort(_.desc(_.identity), _));
    const founded = c.founded(contents, c.district(board, contents, at));
    const scored = _.detect(_.gt(_, 0), points);
    return founded || scored ? tr(th({class: "at"}, founded ? img({src: `./images/c${size}.png`, "data-piece": "capulli", "data-size": size}) : [img({src: `./images/capulli.png`, "data-piece": "capulli", "data-size": size}), div({class: "size"}, size)], span(at)), _.chain(points, _.mapIndexed(function(idx, score){
          const rank = _.indexOf(ranked, score) + 1,
                ties = _.chain(points, _.filter(_.eq(score, _), _), _.count, _.gt(_, 1));
      return td({"data-score": score}, ranking(rank, score > 0 && ties), span({class: "score"}, score));
    },  _), _.toArray)) : null;
  }, _));

  return [
    table({class: "scored"},
      thead(
        tr(th({class: "corner"}), heads),
        tr({class: "palace"}, th(div("Palace")), bonuses),
        tr({class: "districts"}, th(div("Districts")), totals)
      ),
      tbody(
        rows
      )),
    div({class: "note"},"Scroll to view district rankings")
  ];
}

const moving = _.partial(focal, ["pilli", "bridge"]);

$.on(document.body, "keydown", function(e){
  switch(e.key){
    case "Escape": //cancel a command in progress
      sh.dispatch($wip, null);
      dom.removeClass(el, "error");
      break;
    case ".":
      sh.dispatch($story, {type: "pass"});
      break;
    case "Enter":
      sh.dispatch($story, {type: "commit"});
      break;
  }
});

$.on(el, "animationend", "[data-piece]", function(e){
  if (e.animationName === "fade-out"){
    dom.omit(this);
  }
});

$.on(el, "click", `#table.act[data-foundable]:not([data-command-type]) div[data-spot]`, function(e){
  const type  = "found-district",
        at    = closestAttr(this, "data-spot"),
        size  = _.maybe(dom.attr(el, "data-foundable"), _.blot, parseInt),
        spots = _.chain(dom.attr(el, "data-found-at"), _.split(_, " "));
  if (size && _.includes(spots, at)) {
    sh.dispatch($story, {type, details: {size, at}});
  }
});

$.on(el, "click", `#table.act[data-command-type="move"][data-command-from] div[data-spot]`, function(e){
  const type = "move",
        from = closestAttr(this, "data-command-from"),
        to   = closestAttr(this, "data-spot"),
        game = moment($story),
        moves = g.moves(game, {type, seat}),
        move = _.maybe(moves, _.detect(function({details}){
          return (details.from === from && details.to === to) || details.by === "teleport"
        }, _), _.update(_, "details", _.merge(_, {from, to}))); //merge completes teleport
  if (move) {
    sh.dispatch($story, move);
  }
});

$.on(el, "click", `#table.act[data-status='actions'] .zone.yours .area div.temples:not([data-remaining="0"])`, function(e){
  const type = "build-temple",
        size = parseInt(closestAttr(this, "data-size"));
  sh.dispatch($wip, {type, details: {size}});
});

$.on(el, "click", `#table.act[data-status='actions'][data-command-type="build-temple"] div[data-spot]`, function(e){
  const type = "build-temple",
        at   = closestAttr(this, "data-spot"),
        level = parseInt(closestAttr(this, "data-command-size"));
  sh.dispatch($story, {type, details: {level, at}});
});

$.on(el, "click", `#table.act[data-status='actions'][data-command-type="relocate-bridge"][data-command-from] div[data-spot]`, function(e){
  const type = "relocate-bridge",
        from = closestAttr(this, "data-command-from"),
        to   = closestAttr(this, "data-spot");
  sh.dispatch($story, {type, details: {from, to}});
});

$.on(el, "click", `#table.act[data-status='placing-pilli'][data-command-type="place-pilli"][data-command-at~="H6"] div[data-spot="H6"] div.propose, #table.act[data-command-type="place-pilli"][data-command-at~="H8"] div[data-spot="H8"] div.propose, #table.act[data-command-type="place-pilli"][data-command-at~="I7"] div[data-spot="I7"] div.propose, #table.act[data-command-type="place-pilli"][data-command-at~="G7"] div[data-spot="G7"] div.propose`, function(e){
  const type = "place-pilli",
        at = closestAttr(this, "data-spot");
  sh.dispatch($story, {type, details: {at}});
});

$.on(el, "click", `#table.act .moves button[data-type="commit"], #table.act .moves button[data-type="pass"]`, function(e){
  const type = dom.attr(this, "data-type");
  sh.dispatch($story, {type});
});

$.on(el, "click", `#table.act[data-status='actions'] #supplies div.tokens`, function(e){
  sh.dispatch($story, {type: "bank"});
});

$.on(el, "click", `#table.act[data-status='actions'][data-command-type="construct-bridge"] div[data-spot]`, function(e){
  const type = "construct-bridge",
        at   = closestAttr(this, "data-spot");
  sh.dispatch($story, {type, details: {at}});
});

$.on(el, "click", `#table.act[data-status='actions'] #supplies div.bridges`, function(e){
  sh.dispatch($wip, {type: "construct-bridge"});
});

$.on(el, "click", `#table.act[data-status='actions'][data-command-type="construct-canal"][data-command-size="1"] div[data-spot]`, function(e){
  const type = "construct-canal",
        at   = closestAttr(this, "data-spot");
  sh.dispatch($story, {type, details: {at: [at]}});
});

$.on(el, "click", `#table.act[data-status='actions'][data-command-type="construct-canal"][data-command-size="2"] div[data-spot]`, function(e){
  const type = "construct-canal",
        at   = _.distinct(_.compact([closestAttr(this, "data-command-at"), closestAttr(this, "data-spot")])),
        size = parseInt(closestAttr(this, "data-command-size"));
  if(_.count(at) == 2) {
    sh.dispatch($story, {type, details: {at}});
  } else {
    sh.dispatch($wip, {type, details: {size: 2, at}});
  }
});

$.on(el, "click", `#table.act[data-status='actions'] #supplies div.canals`, function(e){
  const type = "construct-canal",
        size = parseInt(closestAttr(this, "data-size"));
  sh.dispatch($wip, {type, details: {size}});
});

$.on(el, "click", `#table.act[data-status='actions']:not([data-command-type="move"]) div[data-spot]`, function(e){
  const piece = _.chain([
      dom.sel1(`.contents > [data-piece='pilli'][data-seat='${seat}']`, this),
      dom.sel1(".contents > [data-piece='bridge']", this)
    ],
    _.compact,
    _.first);

  const what = _.maybe(piece, dom.attr(_, "data-piece"));
  switch(what){
    case "pilli": {
      const type = "move",
            from = closestAttr(this, "data-spot");
      sh.dispatch($wip, {type, details: {from}});
      break;
    }

    case "bridge": {
      const type = "relocate-bridge",
            from = closestAttr(this, "data-spot");
      sh.dispatch($wip, {type, details: {from}});
      break;
    }
  }
});

Object.assign(window, {$, g, _, sh, c, moment, session, $story, $wip, $table, $online, supabase});
