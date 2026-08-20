import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        navigate('/today');
      } else {
        const body = await res.json();
        setError(body.error?.message || 'Invalid username or password');
      }
    } catch {
      setError('Network connection error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 50%, #fdf4ff 100%)',
        padding: 'var(--space-4)',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-modal)',
          padding: 'var(--space-8)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
          animation: 'modal-in 400ms var(--ease-spring)',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
              border: '2px solid var(--clr-brand-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              margin: '0 auto var(--space-4)',
              boxShadow: '0 4px 16px 0 rgb(22 163 74 / 0.2)',
            }}
          >
            
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              color: 'var(--clr-text-primary)',
              letterSpacing: 'var(--tracking-heading)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Wellness CRM
          </h1>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--clr-text-tertiary)',
              fontWeight: 500,
            }}
          >
            Coach Operating System · Login
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--clr-danger-bg)',
              border: '1px solid var(--clr-danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--clr-danger-text)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span></span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label htmlFor="email-input" className="form-label">
              Username or Email
            </label>
            <input
              id="email-input"
              className="form-input"
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password-input" className="form-label">
              Password
            </label>
            <input
              id="password-input"
              className="form-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span
                  className="animate-spin"
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
                Signing in…
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Credential hint */}
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--clr-brand-light)',
              border: '1px solid var(--clr-brand-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--clr-brand-text)',
              fontWeight: 600,
            }}
          >
            Default login: <strong>admin</strong> / <strong>admin</strong>
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--clr-text-tertiary)',
            }}
          >
            Authorized Coach Workspace · Session valid 12 hours
          </p>
        </div>
      </div>
    </div>
  );
}
