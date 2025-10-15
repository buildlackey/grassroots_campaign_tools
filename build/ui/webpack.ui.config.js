const path = require("path");

const entryName = process.env.ENTRY_NAME; // passed by build script
if (!entryName) {
  throw new Error("ENTRY_NAME env var is required (e.g. ENTRY_NAME=SettingsDialogActionCode)");
}

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, `../../code/ui/src/logic/${entryName}.ts`),
  output: {
    path: path.resolve(__dirname, "../../dist/ui/gas_safe_staging"),
    filename: `${entryName}.html`, // GAS expects .html for includes
    library: {
      type: "assign",
      name: `globalThis.CAMPAIGN.${entryName}`,
    },
    pathinfo: true,
  },
  target: ["web", "es5"],
  devtool: "inline-source-map",
  optimization: {
    minimize: false,
    concatenateModules: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.json")
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  stats: "errors-warnings",
};
