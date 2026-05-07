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
  if (!beforeValue && !afterValue) return null;
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: BRAND.blue,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {open ? '▼ HIDE DIFF' : '▶ SHOW DIFF'}
      </button>
      {open ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 6,
          }}
        >
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              background: BRAND.pageBed,
              border: `2px solid ${BRAND.charcoal}`,
              padding: 8,
              maxHeight: 200,
              overflow: 'auto',
              margin: 0,
            }}
          >
            {JSON.stringify(beforeValue ?? {}, null, 2)}
          </pre>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              background: BRAND.pageBed,
              border: `2px solid ${BRAND.charcoal}`,
              padding: 8,
              maxHeight: 200,
              overflow: 'auto',
              margin: 0,
            }}
          >
            {JSON.stringify(afterValue ?? {}, null, 2)}
          </pre>
        </div>
      ) : null}
    </>
  );
}
