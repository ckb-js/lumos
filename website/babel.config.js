const babelPresets = require('@docusaurus/core/lib/babel/preset').default;

module.exports = {
  presets: [(api) => {
    const origin = babelPresets(api);
    const transformRuntime = origin.plugins.find(plugin => plugin[0] === require.resolve('@babel/plugin-transform-runtime'))
    if (transformRuntime) {
      transformRuntime[1].helpers = false
    }
    return origin
  }],

}
