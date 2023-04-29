import {
  app,
  get,
  post,
  redirect,
  contentType,
} from "https://denopkg.com/syumai/dinatra/mod.ts";
import {comp} from "https://yourmove.cc/lib/atomic/core.js";
import * as g from "https://yourmove.cc/lib/game.js";

console.log("The Game Mind lives!");

app(
  post("/mind/:game", function({params: {game, seats, config, events, commands, seen, snapshot}}){
    return import(`https://yourmove.cc/games/${game}/core.js`).then(function({make}){
      const simulate = comp(g.effects, g.simulate(make));
      const results = simulate(seats, config || {}, events || [], commands || [], seen || [], snapshot || null)
      return [
        200,
        contentType("json"),
        JSON.stringify(results)];
    });
  }),
  get("/", () => "<h1>The Game Mind lives!</h1>")
);


// To invoke: curl -i --location --request POST 'https://yourmove.fly.dev/mind/mexica' --header 'Content-Type: application/json' --data '{"seats": [{}, {}, {}], "config": {}, "events": [{"type": "started"},{"type": "dealt-capulli", "details": {"capulli": [[{"at": null,"size": 13},{"at": null,"size": 11},{"at": null,"size": 9},{"at": null,"size": 6},{"at": null,"size": 5},{"at": null,"size": 4},{"at": null,"size": 4},{"at": null,"size": 3}],[{"at": null,"size": 12},{"at": null,"size": 10},{"at": null,"size": 8},{"at": null,"size": 7},{"at": null,"size": 6},{"at": null,"size": 5},{"at": null,"size": 3}]]}}], "commands": [], "seen": [1], "snapshot": null}'
//curl --header "Content-Type: application/json" --request POST --data '{"seats": [{}, {}, {}], "events":[], "commands": [{"type": "start"}], "seen": [0]}' https://yourmove.fly.dev/mexica
//curl --header "Content-Type: application/json" --request POST --data '{"seats": [{}, {}, {}], "events":[], "commands": [{"type": "start"}], "seen": [0]}' https://yourmove.fly.dev/mexica
