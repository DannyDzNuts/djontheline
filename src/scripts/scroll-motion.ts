import { afterPaint, mediaReady, reportMotion } from './motion-events';

export function initMotion() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const hero = document.querySelector<HTMLElement>('.signature-hero');
  const sections = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  let generation = 0;
  let observer: IntersectionObserver | undefined;
  const pending = new Set<Element>();
  const expose = () => {
    hero?.classList.add('hero-media-ready', 'hero-text-ready');
    sections.forEach(section => section.classList.add('is-visible'));
  };
  const configure = async () => {
    const run = ++generation;
    observer?.disconnect(); pending.clear();
    root.dataset.motion = reduced.matches ? 'reduced' : 'full';
    reportMotion('initialized', { reduced: reduced.matches });
    if (reduced.matches || !('IntersectionObserver' in window)) { expose(); return; }
    sections.forEach(section => section.classList.add('will-reveal'));
    if (hero && !hero.classList.contains('hero-media-ready')) {
      // Slow photography may delay the media entrance, never access to the copy.
      const textFallback = setTimeout(() => { if (run === generation) hero.classList.add('hero-text-ready'); }, 1800);
      void Promise.all([mediaReady(hero), Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 500))])]).then(afterPaint).then(() => {
        clearTimeout(textFallback);
        if (run !== generation) return;
        hero.classList.add('hero-media-ready', 'hero-text-ready');
        reportMotion('hero ready', { decoded: true });
      });
    }
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const section = entry.target;
        if (!entry.isIntersecting || pending.has(section) || section.classList.contains('is-visible')) continue;
        pending.add(section);
        const fallback = setTimeout(() => { if (run === generation) section.classList.add('text-ready'); }, 1800);
        void mediaReady(section).then(afterPaint).then(() => {
          clearTimeout(fallback);
          if (run !== generation) return;
          section.classList.add('is-visible'); observer?.unobserve(section); pending.delete(section);
          reportMotion('revealed', { id: section.id || section.className });
        });
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    // In-view elements must paint their start state before observing them.
    await afterPaint();
    if (run === generation) sections.filter(section => !section.classList.contains('is-visible')).forEach(section => observer?.observe(section));
  };
  void configure();
  reduced.addEventListener('change', () => void configure());
  document.addEventListener('focusin', event => {
    (event.target as Element)?.closest('[data-reveal]')?.classList.add('is-visible');
    if ((event.target as Element)?.closest('.signature-hero')) hero?.classList.add('hero-text-ready');
  });
  if (import.meta.env.DEV) document.addEventListener('portfolio:replay', () => {
    hero?.classList.remove('hero-media-ready', 'hero-text-ready');
    sections.forEach(section => section.classList.remove('is-visible', 'text-ready'));
    void configure();
  });
}
