import { Locator, Page, Response, expect } from '@playwright/test';

export interface Cf7Result {
  status: string;
  message: string;
  invalidFields: string[];
}

/** A Contact Form 7 form. Fields are addressed by their `name` attribute. */
export class Cf7Form {
  readonly form: Locator;
  readonly submitButton: Locator;
  readonly responseOutput: Locator;

  constructor(
    private readonly page: Page,
    root: Locator,
  ) {
    this.form = root.locator('form.wpcf7-form').first();
    this.submitButton = this.form.locator('[type="submit"]');
    this.responseOutput = this.form.locator('.wpcf7-response-output');
  }

  /** reCAPTCHA v2 "I'm not a robot" widget (CF7 Simple Recaptcha). */
  captchaWidget(): Locator {
    return this.form.locator('.cf7sr-g-recaptcha, .g-recaptcha').first();
  }

  /**
   * Ticks the reCAPTCHA checkbox. Only passes on staging with Google's test keys
   * (6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI) — production shows a challenge, by design.
   */
  async solveTestCaptcha(): Promise<void> {
    if ((await this.captchaWidget().count()) === 0) return;
    const frame = this.page.frameLocator('form.wpcf7-form iframe[title="reCAPTCHA"]').first();
    const anchor = frame.locator('#recaptcha-anchor');
    await anchor.click();
    await expect(anchor).toHaveAttribute('aria-checked', 'true', { timeout: 15_000 });
  }

  field(name: string): Locator {
    return this.form.locator(`[name="${name}"]`);
  }

  errorFor(name: string): Locator {
    return this.form.locator(`[data-name="${name}"] .wpcf7-not-valid-tip, .wpcf7-form-control-wrap.${name} .wpcf7-not-valid-tip`);
  }

  async fill(values: Record<string, string>): Promise<void> {
    for (const [name, value] of Object.entries(values)) {
      await this.field(name).fill(value);
    }
  }

  private isFeedback(r: Response): boolean {
    return r.url().includes('/contact-form-7/v1/contact-forms/') && r.request().method() === 'POST';
  }

  /** Clicks submit and returns the server's CF7 verdict. */
  async submit(): Promise<Cf7Result> {
    await this.submitButton.scrollIntoViewIfNeeded();
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => this.isFeedback(r), { timeout: 30_000 }),
      this.submitButton.click(),
    ]);
    const body = (await response.json().catch(() => ({}))) as {
      status?: string;
      message?: string;
      invalid_fields?: Array<{ field?: string; into?: string }>;
    };
    await expect(this.responseOutput).not.toBeEmpty();
    return {
      status: body.status ?? `http-${response.status()}`,
      message: body.message ?? '',
      invalidFields: (body.invalid_fields ?? []).map(fieldName),
    };
  }

  /** Counts CF7 submissions sent by the page from now on. */
  countSubmissions(): { count: () => number } {
    let n = 0;
    this.page.on('request', (r) => {
      if (r.url().includes('/contact-form-7/v1/contact-forms/') && r.method() === 'POST') n++;
    });
    return { count: () => n };
  }
}

/** CF7 reports a field as `field` (newer) or as a CSS path in `into` (older). */
export function fieldName(f: { field?: string; into?: string }): string {
  if (f.field) return f.field;
  const into = f.into ?? '';
  return into.match(/data-name="([^"]+)"/)?.[1] ?? into.split('.').pop() ?? into;
}
