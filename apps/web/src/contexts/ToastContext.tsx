import React, { useState, useEffect } from 'react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

const ToastContext = React.createContext<{
  addToast: (t: Omit<ToastMessage, 'id'>) => void;
}>(null!);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (t: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm max-w-sm ${
              t.type === 'success'
                ? 'bg-white border-teal-200 text-teal-800'
                : t.type === 'error'
                ? 'bg-white border-red-200 text-red-800'
                : t.type === 'warning'
                ? 'bg-white border-amber-200 text-amber-800'
                : 'bg-white border-blue-200 text-blue-800'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                t.type === 'success'
                  ? 'bg-teal-500'
                  : t.type === 'error'
                  ? 'bg-red-500'
                  : t.type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
            />
            <div>
              <p className="font-semibold">{t.title}</p>
              {t.message && <p className="text-xs mt-0.5 opacity-80">{t.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
