import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Profile = () => {
  const { user, toggleTheme, theme } = useAuth();
  const { showToast } = useToast();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast('Enter all password fields.', 'warning');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast('Password changed successfully.', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to change password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Profile settings</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Manage your account and security</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-200 font-semibold">Account overview</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
              <span className="text-slate-600 dark:text-slate-300">Name</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user?.name}</span>
            </div>
            <div className="flex justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
              <span className="text-slate-600 dark:text-slate-300">Email</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
              <span className="text-slate-600 dark:text-slate-300">Theme</span>
              <span className="font-semibold text-slate-900 dark:text-white">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="mt-5 rounded-xl border border-cyan-300 dark:border-cyan-400/40 bg-cyan-50 dark:bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-100 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors shadow-sm"
          >
            Toggle {theme === 'dark' ? 'light' : 'dark'} mode
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/75 p-6 shadow-sm dark:shadow-none">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-200 font-semibold">Change password</p>
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300 font-medium">Current password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300 font-medium">New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300 font-medium">Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 dark:bg-cyan-400 px-4 py-3 font-bold text-white dark:text-slate-950 hover:bg-cyan-600 dark:hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
