import ohHell from "../../src/games/oh-hell/core.js";
import _ from "../../src/lib/atomic_/core.js";
import g from "../../src/lib/game_.js";
export const simulate = _.comp(g.effects, g.simulate(ohHell));
