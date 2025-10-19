// @ts-nocheck
import {comp} from "https://meeplitis.com/libs/atomic/core.js";
import * as g from "https://meeplitis.com/libs/game.js";
import {make} from "https://meeplitis.com/games/mexica/table/H7z/core.js";
const simulate = comp(g.effects, g.simulate(make));

function see(label){
  return function(value) {
    console.log(label, value);
    return value;
  };
}

const simulate = pipe(
  //see("got"),
  g.simulate(make),
  //see("simulate"),
  g.effects,
  //see("effects")
);

Deno.serve(async function (req){
  const payload = await req.json(),
        result = simulate(payload);
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});

