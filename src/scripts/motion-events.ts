/** Small shared hooks; diagnostics are rendered only by the development component. */
export function reportMotion(kind: string, detail: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) document.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { kind, ...detail } }));
}
export const afterPaint = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
export async function mediaReady(container: Element) {
  const lead = container.querySelector('.dish-visual') || container;
  const image = lead.querySelector<HTMLImageElement>('img');
  const images = image ? [image] : [];
  for (const video of lead.querySelectorAll<HTMLVideoElement>('video[poster]')) {
    const poster = new Image(); poster.src = video.poster; images.push(poster);
  }
  // A failed photograph must never leave the accompanying text hidden.
  await Promise.all(images.map(image => image.decode().catch(() => undefined)));
}
