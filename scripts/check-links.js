const fs = require('fs');
const path = require('path');

function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === '.git' || file === 'node_modules') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = getAllHtmlFiles(rootDir);

let brokenLinks = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const fileDir = path.dirname(file);
  const regex = /href=["']([^"'#][^"']*)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let href = match[1];
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('tel:') ||
      href.startsWith('mailto:') ||
      href.startsWith('javascript:')
    ) {
      continue;
    }
    // Clean query and hash
    const cleanHref = href.split('?')[0].split('#')[0];
    if (!cleanHref) continue;

    let targetPath;
    if (cleanHref.startsWith('/')) {
      targetPath = path.join(rootDir, cleanHref);
    } else {
      targetPath = path.resolve(fileDir, cleanHref);
    }

    if (!fs.existsSync(targetPath)) {
      brokenLinks.push({
        sourceFile: path.relative(rootDir, file),
        href: href,
        targetPath: path.relative(rootDir, targetPath)
      });
    }
  }
});

console.log('Total broken relative links found:', brokenLinks.length);
brokenLinks.forEach(b => console.log('File:', b.sourceFile, '| href:', b.href, '| target:', b.targetPath));
