import * as g from "../../src/lib/game.js";
import mexica from "../../src/games/mexica/core.js";

export function simulate(seats, config, events, commands, seen){
  return g.simulate(mexica(seats, config), events, commands, seen);
}
