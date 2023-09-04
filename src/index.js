import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import {games, render} from "/lib/games.js";
import "/lib/session.js";

_.fmap(games(),
  _.see("games"),
  _.map(_.pipe(render, dom.tag('li')), _),
  dom.html(dom.sel1(".games > ul"), _));
