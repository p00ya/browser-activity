// SPDX-License-Identifier: MPL-2.0

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

// Copyright notice to prefix to the output.
const copyrightNotice = 'Copyright 2022, Dean Scarff.';

module.exports = {
  entry: {
    background: './src/background/index.ts',
    content: './src/content/index.ts',
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
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin(
      {
        terserOptions: {
          ecma: 2019,
          compress: {
            passes: 2,
          },
          output: {
            // Minification is applied after BannerPlugin, so make sure to
            // preserve the copyright notice.  The "!" is added by BannerPlugin.
            comments: /^! Copyright/,
          },
        },
        extractComments: false,
      },
    )],
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json' },
        { from: './src/img/icon-*.png', to: '[name][ext]' },
      ],
    }),
    new ForkTsCheckerWebpackPlugin(),
    new webpack.BannerPlugin(copyrightNotice),
  ],
  resolve: {
    extensions: ['.ts'],
  },
};
