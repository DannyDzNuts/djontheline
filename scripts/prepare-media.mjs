import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Originals are retained for future exports. Only derivatives are used by pages.
const root = 'public/media';
const manifest = {};
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await scan(file); continue; }
    if (!/\.original\.(jpg|jpeg|png|webp)$/i.test(file)) continue;
    const output = file.replace(/\.original\.[^.]+$/, '');
    const source = sharp(file).rotate();
    const full = await source.clone().resize({ width: 2200, withoutEnlargement: true }).webp({ quality: 84 }).toFile(`${output}.webp`);
    const variants = [];
    for (const width of [480, 800, 1200, 1600, 2200].filter(w => w <= full.width)) {
      const webp = `${output}-${width}.webp`;
      const avif = `${output}-${width}.avif`;
      await source.clone().resize({ width }).webp({ quality: 80 }).toFile(webp);
      await source.clone().resize({ width }).avif({ quality: 56, effort: 4 }).toFile(avif);
      variants.push({ width, webp: '/' + webp.replace(/^public\//, ''), avif: '/' + avif.replace(/^public\//, '') });
    }
    manifest['/' + `${output}.webp`.replace(/^public\//, '')] = { width: full.width, height: full.height, variants };
    console.log(`Prepared ${output}: ${full.width} × ${full.height}`);
  }
}
await scan(root);
await writeFile('src/data/media-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
