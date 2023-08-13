import _ from "/lib/atomic_/core.js";
import dom from "/lib/atomic_/dom.js";
import {games, render} from "/lib/games.js";

_.fmap(games(), _.see("games"), _.map(render, _), dom.html(dom.sel1(".open > p"), _));
