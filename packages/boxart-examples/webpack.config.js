const fs = require('fs');
const {join, relative} = require('path');

const FunctionCompilePlugin = require('boxart-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const htmlFiles = function() {
  const rootItems = fs.readdirSync(__dirname);
  const directories = rootItems
  .map(function(dir) {
    try {
      if (fs.statSync(join(__dirname, dir)).isDirectory()) {
        return dir;
      }
      return null;
    }
    catch (e) {
      return null;
    }
  })
  .filter(Boolean);

  return directories
  .map(function(dir) {
    const items = fs.readdirSync(join(__dirname, dir));
    return items
    .filter(item => /\.(html|svg)(|\.js)$/.test(item))
    .map(item => join(dir, item));
  })
  .reduce(function(carry, items) {
    items.forEach(item => carry.push(item));
    return carry;
  }, []);
}

function entries() {
  const entryObj = {};
  htmlFiles()
  .map(item => item.replace(/\/(\w+)\.[^\/]*$/, '/$1.js'))
  .map(function(item) {
    try {
      fs.statSync(item);
      return item;
    }
    catch (e) {
      return null;
    }
  })
  .filter(Boolean)
  .forEach(function(item) {
    entryObj[item.replace(/\.js$/, '')] = `./${item}`;
  });
  return entryObj;
}

function htmlPlugins() {
  return htmlFiles()
  .map(function(item) {
    return new HtmlWebpackPlugin({
      filename: relative(__dirname, item.replace(/\.(html|svg)(|\.js)$/, '.$1')),
      template: `./${item}`,
      chunks: [relative(__dirname, item.replace(/\.(html|svg)(|\.js)$/, ''))],
      inject: /\.html(|\.js)$/.test(item),
    });
  });
}

module.exports = {
  context: __dirname,
  entry: entries(),
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\banimations\.js$/,
        use: FunctionCompilePlugin.buildTime(),
      },
    ],
  },
  plugins: [
    ...htmlPlugins(),
    new FunctionCompilePlugin(),
    {
      apply: function(compiler) {
        compiler.plugin('compilation', function(compilation) {
          compilation.plugin('html-webpack-plugin-after-html-processing', function(htmlPluginData, cb) {
            if (
              htmlPluginData.outputName.endsWith('.svg') &&
              htmlPluginData.html.indexOf('<script>') === -1
            ) {
              htmlPluginData.html = htmlPluginData.html.replace('</svg>', '') +
                [
                  '<script type="text/javascript" charset="utf8"><![CDATA[',
                  htmlPluginData.plugin.options.chunks
                  .map(name => (
                    Object.entries(compilation.assets)
                    .find(([key]) => (
                      key.indexOf(name) !== -1 && key.endsWith('.js')
                    ))[1]
                    .source()
                  ))
                  .join('\n'),
                  ']]></script>',
                  '</svg>',
                ].join('\n');
            }
            cb(null, htmlPluginData);
          });
        });
      },
    },
  ],
};
