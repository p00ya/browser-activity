// SPDX-License-Identifier: MPL-2.0

const { merge } = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  mode: 'development',
});
