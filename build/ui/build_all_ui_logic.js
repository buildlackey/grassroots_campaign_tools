const { execSync } = require("child_process");
const glob = require("glob");
const path = require("path");

const entryFiles = glob.sync(path.resolve(__dirname, "../../code/ui/src/logic/*Code.ts"));

for (const file of entryFiles) {
  const entryName = path.basename(file, ".ts");
  console.log(`\n🚀 Building ${entryName}...`);
  execSync(`ENTRY_NAME=${entryName} npx webpack --config ${__dirname}/webpack.ui.config.js`, {
    stdio: "inherit",
  });
}

console.log("\n✅ All UI logic files built successfully.");
