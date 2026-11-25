import { test, expect, knownDefect } from '../../src/fixtures/test';
import { CONTACT, PROVIDERS } from '../../src/data/site';
import { CONTACT_FIELDS, validDemoData } from '../../src/data/forms';
import { testEmail } from '../../src/utils/mailbox';

/** E2E-01 — the paths a visitor takes to become a lead: CTAs, contact page, newsletter. */
test.describe('E2E-01 Lead journeys', { tag: '@E2E-01' }, () => {
  test('UI-006 hero "Take a Demo" opens the demo page', { tag: ['@smoke', '@mobile'] }, async ({ page, homePage }) => {
    await homePage.open();
    await homePage.heroDemoButton.click();
    await expect(page).toHaveURL(/\/demo\/?$/);
    await expect(page.locator('form.wpcf7-form')).toBeVisible();
  });

  test('UI-028 every pricing CTA leads somewhere real', { tag: '@smoke' }, async ({ page, pricingPage, request }) => {
    await pricingPage.open();
    const hrefs = await pricingPage.ctas.evaluateAll((as) =>
      as.map((a) => ({ text: a.textContent?.trim() ?? '', href: a.getAttribute('href') ?? '' })),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const { text, href } of hrefs) {
      expect.soft(href, `"${text}" has no destination`).not.toMatch(/^(#?|javascript:.*)$/);
      if (href.startsWith('#') && href.length > 1) {
        expect.soft(await page.locator(href).count(), `"${text}" anchor ${href} missing`).toBeGreaterThan(0);
      } else if (href && !href.startsWith('#')) {
        const res = await request.get(new URL(href, page.url()).toString());
        expect.soft(res.status(), `"${text}" → ${href}`).toBe(200);
      }
    }
  });

  test('UI-025 contact email and phone links are correct', async ({ contactPage }) => {
    await contactPage.open();
    await expect(contactPage.emailLink).toHaveAttribute('href', `mailto:${CONTACT.email}`);
    await expect(contactPage.phoneLink).toHaveAttribute('href', new RegExp(`^tel:\\${CONTACT.phone}$`));
  });

  test('UI-024 contact form with valid data is accepted', { tag: '@write' }, async ({ contactPage }) => {
    await contactPage.open();
    const d = validDemoData('ui-contact');
    await contactPage.form.fill({
      [CONTACT_FIELDS.name]: d.name,
      [CONTACT_FIELDS.email]: d.email,
      [CONTACT_FIELDS.phone]: '+201001234567',
      [CONTACT_FIELDS.company]: d.company,
      [CONTACT_FIELDS.message]: d.message,
    });
    await contactPage.form.solveTestCaptcha();
    const result = await contactPage.form.submit();
    expect(result.status).toBe('mail_sent');
  });

  test('UI-012 newsletter has an email field and subscribe button', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('Newsletter section shows a heading only — no input or button');
    await homePage.open();
    const section = homePage.newsletterSection();
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('input[type="email"], input[name*="mail" i]')).toBeVisible();
    await expect(section.getByRole('button', { name: /subscribe/i })).toBeVisible();
  });

  test('UI-013 newsletter rejects an invalid email', { tag: '@known-defect' }, async ({ homePage }) => {
    knownDefect('Blocked by UI-012 — newsletter form missing');
    await homePage.open();
    const section = homePage.newsletterSection();
    const input = section.locator('input[type="email"], input[name*="mail" i]');
    await input.fill('abc@');
    await section.getByRole('button', { name: /subscribe/i }).click();
    await expect(section.getByText(/invalid|valid email/i)).toBeVisible();
  });

  test('E2E-01 full journey: home → pricing → demo → submit', { tag: '@write' }, async ({ page, homePage, demoPage }) => {
    await homePage.open();
    await homePage.header.goTo('Pricing');
    await expect(page).toHaveURL(/\/pricing\/?$/);
    await page.getByRole('link', { name: /request demo/i }).first().click();
    await expect(page).toHaveURL(/\/demo\/?/);
    await demoPage.fillDemo({ ...validDemoData('journey'), email: testEmail('journey') });
    await demoPage.form.solveTestCaptcha();
    expect((await demoPage.form.submit()).status).toBe('mail_sent');
  });

  test('UI-030b each provider page offers a demo CTA', async ({ page }) => {
    for (const p of PROVIDERS) {
      await page.goto(p.path);
      await expect(page.locator('a[href*="/demo"]').first(), p.name).toBeAttached();
    }
  });
});
