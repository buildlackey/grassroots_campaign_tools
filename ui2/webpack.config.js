const GasPlugin = require("gas-webpack-plugin");

const entry = "./build/index.js";

module.exports = {
  mode: "development", // same as your working version
  context: __dirname,
  entry,
  output: {
    path: __dirname + "/build",
    filename: "Code.js",
  },
  plugins: [
    new GasPlugin({
      autoGlobalExportsFiles: [entry],
    }),
  ],
  devtool: false,
};

