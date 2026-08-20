import React from 'react';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'neutral';

const legacyMap: Record<string, BadgeVariant> = {
  ACTIVE:      'success',
  RENEWAL_DUE: 'warning',
  INACTIVE:    'danger',
  COMPLETED:   'info',
  NEW:         'info',
  CONTACTED:   'purple',
  QUALIFIED:   'success',
  LOST:        'neutral',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  /** Auto-detect variant from a status string */
  status?: string;
  className?: string;
}

export function Badge({ children, variant, status, className = '' }: BadgeProps) {
  const resolvedVariant: BadgeVariant =
    variant ?? (status ? (legacyMap[status] ?? 'neutral') : 'neutral');

  return (
    <span className={`badge badge-${resolvedVariant} ${className}`}>
      {children}
    </span>
  );
}
