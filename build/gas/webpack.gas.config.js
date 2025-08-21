const path = require("path");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
    mode: "production",

    entry: {
        gas_bundle: path.resolve(__dirname, "../../code/gas/src/logic/IntegrationTest.ts"),
    },

    output: {
        path: path.resolve(__dirname, "../../built/gas/gas_safe_staging"),
        filename: "[name].js",   // => gas_bundle.js
        library: "global",
        libraryTarget: "this",   // ensures GAS globals attach correctly
    },

    resolve: {
        extensions: [".ts", ".js"],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(__dirname, "tsconfig.json"), // force correct config
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },

    plugins: [
        new GasPlugin(),
    ],
};

