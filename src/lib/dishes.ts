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

/** Leave a dish between process moments; short portfolios need fewer breaks. */
export function processPlacements(featured: Dish[], selectedCount: number) {
  const slots = selectedCount === 0 ? [-1] : selectedCount === 1 ? [0]
    : Array.from({ length: Math.floor(selectedCount / 2) }, (_, index) => index * 2 + 1);
  const configured = featured.filter(dish => dish.data.process).slice(0, Math.min(3, slots.length));
  const placements = new Map<number, Dish>();
  configured.forEach((dish, index) => {
    const slotIndex = Math.min(slots.length - 1, Math.max(0, Math.floor((index + 1) * (slots.length + 1) / (configured.length + 1)) - 1));
    placements.set(slots[slotIndex], dish);
  });
  return placements;
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
