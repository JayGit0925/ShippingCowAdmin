import Link from 'next/link';
import type { Route } from 'next';
import { BRAND } from '@/lib/brand';
import type { OrgRow } from '@/lib/customers';

const cell: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: BRAND.charcoal,
  padding: '8px 12px',
};

const tierColor: Record<string, string> = {
  calf: BRAND.sky,
  cow: BRAND.midBlue,
  bull: BRAND.amber,
};

const statusColor: Record<string, string> = {
  active: BRAND.green,
  suspended: BRAND.amber,
  deactivated: BRAND.red,
  payment_failed: BRAND.red,
};

export function CustomerList({ rows }: { rows: OrgRow[] }) {
  return (
    <div
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
        overflow: 'auto',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: BRAND.pageBed, borderBottom: `3px solid ${BRAND.charcoal}` }}>
            {['ORG', 'TIER', 'MRR', 'MEMBERS', 'SHIP 30D', 'STATUS', 'ZIP'].map((h) => (
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
                <Link
                  href={`/admin/customers/${r.id}` as Route}
                  style={{ color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}
                >
                  {r.name}
                </Link>
              </td>
              <td style={cell}>
                {r.tier ? (
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 9,
                      color: BRAND.charcoal,
                      background: tierColor[r.tier] ?? BRAND.sky,
                      padding: '2px 8px',
                      border: `2px solid ${BRAND.charcoal}`,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {r.tier.toUpperCase()}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td style={cell}>{r.mrr != null ? `$${r.mrr.toLocaleString()}` : '—'}</td>
              <td style={cell}>{r.members}</td>
              <td style={cell}>{r.shipments_30d}</td>
              <td
                style={{
                  ...cell,
                  color: r.status ? statusColor[r.status] ?? BRAND.charcoal : BRAND.charcoal,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                }}
              >
                {(r.status ?? '—').toUpperCase()}
              </td>
              <td style={cell}>{r.origin_zip ?? '—'}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{
                  ...cell,
                  textAlign: 'center',
                  padding: 24,
                }}
              >
                No orgs match these filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
