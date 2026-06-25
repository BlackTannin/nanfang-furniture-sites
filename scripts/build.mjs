import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pagesDir = path.join(root, 'src', 'pages');
const viewDir = path.join(root, 'view');

const site = JSON.parse(fs.readFileSync(path.join(root, 'src', 'site.config.json'), 'utf8'));
const SITE = site.siteUrl.replace(/\/$/, '');
const DEFAULT_OG = `${SITE}/images/og.jpg`;

const headerTpl = fs.readFileSync(path.join(root, 'partials/header.html'), 'utf8');
const footerTpl = fs.readFileSync(path.join(root, 'partials/footer.html'), 'utf8');

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Missing front matter');
  const meta = {};
  const fm = match[1];
  const jsonMatch = fm.match(/^jsonLd:\s*(\{[\s\S]*\})\s*$/m);
  if (jsonMatch) meta.jsonLd = jsonMatch[1];
  const fmLines = fm.replace(/^jsonLd:\s*\{[\s\S]*\}\s*$/m, '').trim();
  for (const line of fmLines.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (key === 'jsonLd') continue;
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body: match[2].trim() };
}

function navClass(active, key) {
  if (key === 'zhongshi') {
    return ['zhongshi', 'xinzhongshi', 'song', 'ming', 'tang'].includes(active) ? ' class="active"' : '';
  }
  return active === key ? ' class="active"' : '';
}

function applyPaths(tpl, paths) {
  return tpl
    .replaceAll('{{ROOT}}', paths.root)
    .replaceAll('{{HOME}}', paths.home)
    .replaceAll('{{VIEW}}', paths.view);
}

function applySite(tpl) {
  return tpl
    .replaceAll('{{BRAND}}', site.brand)
    .replaceAll('{{BRAND_ALT}}', site.brandAlt || site.brand)
    .replaceAll('{{LEGAL_NAME}}', site.legalName)
    .replaceAll('{{TAGLINE}}', site.tagline)
    .replaceAll('{{PHONE}}', site.phone)
    .replaceAll('{{PHONE_TEL}}', site.phoneTel)
    .replaceAll('{{WECHAT}}', site.wechat)
    .replaceAll('{{WECHAT_NOTE}}', site.wechatNote || '')
    .replaceAll('{{EMAIL}}', site.email || '')
    .replaceAll('{{ADDRESS}}', site.address)
    .replaceAll('{{CITY}}', site.city || '')
    .replaceAll('{{SERVICE_AREA}}', site.serviceArea)
    .replaceAll('{{WORK_HOURS}}', site.workHours || '')
    .replaceAll('{{MAP_LINK}}', site.mapLink || '#')
    .replaceAll('{{MAP_EMBED}}', site.mapEmbed || '')
    .replaceAll('{{WARRANTY}}', site.warranty || '');
}

function renderHeader(active, paths) {
  const keys = ['index', 'custom', 'zhongshi', 'xinzhongshi', 'song', 'ming', 'tang', 'cases', 'about', 'contact'];
  let html = applySite(applyPaths(headerTpl, paths));
  for (const k of keys) {
    html = html.replace(`{{ACTIVE_${k}}}`, navClass(active, k));
  }
  return html;
}

function renderFooter(paths) {
  return applySite(applyPaths(footerTpl, paths));
}

function renderHead(meta, paths) {
  const canonical = meta.canonical || SITE + '/';
  const ogImage = meta.ogImage || DEFAULT_OG;
  const ogType = meta.ogType || 'website';
  const themeClass = meta.theme ? ` class="theme-${meta.theme}"` : '';
  let jsonLd = meta.jsonLd || '';
  if (jsonLd && !jsonLd.trim().startsWith('{')) jsonLd = '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  ${meta.keywords ? `<meta name="keywords" content="${meta.keywords}">` : ''}
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="${paths.root}favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${meta.ogTitle || meta.title}">
  <meta property="og:description" content="${meta.ogDescription || meta.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:locale" content="zh_CN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.ogTitle || meta.title}">
  <meta name="twitter:description" content="${meta.ogDescription || meta.description}">
  <meta name="twitter:image" content="${ogImage}">
  <link rel="stylesheet" href="${paths.root}css/style.css">
  ${jsonLd ? `<script type="application/ld+json">\n${jsonLd}\n  </script>` : ''}
</head>
<body${themeClass}>`;
}

function expandPictures(html, assetRoot) {
  return html.replace(/\[\[pic:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|(\w+)\]\]/g, (_, file, alt, cls, loading) => {
    const eager = loading === 'eager';
    return `<picture class="${cls}">
  <source srcset="${assetRoot}images/${file}.webp" type="image/webp">
  <img src="${assetRoot}images/${file}.jpg" alt="${alt}" width="800" height="530" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>
</picture>`;
  });
}

const pathSets = {
  root: { root: '', home: 'index.html', view: 'view/' },
  view: { root: '../', home: '../index.html', view: '' }
};

fs.mkdirSync(viewDir, { recursive: true });

const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.html'));
const builtView = new Set();

for (const file of files) {
  const raw = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  const isIndex = (meta.file || file) === 'index.html';
  const paths = isIndex ? pathSets.root : pathSets.view;
  const active = meta.active || '';
  const content = expandPictures(applySite(body), paths.root);
  const page = [
    renderHead(meta, paths),
    renderHeader(active, paths),
    content,
    renderFooter(paths),
    '</body>\n</html>'
  ].join('\n\n');

  const outFile = meta.file || file;
  if (isIndex) {
    fs.writeFileSync(path.join(root, outFile), page, 'utf8');
    console.log('Built', outFile);
  } else {
    fs.writeFileSync(path.join(viewDir, outFile), page, 'utf8');
    builtView.add(outFile);
    console.log('Built view/' + outFile);
  }
}

// 清理根目录已迁移到 view/ 的旧 HTML
for (const name of fs.readdirSync(root)) {
  if (name === 'index.html') continue;
  if (!name.endsWith('.html')) continue;
  if (builtView.has(name)) {
    fs.unlinkSync(path.join(root, name));
    console.log('Removed root/' + name);
  }
}

console.log(`Done — ${files.length} pages.`);

const configJs = `window.SITE_CONFIG = ${JSON.stringify({
  siteUrl: site.siteUrl,
  brand: site.brand,
  legalName: site.legalName,
  phone: site.phone,
  phoneTel: site.phoneTel,
  wechat: site.wechat,
  address: site.address,
  city: site.city,
  serviceArea: site.serviceArea,
  apiBaseUrl: site.apiBaseUrl || ''
}, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'js', 'config.js'), configJs, 'utf8');
console.log('Built js/config.js');
