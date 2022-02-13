const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserPlugin(
        {
          terserOptions: {
            ecma: '2019',
            compress: {
              // Remove console calls.
              pure_funcs: [
                'console.debug',
                'console.log',
                'console.warn',
              ],
            },
          },
        },
      ),
    ],
  },
});
