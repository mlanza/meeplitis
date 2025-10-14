const {execSync} = require('child_process');
const game = process.argv[2];
game && execSync(`deno task ${game} && lume --config _config.sim.js`);
