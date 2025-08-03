const path = require("path");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./src/FormValidation.global.ts", // 👈 Entry point that attaches to globalThis
  output: {
    filename: "FormValidation.global.js",
    path: path.resolve(__dirname, "build/injectable_js"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new GasPlugin(), // Wraps output in IIFE and removes unsupported module syntax
  ],
};

