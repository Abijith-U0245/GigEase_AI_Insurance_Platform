import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; }
interface ToastCtx { addToast: (type: ToastType, message: string) => void; }

const ToastContext = createContext<ToastCtx>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = { success: <CheckCircle size={18} />, error: <XCircle size={18} />, info: <Info size={18} /> };
  const borders = { success: 'border-l-4 border-success', error: 'border-l-4 border-danger', info: 'border-l-4 border-primary' };
  const colors = { success: 'text-success', error: 'text-danger', info: 'text-primary' };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[340px]">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              className={`bg-white rounded-btn shadow-card flex items-center gap-3 px-4 py-3 ${borders[t.type]}`}
            >
              <span className={colors[t.type]}>{icons[t.type]}</span>
              <span className="text-sm text-textPrimary flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="text-textSecondary hover:text-textPrimary"><X size={14} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
