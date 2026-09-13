import { wheelLooksDiscrete } from './scroll-policy';
import { reportMotion } from './motion-events';

export function initWheelMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, target = 0, position = 0, lastFrame = 0, previous = 0, lastInput = 0;
  const cancel = () => { cancelAnimationFrame(frame); frame = 0; };
  const reset = () => { cancel(); previous = 0; lastInput = 0; };
  const tick = (now: number) => {
    const elapsed = Math.min(32, now - lastFrame); lastFrame = now;
    const distance = target - position;
    if (Math.abs(distance) < 1) { scrollTo({ top: target, behavior: 'instant' }); frame = 0; return; }
    position += distance * (1 - Math.exp(-elapsed / 58));
    scrollTo({ top: position, behavior: 'instant' });
    frame = requestAnimationFrame(tick);
  };
  window.addEventListener('wheel', event => {
    const now = performance.now();
    const discrete = wheelLooksDiscrete(event.deltaY, event.deltaMode, now - lastInput, previous);
    previous = event.deltaY; lastInput = now;
    let node = event.target instanceof Element ? event.target : null;
    let nested = false;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.matches('dialog, input, textarea, select, video, [data-native-scroll]') || (node.scrollHeight > node.clientHeight && /auto|scroll/.test(getComputedStyle(node).overflowY))) { nested = true; break; }
      node = node.parentElement;
    }
    if (reduced.matches || !discrete || nested || !event.cancelable || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > 1) { cancel(); reportMotion('wheel native'); return; }
    const amount = event.deltaY * (event.deltaMode === 1 ? parseFloat(getComputedStyle(document.body).lineHeight) || 24 : 1);
    target = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, (frame ? target : scrollY) + amount));
    event.preventDefault(); reportMotion('wheel smoothed');
    if (!frame) { position = scrollY; lastFrame = now; frame = requestAnimationFrame(tick); }
  }, { passive: false });
  window.addEventListener('pointerdown', reset, { passive: true });
  window.addEventListener('touchstart', reset, { passive: true });
  window.addEventListener('keydown', reset);
  window.addEventListener('hashchange', reset);
  window.addEventListener('popstate', reset);
  window.addEventListener('resize', reset);
  document.addEventListener('focusin', reset);
  document.addEventListener('visibilitychange', reset);
  reduced.addEventListener('change', reset);
}
