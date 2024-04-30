// @ts-nocheck
import {serve} from "https://deno.land/std@0.131.0/http/server.ts";
import {comp} from "https://meeplistis.pages.dev/atomic/core.js";
import * as g from "https://meeplitis.pages.dev/libs/game.js";
import ohhell from "https://meeplitis.pages.dev/games/oh-hell/core.js";
const simulate = comp(g.effects, g.simulate(ohhell));

console.log("Let's play Oh Hell!");

serve(async (req) => {
  const payload = await req.json(),
        result = simulate(payload);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});
