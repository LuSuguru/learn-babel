const path = require('path')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HashedModuleIdsPlugin = require('webpack/lib/HashedModuleIdsPlugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const DefinePlugin = require('webpack/lib/DefinePlugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const autoprefixer = require('autoprefixer')

module.exports = merge(baseWebpackConfig, {
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: 'static/js/[name].[chunkhash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].js',
    publicPath: '/'
  },

  resolve: {
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main']
  },

  optimization: {
    minimizer: new ParallelUglifyPlugin({
      cacheDir: path.resolve(__dirname, '../webpack_cache'),
      uglifyJS: {
        output: {
          // 最紧凑的输出
          beautify: false,
          // 删除所有的注释
          comments: false,
        },
        compress: {
          // 在UglifyJs删除没有用到的代码时不输出警告
          warnings: false,
          // 删除所有的 `console` 语句，可以兼容ie浏览器
          drop_console: true,
          comparisons: false
        }
      }
    }), //取代 new UglifyJsPlugin(/* ... */)
    providedExports: true,
    usedExports: true,

    sideEffects: true, // tree-shake
    concatenateModules: true,

    noEmitOnErrors: true, // 编译错误时不打印输出资源。
    splitChunks: { // 代码分割
      chunks: "async",
      minSize: 30000, //模块大于30k会被抽离到公共模块
      minChunks: 1, //模块出现1次就会被抽离到公共模块
      maxAsyncRequests: 5, //异步模块，一次最多只能被加载5个
      maxInitialRequests: 3, //入口模块最多只能加载3个
      name: true,
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        }
      }
    },
  },

  module: {
    rules: [{
      oneOf: [{
        test: /\.(sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // publicPath: '../'
            }
          }, 'css-loader',
          {
            loader: require.resolve('postcss-loader'),
            options: {
              ident: 'postcss',
              plugins: () => [
                require('postcss-flexbugs-fixes'),
                autoprefixer({
                  browsers: [
                    '>1%',
                    'last 4 versions',
                    'Firefox ESR',
                    'not ie < 9',
                  ],
                  flexbox: 'no-2009',
                }),
              ],
            },
          }, 'sass-loader']
      }]
    }]
  },

  plugins: [
    // 防止每次hashname都更新
    new HashedModuleIdsPlugin(),
    // 清空dist
    new CleanWebpackPlugin('dist', { root: path.resolve(__dirname, '../') }),

    // 配置生产环境的全局变量
    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),

    // 生成自动引用文件的html模板
    new HtmlWebpackPlugin({
      template: require.resolve('../public/index.html'),
      inject: true,
      minify: { // 压缩生成的html
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      }
    }),

    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
      allChunks: true // 将按需加载里的css提取出来
    }),

    // 增加输出分析
    // new BundleAnalyzerPlugin()
  ]
})