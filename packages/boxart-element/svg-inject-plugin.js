module.exports = SvgInjectScriptPlugin;

function SvgInjectScriptPlugin(options) {
  this.options = options;
}

SvgInjectScriptPlugin.prototype.apply = function(compiler) {
  const options = this.options;
  const firstChunk = options.chunks[0];

  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('html-webpack-plugin-after-html-processing', function(htmlPluginData, cb) {
      if (
        htmlPluginData.plugin.options.chunks.indexOf(firstChunk) !== -1 &&
        htmlPluginData.html.indexOf('<script>') === -1
      ) {
        htmlPluginData.html = htmlPluginData.html.replace('</svg>', '') +
          [
            '<script type="text/javascript" charset="utf8"><![CDATA[',
            options.chunks
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
};
