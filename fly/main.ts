// @ts-nocheck
import {
  app,
  get,
  post,
  options,
  redirect,
  contentType,
} from "https://denopkg.com/syumai/dinatra/mod.ts";
import {log} from "https://yourmove.cc/lib/atomic/core.js";
import * as g from "https://yourmove.cc/lib/game.js";
import {count, uident, date, period, elapsed} from "https://yourmove.cc/lib/atomic/core.js";

function routes(path){
  return function handles(id, params){
    const {events} = params, n = count(events);
    return new Promise((resolve, reject) => {
      const start = date();
      const worker = new Worker(new URL(path, import.meta.url).href, { type: "module" });
      worker.addEventListener('message', function({data}){
        const stop = date();
        const ms = elapsed(period(start, stop)).valueOf();
        resolve({start, stop, ms, n, data});
      });
      worker.addEventListener('error', reject);
      worker.addEventListener('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
      worker.postMessage(params);
    });
  }
}

const games = {
  "mexica": routes("./games/mexica.ts"),
  "oh-hell": routes("./games/oh-hell.ts")
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
    const id = uident(5);
    const spawn = games[params.game];
    log("received", id, JSON.stringify(params));
    return spawn(id, params).then(function({start, stop, ms, n, data}){
      log("handled", id, n, start, stop, `${ms}ms`, JSON.stringify(data));
      return [200, headers, JSON.stringify(data)];
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
