# Cloud7 test automation — Playwright + TypeScript
#
# Build:  docker build -t cloud7-automation .
# Run:    docker run --rm --ipc=host --init --env-file .env \
#           -v "$PWD/playwright-report:/app/playwright-report" \
#           -v "$PWD/test-results:/app/test-results" \
#           cloud7-automation                      # smoke (default)
#         ... cloud7-automation test:regression    # any npm script
#         ... cloud7-automation test -- --grep "UI-017"
#
# The image tag MUST match the @playwright/test version in package.json,
# otherwise the browsers in the image won't match the test runner.
ARG PLAYWRIGHT_VERSION=1.63.0
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

WORKDIR /app

ENV NODE_ENV=test \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false

# Dependencies first, so this layer is cached until package*.json changes.
# Browsers are already in the image (/ms-playwright) — no `playwright install`.
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

# Run as the image's non-root user; it needs to write reports.
RUN mkdir -p playwright-report test-results blob-report \
 && chown -R pwuser:pwuser /app
USER pwuser

ENTRYPOINT ["npm", "run"]
CMD ["test:smoke"]
