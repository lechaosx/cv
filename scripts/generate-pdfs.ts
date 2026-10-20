import { rm, writeFile } from 'node:fs/promises';
import { preview } from 'astro';
import { chromium } from '@playwright/test';
import { renderPDF } from './render-pdf.ts';

const languages = ['en', 'cs'] as const;
const output = (language: string) => new URL(`../dist/${language}/cv.pdf`, import.meta.url);
const removePDFs = () => Promise.all(languages.map(language => rm(output(language), { force: true })));

await removePDFs();
const server = await preview({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
let browser;
try {
  browser = await chromium.launch();
  const origin = `http://127.0.0.1:${server.port}`;
  const generated = [];
  for (const language of languages) {
    const { bytes, scale } = await renderPDF(browser, origin, language);
    generated.push({ language, bytes });
    console.log(`PDF: /${language}/cv.pdf — one A4 page at ${scale}%`);
  }
  for (const { language, bytes } of generated) await writeFile(output(language), bytes);
} catch (error) {
  await removePDFs();
  throw error;
} finally {
  try { await browser?.close(); }
  finally { await server.stop(); }
}
