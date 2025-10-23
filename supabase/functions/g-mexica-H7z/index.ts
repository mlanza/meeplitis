// @ts-nocheck
import * as g from "https://meeplitis.com/libs/game.js";
import {make} from "https://meeplitis.com/games/mexica/table/H7z/core.js";

Deno.serve(g.handle(make));
