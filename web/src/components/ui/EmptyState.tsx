import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>{icon}</div>}
      <p className="empty-state__title" style={{ fontWeight: 600 }}>{title}</p>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div style={{ marginTop: 'var(--space-3)' }}>{action}</div>}
    </div>
  );
}
