'use strict';

const path = require('path');
const { DefinePlugin } = require('webpack');

module.exports = ({ development }) => ({
  devtool: false,
  mode: development ? 'development' : 'production',
  watch: !!development,
  entry: path.join(__dirname, 'src', 'index.ts'),
  output: {
    path: path.join(__dirname, '.build'),
    filename: 'script.js',
    library: ['squeaky'],
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    usedExports: true
  },
  plugins: [
    new DefinePlugin({
      DEBUG: JSON.stringify(!!development),
      WEBSOCKET_SERVER_HOST: JSON.stringify(development ? 'ws://localhost:4000' : 'wss://squeaky.ai'),
    })
  ]
});
