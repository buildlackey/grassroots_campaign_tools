/**
 * Webpack configuration for Google Apps Script bundling.
 *
 * 🔧 Purpose:
 * This config transforms and bundles TypeScript modules for use in the Apps Script environment.
 *
 * 🧱 Build Lifecycle:
 *   - TypeScript files are compiled by `tsc` into `build/unit_testable_js/` (for testing only)
 *   - Webpack then bundles those into `build/gas_safe_staging/`, removing module syntax
 *
 * 📦 What Webpack does:
 *   1. Loads compiled JS from `build/unit_testable_js/`
 *   2. Removes unsupported module features like `import`/`export`
 *   3. Generates Google Apps Script–safe `.js` files in `build/gas_safe_staging/`
 *   4. Uses `gas-webpack-plugin` to expose exports as global objects 
 *
 * 🚀 Only files in `build/gas_safe_staging/` are pushed to Apps Script using `clasp push`.
 *
 * ✅ Result:
 * Apps Script can call TypeScript-defined logic as global functions without errors.
 */



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
    path: path.resolve(__dirname, "build/gas_safe_staging"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
plugins: [
  new GasPlugin({
    // 📦 autoGlobalExportsFiles tells gas-webpack-plugin which modules to
    // expose globally in Google Apps Script. Although Webpack processes
    // compiled JS from build/unit_testable_js/, this list uses the original
    // .ts source paths to ensure that exports (from Foo.ts files) are
    // attached to the global scope as globalThis.Foo.
    //
    // This is required because GAS does not support modules — all callable
    // functions must be globally scoped.
    autoGlobalExportsFiles: [
      './src/LatLong.ts' // ✅ not build/unit_testable_js — plugin maps source to global
    ],
  }),
],

  devtool: false,
};


