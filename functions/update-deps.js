const fs = require('fs');
const path = require('path');
function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            if (file !== 'node_modules') walk(p);
        } else if (p.endsWith('.js')) {
            let content = fs.readFileSync(p, 'utf8');
            const newContent = content.replace(/require\(['"]firebase-functions['"]\)/g, 'require("firebase-functions/v1")');
            if (content !== newContent) {
                fs.writeFileSync(p, newContent);
                console.log('Updated ' + p);
            }
        }
    }
}
walk(__dirname);
