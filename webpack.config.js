var path = require('path');

module.exports = {
  entry: {
    ohhell: "./src/db/ohhell.js"
  },
  resolve: {
    alias: {
      "/libs/atomic_/core.js": "/src/libs/atomic_/core.js",
      "/libs/atomic_/reactives.js": "/src/libs/atomic_/reactives.js",
      "/libs/game.js": "/src/libs/game.js",
      "/libs/game_.js": "/src/libs/game_.js"
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
