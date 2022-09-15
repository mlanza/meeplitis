import * as g from "../lib/game.js";
import * as oh from "../games/oh-hell/lib/index.js";

export function simulate(seated, config, events, commands, seat){
  return g.simulate(oh.ohHell(seated, config), events, commands, seat);
}
