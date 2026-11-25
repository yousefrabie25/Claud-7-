// Used by the pipeline's report job: `npx playwright merge-reports --config merge.config.ts ./all-blob-reports`
export default {
  testDir: './tests',
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
};
