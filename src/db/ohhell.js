import * as g from "../lib/game.js";
import ohHell from "../games/oh-hell/lib/index.js";

export function simulate(seats, config, events, commands, seen){
  return g.simulate(ohHell(seats, config), events, commands, seen);
}
