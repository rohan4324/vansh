import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Vansh Logo-Photoroom.png');
const OUT_DIR = path.join(ROOT, 'packages/web/public/icons');
const PUBLIC_DIR = path.join(ROOT, 'packages/web/public');

const BG = '#FAFAF5';

async function loadTrimmedLogo() {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = data[i + 3];
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const isWhite = r > 240 && g > 240 && b > 240;
      if (a > 10 && !isWhite) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return sharp(SRC).toBuffer();
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  return sharp(SRC).extract({ left: minX, top: minY, width: w, height: h }).toBuffer();
}

async function makeSquare(size, padRatio = 0.08) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const trimmed = await loadTrimmedLogo();
  const logo = await sharp(trimmed)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function makeMaskable(size) {
  const inner = Math.round(size * 0.64);
  const trimmed = await loadTrimmedLogo();
  const logo = await sharp(trimmed)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const icon192 = await makeSquare(192);
  const icon512 = await makeSquare(512);
  const apple180 = await makeSquare(180, 0.08);
  const maskable512 = await makeMaskable(512);
  const favicon32 = await makeSquare(32, 0.06);

  fs.writeFileSync(path.join(OUT_DIR, 'icon-192x192.png'), icon192);
  fs.writeFileSync(path.join(OUT_DIR, 'icon-512x512.png'), icon512);
  fs.writeFileSync(path.join(OUT_DIR, 'icon-maskable-512x512.png'), maskable512);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), apple180);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'), favicon32);

  console.log('Generated icons in', OUT_DIR);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
