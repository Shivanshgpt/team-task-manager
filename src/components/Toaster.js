"use client";
import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const toast = useCallback((kind, title, desc) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, kind, title, desc }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  function dismiss(id) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto card px-4 py-3 min-w-[280px] max-w-sm flex items-start gap-3 fade-in shadow-sm ${
              t.kind === "success" ? "border-l-4 border-l-[var(--color-accent)]"
              : t.kind === "error" ? "border-l-4 border-l-[var(--color-rose)]"
              : "border-l-4 border-l-[var(--color-sky)]"
            }`}
            style={{ borderLeftColor: t.kind === "success" ? "#2f6b3a" : t.kind === "error" ? "#b04141" : "#285e7a" }}
          >
            <span className="mt-0.5">
              {t.kind === "success" && <CheckCircle2 className="w-4 h-4 text-accent" />}
              {t.kind === "error" && <AlertCircle className="w-4 h-4 text-rose" />}
              {t.kind === "info" && <Info className="w-4 h-4 text-sky" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{t.title}</p>
              {t.desc && <p className="text-xs text-muted mt-0.5">{t.desc}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
