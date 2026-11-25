import { test, expect } from '../../src/fixtures/test';
import { Cf7Client, Cf7FormMeta } from '../../src/api/Cf7Client';
import { CAPTCHA_FIELD, DEMO_FIELDS, DemoData, safeNegativeDemoData, validDemoData } from '../../src/data/forms';
import { env } from '../../src/config/env';

const toFields = (d: DemoData) =>
  Object.fromEntries(Object.entries(d).map(([k, v]) => [DEMO_FIELDS[k as keyof DemoData], v]));

/** E2E-01 at API level — the CF7 endpoint behind the demo form. */
test.describe('E2E-01 Demo form API', { tag: '@E2E-01' }, () => {
  let form: Cf7FormMeta;

  test.beforeAll(async ({ request }) => {
    form = await new Cf7Client(request).discover('/demo/');
  });

  test('API-009 missing required fields → validation_failed for all five', { tag: '@smoke' }, async ({ cf7 }) => {
    const res = await cf7.submit(form, Object.fromEntries(Object.values(DEMO_FIELDS).map((f) => [f, ''])));
    expect(res.http).toBe(200);
    expect(res.status).toBe('validation_failed');
    expect(res.invalidFields).toEqual(expect.arrayContaining(Object.values(DEMO_FIELDS)));
  });

  test('API-010 invalid email → validation_failed on your-email', async ({ cf7 }) => {
    const res = await cf7.submit(form, toFields(safeNegativeDemoData({ email: 'user@' })));
    expect(res.status).toBe('validation_failed');
    expect(res.invalidFields).toContain(DEMO_FIELDS.email);
  });

  test('API-012 unknown form id → 404', async ({ cf7 }) => {
    const res = await cf7.submit(form, toFields(safeNegativeDemoData()), { formIdOverride: '999999' });
    expect(res.http).toBe(404);
    expect(res.code ?? '').toMatch(/not_found/);
  });

  test('API-013 GET on the feedback endpoint is not allowed', async ({ request }) => {
    const res = await request.get(Cf7Client.feedbackPath(form.id));
    expect([404, 405]).toContain(res.status());
    expect(await res.text()).not.toMatch(/your-email|mail_sent/);
  });

  test('API-014 injection payloads are handled without a server error', { tag: '@security' }, async ({ cf7 }) => {
    const res = await cf7.submit(
      form,
      toFields(safeNegativeDemoData({ name: "<script>alert(1)</script>' OR 1=1--", company: '"><svg onload=alert(1)>' })),
    );
    expect(res.http).toBeLessThan(500);
    expect(res.status).toBe('validation_failed');
  });

  test('API-014b oversized message is rejected', { tag: '@security' }, async ({ cf7 }) => {
    const res = await cf7.submit(form, toFields({ ...safeNegativeDemoData(), email: 'bad', message: 'x'.repeat(10_000) }));
    expect(res.http).toBeLessThan(500);
    expect(res.invalidFields).toContain(DEMO_FIELDS.message);
  });

  test('API-011 valid data without a reCAPTCHA token is rejected', { tag: ['@smoke', '@security'] }, async ({ cf7 }) => {
    // Safe on production: the server refuses it before any mail is sent.
    const res = await cf7.submit(form, toFields(validDemoData('api-no-captcha')));
    expect(res.status).not.toBe('mail_sent');
    expect(['validation_failed', 'spam']).toContain(res.status);
    if (res.status === 'validation_failed') expect(res.invalidFields).toContain(CAPTCHA_FIELD);
  });

  test('API-008 valid submission → mail_sent', { tag: '@write' }, async ({ cf7 }) => {
    test.skip(!env.recaptchaToken, 'Set RECAPTCHA_TEST_TOKEN (staging with Google test keys)');
    const res = await cf7.submit(form, toFields(validDemoData('api-demo')), { recaptchaToken: env.recaptchaToken });
    expect(res.http).toBe(200);
    expect(res.status).toBe('mail_sent');
  });
});
