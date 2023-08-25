import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import {games, render} from "/lib/games.js";

const params = new URLSearchParams(document.location.search),
      column = params.get('c') || "all_tables";

const ul = dom.sel1("section.games > ul");
const li = dom.tag('li'), p = dom.tag('p');

function entitle(column){
  switch(column) {
    case "open_tables":
      return "with open tables";
    case "started_tables":
      return "with started tables";
    default:
      return "one might play";
  }
}

_.chain(column, entitle, dom.append(dom.sel1(".headline"), " ", _));

_.fmap(games(column), _.see("games"), _.map(_.pipe(render, li), _), function(els){
  _.doto(ul,
    dom.html(_, null),
    dom.append(_, _.seq(els) ? els : li(p("None found."))));
});
