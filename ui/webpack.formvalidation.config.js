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

console.log("🛠️  Bundling FormValidation.global.ts → build/injectable_js/FormValidationGlobal.js");

module.exports = {
  mode: "development",
  context: __dirname,

  // ✅ Only build FormValidation.global.ts
  entry: {
    FormValidationGlobal: path.resolve(__dirname, "src/FormValidation.global.ts")
  },

  output: {
    path: path.resolve(__dirname, "build/injectable_js"),
    filename: "[name].js",

    // ✅ Ensure correct export to window.FormValidation
    library: {
      name: "FormValidation",
      type: "window",
      export: ["FormValidation"]
    }
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },

  devtool: false,
};

