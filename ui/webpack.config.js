const path = require("path");
const fs = require("fs");
const GasPlugin = require("gas-webpack-plugin");
const webpack = require("webpack");

console.log("🛠️  Using webpack.config.js with dynamic entry discovery");

// Auto-generate entry object for all .js files in src/
const srcDir = path.resolve(__dirname, "build/unit_testable_js");

const entry = {};

// Only bundle files other than FilterUICode.js - we leave this raw -- better integration w/ GAS
fs.readdirSync(srcDir)
  .filter(file =>
    file.endsWith(".js") &&
    file !== "FilterUICode.js" &&
    file !== "Code.js"
  )
  .forEach(file => {
    const name = path.basename(file, ".js");
    entry[name] = path.join(srcDir, file);
  });

module.exports = {
  mode: "development",
  context: __dirname,
  entry,
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new GasPlugin({
      autoGlobalExportsFiles: [
        './src/LatLong.ts',  // 👈 this enables LatLong.helloLatLong()
      ],
    }),
  ],
  devtool: false,
};
