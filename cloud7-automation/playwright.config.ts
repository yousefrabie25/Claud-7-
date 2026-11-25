import { defineConfig, devices } from '@playwright/test';
import { env, isProduction } from './src/config/env';

if (env.writeTests && isProduction && !env.allowProdWrites) {
  throw new Error(
    'WRITE_TESTS=true would submit real leads to cloud7.io. Point BASE_URL at staging, ' +
      'or also set ALLOW_PROD_WRITES=true if Cloud7 has agreed to production submissions.',
  );
}

const invert: string[] = [];
if (!env.writeTests) invert.push('@write');
if (env.skipKnown) invert.push('@known-defect');

const desktop = { width: 1366, height: 768 };

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  grepInvert: invert.length ? new RegExp(invert.join('|')) : undefined,
  // In CI every job writes a blob; the pipeline's report job merges them into one HTML/JUnit/JSON report.
  reporter: process.env.CI
    ? [['blob', { fileName: `report-${process.env.BLOB_NAME ?? 'ci'}.zip` }], ['github'], ['list']]
    : [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    { name: 'api', testMatch: /.*\.api\.spec\.ts/ },
    {
      name: 'chromium',
      testMatch: /.*\.ui\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: desktop },
    },
    {
      name: 'firefox',
      testMatch: /.*\.ui\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], viewport: desktop },
    },
    {
      name: 'webkit',
      testMatch: /.*\.ui\.spec\.ts/,
      use: { ...devices['Desktop Safari'], viewport: desktop },
    },
    {
      // Only tests tagged @mobile run on the phone profile.
      name: 'mobile-chrome',
      testMatch: /.*\.ui\.spec\.ts/,
      grep: /@mobile/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
