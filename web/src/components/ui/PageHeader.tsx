import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action, back }: PageHeaderProps) {
  return (
    <div className="page-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}
    >
      {back && (
        <div style={{ marginBottom: 'var(--space-1)' }}>{back}</div>
      )}
      <div className="page-header-row"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 className="text-heading" style={{ marginBottom: subtitle ? 'var(--space-1)' : 0 }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--clr-text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
