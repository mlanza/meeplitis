// meeplitis/src/libs/reel/test_imports.js

import * as Core from "./core.js";
import { createReelShell } from "./main.js";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.4/command/mod.ts";

console.log("Successfully imported Core, createReelShell, and Command.");
console.log("Core initialState:", Core.initialState);

// Minimal test to ensure they can be instantiated
const dummyDispatch = (msg) => console.log("Dummy dispatch:", msg);
const shell = createReelShell(Core.initialState, dummyDispatch);
console.log("Shell created.");

const cmd = new Command();
console.log("Cliffy Command created.");

console.log("All imports and basic instantiations successful.");
