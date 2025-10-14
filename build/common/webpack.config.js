const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    HelloWorld: path.resolve(__dirname, '../../code/common/src/HelloWorld.ts'),
    CampaignToolsLogger: path.resolve(__dirname, '../../code/common/src/CampaignToolsLogger.ts'),
  },
  output: {
    path: path.resolve(__dirname, '../../dist/common/gas_safe_staging'),
    filename: '[name].html', // emit JS as .html for GAS include
    library: { type: 'assign', name: 'globalThis.CAMPAIGN' },
  },
  target: ['web', 'es5'],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.webpack.json'),
          },
        },
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
