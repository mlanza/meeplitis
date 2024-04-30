import ohHell from "../../src/games/oh-hell/core.js";
import _ from "../../src/libs/atomic_/core.js";
import g from "../../src/libs/game_.js";
export const simulate = _.comp(g.effects, g.simulate(ohHell));
