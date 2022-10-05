var path = require('path');

module.exports = {
  entry: {
    ohhell: "./src/db/ohhell.js"
  },
  resolve: {
    alias: {
      "/lib/atomic_/core.js": "/src/lib/atomic_/core.js",
      "/lib/atomic_/reactives.js": "/src/lib/atomic_/reactives.js",
      "/lib/game.js": "/src/lib/game.js",
      "/lib/game_.js": "/src/lib/game_.js"
    }
  },
  output: {
    libraryTarget: 'umd',
    filename: '../dist/[name].bundle.js',
  },
  optimization: {
    minimize: false
  }
}
