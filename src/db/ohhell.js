import * as g from "../lib/game.js";
import * as oh from "../games/oh-hell/lib/index.js";

export function aggregate(seated, config, events, commands, seat){
  return g.aggregate(oh.ohHell(seated, config), events, commands, seat);
}
