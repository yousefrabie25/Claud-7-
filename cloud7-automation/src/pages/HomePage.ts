import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly heroDemoButton: Locator;

  constructor(page: Page) {
    super(page, '/');
    this.heroDemoButton = page.getByRole('link', { name: /take a demo/i }).first();
  }

  tab(name: string): Locator {
    return this.page.locator('ul.nav-pills a.nav-link', { hasText: name }).first();
  }

  /** Clicks a tab and returns its pane after checking it became the active, visible one. */
  async openTab(name: string): Promise<Locator> {
    const tab = this.tab(name);
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    const target = await tab.getAttribute('href');
    expect(target, `tab "${name}" has no target pane`).toMatch(/^#/);
    const pane = this.page.locator(target!);
    await expect(pane).toHaveClass(/\bactive\b/);
    await expect(pane).toBeVisible();
    return pane;
  }
}
