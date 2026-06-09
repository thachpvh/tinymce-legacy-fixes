const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const path = require('path');

module.exports = function(grunt) {
  var packageData = grunt.file.readJSON('package.json');
  const tsDemoSourceFile = path.resolve('src/demo/ts/Demo.ts');
  const jsDemoDestFile = path.resolve('scratch/compiled/demo.js');

  grunt.initConfig({
    pkg: packageData,

    shell: {
      command: 'tsc'
    },

    webpack: {
      options: {
        mode: 'development',
        watch: true
      },
      dev: {
        entry: tsDemoSourceFile,
        mode: 'development',
        devtool: 'source-map',

        resolve: {
          extensions: ['.ts', '.js'],
          plugins: [
            new TsconfigPathsPlugin({
              configFile: path.resolve(__dirname, 'tsconfig.json')
            })
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

        plugins: [new LiveReloadPlugin()],

        output: {
          filename: path.basename(jsDemoDestFile),
          path: path.dirname(jsDemoDestFile)
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', []);
};
