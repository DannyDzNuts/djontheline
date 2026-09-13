import { settleDelta } from './scroll-policy';

/** Never intercept scrolling. Only finish a nearby composition after native touch momentum ends. */
export function initMobileSettle() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let touching = false;
  let eligible = false;
  let gestureStart = 0;
  let origin = 0;
  let gestureDistance = 0;
  let timer: ReturnType<typeof setTimeout>;
  let frame = 0;
  let activeSection: HTMLElement | null = null;

  const cancel = () => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    frame = 0;
    activeSection?.classList.remove('is-settling');
    activeSection = null;
    eligible = false;
  };
  const settle = () => {
    if (!eligible || touching || reduced.matches || !coarse.matches || document.hidden) return;
    eligible = false;
    if (window.visualViewport && window.visualViewport.scale !== 1) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body && focused !== document.documentElement) return;
    if (Math.abs(scrollY - origin) > innerHeight * 1.15) return;
    let candidate: { delta: number; section: HTMLElement } | undefined;
    document.querySelectorAll<HTMLElement>('[data-snap-anchor]').forEach(anchor => {
      const rect = anchor.getBoundingClientRect();
      const delta = settleDelta(rect.top, rect.height, innerHeight);
      if (delta !== null && (!candidate || Math.abs(delta) < Math.abs(candidate.delta))) {
        candidate = { delta, section: anchor.closest<HTMLElement>('[data-dish]') || anchor };
      }
    });
    if (!candidate) return;
    const start = scrollY;
    const maximum = document.documentElement.scrollHeight - innerHeight;
    const destination = Math.max(0, Math.min(maximum, start + candidate.delta));
    const began = performance.now();
    activeSection = candidate.section;
    activeSection.classList.add('is-visible', 'is-settling');
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / 340);
      window.scrollTo({ top: start + (destination - start) * (1 - (1 - progress) ** 3), behavior: 'instant' });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { frame = 0; activeSection?.classList.remove('is-settling'); activeSection = null; }
    };
    frame = requestAnimationFrame(tick);
  };
  const schedule = () => {
    clearTimeout(timer);
    if (eligible && !touching && !frame) timer = setTimeout(settle, 220);
  };
  window.addEventListener('touchstart', event => {
    cancel(); touching = true;
    gestureStart = performance.now(); origin = scrollY; gestureDistance = 0;
    const target = event.target instanceof Element ? event.target : null;
    eligible = coarse.matches && !reduced.matches && event.touches.length === 1 && !target?.closest('a, button, video, input, textarea, select, summary, [data-native-scroll]');
  }, { passive: true });
  window.addEventListener('touchend', event => {
    touching = event.touches.length > 0;
    if (touching) { cancel(); return; }
    gestureDistance = Math.abs(scrollY - origin);
    const velocity = gestureDistance / Math.max(1, performance.now() - gestureStart);
    if (velocity > 1.1 || gestureDistance < 8) { cancel(); return; }
    schedule();
  }, { passive: true });
  window.addEventListener('touchcancel', () => { touching = false; cancel(); }, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  // New intent always wins, including mouse/keyboard input on hybrid devices.
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('pointerdown', cancel, { passive: true });
  window.addEventListener('keydown', cancel);
  window.addEventListener('hashchange', cancel);
  window.addEventListener('resize', cancel);
  document.addEventListener('focusin', cancel);
  document.addEventListener('visibilitychange', cancel);
  reduced.addEventListener('change', cancel);
}
