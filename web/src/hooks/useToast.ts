import { useState, useCallback } from 'react';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = 'success', duration = 3500) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string) => show(msg, 'success'), [show]);
  const error   = useCallback((msg: string) => show(msg, 'danger', 5000), [show]);
  const warning = useCallback((msg: string) => show(msg, 'warning'), [show]);
  const info    = useCallback((msg: string) => show(msg, 'info'), [show]);

  return { toasts, show, dismiss, success, error, warning, info };
}

export type { Toast };
