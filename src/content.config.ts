import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { cvSchema } from './cv';

export const collections = {
  cv: defineCollection({
    loader: glob({ pattern: 'cv.yaml', base: './src/content' }),
    schema: cvSchema,
  }),
};
