// @ts-nocheck
import {
  app,
  get,
  post,
  options,
  redirect,
  contentType,
} from "https://denopkg.com/syumai/dinatra/mod.ts";
import {comp} from "https://yourmove.cc/lib/atomic/core.js";
import * as g from "https://yourmove.cc/lib/game.js";

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-credentials": true,
  "access-control-allow-headers": "Origin, X-Requested-With, Content-Type, Accept",
  "access-control-max-age": 10,
  "content-type": "application/json"
};

app(
  post("/mind/:game", function(req){
    const {params} = req;
    const {game, seats, config, events, commands, seen, snapshot} = params;
    //console.log("req", JSON.stringify(req));
    return import(`https://yourmove.cc/games/${game}/core.js`).then(function({make}){
      const simulate = comp(g.effects, g.simulate(make));
      const results = simulate(seats, config || {}, events || [], commands || [], seen || [], snapshot || null)
      return [
        200,
        headers,
        JSON.stringify(results)];
    });
  }),
  options("/mind/:game", function(){
    return [200, headers, ""];
  }),
  get("/", () => "<h1>The Game Mind lives!</h1>"),
  get("/info", () => [
    200,
    contentType("json"),
    JSON.stringify({ app: "mind", version: "1.0.0" })
  ])
);

console.log("The Game Mind lives!");
