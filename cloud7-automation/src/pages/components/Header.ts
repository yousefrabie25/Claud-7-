import { Locator, Page, expect } from '@playwright/test';

const exact = (text: string) => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');

export class Header {
  readonly nav: Locator;
  readonly toggler: Locator;
  readonly menu: Locator;
  readonly logo: Locator;

  constructor(private readonly page: Page) {
    this.nav = page.locator('nav#site-navigation');
    this.toggler = this.nav.locator('button.navbar-toggler');
    this.menu = page.locator('#top-menu');
    this.logo = this.nav.locator('a:has(img)').first();
  }

  topItem(name: string): Locator {
    return this.menu.locator(':scope > li > a', { hasText: exact(name) });
  }

  providersItem(): Locator {
    return this.menu.locator(':scope > li', { has: this.page.locator(':scope > a', { hasText: exact('Providers') }) });
  }

  providerLink(name: string): Locator {
    return this.providersItem().locator('ul.sub-menu a', { hasText: exact(name) });
  }

  async isCollapsed(): Promise<boolean> {
    return this.toggler.isVisible();
  }

  /** Opens the hamburger menu when the header is collapsed. */
  async ensureMenuOpen(): Promise<void> {
    if ((await this.isCollapsed()) && !(await this.menu.isVisible())) {
      await this.toggler.click();
    }
    await expect(this.menu).toBeVisible();
  }

  async goTo(name: string): Promise<void> {
    await this.ensureMenuOpen();
    await this.topItem(name).click();
  }

  async openProviders(): Promise<void> {
    await this.ensureMenuOpen();
    await this.providersItem().hover();
    await expect(this.providersItem().locator('ul.sub-menu')).toBeVisible();
  }
}
