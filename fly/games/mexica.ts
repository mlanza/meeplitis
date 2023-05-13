// @ts-nocheck
import * as g from "https://yourmove.cc/lib/game.js";
import {comp} from "https://yourmove.cc/lib/atomic/core.js";
import mexica from "https://yourmove.cc/games/mexica/core.js";

const simulate = comp(g.effects, g.simulate(mexica));

self.onmessage = async function(e){
  const {game, seats, config, events, commands, seen, snapshot} = e.data;
  self.postMessage(simulate(seats, config, events, commands, seen, snapshot));
  self.close();
}
