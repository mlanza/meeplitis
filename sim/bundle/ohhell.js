import {comp} from "../../src/lib/atomic/core.js";
import * as g from "../../src/lib/game.js";
import ohHell from "../../src/games/oh-hell/core.js";
export const simulate = comp(g.effects, g.simulate(ohHell));
