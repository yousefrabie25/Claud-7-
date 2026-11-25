import { test, expect, knownDefect } from '../../src/fixtures/test';
import { Cf7Client } from '../../src/api/Cf7Client';

/** E2E-02 — the WordPress site should not expose admin surfaces or user data. */
test.describe('E2E-02 WordPress security', { tag: ['@E2E-02', '@security'] }, () => {
  test('API-016 user list is not exposed', { tag: '@smoke' }, async ({ request }) => {
    const res = await request.get('/wp-json/wp/v2/users');
    expect([401, 403, 404]).toContain(res.status());
    expect(await res.text()).not.toMatch(/"slug"\s*:/);
  });

  test('API-017 author enumeration does not reveal usernames', async ({ request }) => {
    for (let id = 1; id <= 3; id++) {
      const res = await request.get(`/?author=${id}`, { maxRedirects: 0 });
      expect.soft(res.headers()['location'] ?? '', `author=${id}`).not.toMatch(/\/author\/[^/]+/);
    }
  });

  test('API-018 XML-RPC is disabled', { tag: '@smoke' }, async ({ request }) => {
    const res = await request.post('/xmlrpc.php', {
      headers: { 'Content-Type': 'text/xml' },
      data: '<?xml version="1.0"?><methodCall><methodName>system.listMethods</methodName></methodCall>',
    });
    expect([403, 404, 405]).toContain(res.status());
  });

  test('API-019 admin login page is not publicly reachable', { tag: '@known-defect' }, async ({ request }) => {
    knownDefect('/wp-login.php returns 200');
    const res = await request.get('/wp-login.php', { maxRedirects: 0 });
    expect([302, 403, 404]).toContain(res.status());
  });

  test('API-020 REST index leaks no emails or secrets', async ({ request }) => {
    const res = await request.get('/wp-json/');
    expect([200, 401, 403]).toContain(res.status());
    const body = await res.text();
    expect(body).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(body).not.toMatch(/api[_-]?key|secret|password/i);
  });

  test('API-021 CORS does not allow an untrusted origin', async ({ request }) => {
    const res = await request.fetch(Cf7Client.feedbackPath('1'), {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
    });
    const allow = res.headers()['access-control-allow-origin'];
    const creds = res.headers()['access-control-allow-credentials'];
    expect(allow === '*' && creds === 'true', 'wildcard origin with credentials').toBe(false);
    expect(allow).not.toBe('https://evil.example');
  });
});
