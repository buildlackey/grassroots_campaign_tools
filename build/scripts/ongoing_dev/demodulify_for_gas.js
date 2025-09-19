const fs = require('fs');
const path = require('path');

console.log('🔧 Post-processing TypeScript output for GAS compatibility...');
console.log('📍 Working directory:', process.cwd());

// Recursively find all .js files using built-in fs
function findJsFiles(dir) {
    const files = [];

    function traverse(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                traverse(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
    }

    traverse(dir);
    return files;
}

try {
    const files = findJsFiles('.');
    console.log(`📁 Found ${files.length} files to process`);

    files.forEach(file => {
        console.log(`🔄 Processing: ${file}`);

        let content = fs.readFileSync(file, 'utf8');
        const originalLength = content.length;

        // Remove all import statements
        content = content.replace(/^import\s+.*?from\s+['"][^'"]*['"];?\s*$/gm, '');
        content = content.replace(/^import\s+['"][^'"]*['"];?\s*$/gm, '');

        // Remove export keywords but keep the declarations
        content = content.replace(/^export\s+(?=class|interface|type|const|let|var|function)/gm, '');

        // Remove standalone export statements like "export { Foo, Bar };"
        content = content.replace(/^export\s*{\s*[^}]*\s*}\s*;?\s*$/gm, '');

        // Remove "export default"
        content = content.replace(/^export\s+default\s+/gm, '');

        // Remove the TypeScript module marker "export {};"
        content = content.replace(/^export\s*{\s*}\s*;?\s*$/gm, '');

        // Clean up extra newlines
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

        // Find class declarations and add global assignments
        const classMatches = content.match(/(?:^|\n)(?:var\s+)?(\w+)\s*=\s*\/\*\*\s*@class\s*\*\/\s*\(function\s*\(\)/g) ||
            content.match(/(?:^|\n)class\s+(\w+)/g) ||
            [];

        if (classMatches.length > 0) {
            console.log(`  📦 Found ${classMatches.length} classes to expose globally`);

            const assignments = classMatches.map(match => {
                // Extract class name from either TypeScript compiled format or ES6 class
                let className;
                if (match.includes('/** @class */')) {
                    className = match.match(/(\w+)\s*=\s*\/\*\*\s*@class\s*\*\//)[1];
                } else {
                    className = match.replace(/(?:^|\n)class\s+/, '');
                }

                return `(globalThis as any).CAMPAIGN = (globalThis as any).CAMPAIGN || {};\n(globalThis as any).CAMPAIGN.${className} = ${className};`;
            }).join('\n');

            // Add global assignments at the end
            if (!content.includes('globalThis.CAMPAIGN')) {
                content += '\n\n// Global namespace assignments\n' + assignments;
            }
        }

        // Write the modified content back
        fs.writeFileSync(file, content);

        const newLength = content.length;
        const saved = originalLength - newLength;
        console.log(`  ✅ Processed: ${file} (removed ${saved} chars)`);
    });

    console.log('🎉 GAS post-processing complete!');
} catch (error) {
    console.error('❌ Error during post-processing:', error);
    process.exit(1);
}