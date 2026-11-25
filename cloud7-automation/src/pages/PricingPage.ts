import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PricingPage extends BasePage {
  readonly ctas: Locator;

  constructor(page: Page) {
    super(page, '/pricing/');
    this.ctas = page
      .locator('main a, .elementor a, #content a')
      .filter({ hasText: /talk to sales|get started|explore plans|request demo/i });
  }

  plan(name: 'Free' | 'Monthly' | 'Annual'): Locator {
    return this.page.getByRole('heading', { name: new RegExp(`^\\s*${name}\\s*$`, 'i') }).first();
  }
}
