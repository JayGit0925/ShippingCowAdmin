import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';

export default function Page() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// PHASE A SCAFFOLD'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Audit Log
        </h1>
      </div>
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          Append-only audit log UI wired in Phase E. See handoff §5.6.
        </p>
      </Card>
    </div>
  );
}
