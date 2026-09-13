export function initMotion() {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  const sections = document.querySelectorAll<HTMLElement>('[data-reveal]');
  const configure = () => {
    for (const section of sections) {
      if (preference.matches) { section.classList.remove('will-reveal'); section.classList.add('is-visible'); }
      else { section.classList.add('will-reveal'); observer.observe(section); }
    }
  };
  configure();
  preference.addEventListener('change', configure);
  // Keyboard users never have to focus partly hidden content.
  document.addEventListener('focusin', event => {
    (event.target as HTMLElement)?.closest('[data-reveal]')?.classList.add('is-visible');
  });
}
