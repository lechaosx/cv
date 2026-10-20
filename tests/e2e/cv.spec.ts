import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { cvSchema, localizeCV } from '../../src/cv';

const cv = localizeCV(cvSchema.parse(parse(readFileSync('src/content/cv.yaml', 'utf8'))), 'en');

test('screen content stays readable offline, without JavaScript, from phones to desktop', async ({ page }) => {
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

  for (const [width, colorScheme] of [[1440, 'light'], [768, 'light'], [390, 'dark'], [320, 'light']] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { name: cv.name, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), width + 'px page fits the viewport').toBe(true);
    const portrait = await page.locator('.photo > img, .photo > svg').boundingBox();
    expect(Math.abs(portrait!.width - portrait!.height)).toBeLessThan(1);
    if (cv.links.length > 0) {
      const connect = page.locator('.connect:visible');
      await expect(connect).toHaveCount(1);
      if (width < 1280) {
        const sections = page.locator('section:visible:not(.connect)');
        const connectBox = await connect.boundingBox();
        for (const section of await sections.all()) {
          const box = await section.boundingBox();
          expect(connectBox!.y, width + 'px Connect follows the other sections').toBeGreaterThanOrEqual(box!.y + box!.height);
        }
        await expect(page.locator('main').getByRole('link').last()).toHaveAttribute('href', cv.links.at(-1)!.url);
      }
    } else {
      await expect(page.locator('.connect:visible')).toHaveCount(0);
    }
    if (width <= 390 && cv.experience.length + cv.education.length > 0) {
      const organization = await page.locator('.timeline article > :first-child').first().boundingBox();
      const description = await page.locator('.timeline article > :last-child').first().boundingBox();
      expect(description!.y).toBeGreaterThan(organization!.y);
      expect(description!.width).toBeGreaterThan(width * 0.7);
    }
  }

  await expect(page.locator('html')).toHaveAttribute('lang', cv.language);
  if (cv.email) await expect(page.getByRole('link', { name: cv.email, exact: true })).toHaveAttribute('href', 'mailto:' + cv.email);
  if (cv.phone) await expect(page.getByRole('link', { name: cv.phone, exact: true })).toHaveAttribute('href', 'tel:' + cv.phone);
  for (const link of cv.links) await expect(page.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url);
  await expect(page.locator('article')).toHaveCount(cv.experience.length + cv.education.length);
  await expect(page.getByRole('combobox')).toBeHidden();
  if (cv.photo) expect(await page.locator('.photo img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('300 16px "Roboto Variable"') && document.fonts.check('700 40px "Roboto Condensed Variable"'))).toBe(true);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    for (const [selector, text] of [
      ['.contact-list div:last-child span', 'a.very.long.email.address.for.professional.enquiries@example.com'],
      ['.connect a span', 'github.com/an-extremely-long-unbroken-professional-profile-name'],
      ['.timeline article strong', 'AnExtremelyLongUnbrokenOrganizationName'],
      ['.badge-list li', 'AnExtremelyLongUnbrokenTechnicalSpecialization'],
    ] as const) {
      const element = [...document.querySelectorAll<HTMLElement>(selector)].find(element => element.checkVisibility());
      if (element) element.textContent = text;
    }
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'long content at 200% text size fits the small phone').toBe(true);
  if (cv.experience.length + cv.education.length > 0) {
    expect(await page.locator('.timeline article > :last-child').first().evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  expect(external).toEqual([]);
  expect(failures).toEqual([]);
  await page.goto('/cs/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(page.getByRole('heading', { name: 'Pracovní zkušenosti' })).toBeVisible();
  await expect(page.locator('.theme-control')).toBeHidden();
  await expect(page.getByRole('link', { name: 'English', exact: true })).toHaveAttribute('href', '/en/');
});

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
  if (cv.links.length > 0) {
    await expect(page.locator('.connect:visible')).toHaveCount(1);
    const connect = await page.locator('.connect:visible').boundingBox();
    expect(connect!.x).toBeLessThan(header!.x);
  }
  for (const language of ['en', 'cs'] as const) {
    await page.goto(`/${language}/`);
    await page.evaluate(() => document.fonts.ready);
    const localized = localizeCV(cvSchema.parse(parse(readFileSync('src/content/cv.yaml', 'utf8'))), language);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('.page-settings')).toBeHidden();
    for (const [index, entry] of [...localized.experience, ...localized.education].entries()) {
      await expect(page.locator('article').nth(index).getByText(entry.title, { exact: true })).toBeVisible();
    }
    const pdf = info.outputPath(`cv-${language}.pdf`);
    await page.pdf({ path: pdf, format: 'A4', printBackground: true });
    await info.attach(`print-${language}.pdf`, { path: pdf, contentType: 'application/pdf' });
  }
});
