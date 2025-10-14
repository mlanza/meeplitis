// @ts-nocheck
import {comp} from "https://meeplitis.com/libs/atomic/core.js";
import * as g from "https://meeplitis.com/libs/game.js";
import {make} from "https://meeplitis.com/games/backgammon/table/uJl/core.js";
const simulate = comp(g.effects, g.simulate(make));

console.log("Let's play Backgammon!");

Deno.serve(async function (req){
  const payload = await req.json(),
        result = simulate(payload);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});
