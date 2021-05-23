const path = require('path');

module.exports = ({ development }) => ({
  devtool: false,
  mode: development ? 'development' : 'production',
  watch: !!development,
  entry: path.join(__dirname, 'src', 'script.ts'),
  output: {
    path: path.join(__dirname, '.build'),
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
  }
});
