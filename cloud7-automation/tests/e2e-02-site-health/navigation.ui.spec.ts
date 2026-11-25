import { test, expect, knownDefect } from '../../src/fixtures/test';
import { PROVIDERS, TOP_MENU } from '../../src/data/site';
import { HomePage } from '../../src/pages/HomePage';
import { hasHorizontalScroll, visibleHeading } from '../../src/utils/page-checks';

/** E2E-02 — header navigation on desktop and mobile. */
test.describe('E2E-02 Navigation', { tag: '@E2E-02' }, () => {
  for (const item of TOP_MENU) {
    test(`UI-001 menu "${item.name}" opens ${item.path}`, { tag: ['@smoke', '@mobile'] }, async ({ page, homePage }) => {
      await homePage.open();
      await homePage.header.goTo(item.name);
      await expect(page).toHaveURL(new RegExp(`${item.path.replace(/\/$/, '')}/?$`));
      await expect(visibleHeading(page)).toBeVisible();
      await expect(page).not.toHaveTitle(/not found|404/i);
    });
  }

  test('UI-002 Providers dropdown lists and opens each platform', async ({ page, homePage, isMobile }) => {
    test.skip(isMobile, 'hover menu is desktop-only');
    for (const p of PROVIDERS) {
      await homePage.open();
      await homePage.header.openProviders();
      await homePage.header.providerLink(p.name).click();
      await expect(page, p.name).toHaveURL(new RegExp(`${p.path.replace(/\/$/, '')}/?$`));
    }
  });

  test('UI-002b "Providers" itself is not a dead "#" link', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('Providers href="#"');
    await homePage.open();
    const href = await homePage.header.providersItem().locator(':scope > a').getAttribute('href');
    expect(href).not.toBe('#');
  });

  for (const width of [375, 768]) {
    test(`UI-003 hamburger menu works at ${width}px`, { tag: '@smoke' }, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const home = new HomePage(page);
      await home.open();
      await expect(home.header.toggler).toBeVisible();
      await expect(home.header.menu).toBeHidden();
      await home.header.toggler.click();
      await expect(home.header.menu).toBeVisible();
      await home.header.topItem('Pricing').click();
      await expect(page).toHaveURL(/\/pricing\/?$/);
      expect(await hasHorizontalScroll(page), 'horizontal scroll').toBe(false);
    });
  }

  test('UI-003 full menu shown on a 1366px desktop', async ({ page, homePage, isMobile }) => {
    test.skip(isMobile, 'desktop check');
    await homePage.open();
    await expect(homePage.header.toggler).toBeHidden();
    for (const item of TOP_MENU) await expect(homePage.header.topItem(item.name)).toBeVisible();
    expect(page.viewportSize()?.width).toBe(1366);
  });

  test('UI-003b full menu shown on a 1024px laptop', { tag: '@known-defect' }, async ({ page }) => {
    knownDefect('Menu collapses below 1200px (navbar-expand-xl)');
    await page.setViewportSize({ width: 1024, height: 768 });
    const home = new HomePage(page);
    await home.open();
    await expect(home.header.toggler).toBeHidden();
  });

  test('UI-004 logo returns to the home page', { tag: '@mobile' }, async ({ page, pricingPage }) => {
    await pricingPage.open();
    await pricingPage.header.logo.click();
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);
  });

  test('UI-004b logo link is announced as "Cloud7"', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('Logo link accessible name is "xamin" (theme leftover)');
    await homePage.open();
    await expect(homePage.header.logo).toHaveAccessibleName(/cloud7/i);
  });
});
