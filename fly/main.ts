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
import {log, count, uident, date, period, elapsed} from "https://yourmove.cc/lib/atomic/core.js";

const sep = '->';

function spawn(id, params){
  return new Promise(function(resolve, reject){
    const start = date();
    try {
      const worker = new Worker(new URL("./game.ts", import.meta.url).href, { type: "module" });
      worker.addEventListener('message', function({data}){
        const stop = date();
        const ms = elapsed(period(start, stop)).valueOf();
        resolve({start, stop, ms, data});
      });
      worker.addEventListener('error', reject);
      worker.addEventListener('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
      worker.postMessage(params);
    } catch (ex) {
      reject(ex);
    }
  });
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
  post("/simulate/:game", async function({params}){
    const id = uident(5);
    const body = JSON.stringify(params);
    const {events, commands} = params;
    log("req", params.game, id, sep, body);
    return spawn(id, params).then(function({ms, data}){
      const body = JSON.stringify(data);
      log("resp", params.game, id, `${count(events)}e`, `${count(commands)}c`, `${ms}ms`, sep, body);
      return [200, headers, body];
    }).catch(function(ex){
      const body = JSON.stringify(ex);
      log("error", params.game, id, sep, body);
      return [500, headers, body];
    });
  }),
  options("/simulate/:game", function(){
    return [200, headers, ""];
  }),
  get("/", () => "<h1>Your Move Compute lives!</h1>"),
  get("/info", () => [
    200,
    contentType("json"),
    JSON.stringify({ app: "yourmove", appname: "Your Move Compute", version: "1.2.0" })
  ])
);

log("Your Move Compute lives!");
