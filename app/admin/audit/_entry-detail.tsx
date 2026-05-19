'use client';
import { useState } from 'react';
import { BRAND } from '@/lib/brand';

export function AuditEntryDetail({
  beforeValue,
  afterValue,
}: {
  beforeValue: unknown;
  afterValue: unknown;
}) {
  const [open, setOpen] = useState(false);
  if (beforeValue == null && afterValue == null) return null;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          padding: '3px 8px',
          border: `2px solid ${BRAND.charcoal}`,
          background: 'transparent',
          cursor: 'pointer',
          letterSpacing: '0.03em',
        }}
      >
        {open ? 'HIDE' : 'DIFF'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            fontFamily: 'monospace',
            fontSize: 11,
          }}
        >
          <pre
            style={{
              background: '#FFF0F0',
              padding: 8,
              border: `1px solid ${BRAND.red}`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {beforeValue != null ? JSON.stringify(beforeValue, null, 2) : '—'}
          </pre>
          <pre
            style={{
              background: '#F0FFF4',
              padding: 8,
              border: `1px solid ${BRAND.green}`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {afterValue != null ? JSON.stringify(afterValue, null, 2) : '—'}
          </pre>
        </div>
      )}
    </div>
  );
}
