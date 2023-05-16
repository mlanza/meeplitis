// @ts-nocheck
import * as g from "https://yourmove.cc/lib/game.js";
import * as _ from "https://yourmove.cc/lib/atomic/core.js";

self.onmessage = async function(e){
  const {game, seats, config, events, commands, seen, snapshot} = e.data;
  const {make} = await import(`https://yourmove.cc/games/${game}/core.js`);
  const simulate = _.comp(g.effects, g.simulate(make));
  self.postMessage(_.chain(simulate(seats, config, events, commands, seen, snapshot), x => _.update(x, "moves", _.toArray)));
  self.close();
}
