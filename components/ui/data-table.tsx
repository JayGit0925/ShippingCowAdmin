'use client';
import { useMemo, useState } from 'react';
import { BRAND } from '@/lib/brand';

export type Column<T> = {
  key: keyof T & string;
  label: string;
  format?: (value: T[keyof T], row: T) => string;
  width?: number;
};

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  pageSize = 50,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = useMemo(
    () => rows.slice(page * pageSize, page * pageSize + pageSize),
    [rows, page, pageSize],
  );

  return (
    <div
      style={{
        background: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: BRAND.pageBed,
                borderBottom: `3px solid ${BRAND.charcoal}`,
              }}
            >
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 9,
                    color: BRAND.blue,
                    letterSpacing: '0.04em',
                    padding: '10px 12px',
                    textAlign: 'left',
                    width: c.width,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: `1px solid ${BRAND.sky}`,
                  background: i % 2 ? '#FAFBFF' : BRAND.white,
                }}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: BRAND.charcoal,
                      padding: '8px 12px',
                    }}
                  >
                    {c.format
                      ? c.format(row[c.key], row)
                      : String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: BRAND.charcoal,
                  }}
                >
                  No rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderTop: `3px solid ${BRAND.charcoal}`,
          background: BRAND.pageBed,
        }}
      >
        <span
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: BRAND.charcoal,
            letterSpacing: '0.03em',
          }}
        >
          PAGE {page + 1} / {totalPages} · {rows.length} ROWS
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: '6px 10px',
              border: `2px solid ${BRAND.charcoal}`,
              background: page === 0 ? '#e5e7eb' : BRAND.yellow,
              color: BRAND.charcoal,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              borderRadius: 0,
            }}
          >
            « PREV
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: '6px 10px',
              border: `2px solid ${BRAND.charcoal}`,
              background: page >= totalPages - 1 ? '#e5e7eb' : BRAND.yellow,
              color: BRAND.charcoal,
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              borderRadius: 0,
            }}
          >
            NEXT »
          </button>
        </div>
      </div>
    </div>
  );
}
