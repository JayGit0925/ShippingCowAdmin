import type { Route } from 'next';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import type { FailedPaymentRow } from '@/lib/metrics';

export function FailedQueue({ rows }: { rows: FailedPaymentRow[] }) {
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
            {['ORG', 'TIER', 'AMOUNT', 'REASON', 'TRIES', 'LAST ATTEMPT', 'ACTIONS'].map((h) => (
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
              key={r.org_id}
              style={{
                borderBottom: `1px solid ${BRAND.pageBed}`,
                background: i % 2 ? '#FAFBFF' : BRAND.white,
              }}
            >
              <td style={{ ...cell, fontWeight: 700 }}>{r.org_name}</td>
              <td style={cell}>
                {r.tier ? (
                  <span
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 8,
                      padding: '3px 6px',
                      background: BRAND.charcoal,
                      color: BRAND.yellow,
                      border: `2px solid ${BRAND.charcoal}`,
                      textTransform: 'uppercase',
                    }}
                  >
                    {r.tier}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td style={{ ...cell, color: BRAND.red, fontWeight: 700 }}>
                {r.mrr != null ? `$${r.mrr.toLocaleString()}` : '—'}
              </td>
              <td style={{ ...cell, color: '#6B7280' }}>{r.decline_code ?? '—'}</td>
              <td
                style={{
                  ...cell,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                  color:
                    r.payment_retry_count != null && r.payment_retry_count >= 2
                      ? BRAND.red
                      : BRAND.amber,
                }}
              >
                {r.payment_retry_count ?? '—'}
              </td>
              <td style={{ ...cell, color: '#9CA3AF' }}>
                {new Date(r.updated_at).toISOString().slice(0, 10)}
              </td>
              <td style={{ ...cell, padding: '6px 12px' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <form
                    action={`/api/admin/billing/retry` as Route}
                    method="post"
                    style={{ display: 'inline-flex' }}
                  >
                    <input type="hidden" name="stripeCustomerId" value={r.stripe_customer_id ?? ''} />
                    <input type="hidden" name="orgId" value={r.org_id} />
                    <Button variant="primary" size="sm">
                      Retry
                    </Button>
                  </form>
                  <form
                    action={`/api/admin/billing/extend` as Route}
                    method="post"
                    style={{ display: 'inline-flex' }}
                  >
                    <input type="hidden" name="orgId" value={r.org_id} />
                    <Button variant="ghost" size="sm">
                      Extend
                    </Button>
                  </form>
                  <form
                    action={`/api/admin/billing/suspend` as Route}
                    method="post"
                    style={{ display: 'inline-flex' }}
                  >
                    <input type="hidden" name="orgId" value={r.org_id} />
                    <Button variant="danger" size="sm">
                      Suspend
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ ...cell, padding: 24, textAlign: 'center' }}>
                No failed payments.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

const cell: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: BRAND.charcoal,
  padding: '8px 12px',
};
