import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { findReferenceTable } from '@/lib/reference';
import { BRAND } from '@/lib/brand';

export const dynamic = 'force-dynamic';

type DraftRow = {
  id: string;
  status: 'draft' | 'published' | 'discarded';
  draft_payload: unknown;
  validation_result: { ok?: boolean; rowCount?: number } | null;
  created_at: string;
  created_by: string | null;
};

type ScheduleRow = {
  id: string;
  draft_id: string;
  effective_from: string;
  status: 'pending' | 'published' | 'cancelled';
  scheduled_at: string;
};

function statusColor(status: string): string {
  switch (status) {
    case 'published':
      return BRAND.green;
    case 'discarded':
    case 'cancelled':
      return BRAND.red;
    case 'pending':
      return BRAND.amber;
    case 'draft':
      return BRAND.blue;
    default:
      return BRAND.charcoal;
  }
}

export default async function ReferenceTableHistoryPage({
  params,
}: {
  params: { table: string };
}) {
  const meta = findReferenceTable(params.table);
  if (!meta) notFound();

  let drafts: DraftRow[] = [];
  let schedules: ScheduleRow[] = [];
  let errorMessage: string | null = null;

  if (!SUPABASE_CONFIGURED) {
    errorMessage = 'Supabase not configured.';
  } else {
    try {
      const supabase = adminClient();
      const [draftsRes, schedRes] = await Promise.all([
        supabase
          .from('rate_card_drafts')
          .select('id, status, draft_payload, validation_result, created_at, created_by')
          .eq('table_name', meta.table)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('scheduled_publishes')
          .select('id, draft_id, effective_from, status, scheduled_at')
          .eq('table_name', meta.table)
          .order('scheduled_at', { ascending: false })
          .limit(100),
      ]);
      if (draftsRes.error) errorMessage = draftsRes.error.message;
      else drafts = (draftsRes.data as DraftRow[] | null) ?? [];
      if (!errorMessage && schedRes.error) errorMessage = schedRes.error.message;
      else if (!errorMessage) schedules = (schedRes.data as ScheduleRow[] | null) ?? [];
    } catch (ex) {
      errorMessage = ex instanceof Error ? ex.message : 'Unknown error';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>
          <Link
            href={`/admin/reference/${meta.slug}`}
            style={{ color: BRAND.blue, textDecoration: 'none' }}
          >
            {'« BACK'}
          </Link>
          {' / '}
          {meta.slug.toUpperCase()}
          {' / HISTORY'}
        </Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          {meta.title} — History
        </h1>
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
          <section>
            <Eyebrow>{'// DRAFTS (last 100)'}</Eyebrow>
            <Card style={{ padding: 0, marginTop: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: BRAND.pageBed,
                      borderBottom: `3px solid ${BRAND.charcoal}`,
                    }}
                  >
                    {['CREATED', 'ID', 'STATUS', 'ROWS', 'VALIDATION'].map((h) => (
                      <th
                        key={h}
                        style={{
                          fontFamily: "'Press Start 2P', monospace",
                          fontSize: 9,
                          color: BRAND.blue,
                          letterSpacing: '0.04em',
                          padding: '10px 12px',
                          textAlign: 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((d, i) => {
                    const payloadLength = Array.isArray(d.draft_payload)
                      ? d.draft_payload.length
                      : 0;
                    return (
                      <tr
                        key={d.id}
                        style={{
                          borderBottom: `1px solid ${BRAND.sky}`,
                          background: i % 2 ? '#FAFBFF' : BRAND.white,
                        }}
                      >
                        <td style={cell}>
                          {new Date(d.created_at).toISOString().slice(0, 19).replace('T', ' ')}
                        </td>
                        <td style={cell}>{d.id.slice(0, 8).toUpperCase()}</td>
                        <td
                          style={{
                            ...cell,
                            color: statusColor(d.status),
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: 9,
                          }}
                        >
                          {d.status.toUpperCase()}
                        </td>
                        <td style={cell}>{payloadLength.toLocaleString()}</td>
                        <td style={cell}>
                          {d.validation_result?.ok === true
                            ? 'OK'
                            : d.validation_result?.ok === false
                              ? 'INVALID'
                              : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {drafts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: 24,
                          textAlign: 'center',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14,
                          color: BRAND.charcoal,
                        }}
                      >
                        No drafts yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Card>
          </section>

          <section>
            <Eyebrow>{'// SCHEDULED PUBLISHES'}</Eyebrow>
            <Card style={{ padding: 0, marginTop: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      background: BRAND.pageBed,
                      borderBottom: `3px solid ${BRAND.charcoal}`,
                    }}
                  >
                    {['SCHEDULED', 'EFFECTIVE FROM', 'DRAFT', 'STATUS'].map((h) => (
                      <th
                        key={h}
                        style={{
                          fontFamily: "'Press Start 2P', monospace",
                          fontSize: 9,
                          color: BRAND.blue,
                          letterSpacing: '0.04em',
                          padding: '10px 12px',
                          textAlign: 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, i) => (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: `1px solid ${BRAND.sky}`,
                        background: i % 2 ? '#FAFBFF' : BRAND.white,
                      }}
                    >
                      <td style={cell}>
                        {new Date(s.scheduled_at).toISOString().slice(0, 19).replace('T', ' ')}
                      </td>
                      <td style={cell}>{s.effective_from}</td>
                      <td style={cell}>{s.draft_id.slice(0, 8).toUpperCase()}</td>
                      <td
                        style={{
                          ...cell,
                          color: statusColor(s.status),
                          fontFamily: "'Press Start 2P', monospace",
                          fontSize: 9,
                        }}
                      >
                        {s.status.toUpperCase()}
                      </td>
                    </tr>
                  ))}
                  {schedules.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: 24,
                          textAlign: 'center',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14,
                          color: BRAND.charcoal,
                        }}
                      >
                        No scheduled publishes.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Card>
          </section>

          <section>
            <Eyebrow>{'// MV REFRESH (cross-repo)'}</Eyebrow>
            <Card style={{ padding: 18, marginTop: 6 }}>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: BRAND.charcoal,
                  lineHeight: 1.5,
                }}
              >
                On publish, this admin portal calls the Postgres function{' '}
                <code>refresh_mv_org_cost_summary()</code>. That function lives in the user-portal
                repo&apos;s migrations and refreshes <code>mv_org_cost_summary</code>. If the
                function does not exist (e.g. user portal not migrated yet), publish still
                completes — the MV refresh is reported as skipped in the publish outcome.
              </p>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

const cell: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: BRAND.charcoal,
  padding: '8px 12px',
};
