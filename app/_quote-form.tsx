'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { BRAND, px, FONT } from '@/lib/brand';

type Status = 'idle' | 'loading' | 'done' | 'error';

interface FormState {
  name: string;
  company: string;
  email: string;
  item_type: string;
  weight_lbs: string;
  origin_zip: string;
}

const inputStyle: CSSProperties = {
  fontFamily: FONT.body,
  fontSize: 14,
  padding: '10px 14px',
  border: `3px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  borderRadius: 0,
};

const labelStyle: CSSProperties = {
  fontFamily: FONT.pixel,
  fontSize: 7,
  opacity: 0.5,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
  display: 'block',
};

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState<FormState>({
    name: '',
    company: '',
    email: '',
    item_type: '',
    weight_lbs: '',
    origin_zip: '',
  });

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    const payload: {
      name: string;
      company?: string;
      email: string;
      item_type?: string;
      weight_lbs?: number;
      origin_zip?: string;
    } = {
      name: form.name,
      email: form.email,
    };

    if (form.company.trim()) payload.company = form.company.trim();
    if (form.item_type.trim()) payload.item_type = form.item_type.trim();
    if (form.weight_lbs.trim()) {
      const parsed = parseInt(form.weight_lbs, 10);
      if (!isNaN(parsed)) payload.weight_lbs = parsed;
    }
    if (form.origin_zip.trim()) payload.origin_zip = form.origin_zip.trim();

    try {
      const res = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div
        style={{
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: px(BRAND.green),
          background: BRAND.white,
          padding: 32,
          maxWidth: 640,
        }}
      >
        <h3
          style={{
            fontFamily: FONT.display,
            fontSize: 22,
            textTransform: 'uppercase',
            color: BRAND.charcoal,
            margin: '0 0 12px',
          }}
        >
          Request sent.
        </h3>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 14,
            opacity: 0.6,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          We&apos;ll email your rate within 24 hours. Check your inbox.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: px(),
        padding: 32,
        background: BRAND.white,
        maxWidth: 640,
      }}
    >
      {/* Row 1: Name + Company */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            style={inputStyle}
            type="text"
            required
            value={form.name}
            onChange={handleChange('name')}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label style={labelStyle}>Company</label>
          <input
            style={inputStyle}
            type="text"
            value={form.company}
            onChange={handleChange('company')}
            placeholder="Acme Co."
          />
        </div>
      </div>

      {/* Row 2: Email */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Email *</label>
        <input
          style={inputStyle}
          type="email"
          required
          value={form.email}
          onChange={handleChange('email')}
          placeholder="jane@acme.com"
        />
      </div>

      {/* Row 3: Item type + Weight + Zip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={labelStyle}>Item type</label>
          <input
            style={inputStyle}
            type="text"
            value={form.item_type}
            onChange={handleChange('item_type')}
            placeholder="Sofa, dresser…"
          />
        </div>
        <div>
          <label style={labelStyle}>Typical weight (lbs)</label>
          <input
            style={inputStyle}
            type="number"
            min={10}
            max={500}
            value={form.weight_lbs}
            onChange={handleChange('weight_lbs')}
            placeholder="40"
          />
        </div>
        <div>
          <label style={labelStyle}>Origin zip</label>
          <input
            style={inputStyle}
            type="text"
            value={form.origin_zip}
            onChange={handleChange('origin_zip')}
            placeholder="10001"
          />
        </div>
      </div>

      {/* Row 4: Error message */}
      {status === 'error' && (
        <p
          style={{
            color: BRAND.red,
            fontSize: 12,
            fontFamily: FONT.body,
            marginBottom: 16,
            margin: '0 0 16px',
          }}
        >
          Something went wrong — email us at hello@shippingcow.ai
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          fontFamily: FONT.pixel,
          fontSize: 10,
          textTransform: 'uppercase',
          color: BRAND.charcoal,
          background: status === 'loading' ? BRAND.charcoal : BRAND.yellow,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: status === 'loading' ? 'none' : px(),
          padding: '14px 28px',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          display: 'inline-block',
          borderRadius: 0,
          lineHeight: 1.4,
        }}
      >
        {status === 'loading' ? 'Sending…' : 'Get My Rate →'}
      </button>
    </form>
  );
}
