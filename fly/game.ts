// @ts-nocheck
import * as g from "https://yourmove.cc/lib/game.js";
import {comp} from "https://yourmove.cc/lib/atomic/core.js";

self.onmessage = async function(e){
  const {game, seats, config, events, commands, seen, snapshot} = e.data;
  const {make} = await import(`https://yourmove.cc/games/${game}/core.js`);
  const simulate = comp(g.effects, g.simulate(make));
  self.postMessage(simulate(seats, config, events, commands, seen, snapshot));
  self.close();
}
