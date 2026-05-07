import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';

type Tile = { label: string; value: string; tone: 'ok' | 'warn' | 'err' | 'na' };

async function tile(label: string, fn: () => Promise<Tile>): Promise<Tile> {
  try {
    return await fn();
  } catch {
    return { label, value: 'n/a', tone: 'na' };
  }
}

export async function HealthTiles() {
  const supabase = adminClient();

  const tiles: Tile[] = await Promise.all([
    tile('MOOOVY API', async () => {
      const { data } = await supabase
        .from('api_health_snapshots')
        .select('latency_p95_ms, error_rate')
        .order('captured_at', { ascending: false })
        .limit(1);
      const row = data?.[0] as { latency_p95_ms?: number; error_rate?: number } | undefined;
      if (!row) return { label: 'MOOOVY API', value: 'n/a', tone: 'na' };
      const tone =
        (row.error_rate ?? 0) > 0.05 ? 'err' : (row.latency_p95_ms ?? 0) > 1500 ? 'warn' : 'ok';
      return {
        label: 'MOOOVY API',
        value: `${row.latency_p95_ms ?? 0}ms p95 · ${((row.error_rate ?? 0) * 100).toFixed(1)}% err`,
        tone,
      };
    }),
    tile('AI SPEND TODAY', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('ai_usage_events')
        .select('cost_usd')
        .gte('event_date', today);
      const sum = ((data ?? []) as Array<{ cost_usd: number | null }>).reduce(
        (a, r) => a + (Number(r.cost_usd) || 0),
        0,
      );
      return { label: 'AI SPEND TODAY', value: `$${sum.toFixed(2)}`, tone: 'ok' };
    }),
    tile('EDGE FN ERRORS', async () => {
      const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('edge_fn_error_log')
        .select('*', { count: 'exact', head: true })
        .gte('occurred_at', cutoff);
      return {
        label: 'EDGE FN ERRORS',
        value: `${count ?? 0} / 60min`,
        tone: (count ?? 0) > 10 ? 'warn' : 'ok',
      };
    }),
    tile('STRIPE WEBHOOKS', async () => {
      const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count: total } = await supabase
        .from('stripe_webhook_log')
        .select('*', { count: 'exact', head: true })
        .gte('received_at', cutoff);
      const { count: failed } = await supabase
        .from('stripe_webhook_log')
        .select('*', { count: 'exact', head: true })
        .gte('received_at', cutoff)
        .eq('status', 'failed');
      return {
        label: 'STRIPE WEBHOOKS',
        value: `${(total ?? 0) - (failed ?? 0)}/${total ?? 0} ok`,
        tone: (failed ?? 0) > 0 ? 'warn' : 'ok',
      };
    }),
  ]);

  const tone = (t: Tile['tone']): string =>
    t === 'ok' ? BRAND.green : t === 'warn' ? BRAND.amber : t === 'err' ? BRAND.red : BRAND.charcoal;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
      }}
    >
      {tiles.map((t) => (
        <Card key={t.label} style={{ padding: 14 }}>
          <div
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: BRAND.blue,
              letterSpacing: '0.04em',
              marginBottom: 6,
            }}
          >
            {t.label}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: tone(t.tone),
            }}
          >
            {t.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
