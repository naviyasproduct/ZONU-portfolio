const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
const ignoreDirs = new Set(['node_modules', '.next', '.git', 'scripts']);

function shouldScanFile(filePath) {
  return exts.has(path.extname(filePath));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('next/document') || content.includes('<Html');
}

function walk(dirPath, hits) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      walk(path.join(dirPath, entry.name), hits);
      continue;
    }

    const filePath = path.join(dirPath, entry.name);
    if (!shouldScanFile(filePath)) continue;

    try {
      if (scanFile(filePath)) hits.push(filePath);
    } catch {
      // ignore unreadable files
    }
  }
}

const hits = [];
walk(root, hits);

if (hits.length === 0) {
  console.log('No matches for next/document or <Html in source.');
  process.exit(0);
}

for (const filePath of hits) {
  console.log(path.relative(root, filePath));
}
