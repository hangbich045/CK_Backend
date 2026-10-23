'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-brand-success" />;
      case 'error':
        return <AlertOctagon className="w-5 h-5 text-brand-error" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-brand-accent" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-brand-secondary" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-brand-success/20 bg-brand-success/5 text-white';
      case 'error':
        return 'border-brand-error/20 bg-brand-error/5 text-white';
      case 'warning':
        return 'border-brand-accent/20 bg-brand-accent/5 text-white';
      case 'info':
      default:
        return 'border-brand-secondary/20 bg-brand-secondary/5 text-white';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border glass-panel shadow-2xl animate-in slide-in-from-bottom duration-300 ${getBgColor(
              t.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(t.type)}</div>
            <div className="flex-1 text-sm font-medium pr-2 leading-relaxed">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 text-studio-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
