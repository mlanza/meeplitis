import * as g from "../../src/lib/game.js";
import ohHell from "../../src/games/oh-hell/lib/index.js";

export function simulate(seats, config, events, commands, seen){
  return g.simulate(ohHell(seats, config), events, commands, seen);
}
