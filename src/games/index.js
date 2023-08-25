import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import {games, render} from "/lib/games.js";

const params = new URLSearchParams(document.location.search);
const column = params.get('c') || "all_tables";
const li = dom.tag('li'), p = dom.tag('p');

function entitle(column){
  switch(column) {
    case "open_tables":
      return "With Open Tables";
    case "started_tables":
      return "With Started Tables";
    default:
      return "All";
  }
}

_.fmap(games(column), _.see("games"), _.map(_.pipe(render, li), _), function(els){
  const h1 = dom.sel1("section.games > h1"),
        ul = dom.sel1("section.games > ul");
  dom.text(h1, entitle(column));
  dom.html(ul, null);
  dom.append(ul, _.seq(els) ? els : li(p("None found.")));
});
