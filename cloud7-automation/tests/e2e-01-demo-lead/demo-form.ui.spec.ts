import { test, expect, knownDefect } from '../../src/fixtures/test';
import {
  DEMO_FIELDS,
  INVALID_EMAILS,
  INVALID_PHONES,
  LIMITS,
  XSS_PAYLOADS,
  safeNegativeDemoData,
  validDemoData,
} from '../../src/data/forms';
import { mailboxEnabled, waitForEmail } from '../../src/utils/mailbox';
import { trackDialogs } from '../../src/utils/page-checks';

/**
 * E2E-01 — Website visitor becomes a demo lead (demo page).
 * Negative tests always leave the message empty (safeNegativeDemoData), so they
 * can run on production without ever sending a lead.
 */
test.describe('E2E-01 Demo form', { tag: '@E2E-01' }, () => {
  test.beforeEach(async ({ demoPage }) => {
    await demoPage.open();
    await expect(demoPage.form.form).toBeVisible();
  });

  test('UI-014 demo form shows all fields and submit button', { tag: ['@smoke', '@mobile'] }, async ({ demoPage }) => {
    for (const name of Object.values(DEMO_FIELDS)) {
      await expect(demoPage.form.field(name), `field ${name}`).toBeVisible();
    }
    await expect(demoPage.form.submitButton).toBeVisible();
    await expect(demoPage.form.submitButton).toHaveText(/submit my query now/i);
    await expect(demoPage.form.captchaWidget(), 'reCAPTCHA widget').toBeVisible();
  });

  test('UI-014b every demo field has an accessible label', { tag: '@known-defect' }, async ({ demoPage }) => {
    knownDefect('Fields use placeholder text only, no <label> (exploratory, Nov 2026)');
    for (const name of Object.values(DEMO_FIELDS)) {
      const labelled = await demoPage.form.field(name).evaluate(
        (el) => (el as HTMLInputElement).labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'),
      );
      expect.soft(labelled, `field ${name} has no label`).toBeTruthy();
    }
  });

  test('UI-016 empty submit shows an error under every required field', { tag: '@smoke' }, async ({ demoPage }) => {
    const result = await demoPage.form.submit();
    expect(result.status).toBe('validation_failed');
    for (const name of Object.values(DEMO_FIELDS)) {
      await expect(demoPage.form.errorFor(name), `error for ${name}`).toBeVisible();
    }
  });

  for (const email of INVALID_EMAILS) {
    test(`UI-017 invalid email is rejected: "${email}"`, async ({ demoPage }) => {
      await demoPage.fillDemo(safeNegativeDemoData({ email }));
      const result = await demoPage.form.submit();
      expect(result.status).toBe('validation_failed');
      expect(result.invalidFields).toContain(DEMO_FIELDS.email);
      await expect(demoPage.form.errorFor(DEMO_FIELDS.email)).toBeVisible();
    });
  }

  for (const phone of INVALID_PHONES) {
    test(`UI-018 invalid phone is rejected: "${phone}"`, { tag: '@known-defect' }, async ({ demoPage }) => {
      knownDefect('Phone is a plain text field with no format check');
      await demoPage.fillDemo(safeNegativeDemoData({ phone }));
      const result = await demoPage.form.submit();
      expect(result.invalidFields).toContain(DEMO_FIELDS.phone);
    });
  }

  test('UI-019 name and message stop at their length limits', async ({ demoPage }) => {
    await demoPage.fillDemo({ name: 'N'.repeat(LIMITS.name + 1), message: 'M'.repeat(LIMITS.message + 1) });
    const nameLen = (await demoPage.form.field(DEMO_FIELDS.name).inputValue()).length;
    const msgLen = (await demoPage.form.field(DEMO_FIELDS.message).inputValue()).length;
    expect(nameLen).toBeLessThanOrEqual(LIMITS.name);
    expect(msgLen).toBeLessThanOrEqual(LIMITS.message);
  });

  for (const payload of XSS_PAYLOADS) {
    test(`UI-020 script input is not executed: ${payload}`, { tag: '@security' }, async ({ page, demoPage }) => {
      const dialogs = trackDialogs(page);
      await demoPage.fillDemo(safeNegativeDemoData({ name: payload, company: payload }));
      await demoPage.form.submit();
      await page.waitForTimeout(500);
      expect(dialogs, 'a script ran on the page').toEqual([]);
      await expect(demoPage.form.field(DEMO_FIELDS.name)).toHaveValue(payload);
    });
  }

  test('UI-022 every demo button brings the form into view', { tag: '@mobile' }, async ({ page, demoPage }) => {
    const count = await demoPage.demoButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await page.evaluate(() => window.scrollTo(0, 0));
      const button = demoPage.demoButtons.nth(i);
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await expect(demoPage.form.form, `button #${i + 1}`).toBeInViewport({ ratio: 0.2 });
    }
  });

  test('UI-015 valid demo request is accepted and demo access email arrives', { tag: '@write' }, async ({ demoPage }) => {
    const data = validDemoData('ui-demo');
    await demoPage.fillDemo(data);
    await demoPage.form.solveTestCaptcha();
    const result = await demoPage.form.submit();
    expect(result.status).toBe('mail_sent');
    await expect(demoPage.form.responseOutput).toBeVisible();
    if (mailboxEnabled) {
      const mail = await waitForEmail(data.email);
      expect(mail.subject + mail.text).toMatch(/demo|cloud7/i);
    } else {
      test.info().annotations.push({ type: 'note', description: 'Mailosaur not configured — email not checked' });
    }
  });

  test('UI-021 double-click on submit sends only one request', { tag: '@write' }, async ({ demoPage }) => {
    await demoPage.fillDemo(validDemoData('ui-dblclick'));
    await demoPage.form.solveTestCaptcha();
    const counter = demoPage.form.countSubmissions();
    await demoPage.form.submitButton.dblclick();
    await expect(demoPage.form.responseOutput).not.toBeEmpty({ timeout: 30_000 });
    expect(counter.count()).toBe(1);
  });
});
