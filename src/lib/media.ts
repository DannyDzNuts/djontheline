import manifest from '../data/media-manifest.json';
import type { Media } from './dishes';
export type PreparedMedia = { width: number; height: number; variants: { width: number; webp: string; avif: string }[] };
export function mediaInfo(media: Media) {
  const source = media.type === 'video' ? media.poster : media.src;
  const prepared = (manifest as Record<string, PreparedMedia>)[source];
  return {
    prepared,
    width: prepared?.width || media.width || 1600,
    height: prepared?.height || media.height || (media.orientation === 'portrait' ? 2000 : media.orientation === 'square' ? 1600 : 1067),
  };
}
