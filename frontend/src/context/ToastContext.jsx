import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, classes: "bg-green-600 border-green-500" },
  error: { icon: XCircle, classes: "bg-red-600 border-red-500" },
  info: { icon: Info, classes: "bg-slate-700 border-slate-600" },
};

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    info: (message) => push(message, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map(({ id, message, type }) => {
          const { icon: Icon, classes } = STYLES[type] || STYLES.info;
          return (
            <div
              key={id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 text-white border rounded-xl shadow-lg p-4 ${classes} animate-[toast-in_0.2s_ease-out]`}
            >
              <Icon size={20} className="shrink-0 mt-0.5" />
              <p className="flex-1 text-sm leading-snug">{message}</p>
              <button
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return ctx;
}
