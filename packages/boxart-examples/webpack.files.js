const fs = require('fs');
const {join, relative} = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const SvgInjectScriptPlugin = require('boxart-element/svg-inject-plugin');

const htmlFiles = exports.htmlFiles = function htmlFiles() {
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
};

const entries = exports.entries = function entries() {
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
};

const htmlPlugins = exports.htmlPlugins = function htmlPlugins() {
  return htmlFiles()
  .map(function(item) {
    return new HtmlWebpackPlugin({
      filename: relative(__dirname, item.replace(/\.(html|svg)(|\.js)$/, '.$1')),
      template: `./${item}`,
      chunks: [relative(__dirname, item.replace(/\.(html|svg)(|\.js)$/, ''))],
      inject: /\.html(|\.js)$/.test(item),
    });
  });
};

const svgPlugins = exports.svgPlugins = function svgPlugins() {
  return htmlFiles()
  .filter(item => /\.svg(|\.js)$/.test(item))
  .map(item => (
    new SvgInjectScriptPlugin({
      chunks: [relative(__dirname, item.replace(/\.svg(|\.js)$/, ''))],
    })
  ));
};
