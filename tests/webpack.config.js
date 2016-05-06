module.exports = {
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        loader: 'babel-loader',
      },
    ],
  },
};
