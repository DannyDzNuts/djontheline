import { getCollection, type CollectionEntry } from 'astro:content';
import { mediaInfo } from './media';
import { validateMedia } from './validate-media';
export type Dish = CollectionEntry<'dishes'>;
export type Media = Dish['data']['heroMedia'];
export const slugOf = (dish: Dish) => dish.data.slug || dish.id;

export async function portfolio() {
  const all = (await getCollection('dishes')).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
  const slugs = all.map(slugOf);
  if (new Set(slugs).size !== slugs.length) throw new Error('Dish slugs must be unique.');
  const signatures = all.filter(d => d.data.signature);
  if (signatures.length > 1) throw new Error('Choose only one signature dish.');
  if (signatures.some(d => !d.data.featured)) throw new Error('The signature dish must also be featured.');
  await validateMedia(all);
  const featured = all.filter(d => d.data.featured);
  const signature = signatures[0] || featured[0];
  return { all, featured, signature, selected: featured.filter(d => d !== signature) };
}

export function composition(dish: Dish, index: number) {
  const preferred = dish.data.layout.preferred;
  if (preferred !== 'auto') return preferred;
  const media = dish.data.heroMedia;
  const { width, height } = mediaInfo(media);
  const ratio = width / height;
  if (ratio > 1.9) return 'wide';
  if (media.orientation === 'portrait' || ratio < 0.9) return 'left';
  return index % 2 === 0 ? 'right' : 'left';
}
