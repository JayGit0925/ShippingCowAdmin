import type { ReferenceTableName } from '@/lib/reference';

export type ValidationIssue = {
  rowIndex: number | null;
  field: string | null;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
  rowCount: number;
};

type RawRow = Record<string, unknown>;

const ZIP_PREFIX_RE = /^\d{3}$/;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function asInt(v: unknown): number | null {
  if (typeof v === 'number') return Number.isInteger(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function validateZoneMatrix(rows: RawRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const origin = row.origin_zip_prefix;
    const dest = row.dest_zip_prefix;
    const zone = asInt(row.zone);
    const eff = row.effective_from;
    if (typeof origin !== 'string' || !ZIP_PREFIX_RE.test(origin)) {
      issues.push({ rowIndex: i, field: 'origin_zip_prefix', message: 'Must be 3-digit ZIP prefix' });
    }
    if (typeof dest !== 'string' || !ZIP_PREFIX_RE.test(dest)) {
      issues.push({ rowIndex: i, field: 'dest_zip_prefix', message: 'Must be 3-digit ZIP prefix' });
    }
    if (zone === null || zone < 1 || zone > 9) {
      issues.push({ rowIndex: i, field: 'zone', message: 'Zone must be integer 1-9' });
    }
    if (!isIsoDate(eff)) {
      issues.push({ rowIndex: i, field: 'effective_from', message: 'effective_from must be YYYY-MM-DD' });
    }
    const key = `${origin}|${dest}|${eff}`;
    if (seen.has(key)) {
      issues.push({ rowIndex: i, field: null, message: 'Duplicate (origin, dest, effective_from) within draft' });
    }
    seen.add(key);
  });
  return issues;
}

function validateCarrierRates(rows: RawRow[], label: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const bands = new Map<string, { min: number; max: number; rowIndex: number }[]>();
  rows.forEach((row, i) => {
    const carrier = row.carrier;
    const service = row.service;
    const zone = asInt(row.zone);
    const wMin = asNumber(row.weight_lb_min);
    const wMax = asNumber(row.weight_lb_max);
    const rate = asNumber(row.rate_usd);
    const eff = row.effective_from;
    if (!isNonEmptyString(carrier)) {
      issues.push({ rowIndex: i, field: 'carrier', message: 'carrier required' });
    }
    if (!isNonEmptyString(service)) {
      issues.push({ rowIndex: i, field: 'service', message: 'service required' });
    }
    if (zone === null || zone < 1 || zone > 9) {
      issues.push({ rowIndex: i, field: 'zone', message: 'zone must be 1-9' });
    }
    if (wMin === null || wMin < 0) {
      issues.push({ rowIndex: i, field: 'weight_lb_min', message: 'weight_lb_min must be ≥ 0' });
    }
    if (wMax === null || wMax <= 0) {
      issues.push({ rowIndex: i, field: 'weight_lb_max', message: 'weight_lb_max must be > 0' });
    }
    if (wMin !== null && wMax !== null && wMin >= wMax) {
      issues.push({ rowIndex: i, field: 'weight_lb_max', message: 'weight_lb_max must be > weight_lb_min' });
    }
    if (rate === null || rate <= 0) {
      issues.push({ rowIndex: i, field: 'rate_usd', message: 'rate_usd must be > 0' });
    }
    if (!isIsoDate(eff)) {
      issues.push({ rowIndex: i, field: 'effective_from', message: 'effective_from must be YYYY-MM-DD' });
    }
    if (
      isNonEmptyString(carrier) &&
      isNonEmptyString(service) &&
      zone !== null &&
      wMin !== null &&
      wMax !== null
    ) {
      const k = `${carrier}|${service}|${zone}|${eff}`;
      const list = bands.get(k) ?? [];
      list.push({ min: wMin, max: wMax, rowIndex: i });
      bands.set(k, list);
    }
  });
  bands.forEach((list, key) => {
    list.sort((a, b) => a.min - b.min);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (cur.min < prev.max) {
        issues.push({
          rowIndex: cur.rowIndex,
          field: 'weight_lb_min',
          message: `${label}: weight band overlaps prior band for ${key}`,
        });
      }
    }
  });
  return issues;
}

function validateFeeTable(rows: RawRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const feeType = row.fee_type;
    const unit = row.unit;
    const rate = asNumber(row.rate_usd);
    const eff = row.effective_from;
    if (!isNonEmptyString(feeType)) {
      issues.push({ rowIndex: i, field: 'fee_type', message: 'fee_type required' });
    }
    if (!isNonEmptyString(unit)) {
      issues.push({ rowIndex: i, field: 'unit', message: 'unit required' });
    }
    if (rate === null || rate < 0) {
      issues.push({ rowIndex: i, field: 'rate_usd', message: 'rate_usd must be ≥ 0' });
    }
    if (!isIsoDate(eff)) {
      issues.push({ rowIndex: i, field: 'effective_from', message: 'effective_from must be YYYY-MM-DD' });
    }
    const key = `${feeType}|${eff}`;
    if (seen.has(key)) {
      issues.push({ rowIndex: i, field: null, message: 'Duplicate (fee_type, effective_from)' });
    }
    seen.add(key);
  });
  return issues;
}

function validateCategoryBenchmarks(rows: RawRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const category = row.category;
    const metric = row.metric;
    const value = asNumber(row.value);
    const cohort = asInt(row.cohort_size);
    const eff = row.effective_from;
    if (!isNonEmptyString(category)) {
      issues.push({ rowIndex: i, field: 'category', message: 'category required' });
    }
    if (!isNonEmptyString(metric)) {
      issues.push({ rowIndex: i, field: 'metric', message: 'metric required' });
    }
    if (!isFiniteNumber(value)) {
      issues.push({ rowIndex: i, field: 'value', message: 'value must be number' });
    }
    if (cohort === null || cohort <= 0) {
      issues.push({ rowIndex: i, field: 'cohort_size', message: 'cohort_size must be > 0' });
    }
    if (!isIsoDate(eff)) {
      issues.push({ rowIndex: i, field: 'effective_from', message: 'effective_from must be YYYY-MM-DD' });
    }
    const key = `${category}|${metric}|${eff}`;
    if (seen.has(key)) {
      issues.push({ rowIndex: i, field: null, message: 'Duplicate (category, metric, effective_from)' });
    }
    seen.add(key);
  });
  return issues;
}

export function validateDraft(
  table: ReferenceTableName,
  payload: unknown,
): ValidationResult {
  if (!Array.isArray(payload)) {
    return {
      ok: false,
      issues: [{ rowIndex: null, field: null, message: 'Payload must be an array of rows' }],
      rowCount: 0,
    };
  }
  if (payload.length === 0) {
    return {
      ok: false,
      issues: [{ rowIndex: null, field: null, message: 'Payload is empty' }],
      rowCount: 0,
    };
  }
  const rows = payload as RawRow[];
  let issues: ValidationIssue[];
  switch (table) {
    case 'zone_matrix':
      issues = validateZoneMatrix(rows);
      break;
    case 'our_carrier_rates':
      issues = validateCarrierRates(rows, 'our_carrier_rates');
      break;
    case 'carrier_retail_rates':
      issues = validateCarrierRates(rows, 'carrier_retail_rates');
      break;
    case 'our_warehousing_fees':
    case 'our_logistics_fees':
      issues = validateFeeTable(rows);
      break;
    case 'category_benchmarks':
      issues = validateCategoryBenchmarks(rows);
      break;
    default:
      return {
        ok: false,
        issues: [{ rowIndex: null, field: null, message: `Unknown table ${table as string}` }],
        rowCount: rows.length,
      };
  }
  return { ok: issues.length === 0, issues, rowCount: rows.length };
}
