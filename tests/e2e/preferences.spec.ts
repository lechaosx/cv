import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: true });

test('chooses a language only at the neutral URL and remembers explicit selections', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'cs-CZ', javaScriptEnabled: true });
  const page = await context.newPage();
  await page.goto('/?source=cv#details');
  await expect(page).toHaveURL(/\/cs\/\?source=cv#details$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await expect(page.getByRole('heading', { name: 'Pracovní zkušenosti' })).toBeVisible();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/\?source=cv#details$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
  await page.goto('/cs/');
  await expect(page).toHaveURL(/\/cs\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'cs');
  await context.close();
});

test('remembers a narrow-screen theme override and can resume following the system', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/en/');
  const panel = page.locator('.main-info');
  const theme = page.getByRole('combobox', { name: 'Theme' });
  await expect(theme).toBeVisible();
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await theme.selectOption('dark');
  await expect(panel).toHaveCSS('background-color', 'rgb(40, 54, 73)');
  await page.reload();
  await expect(theme).toHaveValue('dark');
  await expect(panel).toHaveCSS('background-color', 'rgb(40, 54, 73)');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(theme).toBeHidden();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(theme).toBeVisible();
  await expect(theme).toHaveValue('dark');
  await theme.selectOption('system');
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(panel).toHaveCSS('background-color', 'rgb(40, 54, 73)');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.page-settings')).toBeHidden();
  await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 320, height: 900 });
  for (const language of ['en', 'cs']) {
    await page.goto(`/${language}/`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await expect(page.getByRole('combobox')).toBeVisible();
    for (const preference of ['system', 'light', 'dark']) {
      await page.getByRole('combobox').selectOption(preference);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${language} ${preference} settings fit at 200% text size`).toBe(true);
    }
    const settings = await page.locator('.page-settings').boundingBox();
    const main = await page.locator('main').boundingBox();
    expect(settings!.y + settings!.height).toBeLessThanOrEqual(main!.y);
  }
});
