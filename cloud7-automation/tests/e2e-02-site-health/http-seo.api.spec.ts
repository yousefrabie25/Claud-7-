import { test, expect, knownDefect } from '../../src/fixtures/test';
import { KEY_PAGES, LEGACY_FEATURE_URLS, NOT_FOUND_PATH } from '../../src/data/site';
import { env, hostname } from '../../src/config/env';

/** E2E-02 — HTTP behaviour, redirects, SEO files and meta tags. */
test.describe('E2E-02 HTTP & SEO', { tag: '@E2E-02' }, () => {
  test('API-001 home returns 200 with security headers', { tag: ['@smoke', '@security'] }, async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const h = res.headers();
    expect(h['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(h['x-frame-options']?.toUpperCase()).toBe('SAMEORIGIN');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['content-security-policy']).toBeTruthy();
  });

  test('API-001b home page TTFB within budget', { tag: '@known-defect' }, async ({ request }) => {
    knownDefect('TTFB ~2.9 s in exploratory test');
    await request.get('/'); // warm DNS/TLS
    const start = Date.now();
    const res = await request.get(`/?nocache=${Date.now()}`);
    const elapsed = Date.now() - start;
    expect(res.status()).toBe(200);
    expect(elapsed, `took ${elapsed} ms`).toBeLessThan(env.ttfbBudgetMs);
  });

  test('API-002 http redirects to https', { tag: ['@smoke', '@security'] }, async ({ request }) => {
    const res = await request.get(`http://${hostname}/`, { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()['location']).toMatch(/^https:\/\//);
  });

  test('API-003 www and non-www resolve to one host', async ({ request }) => {
    const other = hostname.startsWith('www.') ? hostname.slice(4) : `www.${hostname}`;
    const res = await request.get(`https://${other}/`, { maxRedirects: 0, failOnStatusCode: false }).catch(() => null);
    test.skip(!res, `${other} does not resolve`);
    expect([301, 308]).toContain(res!.status());
    expect(res!.headers()['location']).toContain(hostname);
  });

  test('API-004 unknown page returns a real 404', async ({ request }) => {
    expect((await request.get(NOT_FOUND_PATH)).status()).toBe(404);
  });

  for (const path of LEGACY_FEATURE_URLS) {
    test(`API-005 ${path} redirects permanently to a live page`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect([301, 308]).toContain(res.status());
      const target = res.headers()['location'];
      expect((await request.get(target)).status()).toBe(200);
    });
  }

  test('API-006 robots.txt is valid', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/sitemap:/i);
    expect(body).not.toMatch(/^disallow:\s*\/\s*$/im);
  });

  test('API-007 every sitemap URL returns 200', { tag: '@nightly' }, async ({ request }) => {
    test.setTimeout(300_000);
    const locs = async (url: string): Promise<string[]> =>
      [...(await (await request.get(url)).text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    let urls = await locs('/sitemap.xml');
    expect(urls.length).toBeGreaterThan(0);
    const nested = urls.filter((u) => /sitemap.*\.xml/.test(u));
    if (nested.length) urls = (await Promise.all(nested.map(locs))).flat();
    for (const u of urls) {
      expect.soft((await request.get(u)).status(), u).toBe(200);
    }
  });

  test('UI-040 key pages have unique title, description, canonical and OG image', async ({ request }) => {
    const titles = new Map<string, string>();
    for (const path of KEY_PAGES) {
      const html = await (await request.get(path)).text();
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
      const meta = (attr: string, val: string) =>
        html.match(new RegExp(`<meta[^>]+${attr}=["']${val}["'][^>]*content=["']([^"']*)["']`, 'i'))?.[1] ??
        html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${val}["']`, 'i'))?.[1];
      const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
      expect.soft(title, `${path} title`).not.toBe('');
      expect.soft(meta('name', 'description'), `${path} description`).toBeTruthy();
      expect.soft(canonical, `${path} canonical`).toBeTruthy();
      expect.soft(meta('property', 'og:image'), `${path} og:image`).toBeTruthy();
      expect.soft(titles.get(title), `${path} title duplicates ${titles.get(title)}`).toBeUndefined();
      titles.set(title, path);
    }
  });
});
