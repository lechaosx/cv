import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { cvSchema } from '../../src/cv';

const cv = cvSchema.parse(parse(readFileSync('src/content/cv.yaml', 'utf8')));

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`CV renders offline with JavaScript disabled at ${viewport.width}px in ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      const external: string[] = [];
      const failures: string[] = [];
      page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
      await page.route('**/*', route => {
        if (new URL(route.request().url()).origin !== 'http://127.0.0.1:4331') {
          external.push(route.request().url());
          return route.abort();
        }
        return route.continue();
      });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading', { name: cv.name, exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', cv.language);
      if (cv.email) await expect(page.getByRole('link', { name: cv.email, exact: true })).toHaveAttribute('href', `mailto:${cv.email}`);
      if (cv.phone) await expect(page.getByRole('link', { name: cv.phone, exact: true })).toHaveAttribute('href', `tel:${cv.phone}`);
      for (const link of cv.links) await expect(page.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url);
      await expect(page.locator('article')).toHaveCount(cv.experience.length + cv.education.length);
      await expect(page.locator('script')).toHaveCount(0);
      if (cv.photo) expect(await page.locator('.photo img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      const portrait = await page.locator('.photo > img, .photo > svg').boundingBox();
      expect(Math.abs(portrait!.width - portrait!.height)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.fonts.check('300 16px "Roboto Variable"') && document.fonts.check('700 40px "Roboto Condensed Variable"'))).toBe(true);
      if (viewport.width >= 1280 && cv.theme['dark']) {
        const expected = await page.evaluate(color => {
          const element = document.createElement('div');
          element.style.color = color;
          return element.style.color;
        }, cv.theme['dark']);
        await expect(page.locator('.photo')).toHaveCSS('background-color', expected);
      }
      expect(external).toEqual([]);
      expect(failures).toEqual([]);
    });
  }
}

test('print keeps the two-column layout, colors, and readable content', async ({ page }, info) => {
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const photo = await page.locator('.photo').boundingBox();
  const header = await page.locator('.main-info').boundingBox();
  expect(header!.x).toBeGreaterThan(photo!.x);
  expect(Math.abs(header!.y - photo!.y)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('body')).toHaveCSS('print-color-adjust', 'exact');
  for (const [index, entry] of [...cv.experience, ...cv.education].entries()) {
    await expect(page.locator('article').nth(index).getByText(entry.title, { exact: true })).toBeVisible();
  }
  const pdf = info.outputPath('cv.pdf');
  await page.pdf({ path: pdf, format: 'A4', printBackground: true });
  await info.attach('print.pdf', { path: pdf, contentType: 'application/pdf' });
});
