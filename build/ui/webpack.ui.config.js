const path = require("path");
const glob = require("glob");

// Automatically find all *Code.ts files in the logic folder
const entryFiles = glob.sync(path.resolve(__dirname, "../../code/ui/src/logic/*Code.ts"));
const entries = {};
entryFiles.forEach((file) => {
    const name = path.basename(file, ".ts");
    entries[name] = file;
});

module.exports = {
    mode: "development",
    entry: entries,
    output: {
        path: path.resolve(__dirname, "../../dist/ui/gas_safe_staging"),
        filename: "[name].html", // Emit as .html for GAS includes
        library: { type: "assign", name: "globalThis.CAMPAIGN" },
        pathinfo: true,
    },
    target: ["web", "es5"],
    devtool: "inline-source-map",
    optimization: {
        minimize: false,
        concatenateModules: false,
        mangleExports: false,
        usedExports: false,
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
    stats: "errors-warnings",
    infrastructureLogging: { level: "warn" },
};
