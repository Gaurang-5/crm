import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message = 'Loading...', fullPage = false }: LoadingSpinnerProps) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: fullPage ? 'var(--space-16)' : 'var(--space-8)',
      }}
    >
      {/* Spinner ring */}
      <div
        className="animate-spin"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid var(--clr-border)',
          borderTopColor: 'var(--clr-brand)',
        }}
      />
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--clr-text-secondary)',
          fontWeight: 500,
        }}
      >
        {message}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

/** Row-level skeleton for tables */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div
            className="skeleton"
            style={{ height: 14, borderRadius: 'var(--radius-sm)', width: i === 0 ? '70%' : '50%' }}
          />
        </td>
      ))}
    </tr>
  );
}
