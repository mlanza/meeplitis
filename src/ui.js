import _ from "/libs/atomic_/core.js";
import dom from "/libs/atomic_/dom.js";
import {open_games, render} from "/libs/games.js";
import {reg} from "/libs/cmd.js";
import "/libs/session.js";

_.fmap(open_games(),
  _.tee(_.plug(reg, "games", _)),
  _.map(_.pipe(render, dom.tag('li')), _),
  dom.html(dom.sel1(".games > ul"), _));
