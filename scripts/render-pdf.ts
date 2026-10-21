import type { Browser } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

export async function renderPDF(browser: Browser, origin: string, language: 'en' | 'cs') {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: language === 'cs' ? 'cs-CZ' : 'en-US' });
  try {
    const failures: string[] = [];
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      failures.push(`External request: ${route.request().url()}`);
      return route.abort();
    });
    const page = await context.newPage();
    page.on('response', response => {
      if (response.status() >= 400) failures.push(`${response.status()}: ${response.url()}`);
    });
    page.on('requestfailed', request => failures.push(`${request.failure()?.errorText}: ${request.url()}`));
    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    await page.goto(`${origin}/${language}/`, { waitUntil: 'load' });
    const pathname = await page.locator('.page-settings a[download]').first().getAttribute('href');
    if (!pathname || !new RegExp(`^/${language}/[A-Za-z0-9_]+\\.pdf$`).test(pathname)) {
      throw new Error(`Invalid ${language} PDF download URL: ${pathname}`);
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
      if (!document.fonts.check('300 16px "Roboto Variable"') || !document.fonts.check('700 40px "Roboto Condensed Variable"')) {
        throw new Error('CV fonts did not load');
      }
    });
    if (failures.length) throw new Error(failures.join('\n'));

    const render = async (percent: number) => {
      const bytes = await page.pdf({
        format: 'A4', scale: percent / 100, printBackground: true,
        displayHeaderFooter: false, tagged: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      return { bytes, pages: (await PDFDocument.load(bytes)).getPageCount() };
    };
    let scale = 100;
    let result = await render(scale);
    if (result.pages !== 1) {
      scale = 10;
      result = await render(scale);
      if (result.pages !== 1) throw new Error(`${language} CV cannot fit one A4 page at Chromium's minimum scale`);
      let upper = 99;
      while (scale < upper) {
        const candidate = Math.ceil((scale + upper) / 2);
        const attempt = await render(candidate);
        if (attempt.pages === 1) {
          scale = candidate;
          result = attempt;
        } else upper = candidate - 1;
      }
    }
    if (failures.length) throw new Error(failures.join('\n'));
    return { bytes: result.bytes, scale, pathname };
  } finally {
    await context.close();
  }
}
