import { PublicLayout } from '@/components/shell/public-layout';

export default function HomePage() {
  return (
    <PublicLayout currentPath="/">
      <main style={{ padding: '64px 32px', fontFamily: 'system-ui' }}>
        <h1>ShippingCow — homepage port in progress</h1>
        <p>The full homepage is being ported from <code>homepage/shipping cow home page(1).html</code>. The previous launch hero is now at <a href="/launch">/launch</a>.</p>
      </main>
    </PublicLayout>
  );
}
