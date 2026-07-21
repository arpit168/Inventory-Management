import { useEffect, useState } from 'react';
import { BellRing, CheckCheck, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

const Notifications = () => {
  const { showToast } = useToast();
  const { refreshNotifications, setNotifications: setGlobalNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      const list = response.data.notifications || [];
      setNotifications(list);
      setGlobalNotifications(list);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      // Optimistic update
      setNotifications((current) => current.map((item) => (item._id === id ? { ...item, read: true } : item)));
      setGlobalNotifications((current) => current.map((item) => (item._id === id ? { ...item, read: true } : item)));
      
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to mark notification as read.', 'error');
      loadNotifications(); // Revert on failure
    }
  };

  const handleDeleteOne = async (id) => {
    try {
      setDeletingId(id);
      // Optimistic update
      setNotifications((current) => current.filter((item) => item._id !== id));
      setGlobalNotifications((current) => current.filter((item) => item._id !== id));

      await api.delete(`/notifications/${id}`);
      showToast('Notification removed', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete notification', 'error');
      loadNotifications();
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      setClearingAll(true);
      // Optimistic update
      setNotifications([]);
      setGlobalNotifications([]);
      setShowClearConfirm(false);

      await api.delete('/notifications');
      showToast('All notifications cleared successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to clear notifications', 'error');
      loadNotifications();
    } finally {
      setClearingAll(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
       <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 sm:gap-4 min-w-0">
  <div className="rounded-2xl bg-primary/10 p-2.5 sm:p-3 text-primary shrink-0">
    <BellRing size={20} className="sm:w-6 sm:h-6" />
  </div>

  <div className="min-w-0 flex-1">
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.25em] font-extrabold text-primary">
        Notification Center
      </p>

      {unreadCount > 0 && (
        <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger whitespace-nowrap">
          {unreadCount} unread
        </span>
      )}
    </div>

    <h1 className="mt-1 text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-text tracking-tight break-words">
      Real-time System Alerts
    </h1>
  </div>
</div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={loadNotifications}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-bold text-text hover:border-primary transition shadow-xs"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          {notifications.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs font-bold text-danger hover:bg-danger hover:text-white transition shadow-xs"
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-danger">
              <div className="rounded-2xl bg-danger/10 p-3">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-text">Clear All Notifications?</h3>
            </div>
            <p className="mt-3 text-sm text-text-muted leading-relaxed">
              Are you sure you want to delete all {notifications.length} notifications? This action cannot be undone and will clear your entire alert history.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearingAll}
                className="rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold text-text hover:bg-surface transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearingAll}
                className="inline-flex items-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-danger/20 hover:bg-red-600 transition disabled:opacity-50"
              >
                {clearingAll ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>Yes, Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface/50 p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <CheckCheck size={32} />
          </div>
          <h3 className="text-lg font-bold text-text">All Caught Up!</h3>
          <p className="mt-1 text-sm text-text-muted max-w-sm mx-auto">
            You have no system alerts or inventory notifications right now. Everything is running smoothly.
          </p>
        </div>
      ) : (
        /* Notifications List */
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isUnread = !notification.read;
            const isDeleting = deletingId === notification._id;

            return (
              <div
                key={notification._id}
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${
                  isDeleting ? 'opacity-40 scale-98 pointer-events-none' : ''
                } ${
                  isUnread
                    ? 'border-primary/40 bg-primary/5 hover:border-primary shadow-sm'
                    : 'border-border bg-surface hover:border-text-muted/40 shadow-xs'
                }`}
              >
                {/* Unread Accent Indicator */}
                {isUnread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 pl-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        notification.type === 'out_of_stock' ? 'bg-danger/15 text-danger' :
                        notification.type === 'low_stock' ? 'bg-warning/15 text-warning' :
                        'bg-info/15 text-info'
                      }`}>
                        {notification.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-text-muted">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-2 text-base font-black text-text tracking-tight">
                      {notification.title}
                    </h2>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">
                      {notification.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center sm:flex-col justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border sm:border-l sm:pl-4">
                    {isUnread && (
                      <button
                        onClick={() => handleMarkRead(notification._id)}
                        title="Mark as Read"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-slate-950 transition w-full sm:w-auto justify-center shadow-xs"
                      >
                        <CheckCheck size={14} />
                        <span>Read</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteOne(notification._id)}
                      disabled={isDeleting}
                      title="Delete Notification"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-danger/20 bg-danger/5 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger hover:text-white transition w-full sm:w-auto justify-center shadow-xs"
                    >
                      <Trash2 size={14} />
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
