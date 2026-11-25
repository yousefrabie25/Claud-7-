# Cloud7 automation — E2E-01 & E2E-02

Playwright + TypeScript tests for **cloud7.io**, covering two flows from the test-case sheet:

| Flow | Journey | Specs |
|---|---|---|
| **E2E-01** | Website visitor becomes a demo lead | `tests/e2e-01-demo-lead/` |
| **E2E-02** | Website health, navigation & content | `tests/e2e-02-site-health/` |

Every test title starts with its test-case ID (`UI-017`, `API-009`, …) so results map straight back to the sheet.

## Setup

```bash
npm install
npx playwright install        # browsers
cp .env.example .env          # then edit if needed
```

## Run

| Command | What it runs |
|---|---|
| `npm run test:smoke` | Fast deploy gate: `@smoke` tests, API + Chromium, known defects skipped |
| `npm run test:regression` | Everything on API, Chromium and Pixel 7 |
| `npm run test:cross-browser` | UI tests on Firefox and WebKit (Safari) |
| `npm run test:e2e-01` / `test:e2e-02` | One flow |
| `npm run test:known-defects` | Only the tests that reproduce defects found in exploratory testing |
| `npm run report` | Open the HTML report |
| `npm run report:merge` | Merge downloaded CI blob reports in `all-blob-reports/` |

## Tags

| Tag | Meaning |
|---|---|
| `@E2E-01`, `@E2E-02` | Which business flow the test belongs to |
| `@smoke` | Runs on every deploy |
| `@mobile` | Also runs on the Pixel 7 project |
| `@security` | Security-related check |
| `@nightly` | Slow (e.g. full sitemap crawl) |
| `@known-defect` | Reproduces a bug already found; **expected to fail until fixed**. The report shows the defect as an annotation |
| `@write` | Submits a real form. **Skipped unless `WRITE_TESTS=true`** |

## Safety — production vs staging

- By default nothing is submitted. Negative form tests always leave the **message empty**, so the server returns `validation_failed` and no lead is sent even if the field under test is wrongly accepted.
- `@write` tests (UI-015, UI-021, UI-024, API-008 and the full journey) need `WRITE_TESTS=true`. Against **cloud7.io** they also need `ALLOW_PROD_WRITES=true`, or the run stops before starting. Use a staging copy configured with Google's **reCAPTCHA v2 test keys**: the form has an "I'm not a robot" checkbox (CF7 Simple Recaptcha) that blocks automated submissions on production by design, and the test keys make it always pass.
- Form IDs are read from the live page (`Cf7Client.discover`), so they never go stale.

## Structure

```
src/
  config/env.ts           env vars + .env loader + production guard
  data/                   site map, form field names, test data
  pages/                  Page Objects (Header, Footer, Cf7Form, Home, Demo, Contact, Pricing)
  api/Cf7Client.ts        Contact Form 7 REST client
  utils/                  mailbox (Mailosaur), broken-image / scroll / dialog checks
  fixtures/test.ts        test fixtures + knownDefect() annotation
scripts/ci-summary.mjs    CI run summary from the merged JSON report
merge.config.ts           reporters used when CI merges the shards
tests/
  e2e-01-demo-lead/       demo form UI, lead journeys, CF7 API
  e2e-02-site-health/     navigation, home tabs, pages, HTTP/SEO, WordPress security
```

## Run in Docker

No Node or browsers needed on your machine, only Docker.

```bash
docker compose build                              # once, and after changing package.json
docker compose run --rm smoke                     # smoke suite
docker compose run --rm regression                # API + Chromium + mobile
docker compose run --rm cross-browser             # Firefox + WebKit
docker compose run --rm known-defects
docker compose run --rm tests test -- --grep "UI-017"   # any npm script / filter
```

Settings come from your `.env` file (or shell). Reports appear in `./playwright-report` and `./test-results` on your machine; open `playwright-report/index.html`.

Without Compose:

```bash
docker build -t cloud7-automation .
docker run --rm --ipc=host --init --env-file .env \
  -v "$PWD/playwright-report:/app/playwright-report" -v "$PWD/test-results:/app/test-results" \
  cloud7-automation test:regression
```

The image is `mcr.microsoft.com/playwright:v1.63.0-noble` and `@playwright/test` is pinned to `1.63.0`. **When you upgrade Playwright, change both** (`PLAYWRIGHT_VERSION` in the Dockerfile and `package.json`), or the browsers won't match.

## CI/CD (GitHub Actions)

Full pipeline in `.github/workflows/e2e.yml` — see **[docs/PIPELINE.md](docs/PIPELINE.md)** for setup.

- **Every push / PR / website deploy:** typecheck → smoke gate (API + Chromium, ~5 min)
- **Nightly:** regression (API, Chromium in 2 shards, mobile) + Firefox/WebKit + known-defect tracking
- **Every run:** one merged HTML report, a results summary on the run page, a JUnit check, optional GitHub Pages report and Slack alert
- The summary lists any `@known-defect` test that starts passing, so you know which bugs were fixed

## Not in this project yet

Platform portal and platform API flows (E2E-03 to E2E-08) need a Cloud7 demo tenant and API docs. Non-functional checks (axe, Lighthouse, k6) belong in a separate nightly job.
