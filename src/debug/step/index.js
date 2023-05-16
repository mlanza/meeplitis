import _ from "/lib/atomic_/core.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      game = params.get('game'),
      effects = params.get('effects') == 1,
      payload = await fetch(`./${game}.json`).then(resp => resp.json()),
      op = effects ? g.effects : _.identity;

_.log("payload", game, payload);

const {make} = await import(`/games/${game}/core.js`);
const simulate = _.comp(op, g.simulate(make));
const result = simulate(payload);

_.log("result", game, result);
