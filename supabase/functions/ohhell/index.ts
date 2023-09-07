// @ts-nocheck
import {serve} from "https://deno.land/std@0.131.0/http/server.ts";
import {comp} from "https://f5f77202.yourmove.pages.dev/lib/atomic/core.js";
import * as g from "https://f5f77202.yourmove.pages.dev/lib/game.js";
import ohhell from "https://f5f77202.yourmove.pages.dev/games/oh-hell/core.js";
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
