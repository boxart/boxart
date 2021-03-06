const {basename, join} = require('path');

const LibraryTemplatePlugin = require("webpack/lib/LibraryTemplatePlugin");
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const webpack = require('webpack');

const run = require('./run-module');

function sha1Hash(content) {
  return require('crypto').createHash('sha1').update(content).digest('hex');
}

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
          let resourceId;
          let entry;
          if (typeof resource === 'object') {
            resourceId = sha1Hash(resource.resource + resource.source);
            entry = `${
              require.resolve('./function-compile-loader')
            }!${resource.resource}`;
          }
          else {
            resourceId = basename(resource);
            entry = resource;
          }
          const compilerName = 'boxartFunction-' + resourceId;
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
                    if (typeof resource === 'object') {
                      loaderContext.boxartSource = function() {
                        return resource.source;
                      };
                    }
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
              entry,
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

          let source;

          // Uglify workaround, don't want to evaluate uglified source and then
          // compile those with babel.
          child.plugin('this-compilation', function(compilation) {
            compilation.plugin('additional-assets', function(cb) {
              const asset = childCompilation.assets['__function_compile_plugin__.js'];
              source = asset.source();
              cb();
            });
          });

          child.runAsChild(function(err) {
            if (err) {
              return cb(err);
            }

            try {
              // Store source in case the evaluation fails so its easier to
              // track down the issue.
              Object.keys(compilation.assets).forEach(key => {
                compilation.assets[key] = {
                  source: function() {return source;},
                  size: function() {return source.length;},
                };
              });

              const output = new Function([
                'let output;',
                'function jsonpFunction(entry) {output = entry;};',
                source,
                'return output;',
              ].join('\n'))();

              childCompilation.fileDependencies.forEach(loaderContext.addDependency);

              // Delete the source after evaluation success. Don't need the
              // temporary compilation to be output and confuse the user when it
              // works as expected.
              Object.keys(compilation.assets).forEach(key => {
                delete compilation.assets[key];
              });

              cb(null, output && output.default || output, source);
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
    test: /level0\/(?:animate|present|update)(?:[^\/]*)\.js$/,
    include: [join(__dirname, '../..')],
    use: FunctionCompilePlugin.runtime(),
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
