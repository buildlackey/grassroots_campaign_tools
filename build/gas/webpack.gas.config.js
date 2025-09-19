// build/gas/webpack.gas.config.js
const path = require("path");
const glob = require("glob");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
    mode: "development", // keep dev mode to avoid tree-shaking/minification
    entry: glob.sync(path.resolve(__dirname, "../../code/gas/src/logic/*.ts")),
    output: {
        path: path.resolve(__dirname, "../../dist/gas/gas_safe_staging"),
        filename: "gas_bundle.js",
        // GAS requires functions to live on the global object
        library: { type: "assign", name: "globalThis.CAMPAIGN" },
        pathinfo: true,
    },
    target: ["web", "es5"],   // ensures Apps Script-compatible output
    devtool: "source-map",
    optimization: {
        minimize: false,          // don't minify — easier to debug
        concatenateModules: false,
        mangleExports: false,
        usedExports: false,       // ⬅️ disables tree-shaking entirely
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.json"),
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [new GasPlugin()],
    stats: "errors-warnings",
    infrastructureLogging: { level: "warn" },
};
