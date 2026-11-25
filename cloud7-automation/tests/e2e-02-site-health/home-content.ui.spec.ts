import { test, expect, knownDefect } from '../../src/fixtures/test';
import { FEATURE_TABS, PLATFORM_TABS, PROVIDERS } from '../../src/data/site';

/** E2E-02 — home page tabs and their content. */
test.describe('E2E-02 Home page content', { tag: '@E2E-02' }, () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  test('UI-007 each feature tab shows its own content', async ({ homePage }) => {
    const seen = new Set<string>();
    for (const name of FEATURE_TABS) {
      const pane = await homePage.openTab(name);
      const text = (await pane.innerText()).trim();
      expect(text.length, `${name} pane is empty`).toBeGreaterThan(20);
      expect(seen.has(text), `${name} repeats another tab's content`).toBe(false);
      seen.add(text);
    }
  });

  test('UI-007b feature tab heading matches the tab name', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('"Service Catalogue" tab shows "Subscription & Contract Management"');
    for (const name of FEATURE_TABS) {
      const pane = await homePage.openTab(name);
      const firstWord = name.split(/[\s&-]+/)[0];
      await expect.soft(pane.locator('h1, h2, h3, h4, h5').first(), name).toContainText(new RegExp(firstWord, 'i'));
    }
  });

  test('UI-008 "View details" opens the matching feature', { tag: '@known-defect' }, async ({ page, homePage }) => {
    knownDefect('All "View details" links land on the generic /features/ page');
    for (const name of FEATURE_TABS) {
      await homePage.open();
      const pane = await homePage.openTab(name);
      await pane.getByRole('link', { name: /view details/i }).click();
      await expect.soft(page, name).not.toHaveURL(/\/features\/?$/);
    }
  });

  test('UI-009 each supported-platform tab shows its own content', async ({ homePage }) => {
    for (const name of PLATFORM_TABS) {
      const pane = await homePage.openTab(name);
      await expect(pane, name).toContainText(new RegExp(name, 'i'));
    }
  });

  test('UI-009b supported platforms match the Providers menu', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('Kubernetes and AWS on the home page but not in nav or footer');
    const menu = PROVIDERS.map((p) => p.name.toLowerCase());
    for (const name of PLATFORM_TABS) {
      expect.soft(menu.some((m) => m.includes(name.toLowerCase())), `${name} missing from Providers menu`).toBe(true);
    }
  });
});
