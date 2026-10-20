import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { llmsIndex } from '../publishing';

export const GET: APIRoute = async ({ site }) => {
  const entry = await getEntry('cv', 'cv');
  if (!entry) throw new Error('Missing src/content/cv.yaml');
  return new Response(llmsIndex(entry.data, site!), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
