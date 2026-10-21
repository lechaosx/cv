import { test, expect } from '@playwright/test';
import { localizeCV } from '../../src/cv';
import { cv as fixture } from '../fixtures/cv';
import { pageMetadata } from '../../src/publishing';

const cv = localizeCV(fixture, 'en');

test('text icons, badges and spacing follow the reader’s text size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/en/');
  await page.evaluate(() => document.fonts.ready);
  const measurements = () => page.evaluate(() => {
    const value = (selector: string, property: string) => parseFloat(getComputedStyle(document.querySelector(selector)!).getPropertyValue(property));
    return {
      contactIcon: value('.contact-list svg', 'width'),
      connectIcon: value('.connect-footer .connect svg', 'width'),
      badgeText: value('.badge-list li', 'font-size'),
      sectionGap: value('section', 'margin-bottom'),
      headingGap: value('.section-header', 'margin-bottom'),
      timelineGap: value('.timeline article > :last-child', 'padding-bottom'),
    };
  });
  const normal = await measurements();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const enlarged = await measurements();
  for (const name of Object.keys(normal) as (keyof typeof normal)[]) {
    expect(enlarged[name], name + ' scales with enlarged text').toBeCloseTo(normal[name] * 2, 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('.contact-list, .connect-footer .connect, .badge-list')) {
      element.style.fontSize = '150%';
    }
  });
  const componentText = await measurements();
  for (const name of ['contactIcon', 'connectIcon', 'badgeText'] as const) {
    expect(componentText[name], name + ' follows nearby text').toBeCloseTo(enlarged[name] * 1.5, 1);
  }
});

test('the overall CV uses two columns once the full page fits with side gutters', async ({ page }) => {
  for (const language of ['en', 'cs']) {
    await page.goto(`/${language}/`);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1023, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const photo = (await page.locator('.photo').boundingBox())!;
      const header = (await page.locator('.main-info').boundingBox())!;
      const connect = page.locator('.connect:visible');
      await expect(connect).toHaveCount(1);
      await expect(page.locator('.page-settings:visible')).toHaveCount(1);
      if (width >= 1024) {
        expect(header.y, `${language} header is beside the portrait at ${width}px`).toBeCloseTo(photo.y, 0);
        expect(header.x).toBeGreaterThan(photo.x);
        expect((await connect.boundingBox())!.x).toBeLessThan(header.x);
      } else {
        expect(header.y).toBeGreaterThanOrEqual(photo.y + photo.height);
        const career = (await page.locator('main > div:not([class])').boundingBox())!;
        expect((await connect.boundingBox())!.y).toBeGreaterThanOrEqual(career.y + career.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});

test('the header wraps names between words before moving contacts below', async ({ page }) => {
  for (const language of ['en', 'cs']) {
    await page.setViewportSize({ width: 450, height: 900 });
    await page.goto(`/${language}/`);
    await page.evaluate(() => document.fonts.ready);
    const identity = page.locator('.main-info > :first-child');
    const contacts = page.locator('.contact-list');
    const nameLines = await page.locator('h1').evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size;
    });
    expect(nameLines, language + ' name wraps at the space').toBeGreaterThan(1);
    const nameBox = (await identity.boundingBox())!;
    const contactBox = (await contacts.boundingBox())!;
    expect(contactBox.x).toBeGreaterThanOrEqual(nameBox.x + nameBox.width);
    expect(contactBox.y).toBeLessThan(nameBox.y + nameBox.height);

    for (const textSize of ['100%', '200%']) {
      await page.setViewportSize({ width: 320, height: 900 });
      await page.evaluate(size => { document.documentElement.style.fontSize = size; }, textSize);
      const narrowName = (await identity.boundingBox())!;
      const narrowContacts = (await contacts.boundingBox())!;
      expect(narrowContacts.y, `${language} contacts follow the name at ${textSize} text size`).toBeGreaterThanOrEqual(narrowName.y + narrowName.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }
});

test('language routes expose reciprocal discovery, localized sharing and a shared identity', async ({ page }) => {
  const site = new URL('https://dlabaja.eu');
  for (const language of ['en', 'cs'] as const) {
    const meta = pageMetadata(fixture, language, site);
    await page.goto(`/${language}/`);
    await expect(page).toHaveTitle(meta.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', meta.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', meta.url);
    for (const alternate of ['en', 'cs', 'x-default']) {
      await expect(page.locator(`link[hreflang="${alternate}"]`)).toHaveAttribute('href', new URL(alternate === 'x-default' ? '/' : `/${alternate}/`, site).href);
    }
    for (const [property, content] of [['og:title', meta.title], ['og:description', meta.description], ['og:url', meta.url]]) {
      await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute('content', content!);
    }
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', meta.title);
    await expect(page.locator('link[type="text/markdown"]')).toHaveAttribute('href', new URL(`/${language}/index.md`, site).href);
    await expect(page.locator('link[rel="describedby"]')).toHaveAttribute('href', new URL('/llms.txt', site).href);
    const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(graph['@graph'][0]['@id']).toBe(new URL('/#person', site).href);
    expect(graph['@graph'][1].mainEntity['@id']).toBe(graph['@graph'][0]['@id']);
  }
});

test('keyboard reaches phone, email and each visible Connect link exactly once', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/');
    const focused: string[] = [];
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Tab');
      const href = await page.evaluate(() => document.activeElement?.getAttribute('href'));
      if (href) focused.push(href);
      if (focused.length > 0 && !href) break;
    }
    expect(focused).toEqual([`tel:${cv.phone.replace(/[ ()-]/g, '')}`, `mailto:${cv.email}`, ...cv.links.map(link => link.url), '/cs/', '/en/Example_Person_CV_EN.pdf']);
  }
});

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
    const main = await page.locator('main').boundingBox();
    const settings = page.locator('.page-settings:visible');
    await expect(settings).toHaveCount(1);
    const settingsBox = await settings.boundingBox();
    expect(settingsBox!.y, width + 'px settings follow the CV header').toBeGreaterThan(main!.y);
    if (width >= 1024) {
      const sidebar = await page.locator('.additional-info').boundingBox();
      const header = await page.locator('.main-info').boundingBox();
      expect(settingsBox!.x).toBeLessThan(header!.x);
      expect(settingsBox!.y + settingsBox!.height).toBeCloseTo(sidebar!.y + sidebar!.height, 0);
    } else {
      await expect(page.locator('main').getByRole('link').last()).toHaveAttribute('href', '/en/Example_Person_CV_EN.pdf');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), width + 'px page fits the viewport').toBe(true);
    const portrait = await page.locator('.photo > img, .photo > svg').boundingBox();
    expect(Math.abs(portrait!.width - portrait!.height)).toBeLessThan(1);
    if (cv.links.length > 0) {
      const connect = page.locator('.connect:visible');
      await expect(connect).toHaveCount(1);
      if (width < 1024) {
        const sections = page.locator('section:visible:not(.connect)');
        const connectBox = await connect.boundingBox();
        for (const section of await sections.all()) {
          const box = await section.boundingBox();
          expect(connectBox!.y, width + 'px Connect follows the other sections').toBeGreaterThanOrEqual(box!.y + box!.height);
        }
        expect(settingsBox!.y, width + 'px settings follow Connect').toBeGreaterThanOrEqual(connectBox!.y + connectBox!.height);
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
  if (cv.phone) await expect(page.getByRole('link', { name: cv.phone, exact: true })).toHaveAttribute('href', 'tel:' + cv.phone.replace(/[ ()-]/g, ''));
  for (const link of cv.links) await expect(page.getByRole('link', { name: link.label, exact: true })).toHaveAttribute('href', link.url);
  await expect(page.locator('article')).toHaveCount(cv.experience.length + cv.education.length);
  await expect(page.getByRole('button')).toBeHidden();
  if (cv.photo) expect(await page.locator('.photo img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('300 16px "Roboto Variable"') && document.fonts.check('700 40px "Roboto Condensed Variable"'))).toBe(true);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
    for (const [selector, text] of [
      ['.connect a span', 'A professional profile with a longer descriptive label'],
      ['.timeline article strong', 'A University With Several Faculties'],
      ['.badge-list li', 'Software development'],
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
  await expect(page.locator('.theme-control:visible')).toHaveCount(0);
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
    const localized = localizeCV(fixture, language);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('.page-settings:visible')).toHaveCount(0);
    for (const [index, entry] of [...localized.experience, ...localized.education].entries()) {
      await expect(page.locator('article').nth(index).getByText(entry.title, { exact: true })).toBeVisible();
    }
    const pdf = info.outputPath(`cv-${language}.pdf`);
    await page.pdf({ path: pdf, format: 'A4', printBackground: true });
    await info.attach(`print-${language}.pdf`, { path: pdf, contentType: 'application/pdf' });
  }
});

test('PDF links suggest the person and language in the downloaded filename', async ({ page }) => {
  for (const language of ['en', 'cs']) {
    await page.goto(`/${language}/`);
    await expect(page.locator('.page-settings:visible a[download]')).toHaveAttribute('download', `Example_Person_CV_${language.toUpperCase()}.pdf`);
  }
});

test('only prose may wrap inside a word on screen and in print', async ({ page }) => {
  for (const language of ['en', 'cs']) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${language}/`);
      for (const media of ['screen', 'print'] as const) {
        await page.emulateMedia({ media });
        const nonProse = page.locator('h1, .position, .contact-list span, .section-header, .timeline strong, .timeline article > :first-child > div, .cv-dates, .badge-list li, .connect span');
        for (const element of await nonProse.all()) {
          await expect(element).toHaveCSS('hyphens', 'none');
          await expect(element).toHaveCSS('overflow-wrap', 'normal');
        }
        for (const element of await page.locator('.additional-info > section > p, .timeline article > :last-child > p').all()) {
          await expect(element).toHaveCSS('hyphens', 'auto');
          await expect(element).toHaveCSS('overflow-wrap', 'anywhere');
        }
      }
    }
  }
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/cs/');
  await page.evaluate(() => document.fonts.ready);
  const lineCount = async (selector: string, text: string) => page.locator(selector).first().evaluate((element, value) => {
    element.textContent = value;
    Object.assign((element as HTMLElement).style, { display: 'block', width: '50px' });
    const textNode = element.firstChild!;
    const lines = new Set<number>();
    for (let index = 0; index < value.length; index++) {
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      lines.add(Math.round(range.getBoundingClientRect().top));
    }
    return lines.size;
  }, text);
  expect(await lineCount('.timeline strong', 'Technické')).toBe(1);
  expect(await lineCount('.timeline article > :last-child > p', 'UnusuallyLongUnbrokenProseWord')).toBeGreaterThan(1);
});
