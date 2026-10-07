/**
 * PEDGI Sitemap Generator
 * 
 * Automatically generates a valid XML sitemap (sitemap.xml) for pedgi.com.
 * Scans all HTML files, extracts canonical URLs, excludes noindex/duplicate pages,
 * computes last modified dates from git, and applies SEO priorities.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://pedgi.com';
const ROOT_DIR = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');

// Files explicitly excluded (duplicates or utility pages)
const EXCLUDED_FILES = new Set([
  'blog/index.html', // Duplicate mirror of blog.html
  'thank-you.html'   // Confirmation page with noindex
]);

function getHtmlFiles(dir, base = '') {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(base, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!['.git', '.github', '.vscode', 'node_modules', 'files', 'images'].includes(entry.name)) {
        results = results.concat(getHtmlFiles(fullPath, relPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push({ fullPath, relPath });
    }
  }

  return results;
}

function getGitLastMod(fullPath) {
  try {
    // If the file is currently modified or staged, use today's date
    const status = execSync(`git status --porcelain -- "${fullPath}"`, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    if (status) {
      return new Date().toISOString().split('T')[0];
    }

    const output = execSync(`git log -1 --format="%as" -- "${fullPath}"`, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    if (output && /^\d{4}-\d{2}-\d{2}$/.test(output)) {
      return output;
    }
  } catch {
    // Fall back to file mtime if git fails
  }

  try {
    const stats = fs.statSync(fullPath);
    return stats.mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function parseFileMetadata(file) {
  const content = fs.readFileSync(file.fullPath, 'utf8');

  // Check for robots noindex
  const noindexMatch = /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["']/i.test(content) ||
                       /<meta\s+[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(content);
  if (noindexMatch) {
    return null; // Skip noindex page
  }

  if (EXCLUDED_FILES.has(file.relPath)) {
    return null; // Skip excluded page
  }

  // Canonical tag check
  let canonicalUrl = null;
  const canonicalMatch = content.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                         content.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  if (canonicalMatch) {
    canonicalUrl = canonicalMatch[1].trim();
    // Normalize www.pedgi.com to pedgi.com if needed
    canonicalUrl = canonicalUrl.replace(/^https?:\/\/(www\.)?pedgi\.com/, BASE_URL);
  } else {
    // Determine default canonical URL
    if (file.relPath === 'index.html') {
      canonicalUrl = `${BASE_URL}/`;
    } else {
      canonicalUrl = `${BASE_URL}/${file.relPath}`;
    }
  }

  // Determine lastmod
  const lastmod = getGitLastMod(file.fullPath);

  // Priority and Change Frequency based on page type
  let priority = '0.7';
  let changefreq = 'monthly';
  let category = 'Patient Resources';

  if (file.relPath === 'index.html' || canonicalUrl === `${BASE_URL}/`) {
    priority = '1.0';
    changefreq = 'weekly';
    category = 'Homepage';
  } else if (file.relPath.startsWith('services/')) {
    priority = '0.9';
    changefreq = 'monthly';
    category = 'Specialized Pediatric GI Services';
  } else if (file.relPath === 'children-s-medical-care.html') {
    priority = '0.8';
    changefreq = 'monthly';
    category = 'Clinic Locations';
  } else if (file.relPath === 'contact.html') {
    priority = '0.8';
    changefreq = 'monthly';
    category = 'Contact';
  } else if (file.relPath === 'new-patient-information.html') {
    priority = '0.8';
    changefreq = 'monthly';
    category = 'Patient Resources';
  } else if (file.relPath === 'blog.html') {
    priority = '0.8';
    changefreq = 'weekly';
    category = 'Blog';
  } else if (file.relPath.startsWith('blog/')) {
    priority = '0.7';
    changefreq = 'monthly';
    category = 'Blog Articles';
  } else if (file.relPath === 'no-show-policy.html') {
    priority = '0.5';
    changefreq = 'monthly';
    category = 'Policies';
  }

  return {
    relPath: file.relPath,
    loc: canonicalUrl,
    lastmod,
    changefreq,
    priority,
    category
  };
}

function generateSitemap() {
  console.log('Generating sitemap for PEDGI.com...');
  const files = getHtmlFiles(ROOT_DIR);
  const urlMap = new Map();

  for (const file of files) {
    const meta = parseFileMetadata(file);
    if (!meta) continue;

    // Prevent duplicates
    if (!urlMap.has(meta.loc)) {
      urlMap.set(meta.loc, meta);
    }
  }

  const entries = Array.from(urlMap.values());

  // Sort order: Homepage first, then Services, Locations, Contact, Patient Resources, Blog, Policies
  const categoryOrder = [
    'Homepage',
    'Specialized Pediatric GI Services',
    'Clinic Locations',
    'Contact',
    'Patient Resources',
    'Blog',
    'Blog Articles',
    'Policies'
  ];

  entries.sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return b.priority.localeCompare(a.priority) || a.loc.localeCompare(b.loc);
  });

  let currentCategory = '';
  let xmlBody = '';

  for (const item of entries) {
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      xmlBody += `\n  <!-- ${currentCategory} -->\n`;
    }

    xmlBody += `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>\n`;
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${xmlBody}
</urlset>
`;

  fs.writeFileSync(SITEMAP_PATH, sitemapXml, 'utf8');
  console.log(`Successfully generated ${SITEMAP_PATH}`);
  console.log(`Total canonical URLs included: ${entries.length}`);
  entries.forEach((e, idx) => console.log(`  ${idx + 1}. [${e.priority}] ${e.loc}`));

  return entries;
}

if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };
