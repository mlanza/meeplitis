import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import {session} from "/lib/session.js";
import {games, render} from "/lib/games.js";

if (session && !session?.username) {
  dom.addClass(dom.sel1("#unidentified-user"), "reveal");
}

_.fmap(games(),
  _.see("games"),
  _.map(render, _),
  dom.html(dom.sel1(".games > p"), _));
