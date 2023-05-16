import _ from "/lib/atomic_/core.js";
import g from "/lib/game_.js";
import supabase from "/lib/supabase.js";

const params = new URLSearchParams(document.location.search),
      game = params.get('game'),
      payload = await fetch(`./${game}.json`).then(resp => resp.json());

_.log("payload", game, payload);

const {make} = await import(`/games/${game}/core.js`);
const simulate = g.simulate(make);
const result = simulate(payload);

_.log("result", game, result);
