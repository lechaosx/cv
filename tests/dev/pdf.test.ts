import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dev } from 'astro';
import { PDFDocument, PDFName } from 'pdf-lib';
import { cv } from '../fixtures/cv.ts';

test('development downloads render the current localized page without a production build', async () => {
  const server = await dev({ configFile: './tests/astro.config.mjs', server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  try {
    const origin = `http://127.0.0.1:${server.address.port}`;
    for (const language of ['en', 'cs']) {
      const response = await fetch(`${origin}/${language}/cv.pdf`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'application/pdf');
      assert.match(response.headers.get('content-disposition')!, /attachment/);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const pdf = await PDFDocument.load(await response.arrayBuffer());
      assert.equal(pdf.getPageCount(), 1);
      assert.ok(pdf.getTitle()?.includes(cv.name));
      assert.ok(pdf.getTitle()?.includes(language === 'cs' ? 'Životopis' : 'CV'));
      assert.ok(pdf.catalog.has(PDFName.of('StructTreeRoot')));
      const { width, height } = pdf.getPage(0).getSize();
      assert.ok(Math.abs(width - 595.28) < 1);
      assert.ok(Math.abs(height - 841.89) < 1);
    }
    assert.equal((await fetch(`${origin}/de/cv.pdf`)).status, 404);
  } finally {
    await server.stop();
  }
});
