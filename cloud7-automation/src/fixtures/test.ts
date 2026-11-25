import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { DemoPage } from '../pages/DemoPage';
import { ContactPage } from '../pages/ContactPage';
import { PricingPage } from '../pages/PricingPage';
import { Cf7Client } from '../api/Cf7Client';

type Fixtures = {
  homePage: HomePage;
  demoPage: DemoPage;
  contactPage: ContactPage;
  pricingPage: PricingPage;
  cf7: Cf7Client;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => use(new HomePage(page)),
  demoPage: async ({ page }, use) => use(new DemoPage(page)),
  contactPage: async ({ page }, use) => use(new ContactPage(page)),
  pricingPage: async ({ page }, use) => use(new PricingPage(page)),
  cf7: async ({ request }, use) => use(new Cf7Client(request)),
});

export { expect };

/** Records a known defect from exploratory testing on the test, so the report links them. */
export function knownDefect(description: string): void {
  test.info().annotations.push({ type: 'known-defect', description });
}
