import React from 'react';
import { NavLink } from 'react-router-dom';
import { navItems } from './Sidebar';
import { Icons } from '../ui/Icons';

interface MobileNavProps {
  open: boolean;
  coach: { name: string; email: string };
  onClose: () => void;
  onLogout: () => void;
}

export function MobileNav({ open, coach, onClose, onLogout }: MobileNavProps) {
  if (!open) return null;

  const initial = coach.name ? coach.name.charAt(0).toUpperCase() : 'C';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-overlay)' as any,
        display: 'flex',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--clr-overlay)',
          backdropFilter: 'var(--blur-sm)',
          WebkitBackdropFilter: 'var(--blur-sm)',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'relative',
          width: 288,
          maxWidth: '85vw',
          height: '100%',
          background: 'var(--clr-surface-0)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'drawer-in var(--dur-slow) var(--ease-spring)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--clr-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 'var(--font-size-base)',
                color: 'var(--clr-brand)',
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
              }}
            >
              Wellness CRM
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--clr-border)',
              background: 'var(--clr-neutral-bg)',
              color: 'var(--clr-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Icons.Close size={16} />
          </button>
        </div>

        {/* Nav Links */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-3) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                minHeight: 48,
                background: isActive ? 'var(--clr-brand)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--clr-text-secondary)',
                transition: 'all var(--dur-fast) var(--ease-out)',
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Coach Footer */}
        <div
          style={{
            borderTop: '1px solid var(--clr-border)',
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-full)',
                background: 'var(--clr-neutral-bg)',
                border: '1px solid var(--clr-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 'var(--font-size-base)',
                color: 'var(--clr-brand)',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--clr-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                {coach.name}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--clr-text-tertiary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                {coach.email}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--clr-text-secondary)',
              background: 'var(--clr-neutral-bg)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all var(--dur-fast) var(--ease-out)',
            }}
          >
            <Icons.Logout size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
