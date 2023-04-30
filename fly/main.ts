// @ts-nocheck
import {
  app,
  get,
  post,
  options,
  redirect,
  contentType,
} from "https://denopkg.com/syumai/dinatra/mod.ts";
import {log, count, comp, uident, date, period, elapsed} from "https://yourmove.cc/lib/atomic/core.js";
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
  post("/mind/:game", async function(req){
    const {params} = req;
    const {game, seats, config, events, commands, seen, snapshot} = params;
    const id = uident(5);
    const start = date();
    log("req", id, count(events), snapshot ? "snapshot" : "", JSON.stringify(req), "\n\n");
    const {make} = await import(`https://yourmove.cc/games/${game}/core.js`);
    const simulate = comp(g.effects, g.simulate(make));
    try {
      const results = simulate(seats, config, events, commands, seen, snapshot);
      const stop = date();
      const ms = elapsed(period(start, stop)).valueOf();
      log("resp", id, `${ms}ms`, JSON.stringify(results), "\n\n");
      return [200, headers, JSON.stringify(results)];
    } catch (ex) {
      return [500, headers, JSON.stringify(ex)];
    }
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

log("The Game Mind lives!");
