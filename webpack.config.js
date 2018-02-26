const path = require('path');
const { argv } = require('yargs');
const env = require('./utils/env');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

const sandboxUrl = 'http://sandbox7.feedly.com';

module.exports = {
  entry: {
    background: path.join(__dirname, 'src', 'scripts', 'background.ts'),
    popup: path.join(__dirname, 'src', 'scripts', 'popup.ts'),
    options: path.join(__dirname, 'src', 'scripts', 'options.ts'),
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'scripts/[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /feedly\.api\.ts/,
        exclude: /node_modules/,
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /http(?:s)?:\/\/(?:www\.)?cloud\.feedly\.com/gi,
              replacement: match => (argv.sandbox ? sandboxUrl : match),
            },
          ],
        }),
      },
      {
        test: /background\.ts/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'echo-loader',
          },
          {
            loader: StringReplacePlugin.replace({
              replacements: [
                {
                  pattern: /http(?:s)?:\/\/(?:www\.)?feedly\.com/gi,
                  replacement: match => (argv.sandbox ? sandboxUrl : match),
                },
              ],
            }),
          },
        ],
      },
      {
        test: /.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'echo-loader',
          },
          {
            loader: 'ts-loader',
          },
          {
            loader: 'preprocess-loader',
            options: {
              BROWSER: argv.browser,
            },
          },
        ],
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'echo-loader',
          },
          {
            loader: 'preprocess-loader',
            options: {
              BROWSER: argv.browser,
            },
          },
          {
            loader: 'html-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new StringReplacePlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
      BROWSER: JSON.stringify(argv.browser),
      CLIENT_ID: JSON.stringify(argv.clientId),
      CLIENT_SECRET: JSON.stringify(argv.clientSecret),
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'background.html'),
      filename: 'background.html',
      chunks: ['background'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'options.html'),
      filename: 'options.html',
      chunks: ['options'],
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'src'),
        to: path.resolve(__dirname, 'build'),
        ignore: ['**/scripts/**/*', '**/typings/**/*', '*.html', 'manifest.json'],
        verbose: true,
      },
    ]),
    new WriteFilePlugin(),
  ],
  devtool: 'inline-cheap-source-map',
};
