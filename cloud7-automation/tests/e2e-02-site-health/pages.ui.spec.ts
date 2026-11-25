import { test, expect, knownDefect } from '../../src/fixtures/test';
import { NOT_FOUND_PATH, PROVIDERS, STATIC_PAGES } from '../../src/data/site';
import { findBrokenImages, hasHorizontalScroll, visibleHeading } from '../../src/utils/page-checks';

/** E2E-02 — inner pages, footer, 404, responsive layout. */
test.describe('E2E-02 Pages', { tag: '@E2E-02' }, () => {
  test('UI-027 pricing shows Free, Monthly and Annual plans', async ({ page, pricingPage }) => {
    await pricingPage.open();
    for (const plan of ['Free', 'Monthly', 'Annual'] as const) {
      await expect(pricingPage.plan(plan), plan).toBeVisible();
    }
    await expect(page.getByText(/25 virtual machines/i).first()).toBeVisible();
  });

  for (const p of PROVIDERS) {
    test(`UI-030 ${p.name} page loads with content`, async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(visibleHeading(page)).toBeVisible();
      expect(await findBrokenImages(page)).toEqual([]);
    });
  }

  test('UI-031 blog lists posts and opens one', async ({ page }) => {
    await page.goto('/blog/');
    const post = page.locator('article a[href*="cloud7.io/"], .blog-post a, h2 a, h3 a, h4 a').first();
    await expect(post).toBeVisible();
    await post.click();
    await expect(page).not.toHaveURL(/\/blog\/?$/);
    await expect(visibleHeading(page)).toBeVisible();
  });

  for (const path of STATIC_PAGES) {
    test(`UI-032 ${path} has no broken images`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      expect(await findBrokenImages(page)).toEqual([]);
    });
  }

  test('UI-033 unknown URL shows the custom 404 page', async ({ page }) => {
    const res = await page.goto(NOT_FOUND_PATH);
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/page is not found|not found/i).first()).toBeVisible();
    await page.getByRole('link', { name: /back to home/i }).click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
  });

  test('UI-033b 404 page image loads', { tag: '@known-defect' }, async ({ page }) => {
    knownDefect('404 illustration is broken');
    await page.goto(NOT_FOUND_PATH);
    expect(await findBrokenImages(page)).toEqual([]);
  });

  test('UI-034 footer links work', async ({ page, homePage, request }) => {
    await homePage.open();
    const links = (await homePage.footer.linkHrefs()).filter((h) => new URL(h).hostname === new URL(page.url()).hostname);
    expect(links.length).toBeGreaterThan(3);
    for (const href of links) {
      expect.soft((await request.get(href)).status(), href).toBe(200);
    }
  });

  test('UI-034b footer copyright shows the current year', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('Copyright still says 2025');
    await homePage.open();
    await expect(homePage.footer.copyright).toContainText(String(new Date().getFullYear()));
  });

  for (const width of [375, 414, 768]) {
    test(`UI-036 no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/', '/demo/', '/pricing/']) {
        await page.goto(path);
        expect.soft(await hasHorizontalScroll(page), `${path} @ ${width}px`).toBe(false);
      }
    });
  }

  test('UI-041 privacy policy is linked in the footer', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('No privacy-policy link anywhere on the home page (checked Nov 2026)');
    await homePage.open();
    await expect(homePage.footer.root.getByRole('link', { name: /privacy/i })).toBeVisible();
  });
});
