import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";
import {session, $online} from "/lib/session.js";
import {table, ui, scored, outcome, subject} from "/lib/table.js";
import {getSeated, getSeat, story, nav, waypoint, hist} from "/lib/story.js";
import {describe} from "/components/table/index.js";
import {boardSpots, right, below} from "../core.js";

async function svg(what){
  return await fetch(`../table/images/${what}.svg`).then(function(resp){
    return resp.text();
  });
}

const _temple = [await svg(1), await svg(2), await svg(3), await svg(4)],
      _pilli = await svg("pilli");

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
  return img({src: `./images/c${size}.png`, "title": `capulli for district size ${size}`, "data-piece": "capulli", "data-size": size});
}

function demand(pos){
  return li({"data-demand": pos});
}

function at(spot){
  return dom.sel1(`[data-spot='${spot}'] .contents`, el);
}

function spot([spot, terrain]){
  return div({"title": spot, "data-spot": spot, "data-terrain": terrain},
    div({class: "contents"}),
    div({class: "propose"}));
}

const img = dom.tag('img'),
      ol = dom.tag('ol'),
      li = dom.tag('li'),
      div = dom.tag('div'),
      span = dom.tag('span');

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

dom.addClass(document.body, "initialized"); //TODO temporary

if (!tableId) {
  document.location.href = "../";
}

const el = document.body;
const board = dom.sel1("#board", el);
const supplies = dom.sel1("#supplies", el);
const demands = dom.sel1("#demands", el);

dom.attr(board, "data-propose", "canal");

const [seated, seat] = await Promise.all([
  getSeated(tableId),
  getSeat(tableId, session)
]);

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
  tokens: dom.sel1(".tokens", supplies),
  bridges: dom.sel1(".bridges", supplies),
  canal2: dom.sel1(".canals[data-size='2']", supplies),
  canal1: dom.sel1(".canals[data-size='1']", supplies)
}

dom.append(els.board,
  _.map(spot, boardSpots));

dom.append(els.demands,
  _.map(demand, _.range(8)));

/*
dom.append(at("Q7"),
  canal({size: 1, orientation: "vertical"}),
  bridge({orientation: "vertical"}),
  pilli({seat: 0}));

dom.append(at("Q8"),
  temple({size: 3, seat: 0}));

dom.append(at("Q9"),
  temple({size: 1, seat: 1}));

dom.append(at("R9"),
  temple({size: 2, seat: 3}));

dom.append(at("P7"),
  canal({size: 2, orientation: "vertical"}));

dom.append(at("P9"),
  canal({size: 2, orientation: "vertical"}));
*/

function desc(event){
  const details = event.details;
  switch(event.type) {
    case "started":
      return "Starts game.";
    case "dealt-capulli":
      return "Deals capulli tiles.";
    case "placed-pilli":
      return `Places Pilli Mexica at ${event.details.at}.`;
    case "constructed-canal":
        return `Constructs canal at ${_.join(' & ', event.details.at)}.`;
    case "banked":
      return "Banks an action point.";
    case "founded-district":
      return `Founds ${event.details.size} district at ${event.details.at}.`;
    case "committed":
      return "I'm done.";
    case "moved":
      switch(details.by){
        case "foot":
          return `Moved from ${details.from} to ${details.to}.`;
        case "teleport":
        case "boat":
        default:
          return "Moved";
      }
    default:
      return event.type;
  }
}

const $table = table(tableId),
      $story = story(session, tableId, seat, seated, dom.attr(el, "data-ready", _)),
      $hist = hist($story);

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

function diff(curr, prior, path, f){
  const c = _.getIn(curr, path),
        p = _.getIn(prior, path);
  if (_.notEq(c, p)) {
    f(c, p);
  }
}

function diffEach(f){
  return function(curr, prior){
    _.chain(
      _.map(_.array,
        curr || _.repeat(37, null),
        prior || _.repeat(37, null)),
      _.filter(_.spread(_.notEq), _),
      _.each(_.spread(f), _));
  }
}

//universal ui
ui($table, $story, $hist, $online, seated, seat, desc, template, el);

$.sub($table, _.comp(t.compact(), t.map(describe), t.map(_.join("\n", _))), function(descriptors){
  dom.attr(dom.sel1("#title"), "title", descriptors || "Normal game");
});

function remaining(slots){
  return _.count(_.filter(_.isNil, slots));
}

function omit(el){
  dom.addClass(el, "gone");
}

$.sub($hist, function([curr, prior]){
  const {state, seen} = curr;
  const {seated, tokens, canal1, canal2, bridges, period} = state;

  _.each(dom.omit, dom.sel(".gone", el));

  _.each(function(pos){
    diff(curr, prior, ["state", "capulli", period, pos], function(curr, prior){
      dom.html(
        dom.sel1(`[data-demand='${pos}']`, el),
        curr && !curr.at ? capulli(curr) : null);
      if (curr?.at && !prior?.at){
        dom.append(at(curr.at), capulli(curr));
      }
      if (prior?.at && !curr?.at) {
        omit(dom.sel1("[data-piece='capulli']", at(prior.at)));
      }
    });
  }, _.range(0, 8));

  diff(curr, prior, ["state", "canal2"], diffEach(function(curr, prior){
    if (prior) {
      omit(dom.sel1("[data-piece='canal']", at(prior[0])));
    }
    if (curr) {
      const orientation = below(curr[0]) == curr[1] ? "vertical" : "horizontal";
      dom.append(at(curr[0]), canal({size: 2, orientation}));
    }
  }));

  diff(curr, prior, ["state", "canal1"], diffEach(function(curr, prior){
    if (prior) {
      omit(dom.sel1("[data-piece='canal']", at(prior[0])));
    }
    if (curr) {
      dom.append(at(curr[0]), canal({size: 1}));
    }
  }));

  dom.attr(els.tokens, "data-remaining", tokens);
  dom.attr(els.bridges, "data-remaining", remaining(bridges));
  dom.attr(els.canal1, "data-remaining", remaining(canal1));
  dom.attr(els.canal2, "data-remaining", remaining(canal2));

  _.eachkv(function(seat, {bank, temples, points}){
    const zone = dom.sel1(`[data-seat='${seat}']`, el),
          area = dom.sel1(".area", zone);

    dom.text(dom.sel1(".points", zone), points);
    dom.attr(dom.sel1(".tokens", area), "data-remaining", bank);

    _.eachkv(function(level, spots){
      dom.attr(dom.sel1(`.temples[data-size='${level}'`, area), "data-remaining", remaining(spots));
    }, temples);

    diff(curr, prior, ["state", "seated", seat, "pilli"], function(curr, prior){
      if (prior){
        omit(dom.sel1("[data-piece='pilli']", at(prior)));
      }
      if (curr){
        dom.append(at(curr), pilli({seat}));
      }
    });
  }, seated);

});

Object.assign(window, {$, _, sh, session, $story, $table, $online, supabase});
