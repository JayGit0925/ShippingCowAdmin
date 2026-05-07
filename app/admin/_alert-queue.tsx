import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';

type Alert = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  body: string | null;
  created_at: string;
};

const severityColor: Record<string, string> = {
  critical: BRAND.red,
  high: BRAND.amber,
  medium: BRAND.blue,
  low: BRAND.sky,
};

const severityRank: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

export async function AlertQueue() {
  let alerts: Alert[] = [];
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('alerts')
      .select('id, severity, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) {
      alerts = ((data ?? []) as Alert[]).sort(
        (a, b) =>
          (severityRank[a.severity] ?? 5) - (severityRank[b.severity] ?? 5) ||
          b.created_at.localeCompare(a.created_at),
      );
    }
  } catch {
    /* upstream missing */
  }

  return (
    <Card style={{ padding: 0 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {alerts.map((a) => (
          <li
            key={a.id}
            style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${BRAND.sky}`,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
            }}
          >
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: severityColor[a.severity] ?? BRAND.charcoal,
                marginRight: 8,
                letterSpacing: '0.04em',
              }}
            >
              {a.severity.toUpperCase()}
            </span>
            <strong>{a.title}</strong>
            {a.body ? <span style={{ marginLeft: 8, opacity: 0.8 }}>{a.body}</span> : null}
          </li>
        ))}
        {alerts.length === 0 ? (
          <li
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            No active alerts.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
