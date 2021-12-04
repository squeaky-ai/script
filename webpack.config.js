'use strict';

const path = require('path');
const { DefinePlugin } = require('webpack');

const getEntry = (pathname) => path.join(__dirname, 'src', pathname, 'index.ts');

module.exports = ({ development }) => ({
  devtool: false,
  mode: development ? 'development' : 'production',
  watch: !!development,
  entry: {
    nps: getEntry('nps'),
    script: getEntry('script'),
    sentiment: getEntry('sentiment'),
  },
  output: {
    path: path.join(__dirname, '.build'),
    filename: '[name].js',
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
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ]
      }
    ]
  },
  optimization: {
    usedExports: true
  },
  plugins: [
    new DefinePlugin({
      API_SERVER_HOST: JSON.stringify(development ? 'http://localhost:5000' : 'https://gateway.squeaky.ai'),
      WEBSOCKET_SERVER_HOST: JSON.stringify(development ? 'ws://localhost:5000' : 'wss://gateway.squeaky.ai'),
    })
  ]
});
