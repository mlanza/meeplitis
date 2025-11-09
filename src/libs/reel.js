// meeplitis/src/libs/reel.js - Entry point for the new Atomic reel component

// This file acts as the main entry point for the reel CLI.
// It imports the cli.js module and executes its command parsing logic.

import "../libs/reel/cli.js";

// The cli.js module is designed to be self-executing upon import
// due to the `await reelCommand.parse(Deno.args);` at the end of the file.
// Therefore, no further code is needed here.