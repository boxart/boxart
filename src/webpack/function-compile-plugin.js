const {basename, join} = require('path');

const LibraryTemplatePlugin = require("webpack/lib/LibraryTemplatePlugin");
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const webpack = require('webpack');

const run = require('./run-module');

class FunctionCompilePlugin {
  level0Rule() {
    return FunctionCompilePlugin.level0Rule();
  }

  buildTime() {
    return FunctionCompilePlugin.buildTime();
  }

  runtime() {
    return FunctionCompilePlugin.runtime();
  }

  apply(compiler) {
    let i = 0;
    compiler.plugin('this-compilation', function(compilation, {normalModuleFactory}) {
      compilation.plugin('normal-module-loader', function(loaderContext) {
        loaderContext._inBoxartFunction = false;
        loaderContext.compileBoxartFunction = function(resource, cb) {
          let childCompilation;
          let compilationPlugins;
          const compilerName = basename(resource);
          const child = compilation.createChildCompiler(compilerName, {
            filename: '[name].js',
          }, [
            new LibraryTemplatePlugin(
              'jsonpFunction', 'jsonp', false, '', null,
            ),
            {
              apply(childCompiler) {
                childCompiler.plugin('this-compilation', function(compilation) {
                  childCompilation = compilation;
                  childCompilation.plugin('normal-module-loader', function(loaderContext) {
                    loaderContext._inBoxartFunction = true;
                  });
                });

                childCompiler.plugin('make', (compilation, cb) => {
                  if (compilation.cache) {
                    if (!compilation.cache[compilerName]) {
                      compilation.cache[compilerName] = {};
                    }
                    compilation.cache = compilation.cache[compilerName];
                  }
                  cb();
                });
              }
            },
            new SingleEntryPlugin(
              compiler.options.context,
              resource,
              '__function_compile_plugin__'
            ),
            new webpack.DefinePlugin({
              process: {
                env: {
                  BOXART_ENV: JSON.stringify('compile'),
                },
              },
            }),
            {
              apply: function(compiler) {
                compilationPlugins = compiler._plugins.compilation || [];
              },
            },
          ]);

          // webpack bug workaround
          child._plugins.compilation = compilationPlugins.concat(child._plugins.compilation);

          child.runAsChild(function(err) {
            if (err) {
              return cb(err);
            }

            try {
              const asset = childCompilation.assets['__function_compile_plugin__.js'];
              const source = asset.source();

              const output = new Function([
                'let output;',
                'function jsonpFunction(entry) {output = entry;};',
                source,
                'return output;',
              ].join('\n'))();

              childCompilation.fileDependencies.forEach(loaderContext.addDependency);

              Object.keys(compilation.assets).forEach(key => {
                delete compilation.assets[key];
              });

              cb(null, output && output.default || output);
            }
            catch (e) {
              return cb(e);
            }
          });
        }
      });
    });
  }
}

FunctionCompilePlugin.level0Rule = () => (
  {
    test: /level0\/(?:animate|present|update)\.js$/,
    include: [join(__dirname, '../..')],
    loader: FunctionCompilePlugin.runtime(),
  }
);

FunctionCompilePlugin.buildTime = () => (
  {
    loader: require.resolve('./function-compile-loader'),
  }
);

FunctionCompilePlugin.runtime = () => (
  {
    loader: require.resolve('./function-registry-loader'),
  }
);

module.exports = FunctionCompilePlugin;
