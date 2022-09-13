var path = require('path');

module.exports = {
  entry: {
    ohhell: "./src/db/ohhell.js"
  },
  resolve: {
    alias: {
      "/lib/@atomic/core.js": "/src/lib/@atomic/core.js",
      "/lib/@atomic/reactives.js": "/src/lib/@atomic/reactives.js",
      "/lib/game.js": "/src/lib/game.js"
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
