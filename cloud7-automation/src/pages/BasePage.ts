import { Page, Response } from '@playwright/test';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

export class BasePage {
  readonly header: Header;
  readonly footer: Footer;

  constructor(
    readonly page: Page,
    readonly path: string,
  ) {
    this.header = new Header(page);
    this.footer = new Footer(page);
  }

  async open(): Promise<Response | null> {
    return this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
  }

  newsletterSection() {
    return this.page
      .getByRole('heading', { name: /subscribe for newsletter/i })
      .first()
      // Elementor block that holds the heading (and should hold the form).
      .locator('xpath=ancestor::*[contains(@class,"elementor-container") or self::section][1]');
  }
}
