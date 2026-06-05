const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');

module.exports = {
  entry: './src/demo/ts/ephox/robin/demo/WordSelectDemo.ts',
  devtool: 'source-map',
  mode: 'development',
  target: ['web'],

  resolve: {
    extensions: ['.ts', '.js'],
    tsconfig: path.resolve(__dirname, 'tsconfig.json')
  },

  module: {
    rules: [
      {
        test: /\.js$/,
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
        use: [{
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            projectReferences: false,
            onlyCompileBundledFiles: true,
            compilerOptions: {
              declarationMap: false,
              outDir: undefined
            }
          }
        }]
      }
    ]
  },

  plugins: [
    new ForkTsCheckerWebpackPlugin({ async: true })
  ],

  output: {
    filename: 'demo.js',
    path: path.resolve(__dirname, './scratch/compiled')
  }
};
