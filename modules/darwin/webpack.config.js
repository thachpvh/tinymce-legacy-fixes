const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const path = require('path');

module.exports = {
  entry: './src/demo/ts/ephox/darwin/demo/DarwinTableDemo.ts',
  devtool: 'source-map',

  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, 'tsconfig.json')
      }),
    ]
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      },

      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: path.resolve(__dirname, 'tsconfig.json')
            }
          }
        ]
      }
    ]
  },

  plugins: [],

  output: {
    filename: 'demo.js',
    path: path.resolve(__dirname, './scratch/compiled')
  }
};
