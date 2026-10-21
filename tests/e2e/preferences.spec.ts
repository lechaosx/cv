import { test, expect } from '@playwright/test';
import { pageMetadata } from '../../src/publishing';
import { cv } from '../fixtures/cv';

test.use({ javaScriptEnabled: true });

test('square controls use one matching hover and keyboard focus border', async ({ page }) => {
  for (const [width, colorScheme, forcedColors] of [
    [1440, 'light', 'none'],
    [390, 'light', 'none'],
    [390, 'dark', 'none'],
    [390, 'dark', 'active'],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme, forcedColors });
    await page.goto('/en/');
    await page.keyboard.press('Tab');
    const textLink = page.getByRole('link', { name: cv.phone, exact: true });
    await expect(textLink).toBeFocused();
    await expect(textLink).toHaveCSS('outline-style', 'solid');
    await expect(textLink).toHaveCSS('outline-width', '2px');

    const controls = page.locator('.page-settings:visible').locator('a, button:visible');
    for (const control of await controls.all()) {
      const idleBackground = await control.evaluate(element => getComputedStyle(element).backgroundColor);
      for (let step = 0; step < 12 && !await control.evaluate(element => element === document.activeElement); step++) {
        await page.keyboard.press('Tab');
      }
      await expect(control).toBeFocused();
      const focus = await control.evaluate(element => {
        const style = getComputedStyle(element);
        return { color: style.color, background: style.backgroundColor, border: style.borderColor };
      });
      await expect(control).toHaveCSS('border-width', '1px');
      await expect(control).toHaveCSS('border-style', 'solid');
      if (forcedColors === 'none') expect(focus.border).toBe(focus.color);
      else expect(focus.background).not.toBe(idleBackground);
      await expect(control, `${width}px ${colorScheme} ${forcedColors}`).toHaveCSS('outline-style', 'none');
      await control.evaluate((element: HTMLElement) => element.blur());
      await control.hover();
      expect(await control.evaluate(element => {
        const style = getComputedStyle(element);
        return { color: style.color, background: style.backgroundColor, border: style.borderColor };
      })).toEqual(focus);
      await page.mouse.move(0, 0);
    }
  }
});

test('chooses a language at the neutral URL and switches in place with focus, scroll and history intact', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'cs-CZ', javaScriptEnabled: true, viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/?source=cv#details');
  await expect(page).toHaveURL(/\/cs\/\?source=cv#details$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(page.getByRole('heading', { name: 'Pracovní zkušenosti' })).toBeVisible();
  const historyWrites = await page.evaluate(async () => {
    const original = history.replaceState;
    let writes = 0;
    history.replaceState = function (...args) { writes++; return original.apply(this, args); };
    try {
      for (let step = 0; step < 20; step++) {
        window.scrollTo(0, step % 2 ? 100 : 200);
        await new Promise(requestAnimationFrame);
      }
      await new Promise(resolve => setTimeout(resolve, 600));
      return writes;
    } finally {
      history.replaceState = original;
    }
  });
  expect(historyWrites, 'continuous scrolling batches history checkpoints').toBeLessThanOrEqual(2);
  const english = page.getByRole('link', { name: 'English', exact: true });
  await english.scrollIntoViewIfNeeded();
  await english.focus();
  const top = (await english.boundingBox())!.y;
  const navigations: string[] = [];
  page.on('request', request => { if (request.isNavigationRequest()) navigations.push(request.url()); });
  await english.click();
  await expect(page).toHaveURL(/\/en\/\?source=cv#details$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(navigations, 'switching language keeps the current document').toEqual([]);
  const czech = page.getByRole('link', { name: 'Čeština', exact: true });
  await expect(czech).toBeFocused();
  expect((await czech.boundingBox())!.y).toBeCloseTo(top, 0);
  const assertMetadata = async (language: 'en' | 'cs') => {
    const meta = pageMetadata(cv, language, new URL('https://dlabaja.eu'));
    await expect(page).toHaveTitle(meta.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', meta.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', meta.url);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', meta.url);
    await expect(page.locator('link[type="text/markdown"]')).toHaveAttribute('href', `https://dlabaja.eu/${language}/index.md`);
    await expect(page.getByRole('link', { name: language === 'en' ? 'Download PDF' : 'Stáhnout PDF' })).toHaveAttribute('href', `/${language}/cv.pdf`);
    const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(graph['@graph'][1].inLanguage).toBe(language);
  };
  await assertMetadata('en');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('.main-info')).toHaveCSS('background-color', 'rgb(40, 54, 73)');
  await czech.focus();
  await page.goBack();
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(english).toBeFocused();
  expect((await english.boundingBox())!.y).toBeCloseTo(top, 0);
  await assertMetadata('cs');
  await page.goForward();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(czech).toBeFocused();
  expect((await czech.boundingBox())!.y).toBeCloseTo(top, 0);
  await assertMetadata('en');
  const opened = context.waitForEvent('page');
  await czech.click({ modifiers: ['Control'] });
  const tab = await opened;
  await tab.waitForLoadState('domcontentloaded');
  await expect(tab).toHaveURL(/\/cs\/\?source=cv#details$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await tab.close();
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
  await page.goto('/cs/');
  await expect(page).toHaveURL(/\/cs\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await page.route('**/en/**', route => route.request().resourceType() === 'fetch' ? route.abort() : route.continue());
  await english.click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await assertMetadata('en');
  await context.close();
});

test('follows the system until a narrow-screen theme button remembers a manual choice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/');
  const panel = page.locator('.main-info');
  const theme = page.getByRole('button');
  await expect(theme).toHaveAccessibleName('Switch to dark theme');
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(panel).toHaveCSS('background-color', 'rgb(40, 54, 73)');
  await expect(theme).toHaveAccessibleName('Switch to light theme');
  await theme.click();
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.reload();
  await expect(theme).toHaveAccessibleName('Switch to dark theme');
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(theme).toBeHidden();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(theme).toBeVisible();
  await theme.click();
  await expect(panel).toHaveCSS('background-color', 'rgb(40, 54, 73)');
  await expect(theme).toHaveAccessibleName('Switch to light theme');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.page-settings:visible')).toHaveCount(0);
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 320, height: 900 });
  for (const language of ['en', 'cs']) {
    await page.goto(`/${language}/`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(theme).toBeVisible();
    for (const name of language === 'en' ? ['Switch to light theme', 'Switch to dark theme'] : ['Přepnout na světlý vzhled', 'Přepnout na tmavý vzhled']) {
      await expect(theme).toHaveAccessibleName(name);
      await theme.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${language} settings fit at 200% text size`).toBe(true);
    }
    const settings = await page.locator('.page-settings:visible').boundingBox();
    const connect = await page.locator('.connect:visible').boundingBox();
    expect(settings!.y, `${language} settings follow Connect`).toBeGreaterThanOrEqual(connect!.y + connect!.height);
  }
});
