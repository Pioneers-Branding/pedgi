const fs = require('fs');
const path = require('path');

const gitHooksDir = path.resolve(__dirname, '..', '.git', 'hooks');
const preCommitHook = path.join(gitHooksDir, 'pre-commit');

const hookContent = `#!/bin/sh
# Automatically regenerate sitemap.xml whenever files are committed
if command -v node >/dev/null 2>&1; then
  echo "Regenerating sitemap.xml before commit..."
  node scripts/generate-sitemap.js
  git add sitemap.xml
fi
`;

try {
  if (fs.existsSync(gitHooksDir)) {
    fs.writeFileSync(preCommitHook, hookContent, { mode: 0o755 });
    console.log('Successfully installed git pre-commit hook for sitemap auto-generation.');
  } else {
    console.log('.git/hooks not found, skipping hook install.');
  }
} catch (err) {
  console.warn('Could not install git hook:', err.message);
}
