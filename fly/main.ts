// @ts-nocheck
import {
  app,
  get,
  post,
  options,
  redirect,
  contentType,
} from "https://denopkg.com/syumai/dinatra/mod.ts";
import * as g from "https://yourmove.cc/lib/game.js";
import {make as mexica} from "https://yourmove.cc/games/mexica/core.js";
import {make as ohHell} from "https://yourmove.cc/games/oh-hell/core.js";
import {log, comp, count, uident, date, period, elapsed} from "https://yourmove.cc/lib/atomic/core.js";

function routes(make){
  const simulate = comp(g.effects, g.simulate(make));
  return function handles({game, seats, config, events, commands, seen, snapshot}){
    const id = uident(5);
    const start = date();
    const n = count(events);
    log("request", id, n);
    return new Promise((resolve, reject) => {
      try {
        const data = simulate(seats, config, events, commands, seen, snapshot);
        const stop = date();
        const ms = elapsed(period(start, stop)).valueOf();
        resolve({id, start, stop, ms, n, data});
      } catch (ex) {
        reject({id, n, ex});
      }
    });
  }
}

const games = {
  "mexica": routes(mexica),
  "oh-hell": routes(ohHell)
}

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-credentials": true,
  "access-control-allow-headers": "Origin, X-Requested-With, Content-Type, Accept",
  "access-control-max-age": 10,
  "content-type": "application/json"
};

app(
  post("/mind/:game", async function({params}){
    const spawn = games[params.game];
    return spawn(params).then(function(resp){
      log("handled", resp);
      return [200, headers, JSON.stringify(resp.data)];
    }).catch(function(ex){
      log("failed", ex);
      return [500, headers, JSON.stringify(ex)];
    });
  }),
  options("/mind/:game", function(){
    return [200, headers, ""];
  }),
  get("/", () => "<h1>The Game Mind lives!</h1>"),
  get("/info", () => [
    200,
    contentType("json"),
    JSON.stringify({ app: "mind", version: "1.1.0" })
  ])
);

log("The Game Mind lives!");
