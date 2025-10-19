// @ts-nocheck
import * as g from "https://meeplitis.com/libs/game.js";
import {make} from "https://meeplitis.com/games/up-down/table/kA4/core.js";

Deno.serve(g.handle(make));
