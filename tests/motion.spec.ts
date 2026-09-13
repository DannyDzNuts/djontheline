import { test, expect } from '@playwright/test';
const base = process.env.TEST_BASE || '/';

test('dramatic entrances resolve to still compositions without moving their scroll anchors', async ({ page }) => {
  await page.goto(base);
  await expect(page.locator('.hero-media')).toHaveCSS('animation-duration', '1.5s');
  const dish = page.locator('#bacon-jalapeno-burger');
  const frame = dish.locator('.media-frame');
  const anchor = dish.locator('[data-snap-anchor]');
  await expect(anchor).toHaveCSS('transform', 'none');
  await expect(frame).not.toHaveCSS('transform', 'none');
  await dish.scrollIntoViewIfNeeded();
  await expect(dish).toHaveClass(/is-visible/);
  const wipe = await frame.evaluate(el => {
    const transition = el.getAnimations().find(animation => animation instanceof CSSTransition && animation.transitionProperty === 'clip-path');
    if (!transition) return 'no wipe';
    transition.pause();
    transition.currentTime = Number(transition.effect!.getTiming().duration) / 2;
    const intermediate = getComputedStyle(el).clipPath;
    transition.finish();
    return intermediate;
  });
  expect(wipe).toMatch(/^inset\(/);
  expect(wipe).not.toBe('inset(0px 0px 22%)');
  expect(wipe).not.toBe('inset(0px)');
  await expect(frame).toHaveCSS('transform', 'none');
  await expect(frame).toHaveCSS('opacity', '1');
  await expect(dish.locator('img')).toHaveCSS('transform', 'none');
  await expect(dish.locator('.techniques')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-media')).toHaveCSS('filter', 'none');
});

test('keyboard focus exposes an unrevealed composition immediately', async ({ page }) => {
  await page.goto(base);
  const about = page.locator('#about');
  await expect(about.locator('.about-copy')).toHaveCSS('opacity', '0');
  await about.locator('a').first().focus();
  await expect(about.locator('.about-copy')).toHaveCSS('opacity', '1');
  await expect(about.locator('.about-copy')).toHaveCSS('transform', 'none');
});

test('switching to reduced motion clears all new effects immediately', async ({ page }) => {
  await page.goto(base);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const selector of ['.hero-media', '.intro-grid', '.dish-copy', '.dish-copy .techniques', '.process-copy', '.about-copy']) {
    for (const element of await page.locator(selector).all()) {
      await expect(element).toHaveCSS('transform', 'none');
      await expect(element).toHaveCSS('opacity', '1');
      await expect(element).toHaveCSS('animation-name', 'none');
    }
  }
});
