'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND, FONT, px } from '@/lib/brand';

export function AddReplyForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [tone, setTone] = useState<'positive' | 'neutral' | 'negative'>('positive');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dm-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_name: name, prospect_store: store, reply_tone: tone, notes }),
      });
      if (!res.ok) throw new Error('failed');
      setName('');
      setStore('');
      setNotes('');
      router.refresh();
    } catch {
      setError('Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: 14,
    padding: '8px 12px',
    border: `2px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    borderRadius: 0,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <input
          placeholder="Prospect name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          placeholder="Store / handle"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as 'positive' | 'neutral' | 'negative')}
          style={inputStyle}
        >
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={inputStyle}
        />
      </div>
      {error && (
        <p style={{ fontFamily: FONT.body, fontSize: 12, color: BRAND.red, margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        style={{
          fontFamily: FONT.display,
          fontSize: 14,
          padding: '10px 20px',
          background: loading ? BRAND.sky : BRAND.blue,
          color: BRAND.white,
          border: `2px solid ${BRAND.charcoal}`,
          boxShadow: loading ? 'none' : px(BRAND.charcoal),
          cursor: loading ? 'default' : 'pointer',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          width: 'fit-content',
        }}
      >
        {loading ? 'Saving...' : '+ Log reply'}
      </button>
    </form>
  );
}
