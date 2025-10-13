const path = require("path");

module.exports = {
    mode: "development",
    context: path.resolve(__dirname, "../../"), // 👈 Fix: allow ts-loader to access code/common/src
    entry: {
        CampaignToolsLogger: path.resolve(__dirname, "../../code/common/src/CampaignToolsLogger.ts"),
    },
    output: {
        path: path.resolve(__dirname, "../../dist/common/gas_safe_staging"),
        filename: "CampaignToolsLogger.html",
        library: { type: "assign", name: "globalThis.CAMPAIGN" },
    },
    target: ["web", "es5"],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
    optimization: { minimize: false },
};
