import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Cf7Form } from './components/Cf7Form';

export class ContactPage extends BasePage {
  readonly form: Cf7Form;
  readonly emailLink: Locator;
  readonly phoneLink: Locator;

  constructor(page: Page) {
    super(page, '/contact-us/');
    this.form = new Cf7Form(page, page.locator('body'));
    this.emailLink = page.locator('a[href^="mailto:"]').first();
    this.phoneLink = page.locator('a[href^="tel:"]').first();
  }
}
