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
          Customers
        </h1>
      </div>
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          Org list + drawer wired in Phase C. See handoff §5.2.
        </p>
      </Card>
    </div>
  );
}
