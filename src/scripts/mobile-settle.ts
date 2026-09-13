import { settleDelta } from './scroll-policy';
import { reportMotion } from './motion-events';

/** Observe native touch/momentum; never prevent a touch event or alter active dragging. */
export function initMobileSettle() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let touching = false, eligible = false, origin = 0, began = 0, fingerY = 0, fingerTime = 0, velocity = 0;
  let timer: ReturnType<typeof setTimeout>, frame = 0, width = innerWidth;
  let active: HTMLElement | null = null;
  const cancel = () => {
    clearTimeout(timer); cancelAnimationFrame(frame); frame = 0; eligible = false;
    active?.classList.remove('is-settling'); active = null;
  };
  const settle = () => {
    if (!eligible || touching || reduced.matches || document.hidden) return;
    eligible = false;
    if (Math.abs((visualViewport?.scale || 1) - 1) > .01 || document.querySelector('dialog[open]')) return;
    if (document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (Math.abs(scrollY - origin) > innerHeight * 2) { reportMotion('fast swipe: free'); return; }
    let candidate: { delta: number; section: HTMLElement } | undefined;
    document.querySelectorAll<HTMLElement>('[data-snap-anchor]').forEach(anchor => {
      const rect = anchor.getBoundingClientRect();
      const delta = settleDelta(rect.top, rect.height, innerHeight);
      if (delta !== null && (!candidate || Math.abs(delta) < Math.abs(candidate.delta))) candidate = { delta, section: anchor.closest<HTMLElement>('[data-dish]') || anchor };
    });
    if (!candidate) { reportMotion('outside proximity'); return; }
    const start = scrollY, destination = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, start + candidate.delta));
    const started = performance.now();
    active = candidate.section; active.classList.add('is-settling');
    reportMotion('settling', { delta: Math.round(destination - start), id: active.id });
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 420);
      scrollTo({ top: start + (destination - start) * (1 - (1 - progress) ** 3), behavior: 'instant' });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { frame = 0; active?.classList.remove('is-settling'); active = null; reportMotion('settled'); }
    };
    frame = requestAnimationFrame(tick);
  };
  const schedule = (delay = 180) => {
    clearTimeout(timer);
    if (eligible && !touching && !frame) timer = setTimeout(settle, delay);
  };
  window.addEventListener('touchstart', event => {
    cancel(); touching = true; began = performance.now(); origin = scrollY; velocity = 0;
    fingerTime = began; fingerY = event.touches[0]?.clientY || 0;
    const target = event.target instanceof Element ? event.target : null;
    eligible = !reduced.matches && event.touches.length === 1 && !target?.closest('a:not([data-lightbox]), button, video, input, textarea, select, summary, dialog, [data-native-scroll]');
    reportMotion('touch start', { eligible, reduced: reduced.matches });
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (event.touches.length !== 1) { cancel(); return; }
    const now = performance.now(), y = event.touches[0].clientY;
    velocity = Math.abs(y - fingerY) / Math.max(1, now - fingerTime); fingerY = y; fingerTime = now;
  }, { passive: true });
  window.addEventListener('touchend', event => {
    touching = event.touches.length > 0;
    if (touching) { cancel(); return; }
    const distance = Math.abs(scrollY - origin), average = distance / Math.max(1, performance.now() - began);
    const releaseVelocity = performance.now() - fingerTime > 100 ? 0 : velocity;
    if (distance < 8 || average > 1.8 || releaseVelocity > 1.8) { cancel(); reportMotion('tap or fast swipe: free'); return; }
    reportMotion('waiting for momentum', { eligible }); schedule();
  }, { passive: true });
  window.addEventListener('touchcancel', () => { touching = false; cancel(); }, { passive: true });
  window.addEventListener('scroll', () => schedule(), { passive: true });
  window.addEventListener('scrollend', () => schedule(100), { passive: true });
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('pointerdown', event => { if (event.pointerType !== 'touch') cancel(); }, { passive: true });
  window.addEventListener('keydown', cancel);
  window.addEventListener('hashchange', cancel);
  window.addEventListener('popstate', cancel);
  // Android's address bar changes viewport height throughout normal momentum.
  window.addEventListener('resize', () => { if (innerWidth !== width) { width = innerWidth; cancel(); } });
  document.addEventListener('visibilitychange', cancel);
  reduced.addEventListener('change', cancel);
}
