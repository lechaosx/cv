import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { cvMarkdown } from '../../publishing';

export function getStaticPaths() {
  return (['en', 'cs'] as const).map(language => ({ params: { lang: language }, props: { language } }));
}

export const GET: APIRoute = async ({ site, props }) => {
  const entry = await getEntry('cv', 'cv');
  if (!entry) throw new Error('Missing src/content/cv.yaml');
  return new Response(cvMarkdown(entry.data, props.language, site!), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
