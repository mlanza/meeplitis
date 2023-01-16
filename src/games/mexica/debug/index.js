import _ from "/lib/atomic_/core.js";
import $ from "/lib/atomic_/reactives.js";
import t from "/lib/atomic_/transducers.js";
import g from "/lib/game_.js";
import mexica from "../core.js";

const params = new URLSearchParams(document.location.search),
      split  = params.get('split') || null;

const $game = $.cell(mexica(_.repeat(4, {}), {}));
$.sub($.hist($game), t.map(g.summarize), _.log);
const commands = [{type: "start"}];
g.batch($game, g.run, commands);

_.log($game)
