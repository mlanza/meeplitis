// @ts-nocheck
import {serve} from "https://deno.land/std@0.131.0/http/server.ts";
import {comp} from "https://meeplitis.pages.dev/libs/atomic/core.js";
import * as g from "https://meeplitis.pages.dev/libs/game.js";
import mexica from "https://meeplitis.pages.dev/games/mexica/core.js";
const simulate = comp(g.effects, g.simulate(mexica));

console.log("Let's play Mexica!");

serve(async (req) => {
  const payload = await req.json(),
        result = simulate(payload);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});
//curl -i --location --request POST 'https://miwfiwpgvfhggfnqtfso.functions.supabase.co/mexica' --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODUwMzIzMywiZXhwIjoxOTU0MDc5MjMzfQ.i1l7NNGYF7mChifi8X-Cn_tis-us1Zq1ntyVW-Amdf8' --header 'Content-Type: application/json' --data '{"seats": [{}, {}, {}], "config": {}, "events": [{"type": "started"},{"type": "dealt-capulli", "details": {"capulli": [[{"at": null,"size": 13},{"at": null,"size": 11},{"at": null,"size": 9},{"at": null,"size": 6},{"at": null,"size": 5},{"at": null,"size": 4},{"at": null,"size": 4},{"at": null,"size": 3}],[{"at": null,"size": 12},{"at": null,"size": 10},{"at": null,"size": 8},{"at": null,"size": 7},{"at": null,"size": 6},{"at": null,"size": 5},{"at": null,"size": 3}]]}}], "commands": [], "seen": [1], "snapshot": null}'
