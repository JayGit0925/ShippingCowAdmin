import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { fetchAudit } from '@/lib/audit-search';
import { AuditFilters } from './_filters';
import { AuditEntryDetail } from './_entry-detail';

export const dynamic = 'force-dynamic';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const single = (k: string) =>
    typeof searchParams[k] === 'string' ? (searchParams[k] as string) : undefined;
  const page = parseInt(single('page') ?? '0', 10) || 0;
  const { rows, total, pageSize } = await fetchAudit({
    action: single('action'),
    actorId: single('actorId'),
    orgId: single('orgId'),
    resourceType: single('resourceType'),
    from: single('from'),
    to: single('to'),
    page,
    pageSize: 100,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Eyebrow>{'// AUDIT LOG'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Audit
        </h1>
      </div>
      <AuditFilters />
      <p
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: BRAND.charcoal,
        }}
      >
        {`Showing ${rows.length} of ${total.toLocaleString()} entries (page ${page + 1}, ${pageSize}/page).`}
        {' · '}
        <a
          href={`/api/admin/audit/export?${new URLSearchParams(
            Object.fromEntries(
              Object.entries(searchParams)
                .filter(([, v]) => typeof v === 'string')
                .map(([k, v]) => [k, v as string]),
            ),
          ).toString()}`}
          style={{ color: BRAND.blue }}
        >
          EXPORT CSV
        </a>
      </p>
      <div
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: BRAND.pageBed, borderBottom: `3px solid ${BRAND.charcoal}` }}>
              {['WHEN', 'ACTION', 'ACTOR', 'ORG', 'RESOURCE', 'REASON', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.blue,
                    padding: '10px 12px',
                    textAlign: 'left',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: `1px solid ${BRAND.sky}`,
                  background: i % 2 ? '#FAFBFF' : BRAND.white,
                }}
              >
                <td style={cell}>
                  {new Date(r.occurred_at).toISOString().slice(0, 19).replace('T', ' ')}
                </td>
                <td style={cell}>
                  <strong>{r.action}</strong>
                </td>
                <td style={cell}>
                  {r.actor_user_id ? (
                    <code style={{ fontSize: 11 }}>{r.actor_user_id.slice(0, 8)}</code>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={cell}>
                  {r.org_id ? <code style={{ fontSize: 11 }}>{r.org_id.slice(0, 8)}</code> : '—'}
                </td>
                <td style={cell}>{r.resource_type ?? '—'}</td>
                <td style={cell}>{r.reason ?? '—'}</td>
                <td style={cell}>
                  <AuditEntryDetail beforeValue={r.before_value} afterValue={r.after_value} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...cell, padding: 24, textAlign: 'center' }}>
                  No entries.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cell: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: BRAND.charcoal,
  padding: '8px 12px',
};
