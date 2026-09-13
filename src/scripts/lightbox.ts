export function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('.photo-lightbox');
  const image = dialog?.querySelector('img');
  if (!dialog || !image || !dialog.showModal) return;
  let opener: HTMLElement | null = null;
  let overflow = '';
  document.addEventListener('click', event => {
    const link = (event.target as Element)?.closest<HTMLAnchorElement>('a[data-lightbox]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault(); opener = link;
    image.src = link.href; image.alt = link.dataset.alt || link.querySelector('img')?.alt || 'Portfolio photograph';
    overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
  });
  dialog.querySelector('button')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = overflow;
    image.removeAttribute('src'); opener?.focus({ preventScroll: true });
  });
}
