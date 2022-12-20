'use strict';

const path = require('path');
const { DefinePlugin } = require('webpack');

module.exports = ({ development }) => ({
  devtool: false,
  mode: development ? 'development' : 'production',
  watch: !!development,
  entry: {
    script: path.join(__dirname, 'src', 'index.ts'),
  },
  output: {
    path: path.join(__dirname, '.build'),
    filename: '[name].js',
    library: ['squeaky'],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
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
      PROTOCOL: JSON.stringify(development ? 'http' : 'https'),
      HOST: JSON.stringify(development ? 'localhost:3333' : 'squeaky.ai'),
      SESSION_CUT_OFF_MS : JSON.stringify(1000 * 60 * 30),
    })
  ]
});
