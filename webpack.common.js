// SPDX-License-Identifier: MPL-2.0

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/index.ts',
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            // See: https://webpack.js.org/guides/build-performance/#typescript-loader
            options: { transpileOnly: true },
          },
        ],
      },
    ],
  },
  output: { filename: '[name].js', path: path.resolve(__dirname, 'dist') },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json' },
        { from: './src/img/icon-*.png', to: '[name][ext]' },
      ],
    }),
    new ForkTsCheckerWebpackPlugin(),
  ],
  resolve: {
    extensions: ['.ts'],
  },
};
