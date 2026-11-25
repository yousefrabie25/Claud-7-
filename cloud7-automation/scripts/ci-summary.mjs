#!/usr/bin/env node
/**
 * Turns the merged Playwright JSON report into a GitHub job summary and step outputs.
 *   node scripts/ci-summary.mjs reports/results.json
 * Outputs (GITHUB_OUTPUT): regressions, known_now_passing, totals
 */
import fs from 'node:fs';

const file = process.argv[2] ?? 'reports/results.json';
const report = JSON.parse(fs.readFileSync(file, 'utf8'));

const rows = [];
const walk = (suite, path = []) => {
  const here = suite.title ? [...path, suite.title] : path;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const tags = spec.tags ?? [];
      const last = t.results?.[t.results.length - 1];
      rows.push({
        title: spec.title,
        file: `${spec.file}:${spec.line}`,
        project: t.projectName,
        status: t.status, // expected | unexpected | flaky | skipped
        known: tags.includes('known-defect') || tags.includes('@known-defect'),
        flow: (tags.find((x) => /E2E-\d+/.test(x)) ?? '').replace('@', ''),
        error: (last?.error?.message ?? '').split('\n')[0].replace(/\u001b\[[0-9;]*m/g, '').slice(0, 160),
        defect: (t.annotations ?? []).find((a) => a.type === 'known-defect')?.description ?? '',
      });
    }
  }
  for (const s of suite.suites ?? []) walk(s, here);
};
for (const s of report.suites ?? []) walk(s);

const count = (pred) => rows.filter(pred).length;
const passed = count((r) => r.status === 'expected' && !r.known);
const flaky = count((r) => r.status === 'flaky');
const skipped = count((r) => r.status === 'skipped');
const regressions = rows.filter((r) => r.status === 'unexpected' && !r.known);
const knownFailing = rows.filter((r) => r.known && r.status === 'unexpected');
const knownPassing = rows.filter((r) => r.known && (r.status === 'expected' || r.status === 'flaky'));

const projects = [...new Set(rows.map((r) => r.project))].sort();
const esc = (s) => String(s).replace(/\|/g, '\\|');

let md = `## cloud7 E2E results\n\n`;
md += `| Result | Count |\n|---|---|\n`;
md += `| ✅ Passed | ${passed} |\n| ❌ New failures | ${regressions.length} |\n| ⚠️ Flaky | ${flaky} |\n`;
md += `| 🐞 Known defects still failing | ${knownFailing.length} |\n| 🎉 Known defects now passing | ${knownPassing.length} |\n| ⏭️ Skipped | ${skipped} |\n\n`;

md += `### By project\n\n| Project | Passed | Failed | Flaky | Skipped |\n|---|---|---|---|---|\n`;
for (const p of projects) {
  const mine = rows.filter((r) => r.project === p && !r.known);
  md += `| ${p} | ${mine.filter((r) => r.status === 'expected').length} | ${mine.filter((r) => r.status === 'unexpected').length} | ${mine.filter((r) => r.status === 'flaky').length} | ${mine.filter((r) => r.status === 'skipped').length} |\n`;
}

if (regressions.length) {
  md += `\n### ❌ New failures\n\n| Test | Flow | Project | Error |\n|---|---|---|---|\n`;
  for (const r of regressions) md += `| ${esc(r.title)}<br><sub>${esc(r.file)}</sub> | ${r.flow} | ${r.project} | ${esc(r.error)} |\n`;
}
if (knownPassing.length) {
  md += `\n### 🎉 Known defects now passing — verify the fix, then remove the \`@known-defect\` tag\n\n`;
  for (const r of knownPassing) md += `- **${esc(r.title)}** (${r.project}) — ${esc(r.defect)}\n`;
}
if (knownFailing.length) {
  md += `\n<details><summary>🐞 Known defects still failing (${knownFailing.length})</summary>\n\n`;
  for (const r of knownFailing) md += `- ${esc(r.title)} (${r.project}) — ${esc(r.defect)}\n`;
  md += `\n</details>\n`;
}

const totals = `${passed} passed, ${regressions.length} new failures, ${flaky} flaky, ${knownFailing.length} known defects`;
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
else process.stdout.write(md);
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `regressions=${regressions.length}\nknown_now_passing=${knownPassing.length}\ntotals=${totals}\n`,
  );
}
console.log(totals);
