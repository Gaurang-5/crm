import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../hooks/useToast';
import { Icons } from '../ui/Icons';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [coach, setCoach] = useState<{ name: string; email: string }>({
    name: 'Wellness Coach',
    email: 'coach@example.com',
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, dismiss } = useToast();

  useEffect(() => {
    api.getSession()
      .then((data) => { if (data.coach) setCoach(data.coach); })
      .catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    navigate('/login');
  };

  return (
    <div className="page-root">
      {/* Desktop Sidebar */}
      <Sidebar
        coach={coach}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={handleLogout}
      />

      {/* Main area */}
      <div className="page-content">
        {/* Mobile Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'var(--blur-md)',
            WebkitBackdropFilter: 'var(--blur-md)',
            borderBottom: '1px solid var(--clr-border)',
            zIndex: 'var(--z-header)' as any,
            position: 'relative',
          }}
          className="mobile-header"
        >
          <style>{`
            .mobile-header { display: flex; }
            @media (min-width: 1024px) { .mobile-header { display: none !important; } }
          `}</style>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--clr-border)',
                background: 'var(--clr-neutral-bg)',
                color: 'var(--clr-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icons.Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 800,
                  color: 'var(--clr-brand)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-heading)',
                }}
              >
                Wellness CRM
              </span>
            </div>
          </div>

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
            }}
          >
            {coach.name?.charAt(0)?.toUpperCase() ?? 'C'}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          open={mobileMenuOpen}
          coach={coach}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="page-main">
          <div className="page-section">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t: Toast) => (
            <div
              key={t.id}
              className={`toast toast--${t.variant}`}
              onClick={() => dismiss(t.id)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <span style={{ flex: 1, fontWeight: 500 }}>{t.message}</span>
              <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
