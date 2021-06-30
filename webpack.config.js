const path = require('path');
const { DefinePlugin } = require('webpack');

module.exports = ({ development }) => ({
  devtool: false,
  mode: development ? 'development' : 'production',
  watch: !!development,
  entry: path.join(__dirname, 'src', 'index.ts'),
  output: {
    path: development
      ? path.join(__dirname, 'utils', 'public')
      : path.join(__dirname, '.build'),
    filename: 'script.js',
    library: {
      type: 'window',
      name: 'squeaky'
    }
  },
  resolve: {
    extensions: ['.ts']
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
      WEBSOCKET_SERVER_URL: JSON.stringify(development ? 'ws://localhost:5000/gateway' : 'wss://squeaky.ai/gateway'),
    })
  ]
});
