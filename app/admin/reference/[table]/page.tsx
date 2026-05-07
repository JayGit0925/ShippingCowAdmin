import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { DataTable, type Column } from '@/components/ui/data-table';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { findReferenceTable } from '@/lib/reference';
import { BRAND } from '@/lib/brand';
import { ReferenceEditor } from './_editor';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 200;

type DraftRow = {
  id: string;
  draft_payload: unknown;
  created_at: string;
};

export default async function ReferenceTablePage({
  params,
}: {
  params: { table: string };
}) {
  const meta = findReferenceTable(params.table);
  if (!meta) notFound();

  let publishedRows: Record<string, unknown>[] = [];
  let total = 0;
  let openDraft: DraftRow | null = null;
  let errorMessage: string | null = null;

  if (!SUPABASE_CONFIGURED) {
    errorMessage = 'Supabase not configured.';
  } else {
    try {
      const supabase = adminClient();
      const [countRes, dataRes, draftRes] = await Promise.all([
        supabase.from(meta.table).select('*', { count: 'exact', head: true }),
        supabase
          .from(meta.table)
          .select('*')
          .is('effective_to', null)
          .limit(PAGE_SIZE),
        supabase
          .from('rate_card_drafts')
          .select('id, draft_payload, created_at')
          .eq('table_name', meta.table)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);
      total = countRes.count ?? 0;
      publishedRows = (dataRes.data as Record<string, unknown>[] | null) ?? [];
      const drafts = (draftRes.data as DraftRow[] | null) ?? [];
      openDraft = drafts[0] ?? null;
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

  const editorInitialRows: Record<string, unknown>[] =
    openDraft && Array.isArray(openDraft.draft_payload)
      ? (openDraft.draft_payload as Record<string, unknown>[])
      : publishedRows;

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
          {' / '}
          <Link
            href={`/admin/reference/${meta.slug}/history` as Route}
            style={{ color: BRAND.blue, textDecoration: 'none' }}
          >
            HISTORY
          </Link>
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
          <div>
            <Eyebrow>{'// CURRENTLY PUBLISHED'}</Eyebrow>
            <p
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 9,
                color: BRAND.charcoal,
                marginBottom: 8,
              }}
            >
              {`Showing ${publishedRows.length.toLocaleString()} live of ${total.toLocaleString()} total (incl. superseded). Effective today.`}
            </p>
            <DataTable rows={publishedRows} columns={columns} pageSize={50} />
          </div>

          <div>
            <Eyebrow>
              {openDraft
                ? `// EDIT DRAFT ${openDraft.id.slice(0, 8).toUpperCase()}`
                : '// EDIT (NEW DRAFT)'}
            </Eyebrow>
            <ReferenceEditor
              slug={meta.slug}
              columns={meta.columns}
              initialRows={editorInitialRows}
              initialDraftId={openDraft?.id ?? null}
            />
          </div>
        </>
      )}
    </div>
  );
}
