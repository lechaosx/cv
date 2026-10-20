import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { fullExport } from '../publishing';

export const GET: APIRoute = async ({ site }) => {
  const entry = await getEntry('cv', 'cv');
  if (!entry) throw new Error('Missing src/content/cv.yaml');
  return new Response(fullExport(entry.data, site!), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
