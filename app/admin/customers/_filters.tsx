'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';

export function CustomerFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [tier, setTier] = useState(sp.get('tier') ?? '');
  const [status, setStatus] = useState(sp.get('status') ?? '');
  const [churn, setChurn] = useState(sp.get('churn') === '1');

  function apply(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tier) params.set('tier', tier);
    if (status) params.set('status', status);
    if (churn) params.set('churn', '1');
    router.push(`/admin/customers?${params.toString()}`);
  }

  const inputStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    padding: '6px 10px',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    color: BRAND.charcoal,
    outline: 'none',
    borderRadius: 0,
  };

  return (
    <form
      onSubmit={apply}
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
    >
      <input
        placeholder="Search org name…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ ...inputStyle, minWidth: 220, flex: 1 }}
      />
      <select value={tier} onChange={(e) => setTier(e.target.value)} style={inputStyle}>
        <option value="">All tiers</option>
        <option value="calf">Calf</option>
        <option value="cow">Cow</option>
        <option value="bull">Bull</option>
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={inputStyle}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="deactivated">Deactivated</option>
        <option value="payment_failed">Payment failed</option>
      </select>
      <label
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: BRAND.charcoal,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <input type="checkbox" checked={churn} onChange={(e) => setChurn(e.target.checked)} />
        CHURN RISK
      </label>
      <Button variant="blue" size="sm">
        Apply
      </Button>
    </form>
  );
}
