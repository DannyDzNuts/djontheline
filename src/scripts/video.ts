export function initVideo() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const videos = document.querySelectorAll<HTMLVideoElement>('[data-video]');
  const attach = (video: HTMLVideoElement) => {
    const source = video.querySelector<HTMLSourceElement>('source[data-src]');
    if (source && !source.src) { source.src = source.dataset.src!; video.load(); }
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) {
        attach(video);
        if (video.dataset.autoplay && !reduced.matches && !connection?.saveData && !video.dataset.userPaused) {
          video.muted = true;
          video.play().catch(() => { /* Native controls and poster remain available. */ });
        }
      } else { video.pause(); }
    }
  }, { threshold: .25 }) : null;
  videos.forEach(video => {
    observer ? observer.observe(video) : attach(video);
    video.addEventListener('pointerdown', () => { video.dataset.userPaused = 'true'; attach(video); }, { passive: true });
    video.addEventListener('keydown', () => { video.dataset.userPaused = 'true'; attach(video); });
  });
  reduced.addEventListener('change', () => { if (reduced.matches) videos.forEach(video => video.pause()); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(video => video.pause()); });
}
