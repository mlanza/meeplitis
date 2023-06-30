import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import $ from "/lib/atomic_/reactives.js";
import sh from "/lib/atomic_/shell.js";
import supabase from "/lib/supabase.js";
import * as c from "../core.js";
import * as g from "/lib/game.js";
import {session, $online} from "/lib/session.js";
import {table, ui, scored, outcome, subject} from "/lib/table.js";
import {getSeated, getSeat, story, nav, waypoint, hist} from "/lib/story.js";
import {describe} from "/components/table/index.js";

async function svg(what){
  return await fetch(`../table/images/${what}.svg`).then(function(resp){
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

const {img, ol, li, div, kbd, span} = dom.tags(['img', 'ol', 'li', 'div', 'kbd', 'span']);

const params = new URLSearchParams(document.location.search),
      tableId = params.get('id');

dom.addClass(document.body, "initialized"); //TODO temporary

if (!tableId) {
  document.location.href = "../";
}

const el = document.body;
const board = dom.sel1("#board", el);
const actions = dom.sel1("#actions", el);
const supplies = dom.sel1("#supplies", el);
const demands = dom.sel1("#demands", el);

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
      return "Emperor awards spiritual grandeur!";
    case "concluded-period":
      return "The 2nd period begins!";
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

//TODO when finished, port to `story` module
function wip($story){
  const $data  = $.cell({}),
        $head  = $.map(_.comp(_.last, _.get(_, "touches")), $story),
        $at    = $.map(function({at, touches}){
          return _.get(touches, at);
        }, $story),
        $ctx   = $.map(function(data, head, at){
          return head == at ? _.get(data, at, {}) : null;
        }, $data, $head, $at),
        $wip   = $.hist($ctx); //, _.drop(2));

  function dispatch(self, command){
    _.swap($data, _.assoc(_, _.deref($at), command));
  }

  $.sub($at, _.see("$at"));
  $.sub($head, _.see("$head"));

  _.doto($wip, _.specify(sh.IDispatch, {dispatch}));

  return $wip;
}

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

const $table = table(tableId),
      $story = story(session, tableId, seat, seated, dom.attr(el, "data-ready", _)),
      $hist  = hist(c.mexica, $story),
      $wip   = wip($story),
      $both  = which($.latest([$hist, $wip]));

$.sub($both, _.see("$both"));

function test(){
  sh.dispatch($wip, {type: "place-pilli"});
}

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

function diff(curr, prior, path, f){ //TODO promote
  const c = _.getIn(curr, path),
        p = _.getIn(prior, path);
  if (_.notEq(c, p)) {
    f(c, p);
  }
}

//universal ui
ui($table, $story, $hist, $online, seated, seat, desc, template, el);

$.sub($table, _.comp(_.compact(), _.map(describe), _.map(_.join("\n", _))), function(descriptors){
  dom.attr(dom.sel1("#title"), "title", descriptors || "Normal game");
});

function remaining(slots){
  return _.count(_.filter(_.isNil, slots));
}

function indices(xs){
  return _.range(0, _.count(xs));
}

function omit(el){
  dom.addClass(el, "gone");
}

function dropPriorOmissions(el){
  _.each(dom.omit, dom.sel(".gone", el));
}

$.sub($both, function([[curr, prior, motion, game], wip, which]){
  const {step, offset, touch} = motion;
  const {state} = curr;
  const {seated, tokens, canal1, canal2, bridges, period, contents, status, round, spent} = state;
  const up = _.includes(g.up(game), seat);
  const play = up && offset === 0;

  _.chain(game, g.moves, _.toArray, _.see("moves")); //debugging only

  dropPriorOmissions(el);

  _.each(dom.removeClass(_, "foundable"), dom.sel(".foundable", demands));

  dom.toggleClass(el, "scoring-round", step > 0 && _.get(state, "scoring-round"));
  dom.text(dom.sel1("#phase", el), {"placing-pilli": `Choose Starting Spaces`, "actions": `Round ${round}`, "finished": "Finished"}[status]);
  dom.attr(els.board, "data-propose", "canal");
  dom.attr(els.actions, "data-remaining", status == "actions" ? _.max(6 - spent, 0) : 0);

  _.doseq(function(period, seat, level){
    diff(curr, prior, ["state", "seated", seat, "temples", period, level], function(curr, prior){
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
    });
  },  [0, 1], indices(seated), _.range(1, 5));

  _.each(function(pos){
    diff(curr, prior, ["state", "capulli", period, pos], function(curr, prior){
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

  const foundable = _.maybe(g.moves(game, {type: "found-district"}), _.filter(_.includes(_, ["type", "found-district"]), _), _.seq, _.mapa(_.getIn(_, ["details", "size"]), _), _.first);
  _.maybe(dom.sel1(`img[data-piece='capulli'][data-size='${foundable}']`, demands), dom.addClass(_, "foundable"));

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

Object.assign(window, {$, g, _, sh, test, session, $story, $table, $online, supabase});
