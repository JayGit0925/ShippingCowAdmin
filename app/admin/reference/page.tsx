import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { REFERENCE_TABLES, type ReferenceTableMeta } from '@/lib/reference';
import { BRAND } from '@/lib/brand';

export const dynamic = 'force-dynamic';

type RowStat = {
  count: number;
  lastUpdated: string | null;
  draftCount: number;
  error: string | null;
};

async function fetchStats(meta: ReferenceTableMeta): Promise<RowStat> {
  try {
    const supabase = adminClient();
    const [countRes, latestRes, draftsRes] = await Promise.all([
      supabase.from(meta.table).select('*', { count: 'exact', head: true }),
      supabase
        .from(meta.table)
        .select('effective_from')
        .order('effective_from', { ascending: false })
        .limit(1),
      supabase
        .from('rate_card_drafts')
        .select('*', { count: 'exact', head: true })
        .eq('table_name', meta.table)
        .eq('status', 'draft'),
    ]);
    if (countRes.error) {
      return {
        count: 0,
        lastUpdated: null,
        draftCount: 0,
        error: countRes.error.message,
      };
    }
    const latestRow = latestRes.data?.[0] as
      | { effective_from?: string }
      | undefined;
    return {
      count: countRes.count ?? 0,
      lastUpdated: latestRow?.effective_from ?? null,
      draftCount: draftsRes.count ?? 0,
      error: null,
    };
  } catch (ex) {
    return {
      count: 0,
      lastUpdated: null,
      draftCount: 0,
      error: ex instanceof Error ? ex.message : 'Unknown error',
    };
  }
}

export default async function ReferencePage() {
  if (!SUPABASE_CONFIGURED) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Eyebrow>{'// REFERENCE DATA'}</Eyebrow>
          <h1
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 32,
              color: BRAND.charcoal,
              textTransform: 'uppercase',
            }}
          >
            Rate Cards
          </h1>
        </div>
        <Card style={{ padding: 24 }}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            Supabase not configured. Set env vars to view live data. See{' '}
            <code>.env.example</code>.
          </p>
        </Card>
      </div>
    );
  }

  const stats = await Promise.all(REFERENCE_TABLES.map(fetchStats));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// REFERENCE DATA'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Rate Cards
        </h1>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {REFERENCE_TABLES.map((meta, i) => {
          const s = stats[i];
          return (
            <Link
              key={meta.slug}
              href={`/admin/reference/${meta.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <Card interactive style={{ padding: 18 }}>
                <Eyebrow style={{ marginBottom: 4 }}>
                  {meta.slug.toUpperCase()}
                </Eyebrow>
                <h2
                  style={{
                    fontFamily: "'Black Han Sans', sans-serif",
                    fontSize: 18,
                    color: BRAND.charcoal,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {meta.title}
                </h2>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: BRAND.charcoal,
                    marginBottom: 12,
                    minHeight: 32,
                  }}
                >
                  {meta.description}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 14,
                      color: s.error ? BRAND.red : BRAND.blue,
                    }}
                  >
                    {s.error ? 'ERR' : s.count.toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      color: BRAND.charcoal,
                      letterSpacing: '0.03em',
                    }}
                  >
                    {s.error
                      ? 'NOT APPLIED'
                      : s.lastUpdated
                        ? `EFF ${s.lastUpdated}`
                        : 'NO DATA'}
                  </span>
                </div>
                {s.draftCount > 0 ? (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '4px 8px',
                      background: BRAND.yellow,
                      border: `2px solid ${BRAND.charcoal}`,
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      color: BRAND.charcoal,
                      letterSpacing: '0.04em',
                      display: 'inline-block',
                    }}
                  >
                    {s.draftCount} DRAFT{s.draftCount === 1 ? '' : 'S'} OPEN
                  </div>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
