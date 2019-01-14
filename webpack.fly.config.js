let path = require('path')

module.exports = {
  entry: "./index.ts",
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    alias: {
      crypto: path.resolve(__dirname, 'src', 'shims', 'crypto'),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }
    ]
  }
}