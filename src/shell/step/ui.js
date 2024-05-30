import _ from "/libs/atomic_/core.js";
import $ from "/libs/atomic_/shell.js";
import g from "/libs/game_.js";
import supabase from "/libs/supabase.js";

const params = new URLSearchParams(document.location.search),
      game = params.get('game'),
      effects = params.get('effects') == 1,
      payload = await fetch(`./${game}.json`).then(resp => resp.json()),
      op = effects ? g.effects : _.identity;

$.log("payload", game, payload);

const {make} = await import(`/games/${game}/core.js`);
const simulate = _.comp(op, g.simulate(make));
const result = simulate(payload);

$.log("result", game, result);
