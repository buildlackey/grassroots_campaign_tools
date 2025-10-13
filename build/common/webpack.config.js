const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    HelloWorld: path.resolve(__dirname, '../../code/common/src/HelloWorld.ts'),
  },
  output: {
    path: path.resolve(__dirname, '../../dist/common/gas_safe_staging'),
    filename: 'HelloWorld.html', // emit JS as .html for GAS include
    library: { type: 'assign', name: 'globalThis.CAMPAIGN' },
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  optimization: {
    minimize: false,
  },
};

