export type ReferenceTableSlug =
  | 'zone-matrix'
  | 'our-carrier-rates'
  | 'carrier-retail-rates'
  | 'our-warehousing-fees'
  | 'our-logistics-fees'
  | 'category-benchmarks';

export type ReferenceTableName =
  | 'zone_matrix'
  | 'our_carrier_rates'
  | 'carrier_retail_rates'
  | 'our_warehousing_fees'
  | 'our_logistics_fees'
  | 'category_benchmarks';

export type ReferenceTableMeta = {
  slug: ReferenceTableSlug;
  table: ReferenceTableName;
  title: string;
  description: string;
  columns: { key: string; label: string }[];
};

export const REFERENCE_TABLES: ReferenceTableMeta[] = [
  {
    slug: 'zone-matrix',
    table: 'zone_matrix',
    title: 'Zone Matrix',
    description: 'Origin/destination zone lookup — ~42k rows.',
    columns: [
      { key: 'origin_zip_prefix', label: 'ORIGIN' },
      { key: 'dest_zip_prefix', label: 'DEST' },
      { key: 'zone', label: 'ZONE' },
      { key: 'effective_from', label: 'FROM' },
      { key: 'effective_to', label: 'TO' },
    ],
  },
  {
    slug: 'our-carrier-rates',
    table: 'our_carrier_rates',
    title: 'Our Carrier Rates',
    description: 'Negotiated rates by carrier/service/zone/weight band.',
    columns: [
      { key: 'carrier', label: 'CARRIER' },
      { key: 'service', label: 'SERVICE' },
      { key: 'zone', label: 'ZONE' },
      { key: 'weight_lb_min', label: 'WT MIN' },
      { key: 'weight_lb_max', label: 'WT MAX' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'carrier-retail-rates',
    table: 'carrier_retail_rates',
    title: 'Carrier Retail Rates',
    description: 'Public retail rates as benchmark.',
    columns: [
      { key: 'carrier', label: 'CARRIER' },
      { key: 'service', label: 'SERVICE' },
      { key: 'zone', label: 'ZONE' },
      { key: 'weight_lb_min', label: 'WT MIN' },
      { key: 'weight_lb_max', label: 'WT MAX' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'our-warehousing-fees',
    table: 'our_warehousing_fees',
    title: 'Warehousing Fees',
    description: 'Receiving, putaway, storage per cuft.',
    columns: [
      { key: 'fee_type', label: 'FEE' },
      { key: 'unit', label: 'UNIT' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'our-logistics-fees',
    table: 'our_logistics_fees',
    title: 'Logistics Fees',
    description: 'Returns, refurb, disposal, special handling.',
    columns: [
      { key: 'fee_type', label: 'FEE' },
      { key: 'unit', label: 'UNIT' },
      { key: 'rate_usd', label: 'RATE USD' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
  {
    slug: 'category-benchmarks',
    table: 'category_benchmarks',
    title: 'Category Benchmarks',
    description: 'Bull-tier peer cohort comparison.',
    columns: [
      { key: 'category', label: 'CATEGORY' },
      { key: 'metric', label: 'METRIC' },
      { key: 'value', label: 'VALUE' },
      { key: 'cohort_size', label: 'N' },
      { key: 'effective_from', label: 'FROM' },
    ],
  },
];

export function findReferenceTable(slug: string): ReferenceTableMeta | undefined {
  return REFERENCE_TABLES.find((t) => t.slug === slug);
}
