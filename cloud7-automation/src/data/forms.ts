import { env } from '../config/env';
import { testEmail } from '../utils/mailbox';

/** Field names of the Contact Form 7 forms on the site. */
export const DEMO_FIELDS = {
  name: 'your-name',
  company: 'company-name',
  email: 'your-email',
  phone: 'phone',
  message: 'your-message',
} as const;

export const CONTACT_FIELDS = {
  name: 'your-name',
  email: 'your-email',
  phone: 'b-num',
  company: 'c-name',
  message: 'your-message',
} as const;

/** Server-side reCAPTCHA field reported by CF7 Simple Recaptcha when no valid token is sent. */
export const CAPTCHA_FIELD = 'cf7sr-recaptcha';

export type DemoData = Record<keyof typeof DEMO_FIELDS, string>;

/** A complete, valid demo request. Only sent by @write tests. */
export function validDemoData(tag = 'demo'): DemoData {
  return {
    name: 'QA Automation',
    company: 'QA Automation Co',
    email: testEmail(tag),
    phone: '+20 100 123 4567',
    message: `Automated test ${env.runId} — please ignore.`,
  };
}

/**
 * SAFETY GUARD for negative tests: the message is left empty, so the server
 * always answers validation_failed and no lead is ever sent — even if the
 * field under test is wrongly accepted.
 */
export function safeNegativeDemoData(overrides: Partial<DemoData> = {}): DemoData {
  return { ...validDemoData('negative'), message: '', ...overrides };
}

export const INVALID_EMAILS = ['user@', 'user.com', 'user@@x.com', 'user@x', 'a b@x.com'] as const;

export const INVALID_PHONES = ['abcd', '12', '!!!###'] as const;

export const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
] as const;

export const LIMITS = { name: 400, message: 2000 } as const;
