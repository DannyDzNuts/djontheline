import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Dish } from './dishes';

export async function validateMedia(dishes: Dish[]) {
  await Promise.all(dishes.map(async dish => {
    const media = [dish.data.heroMedia, ...dish.data.media, ...(dish.data.process ? [dish.data.process.media] : [])];
    const paths = media.flatMap(item => item.type === 'video' ? [item.src, item.poster, ...(item.captions ? [item.captions] : [])] : [item.src]);
    await Promise.all([...new Set(paths)].map(async path => {
      try { await access(resolve('public', path.slice(1))); }
      catch { throw new Error(`Missing media in "${dish.data.title}": public${path}. Add the file or run npm run media for image originals.`); }
    }));
  }));
}
