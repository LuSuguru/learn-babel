const path = require('path')
const chalk = require('chalk')
const ProgressBarWebpackPlugin = require('progress-bar-webpack-plugin')

const { cssModule, cssNormal } = require('./css-module')

const barLeft = chalk.bold('[')
const barRight = chalk.bold(']')
const green = '\u001b[42m \u001b[0m'
const red = '\u001b[41m \u001b[0m'
const preamble = chalk.cyan.bold('  build ') + barLeft

module.exports = {
  entry: {
    app: require.resolve('../src/main.tsx')
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src')
    },
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    fallback: {
      Buffer: require.resolve('buffer/'),
    }
  },

  // node: {
  //   Buffer: true
  // },

  mode: 'none',

  target: 'web',

  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.(js|jsx|ts|tsx)$/,
            use: [{
              loader: 'babel-loader',
              options: {
                cacheDirectory: './webpack_cache/',
              },
            }],
            include: path.resolve(__dirname, '../src')
          },
          {
            test: /\.module\.(c|le)ss$/,
            use: cssModule
          },
          {
            test: /\.(c|le)ss$/,
            use: cssNormal
          },
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: './dist/[name].[hash:8].[ext]',
            },
          },
          {
            exclude: [/\.js$/, /\.html$/, /\.json$/, /\.less$/],
            loader: 'file-loader',
            options: {
              name: './dist/[name].[hash:8].[ext]',
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new ProgressBarWebpackPlugin({
      format: preamble + ':bar' + barRight + chalk.green.bold(' :percent') + '  :msg',
      complete: green,
      incomplete: red,
      total: 20
    })
  ]
}
