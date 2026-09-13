import { test, expect } from '@playwright/test';
const base = process.env.TEST_BASE || '/';

test('discrete wheel glides, precision input stays native, and all motion stops', async ({ page }) => {
  await page.goto(base); await page.waitForTimeout(1800);
  await page.evaluate(() => {
    (window as any).wheelResults = []; (window as any).scrollCalls = 0;
    window.addEventListener('wheel', event => (window as any).wheelResults.push(event.defaultPrevented));
    const original = window.scrollTo.bind(window);
    window.scrollTo = ((...args: any[]) => { (window as any).scrollCalls++; (original as any)(...args); }) as typeof window.scrollTo;
  });
  await page.mouse.wheel(0, 120); await page.waitForTimeout(80);
  await page.mouse.wheel(0, 120); await page.waitForTimeout(40);
  const middle = await page.evaluate(() => scrollY);
  expect(middle).toBeGreaterThan(120); expect(middle).toBeLessThan(240);
  await page.waitForTimeout(700); expect(await page.evaluate(() => scrollY)).toBeCloseTo(240, 0);
  const calls = await page.evaluate(() => (window as any).scrollCalls); await page.waitForTimeout(150);
  expect(await page.evaluate(() => (window as any).scrollCalls)).toBe(calls);
  expect(await page.evaluate(() => (window as any).wheelResults)).toEqual([false, true]);
  for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, 12.5); await page.waitForTimeout(16); }
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).wheelResults.slice(2).some(Boolean))).toBe(false);
});

test('keyboard, anchors, scrollbar input and reduced motion retain control', async ({ page }) => {
  await page.goto(base); await page.mouse.wheel(0, 120); await page.waitForTimeout(80); await page.mouse.wheel(0, 120);
  await page.keyboard.press('End'); await page.waitForTimeout(650);
  expect(await page.evaluate(() => Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight))).toBeLessThan(3);
  await page.keyboard.press('Home'); await page.waitForTimeout(600); expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press('PageDown'); await page.waitForTimeout(500); expect(await page.evaluate(() => scrollY)).toBeGreaterThan(400);
  await page.keyboard.press('PageUp'); await page.waitForTimeout(500); expect(await page.evaluate(() => scrollY)).toBeLessThan(10);
  await page.keyboard.press('Space'); await page.waitForTimeout(500); expect(await page.evaluate(() => scrollY)).toBeGreaterThan(400);
  // Pointer intent cancels a glide before the scrollbar or another browser mechanism moves it.
  await page.mouse.wheel(0, 120); await page.waitForTimeout(80); await page.mouse.wheel(0, 120);
  await page.mouse.down(); await page.evaluate(() => scrollTo(0, 700)); await page.mouse.up(); await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(700);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { (window as any).canceled = false; window.addEventListener('wheel', e => { if (e.defaultPrevented) (window as any).canceled = true; }); });
  await page.mouse.wheel(0, 120); await page.waitForTimeout(80); await page.mouse.wheel(0, 120); await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as any).canceled)).toBe(false);
});
