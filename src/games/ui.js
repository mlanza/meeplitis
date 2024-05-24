import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";
import dom from "/libs/atomic_/dom.js";
import {games, render} from "/libs/games.js";
import {reg} from "/libs/cmd.js";

_.fmap(games(),
  $.tee(_.plug(reg, "games", _)),
  _.map(_.pipe(render, dom.tag('li')), _),
  dom.html(dom.sel1(".games ul"), _));
