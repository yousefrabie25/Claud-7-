import { Locator, Page } from '@playwright/test';

export class Footer {
  readonly root: Locator;
  readonly copyright: Locator;
  readonly backToTop: Locator;

  constructor(page: Page) {
    this.root = page.locator('footer');
    this.copyright = this.root.getByText(/copyright/i).first();
    this.backToTop = page.locator('#back-to-top, a[href="#top"]').first();
  }

  async linkHrefs(): Promise<string[]> {
    const hrefs = await this.root.locator('a[href]').evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).href),
    );
    return [...new Set(hrefs.filter((h) => h.startsWith('http')))];
  }
}
