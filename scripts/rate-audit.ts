import { calcEstimates } from '../lib/rate-calc';

const CLAIM_MIN = 18;
const PASS_THRESHOLD = 0.80;

const TEST_CASES = [
  { weight: 50,  zone: 2, label: '50lb Zone 2 (local, min ICP weight)' },
  { weight: 50,  zone: 4, label: '50lb Zone 4' },
  { weight: 50,  zone: 6, label: '50lb Zone 6' },
  { weight: 50,  zone: 8, label: '50lb Zone 8' },
  { weight: 70,  zone: 2, label: '70lb Zone 2' },
  { weight: 70,  zone: 4, label: '70lb Zone 4' },
  { weight: 70,  zone: 6, label: '70lb Zone 6' },
  { weight: 70,  zone: 8, label: '70lb Zone 8' },
  { weight: 90,  zone: 2, label: '90lb Zone 2' },
  { weight: 90,  zone: 4, label: '90lb Zone 4' },
  { weight: 90,  zone: 6, label: '90lb Zone 6' },
  { weight: 90,  zone: 8, label: '90lb Zone 8' },
  { weight: 115, zone: 2, label: '115lb Zone 2' },
  { weight: 115, zone: 4, label: '115lb Zone 4' },
  { weight: 115, zone: 6, label: '115lb Zone 6' },
  { weight: 115, zone: 8, label: '115lb Zone 8' },
  { weight: 149, zone: 2, label: '149lb Zone 2 (max ICP weight)' },
  { weight: 149, zone: 4, label: '149lb Zone 4' },
  { weight: 149, zone: 6, label: '149lb Zone 6' },
  { weight: 149, zone: 8, label: '149lb Zone 8' },
];

const date = new Date().toISOString().slice(0, 10);

const results = TEST_CASES.map((tc) => {
  const est = calcEstimates(tc.weight, tc.zone);
  return { ...tc, ...est, pass: est.savings >= CLAIM_MIN };
});

const passed = results.filter((r) => r.pass).length;
const pct = passed / results.length;
const verdict = pct >= PASS_THRESHOLD ? 'PASS' : 'FAIL';
const failures = results.filter((r) => !r.pass);

const lines = [
  `---`,
  `date: ${date}`,
  `type: rate-audit`,
  `verdict: ${verdict}`,
  `pass_rate: ${passed}/${results.length}`,
  `---`,
  ``,
  `# Rate Audit — ${date}`,
  ``,
  `## Verdict: ${verdict} — ${passed}/${results.length} cases ≥ $${CLAIM_MIN} savings (threshold: ${Math.round(PASS_THRESHOLD * 100)}%)`,
  ``,
  `| Case | Standard | ShippingCow | Savings | Status |`,
  `|------|----------|-------------|---------|--------|`,
  ...results.map((r) =>
    `| ${r.label} | $${r.standard} | $${r.shippingcow} | $${r.savings} | ${r.pass ? '✅' : '❌'} |`
  ),
  ``,
];

if (failures.length > 0) {
  lines.push(`## ⚠️ Failures — claim does not hold`);
  lines.push(``);
  failures.forEach((f) => {
    lines.push(`- **${f.label}**: saves $${f.savings} (need $${CLAIM_MIN}, gap: -$${CLAIM_MIN - f.savings})`);
  });
  lines.push(``);
  lines.push(`**Action:** Review DM copy for these cases. Either caveat the claim or confirm these weight/zone combos are outside the ICP envelope.`);
} else {
  lines.push(`## ✅ All cases pass — claim is defensible across the full ICP range (50–149lb, Zone 2–8)`);
}

console.log(lines.join('\n'));
