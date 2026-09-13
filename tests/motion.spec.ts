import { test, expect } from '@playwright/test';
const base = process.env.TEST_BASE || '/';

test('hero entrance waits for decoded photography, then visibly moves and settles', async ({ page }) => {
  await page.route('**/media/dishes/prime-rib/hero*', async route => { await new Promise(resolve => setTimeout(resolve, 2200)); await route.continue(); });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  expect(await page.locator('.hero-media img').evaluate((img: HTMLImageElement) => img.complete)).toBe(false);
  await expect(page.locator('.signature-hero')).not.toHaveClass(/hero-media-ready/);
  await expect(page.locator('.signature-hero')).toHaveClass(/hero-media-ready/);
  const start = await page.locator('.hero-media').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
  expect(start).toBeGreaterThan(1.025);
  await page.screenshot({ path: `/tmp/foodfolio-${test.info().project.name}-hero-moving.png` });
  await page.waitForTimeout(1650);
  expect(await page.locator('.hero-media').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(1);
  await expect(page.locator('.hero-copy .techniques')).toHaveCSS('opacity', '1');
});

test('dish and process visibly reveal once, with text stagger and stable anchors', async ({ page }) => {
  await page.goto(base);
  const dish = page.locator('#bacon-jalapeno-burger');
  const frame = dish.locator('.dish-visual .media-frame');
  await expect(dish.locator('[data-snap-anchor]')).toHaveCSS('transform', 'none');
  await expect(frame).toHaveCSS('opacity', '0.65');
  await dish.scrollIntoViewIfNeeded();
  await expect(dish).toHaveClass(/is-visible/);
  const sample = await dish.evaluate(el => ({
    media: getComputedStyle(el.querySelector('.media-frame')!).transform,
    headingDelay: getComputedStyle(el.querySelector('h2')!).transitionDelay,
    tagsDelay: getComputedStyle(el.querySelector('.techniques')!).transitionDelay,
    heading: getComputedStyle(el.querySelector('h2')!).opacity,
  }));
  expect(sample.media).not.toBe('none'); expect(Number(sample.heading)).toBeLessThan(1);
  expect(parseFloat(sample.tagsDelay)).toBeGreaterThan(parseFloat(sample.headingDelay));
  await page.screenshot({ path: `/tmp/foodfolio-${test.info().project.name}-dish-moving.png` });
  await page.waitForTimeout(1800);
  await expect(frame).toHaveCSS('transform', 'none');
  await expect(dish.locator('.techniques')).toHaveCSS('opacity', '1');
  await page.evaluate(() => scrollTo(0, 0)); await dish.scrollIntoViewIfNeeded();
  await expect(frame).toHaveCSS('transform', 'none');
  const process = page.locator('.process-break').first();
  await process.scrollIntoViewIfNeeded(); await expect(process).toHaveClass(/is-visible/);
  expect(await process.locator('img').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(1);
  await page.waitForTimeout(1500); await expect(process.locator('img')).toHaveCSS('transform', 'none');
});

test('reduced motion removes transforms, wipes, and animations, including preference changes', async ({ page }) => {
  await page.goto(base); await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  for (const selector of ['.hero-media', '.intro-grid', '.dish-copy h2', '.dish-copy .techniques', '.process-copy', '.about-copy']) {
    for (const element of await page.locator(selector).all()) {
      await expect(element).toHaveCSS('transform', 'none'); await expect(element).toHaveCSS('opacity', '1'); await expect(element).toHaveCSS('animation-name', 'none');
    }
  }
});
