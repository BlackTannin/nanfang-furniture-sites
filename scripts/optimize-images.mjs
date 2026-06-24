import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'images');
const MAX_WIDTH = 1600;
const JPG_QUALITY = 82;
const WEBP_QUALITY = 80;

const files = fs.readdirSync(imagesDir).filter((f) => /\.jpe?g$/i.test(f));

for (const file of files) {
  const input = path.join(imagesDir, file);
  const base = file.replace(/\.jpe?g$/i, '');
  const buf = fs.readFileSync(input);

  const resized = sharp(buf).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });

  await resized.clone().jpeg({ quality: JPG_QUALITY, mozjpeg: true }).toFile(input);

  await resized.clone().webp({ quality: WEBP_QUALITY }).toFile(path.join(imagesDir, base + '.webp'));

  const stat = fs.statSync(input);
  console.log(`${file} → ${Math.round(stat.size / 1024)}KB + ${base}.webp`);
}

const heroPath = path.join(imagesDir, 'hero.jpg');
if (fs.existsSync(heroPath)) {
  await sharp(heroPath)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85 })
    .toFile(path.join(imagesDir, 'og.jpg'));
  await sharp(path.join(imagesDir, 'og.jpg'))
    .webp({ quality: 82 })
    .toFile(path.join(imagesDir, 'og.webp'));
  console.log('Created og.jpg / og.webp');
}

console.log('Image optimization complete.');
