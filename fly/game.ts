// @ts-nocheck
import * as g from "game";
import * as _ from "atomic/core";

self.onmessage = async function(e){
  const {game, seats, config, events, commands, seen, snapshot} = e.data;
  const {make} = await import(game);
  const simulate = _.comp(g.effects, g.simulate(make));
  self.postMessage(_.chain(simulate(seats, config, events, commands, seen, snapshot), x => _.update(x, "moves", _.toArray)));
  self.close();
}
