import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface Person {
  id: string;
  name: string;
  phone: string;
  type: 'lead' | 'customer';
  address?: string;
}

interface Props {
  onSelect: (person: Person) => void;
  placeholder?: string;
}

export function CustomerSearch({ onSelect, placeholder = 'Search by name or phone...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/people?q=${encodeURIComponent(query)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch (_) {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (p: Person) => {
    onSelect(p);
    setQuery('');
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--clr-text-tertiary)', display: 'flex', alignItems: 'center', pointerEvents: 'none',
        }}>
          <Icons.Search size={15} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="form-input"
          placeholder={placeholder}
          style={{ paddingLeft: 'var(--space-8)' }}
          autoComplete="off"
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.75rem', color: 'var(--clr-text-tertiary)',
          }}>
            <Icons.Refresh size={14} />
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 9999,
          maxHeight: 280,
          overflowY: 'auto',
        }}>
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--clr-border)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--dur-fast) var(--ease-out)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--clr-neutral-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-full)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 'var(--font-size-xs)',
                background: p.type === 'customer' ? 'var(--clr-success-bg)' : 'var(--clr-info-bg)',
                color: p.type === 'customer' ? 'var(--clr-brand)' : 'var(--clr-info-text)',
              }}>
                {p.name ? p.name.charAt(0).toUpperCase() : '#'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 'var(--font-size-sm)', fontWeight: 600,
                  color: 'var(--clr-text-primary)', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.name || '(No name)'}
                </p>
                <p style={{
                  fontSize: 'var(--font-size-xs)', color: 'var(--clr-text-tertiary)', margin: 0,
                }}>
                  {p.phone}
                </p>
              </div>
              <span style={{
                fontSize: 'var(--font-size-xs)', fontWeight: 600, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: p.type === 'customer' ? 'var(--clr-success-bg)' : 'var(--clr-info-bg)',
                color: p.type === 'customer' ? 'var(--clr-brand)' : 'var(--clr-info-text)',
              }}>
                {p.type === 'customer' ? 'Customer' : 'Lead'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
