import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { cvSchema } from '../../src/cv.ts';
import { cvMarkdown, fullExport, llmsIndex } from '../../src/publishing.ts';
import config from '../../astro.config.mjs';

const cv = cvSchema.parse(parse(readFileSync('src/content/cv.yaml', 'utf8')));
const site = new URL(config.site!);
const output = (path: string) => readFileSync(`dist/${path}`, 'utf8');

test('published crawler files and exports contain only canonical CV routes and current content', () => {
  const robots = output('robots.txt');
  assert.ok(robots.includes('User-agent: *\nAllow: /'));
  assert.ok(robots.includes(`Sitemap: ${new URL('/sitemap.xml', site).href}`));
  const sitemap = output('sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls, ['en', 'cs'].map(language => new URL(`/${language}/`, site).href));
  assert.equal(output('llms.txt'), llmsIndex(cv, site));
  assert.equal(output('llms-full.txt'), fullExport(cv, site));
  for (const language of ['en', 'cs'] as const) {
    assert.equal(output(`${language}/index.md`), cvMarkdown(cv, language, site));
    const html = output(`${language}/index.html`);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)![1]!);
    assert.equal(graph['@graph'][0].name, cv.name);
    assert.equal(graph['@graph'][1].inLanguage, language);
    assert.ok(html.includes(`href="${new URL(`/${language}/index.md`, site).href}"`));
    assert.ok(html.includes(`href="${new URL('/llms.txt', site).href}"`));
  }
  assert.ok(!existsSync('dist/fixtures'));
  assert.ok(!readdirSync('dist').some(name => name.includes('fixture')));
});

test('each language offers a tagged one-page A4 PDF download', async () => {
  for (const language of ['en', 'cs'] as const) {
    const html = output(`${language}/index.html`);
    assert.match(html, new RegExp(`href="/${language}/cv\\.pdf"[^>]*download`));
    const { PDFDocument, PDFName } = await import('pdf-lib');
    const pdf = await PDFDocument.load(readFileSync(`dist/${language}/cv.pdf`));
    assert.equal(pdf.getPageCount(), 1);
    const { width, height } = pdf.getPage(0).getSize();
    assert.ok(Math.abs(width - 595.28) < 1);
    assert.ok(Math.abs(height - 841.89) < 1);
    assert.ok(pdf.getTitle()?.includes(cv.name));
    assert.ok(pdf.getTitle()?.includes(language === 'cs' ? 'Životopis' : 'CV'));
    assert.ok(pdf.catalog.has(PDFName.of('StructTreeRoot')));
  }
});
