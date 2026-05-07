import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';

type Session = {
  id: string;
  user_id: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

function haversine(a: Session, b: Session): number {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function SuspiciousSessions() {
  let sessions: Session[] = [];
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id, user_id, ip, country, city, latitude, longitude, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (!error) sessions = (data ?? []) as Session[];
  } catch {
    /* table absent */
  }

  if (sessions.length === 0) {
    return (
      <Card style={{ padding: 18 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: BRAND.charcoal }}>
          No session data (last 7d). The `user_sessions` table is owned by the user portal —
          if absent, this section will populate once user-portal migrations land.
        </p>
      </Card>
    );
  }

  const byUser = new Map<string, Session[]>();
  for (const s of sessions) {
    const arr = byUser.get(s.user_id) ?? [];
    arr.push(s);
    byUser.set(s.user_id, arr);
  }

  const flagged: Array<{ session: Session; reason: string }> = [];
  for (const [, arr] of byUser) {
    arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const seenCountries = new Set<string>();
    for (let i = 0; i < arr.length; i++) {
      const cur = arr[i];
      if (cur.country && !seenCountries.has(cur.country)) {
        if (seenCountries.size > 0) {
          flagged.push({ session: cur, reason: `New country: ${cur.country}` });
        }
        seenCountries.add(cur.country);
      }
      if (i > 0) {
        const prev = arr[i - 1];
        const dtMs = new Date(cur.created_at).getTime() - new Date(prev.created_at).getTime();
        const km = haversine(prev, cur);
        if (km > 1000 && dtMs < 2 * 3600 * 1000) {
          flagged.push({
            session: cur,
            reason: `Impossible travel: ${Math.round(km)}km in ${(dtMs / 60000).toFixed(0)}min`,
          });
        }
      }
    }
  }

  return (
    <Card style={{ padding: 0 }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {flagged.slice(0, 100).map((f, i) => (
          <li
            key={i}
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
                color: BRAND.red,
                marginRight: 8,
                letterSpacing: '0.04em',
              }}
            >
              {new Date(f.session.created_at).toISOString().slice(0, 16)}
            </span>
            <code style={{ fontSize: 11, marginRight: 8 }}>
              {f.session.user_id.slice(0, 8)}
            </code>
            {f.reason}
            {f.session.ip ? ` (IP ${f.session.ip})` : ''}
          </li>
        ))}
        {flagged.length === 0 ? (
          <li
            style={{
              padding: 24,
              textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            No flagged sessions in last 7d.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
