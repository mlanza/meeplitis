import * as g from "../lib/game.js";
import ohHell from "../games/oh-hell/lib/index.js";

export function simulate(seated, config, events, commands, seat){
  return g.simulate(ohHell(seated, config), events, commands, seat);
}
