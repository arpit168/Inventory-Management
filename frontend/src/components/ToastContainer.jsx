import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
};

const colors = {
  success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-50',
  error: 'border-rose-400/40 bg-rose-500/10 text-rose-50',
  warning: 'border-amber-400/40 bg-amber-500/10 text-amber-50',
  info: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-50',
};

export const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed right-4 top-4 z-100 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${colors[toast.type] || colors.info}`}
          >
            <Icon className="mt-0.5 shrink-0" size={18} />
            <p className="text-sm">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
};
