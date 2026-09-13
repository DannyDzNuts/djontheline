import { test, expect, type Page } from '@playwright/test';
const base = process.env.TEST_BASE || '/';
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function prepare(page: Page) {
  await page.goto(base);
  await page.waitForTimeout(250);
  await page.locator('#bacon-jalapeno-burger [data-snap-anchor]').evaluate(el => {
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * .12 - 44, behavior: 'instant' });
  });
  await page.waitForTimeout(1000);
  // Measure the resting position after the entrance's 22px transform resolves.
  await page.locator('#bacon-jalapeno-burger [data-snap-anchor]').evaluate(el => {
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * .12 - 44, behavior: 'instant' });
  });
}
async function start(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: document.body, clientX: 100, clientY: 500 })] })));
}
async function end(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new TouchEvent('touchend', { touches: [] })));
}

test('soft settle waits for touch release and momentum silence', async ({ page }) => {
  await prepare(page); await start(page);
  await page.evaluate(() => scrollBy(0, 20));
  const drag = await page.evaluate(() => scrollY);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => scrollY)).toBe(drag);
  await end(page);
  // Continued native momentum must postpone the settling timer.
  await page.waitForTimeout(150);
  await page.evaluate(() => scrollBy(0, 5));
  const momentum = await page.evaluate(() => scrollY);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => scrollY)).toBe(momentum);
  await page.waitForTimeout(500);
  const top = await page.locator('#bacon-jalapeno-burger [data-snap-anchor]').evaluate(el => el.getBoundingClientRect().top);
  expect(Math.abs(top - (await page.evaluate(() => innerHeight)) * .12)).toBeLessThan(2);
});

test('a new touch cancels an active settling animation', async ({ page }) => {
  await prepare(page); await start(page);
  await page.evaluate(() => scrollBy(0, 20));
  await page.waitForTimeout(200); await end(page);
  await page.waitForTimeout(290);
  await expect(page.locator('#bacon-jalapeno-burger')).toHaveClass(/is-settling/);
  await start(page);
  const interrupted = await page.evaluate(() => scrollY);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(interrupted);
  await end(page);
});

test('reduced motion and fast swipes do not settle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await prepare(page); await start(page);
  await page.evaluate(() => scrollBy(0, 20));
  await page.waitForTimeout(200); await end(page);
  const reducedPosition = await page.evaluate(() => scrollY);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBe(reducedPosition);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await prepare(page); await start(page);
  await page.evaluate(() => scrollBy(0, 300)); await end(page);
  const fastPosition = await page.evaluate(() => scrollY);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => scrollY)).toBe(fastPosition);
});
