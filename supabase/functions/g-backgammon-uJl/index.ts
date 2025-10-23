// @ts-nocheck
import * as g from "https://meeplitis.com/libs/game.js";
import {make} from "https://meeplitis.com/games/backgammon/table/uJl/core.js";

Deno.serve(g.handle(make));
