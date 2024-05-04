import make from "./core.js";
import _ from "../../../../libs/atomic_/core.js";
import g from "../../../../libs/game_.js";
export const simulate = _.comp(g.effects, g.simulate(make));
