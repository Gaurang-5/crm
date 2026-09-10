import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { Brand } from './Brand';
import './crm-shell.css';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../hooks/useToast';

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
      .catch(() => navigate('/crm/login'));
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    navigate('/crm/login');
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
        <header className="crm-topbar">
          <div className="crm-mobile-brand"><Brand /></div>
          <div className="crm-workspace-label">Your wellness workspace</div>
          <a className="crm-website-link" href="/" target="_blank" rel="noreferrer">View website ↗</a>
          <span className="crm-avatar" aria-label={coach.name}>{coach.name?.charAt(0)?.toUpperCase() || 'C'}</span>
        </header>

        {/* Mobile Navigation Drawer */}
        <MobileNav
          open={mobileMenuOpen}
          coach={coach}
          onClose={() => setMobileMenuOpen(false)}
          onOpen={() => setMobileMenuOpen(true)}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        <main className="page-main">
          <div className={`page-section${location.pathname === "/crm/pipeline" || location.pathname === "/crm/meetings" ? " page-section-wide" : ""}`}>
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
