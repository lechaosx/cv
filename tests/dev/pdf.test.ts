import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dev } from 'astro';
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFName } from 'pdf-lib';
import { cv } from '../fixtures/cv.ts';

test('development downloads render the current localized page without a production build', async () => {
  const server = await dev({ configFile: './tests/astro.config.mjs', server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 390, height: 900 } });
    const origin = `http://127.0.0.1:${server.address.port}`;
    for (const language of ['en', 'cs']) {
      if (language === 'en') await page.goto(`${origin}/en/`);
      else {
        await page.getByRole('link', { name: 'Čeština', exact: true }).click();
        await page.waitForURL('**/cs/');
      }
      const filename = `Example_Person_CV_${language.toUpperCase()}.pdf`;
      const pathname = `/${language}/${filename}`;
      const response = await fetch(`${origin}${pathname}?shared=1`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'application/pdf');
      assert.match(response.headers.get('content-disposition')!, /attachment/);
      assert.ok(response.headers.get('content-disposition')!.includes(filename));
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const directPDF = await PDFDocument.load(await response.arrayBuffer());
      assert.ok(directPDF.getTitle()?.includes(cv.name));
      assert.ok(directPDF.getTitle()?.includes(language === 'cs' ? 'Životopis' : 'CV'));
      const link = page.getByRole('link', { name: language === 'en' ? 'Download PDF' : 'Stáhnout PDF' });
      assert.equal(await link.getAttribute('href'), pathname);
      const downloadPromise = page.waitForEvent('download');
      await link.click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), filename);
      const pdf = await PDFDocument.load(await readFile((await download.path())!));
      assert.equal(pdf.getPageCount(), 1);
      assert.ok(pdf.getTitle()?.includes(cv.name));
      assert.ok(pdf.getTitle()?.includes(language === 'cs' ? 'Životopis' : 'CV'));
      assert.ok(pdf.catalog.has(PDFName.of('StructTreeRoot')));
      const { width, height } = pdf.getPage(0).getSize();
      assert.ok(Math.abs(width - 595.28) < 1);
      assert.ok(Math.abs(height - 841.89) < 1);
    }
    for (const pathname of ['/de/Example_Person_CV_EN.pdf', '/en/Other_Person_CV_EN.pdf', '/en/Example_Person_CV_CS.pdf', '/en/cv.pdf']) {
      assert.equal((await fetch(`${origin}${pathname}`)).status, 404);
    }
  } finally {
    await browser?.close();
    await server.stop();
  }
});
