import { readdir, rm, writeFile } from 'node:fs/promises';
import { preview } from 'astro';
import { chromium } from '@playwright/test';
import { renderPDF } from './render-pdf.ts';

const languages = ['en', 'cs'] as const;
const output = (pathname: string) => new URL(`../dist${pathname}`, import.meta.url);
const removePDFs = () => Promise.all(languages.map(async language => {
  const files = await readdir(new URL(`../dist/${language}/`, import.meta.url));
  await Promise.all(files.filter(file => file.endsWith('.pdf')).map(file => rm(output(`/${language}/${file}`), { force: true })));
}));

await removePDFs();
const server = await preview({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
let browser;
try {
  browser = await chromium.launch();
  const origin = `http://127.0.0.1:${server.port}`;
  const generated = [];
  for (const language of languages) {
    const { bytes, scale, pathname, warning } = await renderPDF(browser, origin, language);
    generated.push({ pathname, bytes });
    console.log(`PDF: ${pathname} — one A4 page at ${scale}%`);
    if (warning) console.log(`::warning title=Small PDF text::${warning}`);
  }
  for (const { pathname, bytes } of generated) await writeFile(output(pathname), bytes);
} catch (error) {
  await removePDFs();
  throw error;
} finally {
  try { await browser?.close(); }
  finally { await server.stop(); }
}
