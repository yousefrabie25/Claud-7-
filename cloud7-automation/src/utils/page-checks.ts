import { Page } from '@playwright/test';

/** Scrolls the whole page so lazy-loaded images load, then returns broken <img> sources. */
export async function findBrokenImages(page: Page): Promise<string[]> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  return page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => {
        const r = img.getBoundingClientRect();
        const visible = r.width > 0 && r.height > 0 && getComputedStyle(img).visibility !== 'hidden';
        return visible && (!img.complete || img.naturalWidth === 0);
      })
      .map((img) => img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || '(no src)'),
  );
}

/** True when the page is wider than the viewport (horizontal scrollbar). */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

/** Fails the test if the page opens any alert/confirm/prompt (used for XSS checks). */
export function trackDialogs(page: Page): string[] {
  const dialogs: string[] = [];
  page.on('dialog', async (d) => {
    dialogs.push(`${d.type()}: ${d.message()}`);
    await d.dismiss();
  });
  return dialogs;
}

/**
 * The page's first *visible* main heading. The theme puts a hidden <h2 class="title">
 * in the page header, so `locator('h1, h2').first()` can resolve to an invisible element.
 */
export function visibleHeading(page: Page) {
  return page.locator('h1:visible, h2:visible').first();
}
