import { useEffect, useState } from 'react';
import { BellRing, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/formatters';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications((current) => current.map((item) => (item._id === id ? { ...item, read: true } : item)));
  };

  if (loading) {
    return <LoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-cyan-100 dark:bg-cyan-400/10 p-2 text-cyan-600 dark:text-cyan-200">
            <BellRing size={18} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Notification center</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Real-time alerts and history</h1>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`rounded-xl border p-4 transition-all ${notification.read ? 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70' : 'border-cyan-300 dark:border-cyan-400/40 bg-cyan-50 dark:bg-cyan-500/10 hover:shadow-md'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-200 font-semibold">{notification.type}</p>
                <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{notification.title}</h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{notification.message}</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(notification.createdAt)}</p>
                {!notification.read && (
                  <button
                    onClick={() => handleMarkRead(notification._id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-300 dark:border-cyan-400/40 bg-cyan-100 dark:bg-cyan-500/10 px-3 py-1 text-sm text-cyan-700 dark:text-cyan-100 hover:bg-cyan-200 dark:hover:bg-cyan-500/20 transition-colors font-semibold"
                  >
                    <CheckCheck size={14} />
                    Mark read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
