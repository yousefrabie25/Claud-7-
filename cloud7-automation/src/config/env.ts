import * as fs from 'fs';
import * as path from 'path';

/** Minimal .env loader (no extra dependency). Real environment variables win over the file. */
function loadDotEnv(): void {
  const file = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    const [, key, raw] = m;
    if (process.env[key] === undefined) process.env[key] = raw.replace(/^['"]|['"]$/g, '');
  }
}
loadDotEnv();

export const env = {
  /** Site under test. Point this at staging for write tests. */
  baseURL: (process.env.BASE_URL ?? 'https://cloud7.io').replace(/\/$/, ''),
  /** Tests tagged @write submit real forms (send leads / emails). Off by default. */
  writeTests: process.env.WRITE_TESTS === 'true',
  /** Second key needed to run @write tests against production. */
  allowProdWrites: process.env.ALLOW_PROD_WRITES === 'true',
  /** Skip tests tagged @known-defect (useful for a green deploy gate). */
  skipKnown: process.env.SKIP_KNOWN === 'true',
  /** Time-to-first-byte budget for the home page (ms). */
  ttfbBudgetMs: Number(process.env.TTFB_BUDGET_MS ?? 800),
  /** reCAPTCHA token for API write tests on staging (use Google's test keys there). */
  recaptchaToken: process.env.RECAPTCHA_TEST_TOKEN ?? '',
  /** Unique id for this run, used in test emails. */
  runId: process.env.RUN_ID ?? Date.now().toString(36),
  mailosaur: {
    apiKey: process.env.MAILOSAUR_API_KEY ?? '',
    serverId: process.env.MAILOSAUR_SERVER_ID ?? '',
  },
};

export const isProduction = /^https?:\/\/(www\.)?cloud7\.io$/i.test(env.baseURL);
export const hostname = new URL(env.baseURL).hostname;
