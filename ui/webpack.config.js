/**
 * Webpack configuration for Google Apps Script bundling.
 *
 * 🔧 Purpose:
 * This config transforms and bundles TypeScript source files for use in the Apps Script environment.
 *
 * 🧱 Build Lifecycle:
 *   - TypeScript files are compiled directly by Webpack (via `ts-loader`) - module rules declared to pick up '*.ts'
 *   - Webpack bundles these into `build/gas_safe_staging/`, stripping unsupported module syntax
 *   -   Also key: Webpack injects methods into the equivalent of globalThis entry points
 *       which are required since GAS environment wants everything in a flat namespace.  
 *       That is where __webpack_require__.g comes in.  This is Webpack's internal globalThis shim which 
 *       provides a consistent global object reference across various JavaScript environments — 
 *       including browsers, Node.js, and older runtimes that may not support globalThis natively.
 *
 * 📦 What Webpack does:
 *   1. Loads `.ts` source files and transpiles them via `ts-loader`
 *   2. Removes unsupported module features like `import`/`export`
 *   3. Automatically injects `globalThis.myExportedFunction = myExportedFunction`  (using its globalThis analog)
 *      for each exported symbol, using `gas-webpack-plugin`
 *   4. Outputs GAS-safe `.js` files into `build/gas_safe_staging/`
 *
 * 🚀 Only files in `build/gas_safe_staging/` are pushed to Apps Script using `clasp push`.
 *
 * ✅ Result:
 * Apps Script can call TypeScript-defined logic as global functions without module errors.
 */

const path = require("path");
const fs = require("fs");
const GasPlugin = require("gas-webpack-plugin");
const webpack = require("webpack");

console.log("🛠️  Using webpack.config.js with dynamic TypeScript entry discovery");

const srcDir = path.resolve(__dirname, "src");

const entry = {};

// Only bundle `.ts` files, skip any UI assets like FilterUICode.ts if needed
fs.readdirSync(srcDir)
  .filter(file => file.endsWith(".ts"))
  .forEach(file => {
    const name = path.basename(file, ".ts"); // ✅ Fix: strip .ts, not .js
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

  // 🧩 Tell Webpack how to handle TypeScript files
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
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
      autoGlobalExportsFiles: [         // this is redundant and brittle .. should derive this from entries, above
        './src/Code.ts',
        './src/LatLong.ts',
      ],
    }),
  ],

  devtool: false,
};

