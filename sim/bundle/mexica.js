import {comp} from "../../src/lib/atomic/core.js";
import * as g from "../../src/lib/game.js";
import mexica from "../../src/games/mexica/core.js";
export const simulate = comp(g.effects, g.simulate(mexica));
