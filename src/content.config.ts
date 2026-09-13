import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localPath = z.string().regex(/^\/media\/[a-zA-Z0-9/_\-.]+$/, 'Use a /media/ path without a repository prefix.').refine(path => !path.split('/').includes('..'), 'Media paths cannot contain parent directory segments.');
const shared = {
  src: localPath,
  caption: z.string().optional(),
  placeholder: z.boolean().default(false),
  orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  position: z.string().default('50% 50%'),
};
const media = z.discriminatedUnion('type', [
  z.object({ ...shared, type: z.literal('image'), alt: z.string().min(1) }),
  z.object({
    ...shared,
    type: z.literal('video'),
    alt: z.string().min(1),
    poster: localPath,
    autoplay: z.boolean().default(false),
    captions: localPath.optional(),
    transcript: z.string().optional(),
  }),
]);

const dishes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/dishes', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    order: z.number().default(100),
    featured: z.boolean().default(true),
    signature: z.boolean().default(false),
    study: z.boolean().default(true),
    sample: z.boolean().default(false),
    season: z.string().optional(),
    date: z.coerce.date().optional(),
    category: z.string().default('Kitchen work'),
    shortDescription: z.string().min(1),
    techniques: z.array(z.string()).default([]),
    heroMedia: media,
    media: z.array(media).default([]),
    layout: z.object({ preferred: z.enum(['auto', 'left', 'right', 'wide', 'immersive']).default('auto') }).default({ preferred: 'auto' }),
    notes: z.string().optional(),
    whatWorked: z.string().optional(),
    nextIteration: z.string().optional(),
    process: z.object({ title: z.string(), description: z.string(), media }).optional(),
  }),
});
export const collections = { dishes };
