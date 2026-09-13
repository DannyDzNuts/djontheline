import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.TEST_BASE || '/';
test('signature photograph fills its viewport on phones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  const hero = await page.locator('.signature-hero').boundingBox();
  const photo = await page.locator('.hero-media img').boundingBox();
  expect(photo!.height).toBeGreaterThanOrEqual(hero!.height - 1);
});
test('all studies are real routes and local media/links resolve', async ({ page, request }) => {
  await page.goto(base);
  await expect(page.locator('h1')).toHaveText('Prime Rib');
  for (const slug of ['prime-rib', 'bacon-jalapeno-burger', 'grilled-pork-chop', 'seasonal-feature']) {
    const response = await page.goto(`${base}dishes/${slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  }
  for (const route of ['', 'about/', 'dishes/prime-rib/']) {
    await page.goto(base + route);
    const urls = await page.locator('a[href], img[src], source[srcset], link[rel="stylesheet"]').evaluateAll(els => els.flatMap(el => {
      const attr = el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('srcset') || '';
      return attr.split(',').map(v => v.trim().split(' ')[0]).filter(v => v.startsWith('/') && !v.startsWith('//'));
    }));
    for (const url of new Set(urls)) expect((await request.get(url.split('#')[0])).status(), url).toBe(200);
  }
});

for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  test(`composition fits ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', 'about/', 'dishes/grilled-pork-chop/']) {
      await page.goto(base + route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const img of await page.locator('img').all()) {
        expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0);
        expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0);
      }
    }
  });
}

test('reduced motion, keyboard, direct anchors, and accessibility', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.goto(`${base}#grilled-pork-chop`);
  await expect(page.locator('#grilled-pork-chop')).toBeInViewport();
  expect(await page.locator('.hero-media').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
});

test('native wheel, precision deltas, keyboard, and scrollbar changes remain unmodified', async ({ page }) => {
  await page.goto(base);
  await page.evaluate(() => {
    (window as any).wheelCanceled = false;
    window.addEventListener('wheel', event => { if (event.defaultPrevented) (window as any).wheelCanceled = true; });
  });
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(120, 0);
  await page.mouse.wheel(0, 12);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(132, 0);
  expect(await page.evaluate(() => (window as any).wheelCanceled)).toBe(false);
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(400);
  await page.keyboard.press('End');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight))).toBeLessThan(3);
  await page.keyboard.press('Home');
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => scrollTo(0, 700));
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => scrollY)).toBe(700);
});

test('no JavaScript still exposes all work and direct routes', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto((process.env.TEST_URL || 'http://127.0.0.1:4321') + (base === '/' ? '/' : ''));
  await expect(page.getByRole('heading', { name: 'Bacon Jalapeño Burger' })).toBeVisible();
  await page.getByRole('link', { name: 'View Grilled Pork Chop dish study' }).click();
  await expect(page.locator('h1')).toHaveText('Grilled Pork Chop');
  await context.close();
});

test('responsive sources, reserved space, production debug guard, and screenshots', async ({ page, browser }) => {
  test.setTimeout(45000);
  await page.addInitScript(() => {
    (window as any).layoutShift = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as any) if (!entry.hadRecentInput) (window as any).layoutShift += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${base}?motionDebug=true`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);
  expect(await page.locator('.motion-debug').count()).toBe(0);
  for (const element of await page.locator('[data-reveal]').all()) { await element.scrollIntoViewIfNeeded(); await page.waitForTimeout(1550); }
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/foodfolio-desktop.png', fullPage: true });
  expect(await page.evaluate(() => (window as any).layoutShift)).toBeLessThan(0.05);
  const desktopSrc = await page.locator('.hero-media img').evaluate((el: HTMLImageElement) => el.currentSrc);
  expect(desktopSrc).toMatch(/\.(avif|webp)$/);
  // A fresh context avoids the browser correctly reusing a larger cached source.
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(new URL(base, process.env.TEST_URL || 'http://127.0.0.1:4321').href);
  await mobile.waitForTimeout(1600);
  await mobile.screenshot({ path: '/tmp/foodfolio-mobile-hero.png' });
  for (const element of await mobile.locator('[data-reveal]').all()) { await element.scrollIntoViewIfNeeded(); await mobile.waitForTimeout(1550); }
  await mobile.evaluate(() => scrollTo(0, 0));
  await mobile.screenshot({ path: '/tmp/foodfolio-mobile.png', fullPage: true });
  expect(await mobile.locator('.hero-media img').evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(/1600\.(avif|webp)$/);
  expect(await mobile.locator('#bacon-jalapeno-burger img').evaluate((el: HTMLImageElement) => el.currentSrc)).toMatch(/480\.(avif|webp)$/);
  await mobile.close();
});
