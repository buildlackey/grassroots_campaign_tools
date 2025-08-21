// build/gas/webpack.gas.config.js
const path = require("path");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
    mode: "development",
    entry: path.resolve(__dirname, "../../code/gas/src/logic/IntegrationTest.ts"),
    // build/gas/webpack.gas.config.js
    output: {
        path: path.resolve(__dirname, "../../dist/gas/gas_safe_staging"),
        filename: "gas_bundle.js",
        // ⬇️ Avoids 'this' being undefined in GAS
        library: { type: "assign", name: "globalThis.GASMOD" },
        pathinfo: true
    },


    target: ["web", "es5"],
    devtool: "source-map",
    optimization: {
        minimize: false,
        concatenateModules: false,
        mangleExports: false,
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
    resolve: { extensions: [".ts", ".tsx", ".js"] },
    plugins: [new GasPlugin()],
    stats: "errors-warnings",
    infrastructureLogging: { level: "warn" },
};
