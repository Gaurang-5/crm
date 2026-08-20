import React from 'react';

type StatVariant = 'default' | 'danger' | 'warning' | 'success' | 'info' | 'purple' | 'primary';

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  variant?: StatVariant;
  subtitle?: string;
  sub?: string;
}

export function StatCard({ icon, label, value, variant = 'default', subtitle, sub }: StatCardProps) {
  const modifier = variant !== 'default' ? ` stat-card--${variant}` : '';
  const subText = subtitle || sub;

  return (
    <div className={`stat-card${modifier}`}>
      {icon && <div className="stat-icon" style={{ display: 'flex', alignItems: 'center' }}>{icon}</div>}
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {subText && <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)' }}>{subText}</span>}
    </div>
  );
}
