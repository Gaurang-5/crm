import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icons } from '../ui/Icons';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

const navItems: NavItem[] = [
  { path: '/crm', label: 'Home', icon: <Icons.HomeVisit size={18} />, end: true },
  { path: '/crm/analyses',      label: 'Body Analysis',      icon: <Icons.BodyAnalysis size={18} /> },
  { path: '/crm/homevisit',     label: 'Home Visits',        icon: <Icons.HomeVisit size={18} /> },
  { path: '/crm/meetings', label: 'Zoom Invitations', icon: <Icons.Campaigns size={18} /> },
  { path: '/crm/today',         label: 'Activity',           icon: <Icons.Today size={18} /> },
  { path: '/crm/leads',         label: 'People',             icon: <Icons.Leads size={18} /> },
  { path: '/crm/pipeline',      label: 'Interest Board',     icon: <Icons.Pipeline size={18} /> },
  { path: '/crm/customers',     label: 'Customers',          icon: <Icons.Customers size={18} /> },
  { path: '/crm/followups',     label: 'Follow-ups',         icon: <Icons.FollowUps size={18} /> },
  { path: '/crm/orders',        label: 'Orders & Payments',  icon: <Icons.Orders size={18} /> },
  { path: '/crm/revenue',       label: 'Money',              icon: <Icons.Revenue size={18} /> },
  { path: '/crm/campaigns',     label: 'Group Messages',     icon: <Icons.Campaigns size={18} /> },
  { path: '/crm/reports',       label: 'Reports',            icon: <Icons.Reports size={18} /> },
  { path: '/crm/settings',      label: 'Settings',           icon: <Icons.Settings size={18} /> },
];

interface SidebarProps {
  coach: { name: string; email: string };
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export function Sidebar({ coach, collapsed, onToggleCollapse, onLogout }: SidebarProps) {
  const initial = coach.name ? coach.name.charAt(0).toUpperCase() : 'C';

  return (
    <aside
      className="sidebar-glass"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        flexDirection: 'column',
        height: '100dvh',
        flexShrink: 0,
        transition: 'width 250ms var(--ease-spring)',
        boxShadow: 'var(--shadow-sidebar)',
        position: 'relative',
        zIndex: 'var(--z-sidebar)',
        borderRight: '1px solid var(--clr-border-glass)',
      }}
      style-lg={{ display: 'flex' }}
    >
      <style>{`.sidebar-glass { display: none; }
@media (min-width: 1024px) { .sidebar-glass { display: flex !important; } }`}</style>

      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? 'var(--space-4) var(--space-2)' : 'var(--space-5) var(--space-4)',
          borderBottom: '1px solid var(--clr-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
          gap: 'var(--space-2)',
        }}
      >
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-0-5)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 800,
                  color: 'var(--clr-brand)',
                  letterSpacing: 'var(--tracking-heading)',
                  textTransform: 'uppercase',
                }}
              >
                Wellness CRM
              </span>
            </div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--clr-text-tertiary)',
                letterSpacing: 'var(--tracking-label)',
                fontWeight: 500,
                margin: 0,
              }}
            >
              Coach Operating System
            </p>
          </div>
        )}
        {collapsed && (
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--clr-brand)' }}>W</span>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 26,
            height: 26,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--clr-border)',
            background: 'var(--clr-neutral-bg)',
            color: 'var(--clr-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'all var(--dur-fast) var(--ease-out)',
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation */}
      <nav
        role="navigation"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 'var(--space-3) var(--space-2)',
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
            title={collapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: collapsed
                ? 'var(--space-2) 0'
                : 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all var(--dur-fast) var(--ease-out)',
              background: isActive ? 'var(--clr-brand)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--clr-text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              minHeight: 38,
            })}
            className={({ isActive }) => isActive ? '' : 'nav-link-hover'}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.icon}
            </span>
            {!collapsed && (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Coach Footer */}
      <div
        style={{
          borderTop: '1px solid var(--clr-border)',
          padding: collapsed ? 'var(--space-3) var(--space-2)' : 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-full)',
                background: 'var(--clr-neutral-bg)',
                border: '1px solid var(--clr-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--clr-brand)',
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
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
        )}

        {collapsed && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-full)',
              background: 'var(--clr-neutral-bg)',
              border: '1px solid var(--clr-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 'var(--font-size-sm)',
              color: 'var(--clr-brand)',
              margin: '0 auto',
            }}
          >
            {initial}
          </div>
        )}

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-3)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: 'var(--clr-text-secondary)',
            background: 'transparent',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all var(--dur-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--clr-danger-bg)';
            (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-danger-border)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--clr-text-secondary)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-border)';
          }}
        >
          <Icons.Logout size={14} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>

      {/* Nav hover style injected */}
      <style>{`
        .nav-link-hover:hover {
          background: var(--clr-neutral-bg) !important;
          color: var(--clr-text-primary) !important;
        }
      `}</style>
    </aside>
  );
}

export { navItems };
