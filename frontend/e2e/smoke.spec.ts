import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vite \+ React/);
  });

  test('displays main heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: /Vite \+ React/i });
    await expect(heading).toBeVisible();
  });

  test('counter button works', async ({ page }) => {
    await page.goto('/');

    const button = page.getByRole('button', { name: /count is 0/i });
    await expect(button).toBeVisible();

    await button.click();
    await expect(page.getByRole('button', { name: /count is 1/i })).toBeVisible();

    await button.click();
    await expect(page.getByRole('button', { name: /count is 2/i })).toBeVisible();
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');

    const viteLink = page.getByRole('link', { name: /vite logo/i });
    const reactLink = page.getByRole('link', { name: /react logo/i });

    await expect(viteLink).toHaveAttribute('href', 'https://vite.dev');
    await expect(reactLink).toHaveAttribute('href', 'https://react.dev');
  });
});
