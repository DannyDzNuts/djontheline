import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { profile } from '../src/data/profile';
const base = process.env.TEST_BASE || '/';

test('single page navigation, media, production paths, and removed features', async ({ page, request }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await expect(page.locator('h1')).toHaveText('Prime Rib');
  await expect(page.locator('header nav a')).toHaveText(['Work', 'Experience', 'About', 'Contact']);
  expect(await page.locator('body').innerText()).not.toMatch(/dish study|case study|process study|résumé|working cook/i);
  await expect(page.locator('.contact-email')).toHaveAttribute('href', `mailto:${profile.email}`);
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://djontheline.com' + base);
  for (const link of await page.locator('header nav a').all()) { await link.click(); await expect(page.locator((await link.getAttribute('href'))!.replace(base, ''))).toBeInViewport(); }
  const urls = await page.locator('a[href], img[src], source[srcset], link[rel="stylesheet"]').evaluateAll(els => els.flatMap(el => (el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('srcset') || '').split(',').map(v => v.trim().split(' ')[0]).filter(v => v.startsWith('/'))));
  for (const url of new Set(urls)) expect((await request.get(url.split('#')[0] || base)).status(), url).toBe(200);
  expect(errors).toEqual([]);
});

for (const width of [360, 390, 768, 1024, 1440, 1920]) test(`layout fits ${width}px and reserves image space`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto(base);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const img of await page.locator('main img').all()) {
    expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0); expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0);
  }
  const hero = await page.locator('.signature-hero').boundingBox(), photo = await page.locator('.hero-media img').boundingBox();
  expect(photo!.height).toBeGreaterThanOrEqual(hero!.height - 1);
});

test('keyboard, direct anchors, lightbox Escape/focus, and accessibility', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(base);
  await page.keyboard.press('Tab'); await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main')).toBeFocused();
  await page.goto(`${base}#grilled-pork-chop`); await expect(page.locator('#grilled-pork-chop')).toBeInViewport();
  const photo = page.locator('#grilled-pork-chop a[data-lightbox]').first();
  await photo.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.locator('.photo-lightbox img').getAttribute('alt')).toBeTruthy();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(photo).toBeFocused();
  await photo.click(); await page.locator('.photo-lightbox').click({ position: { x: 5, y: 5 } }); await expect(photo).toBeFocused();
  const result = await new AxeBuilder({ page }).analyze(); expect(result.violations).toEqual([]);
});

test('without JavaScript the complete portfolio and original image links work', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto(new URL(base, process.env.TEST_URL || 'http://127.0.0.1:4321').href);
  await expect(page.getByRole('heading', { name: 'Bacon Jalapeño Burger' })).toBeVisible();
  await expect(page.locator('.hero-copy h1')).toHaveCSS('opacity', '1');
  const photo = page.locator('#grilled-pork-chop a[data-lightbox]').first(); await photo.click(); expect(page.url()).toMatch(/\.webp$/);
  await context.close();
});

test('responsive media, low layout shift, no production diagnostics, visual captures', async ({ page }) => {
  test.setTimeout(45000);
  await page.addInitScript(() => {
    (window as any).layoutShift = 0;
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) new PerformanceObserver(list => { for (const entry of list.getEntries() as any) if (!entry.hadRecentInput) (window as any).layoutShift += entry.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.setViewportSize({ width: 1440, height: 960 }); await page.goto(`${base}?motionDebug=true`);
  await page.waitForTimeout(1700); expect(await page.locator('.motion-debug').count()).toBe(0);
  for (const section of await page.locator('[data-reveal]').all()) { await section.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500); }
  await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `/tmp/foodfolio-${test.info().project.name}-desktop.png`, fullPage: true });
  expect(await page.evaluate(() => (window as any).layoutShift)).toBeLessThan(.05);
  expect(await page.locator('.hero-media img').evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(/\.(avif|webp)$/);
  await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: `/tmp/foodfolio-${test.info().project.name}-mobile.png`, fullPage: true });
});
