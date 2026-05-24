import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') || '';
  const { showToast } = useToast();
  const [form, setForm] = useState({ token: tokenFromUrl, password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isReady = useMemo(() => form.token && form.password && form.confirmPassword, [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.token) {
      showToast('Enter your reset token.', 'warning');
      return;
    }

    if (form.password.length < 8) {
      showToast('Password must be at least 8 characters.', 'warning');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token: form.token, password: form.password });
      setSuccess(true);
      showToast('Password reset successfully.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background: radial-gradient(circle at top, rgba(34,197,94,0.3), transparent 22%),
            linear-gradient(135deg, #020617, #111827);
               px-4 py-12">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950/85 p-8 sm:p-10">
        <h1 className="text-2xl font-semibold text-white">Reset password</h1>
        <p className="mt-2 text-sm text-slate-300">
          Use the reset token from the previous step or paste the link query token to change your password.
        </p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-50">
            Your password has been reset. You can now <Link to="/login" className="font-semibold underline">sign in</Link>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-200">Reset token</label>
              <input
                value={form.token}
                onChange={(event) => setForm((current) => ({ ...current, token: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                placeholder="Paste the generated token"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-200">New password</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-200">Confirm password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                placeholder="Repeat new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isReady}
              className="rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
