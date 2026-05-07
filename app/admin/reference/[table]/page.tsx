import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { DataTable, type Column } from '@/components/ui/data-table';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { findReferenceTable } from '@/lib/reference';
import { BRAND } from '@/lib/brand';

const PAGE_SIZE = 200;

export default async function ReferenceTablePage({
  params,
}: {
  params: { table: string };
}) {
  const meta = findReferenceTable(params.table);
  if (!meta) notFound();

  let rows: Record<string, unknown>[] = [];
  let total = 0;
  let errorMessage: string | null = null;

  if (!SUPABASE_CONFIGURED) {
    errorMessage = 'Supabase not configured.';
  } else {
    try {
      const supabase = adminClient();
      const [countRes, dataRes] = await Promise.all([
        supabase.from(meta.table).select('*', { count: 'exact', head: true }),
        supabase.from(meta.table).select('*').limit(PAGE_SIZE),
      ]);
      total = countRes.count ?? 0;
      rows = (dataRes.data as Record<string, unknown>[] | null) ?? [];
      if (countRes.error) errorMessage = countRes.error.message;
      else if (dataRes.error) errorMessage = dataRes.error.message;
    } catch (ex) {
      errorMessage = ex instanceof Error ? ex.message : 'Unknown error';
    }
  }

  const columns: Column<Record<string, unknown>>[] = meta.columns.map((c) => ({
    key: c.key,
    label: c.label,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>
          <Link
            href="/admin/reference"
            style={{ color: BRAND.blue, textDecoration: 'none' }}
          >
            {'« BACK'}
          </Link>
          {' / '}
          {meta.slug.toUpperCase()}
        </Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          {meta.title}
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: BRAND.charcoal,
            marginTop: 6,
          }}
        >
          {meta.description}
        </p>
      </div>
      {errorMessage ? (
        <Card
          style={{
            padding: 24,
            border: `3px solid ${BRAND.red}`,
            boxShadow: `4px 4px 0 ${BRAND.red}`,
          }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.red,
            }}
          >
            {errorMessage}
          </p>
        </Card>
      ) : (
        <>
          <p
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: BRAND.charcoal,
            }}
          >
            {`Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()} rows. Editing arrives in Phase B.2.`}
          </p>
          <DataTable rows={rows} columns={columns} pageSize={50} />
        </>
      )}
    </div>
  );
}
