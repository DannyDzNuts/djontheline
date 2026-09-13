import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

// Isolated output; temporary content is always restored, including on assertion failure.
const output = await mkdtemp('.validation-output-');
const fixture = 'src/content/dishes/zz-validation.md';
const secondary = 'src/content/dishes/zz-video-validation.md';
const originalPath = 'src/content/dishes/prime-rib.md';
const original = await readFile(originalPath, 'utf8');
const mediaPath = 'public/media/validation.mp4';
let server, browser;
const minimal = `title: Validation Plate\nslug: validation-plate\nfeatured: true\nshortDescription: A content validation fixture.\nheroMedia:\n  type: image\n  src: /media/dishes/prime-rib/hero.webp\n  alt: Sample image for validation.`;
const put = data => writeFile(fixture, `---\n${data}\n---\n`);
function build() {
  const result = spawnSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', output], { encoding: 'utf8', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', BASE_PATH: '/' } });
  return { status: result.status, log: result.stdout + result.stderr };
}
try {
  await put(minimal);
  let result = build(); assert.equal(result.status, 0, result.log);
  let html = await readFile(join(output, 'index.html'), 'utf8');
  assert.match(html, /id="validation-plate"/);
  assert.doesNotMatch(html, /View dish study/);
  console.log('PASS: omitted optional fields render directly on homepage');

  await put(minimal.replace('slug: validation-plate', 'slug: prime-rib'));
  result = build(); assert.notEqual(result.status, 0); assert.match(result.log, /slugs must be unique/);
  console.log('PASS: duplicate slugs rejected');
  await put(minimal.replace('featured: true', 'featured: true\nsignature: true'));
  result = build(); assert.notEqual(result.status, 0); assert.match(result.log, /only one signature/);
  console.log('PASS: duplicate signatures rejected');

  await put(minimal.replace('type: image', 'type: video'));
  result = build(); assert.notEqual(result.status, 0); assert.match(result.log, /poster/);
  console.log('PASS: video poster required');
  await put(minimal.replace('/media/dishes/prime-rib/hero.webp', '/media/missing.webp'));
  result = build(); assert.notEqual(result.status, 0, 'Missing media must produce an actionable build error.'); assert.match(result.log, /Missing media/);
  console.log('PASS: missing local media rejected');

  const video = 'type: video\n    src: /media/validation.mp4\n    poster: /media/dishes/prime-rib/hero.webp\n    alt: A neutral test video.\n    caption: A test caption.\n    transcript: A neutral solid color frame for player testing.\n    autoplay: true';
  const encoded = spawnSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x1e2722:s=640x360:r=24', '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-y', mediaPath]);
  assert.equal(encoded.status, 0, encoded.stderr?.toString());
  await writeFile(originalPath, original.replace('signature: true', 'signature: false'));
  await put(`title: Validation Film\nslug: validation-film\norder: -1\nfeatured: true\nsignature: true\nshortDescription: A controlled player check.\nheroMedia:\n    ${video}\nprocess:\n  title: Validation process\n  description: A process player check.\n  media:\n    ${video}`);
  await writeFile(secondary, `---\ntitle: Secondary Film\nslug: secondary-film\norder: 1\nshortDescription: An unwrapped native video player.\nheroMedia:\n    ${video}\n---\n`);
  result = build(); assert.equal(result.status, 0, result.log);
  server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = join(output, pathname.endsWith('/') ? pathname + 'index.html' : pathname);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.avif': 'image/avif', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
    try { res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); } catch { res.statusCode = 404; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto(origin);
  const heroVideo = page.locator('.signature-hero video');
  assert.equal(await heroVideo.evaluate(v => v.paused), true, 'Reduced motion must prevent autoplay.');
  assert.equal(await heroVideo.evaluate(v => v.controls && v.muted), true);
  assert.equal(await heroVideo.evaluate(v => { const r = v.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.bottom - 22) === v; }), true, 'Hero controls must be unobstructed.');
  await page.locator('.hero-video-notes summary').click();
  assert.equal(await page.locator('.hero-video-notes details').evaluate(el => el.open), true);
  await heroVideo.evaluate(v => v.play());
  assert.equal(await heroVideo.evaluate(v => v.paused), false);
  assert.equal(await page.locator('#secondary-film video').evaluate(v => v.closest('a') === null), true);
  assert.equal(await page.locator('.process-film').count(), 1, 'Signature process must appear.');
  await page.locator('.process-film summary').click();
  assert.equal(await page.locator('.process-film details').evaluate(el => el.open), true);
  console.log('PASS: playable signature/section/process video, accessible controls/transcripts, reduced-motion autoplay guard');
  const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  await motionPage.goto(origin);
  const film = motionPage.locator('.process-film');
  assert.equal(await film.locator('video source').getAttribute('src'), null, 'Below-fold footage must remain deferred.');
  await film.scrollIntoViewIfNeeded();
  await motionPage.waitForFunction(() => document.querySelector('.process-film')?.classList.contains('is-visible'));
  assert.notEqual(await film.locator('.media-frame').evaluate(el => getComputedStyle(el).transform), 'none', 'Process video must visibly enter.');
  await motionPage.waitForTimeout(1500);
  assert.equal(await film.locator('.media-frame').evaluate(el => getComputedStyle(el).transform), 'none');
  assert.equal(await film.locator('video').evaluate(v => v.muted), true);
  assert.equal(await film.locator('video').evaluate(v => v.paused), false);
  console.log('PASS: process footage defers fetching, visibly reveals, then plays muted and stays still');
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await writeFile(originalPath, original);
  await Promise.all([fixture, secondary, mediaPath].map(path => rm(path, { force: true })));
  await rm(output, { recursive: true, force: true });
}
