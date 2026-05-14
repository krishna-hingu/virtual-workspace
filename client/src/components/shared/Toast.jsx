import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';

const ToastItem = ({ id, message, type }) => {
  const { removeToast } = useUIStore();
  const colors = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    error: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    info: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
  }[type] || 'border-white/10 bg-white/5 text-white';

  const icons = {
    success: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[type];

  return (
    <motion.div
      layout
      className={`
        ${colors} min-w-[280px] cursor-pointer rounded-xl border p-4 shadow-2xl backdrop-blur-md
        flex items-center gap-3
      `}
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => removeToast(id)}
    >
      <div className="flex-shrink-0">{icons}</div>
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  );
};

// Phase 5: Use shallow selector to prevent unnecessary rerenders
export const ToastContainer = () => {
  const toasts = useUIStore((state) => state.toasts || []);

  return (
    <div className="fixed top-6 right-6 z-40 space-y-2 max-w-sm pointer-events-auto">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
