module.exports = () => {
  const HardSourcePlugin = require('hard-source-webpack-plugin');
  const HtmlPlugin = require('html-webpack-plugin');

  return {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: join(__dirname, 'src'),
          loader: 'babel-loader',
          options: {
            presets: [['env', {
              targets: {
                browsers: 'last 2 versions',
              },
              modules: false,
            }], 'preact'],
          },
        },
      ],
    },
    plugins: [
      new HardSourcePlugin(),
      new HtmlPlugin({
        template: 'src/index.html.js',
      }),
    ],
  };
};
