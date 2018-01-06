const {join} = require('path');

const webpack = require('webpack');

const dir = (...args) => join(__dirname, ...args);

const config = c => Object.assign({
  context: dir(),
  externals: {
    preact: true,
    'preact/src/vnode': true,
    './function.babel.compile': {
      var: 'BoxArt.compile',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/src\/level0\/(animate|present|update)/, /node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['env', {
                modules: false,
                loose: true,
              }]],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      exclude: /boxart-functions-compile/,
    }),
  ],
}, c, {
  output: Object.assign({
    path: dir('dist'),
    filename: '[name].[chunkhash].js',
    library: ['BoxArt', 'Core'],
    libraryTarget: 'umd',
  }, c.output),
});

module.exports = [
  config({
    entry: {
      'boxart-functions': './lib/level0/index',
      'boxart-functions-compile': './src/level0/index',
    },
    output: {
      library: ['BoxArt', 'functions'],
      libraryTarget: 'var',
    },
  }),
  config({
    entry: {
      'boxart-compile': './src/level0/function.babel.compile',
    },
    output: {
      library: ['BoxArt', 'compile'],
    },
  }),
  config({
    entry: {
      'boxart-element': './lib/level3/svg',
      'boxart-element-no0': './src/level3/svg-no0',
    },
    output: {
      library: ['BoxArt', 'Element'],
    },
  }),
  config({
    entry: {
      'boxart-mutation-observer': './lib/level3/mutation-observer',
      'boxart-mutation-observer-no0': './src/level3/mutation-observer-no0',
    },
    output: {
      library: ['BoxArt', 'MutationObserver'],
    },
  }),
  config({
    entry: {
      'boxart-preact': './lib/level3/preact',
      'boxart-preact-no0': './src/level3/preact-no0',
    },
    output: {
      library: ['BoxArt', 'Preact'],
    },
  }),
];
