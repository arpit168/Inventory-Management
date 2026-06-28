import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

    if (!form.token.trim()) {
      showToast('Enter your reset token.', 'warning');
      return;
    }

    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token: form.token.trim(), password: form.password });
      setSuccess(true);
      showToast('Password reset successfully.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-xl transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-extrabold text-success">Security Center</p>
            <h1 className="text-2xl font-black text-text tracking-tight">Reset Password</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-text-muted leading-relaxed">
          Paste the reset token generated from the forgot password portal and choose a new secure password.
        </p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-6 text-center space-y-4 animate-scale-up">
            <CheckCircle2 size={48} className="mx-auto text-success animate-bounce" />
            <h3 className="text-lg font-black text-text">Password Successfully Updated!</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Your account password has been reset. You can now sign in using your newly created credentials to access your shop workspace.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block rounded-xl bg-success px-6 py-3 text-xs font-bold text-slate-950 shadow-md hover:bg-emerald-400 transition"
              >
                Sign In to Dashboard &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Reset Token *
              </label>
              <input
                required
                value={form.token}
                onChange={(event) => setForm((current) => ({ ...current, token: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono text-text focus:border-primary focus:outline-hidden transition shadow-xs"
                placeholder="Paste your reset token here"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
                New Password (6+ chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition shadow-xs"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text focus:border-primary focus:outline-hidden transition shadow-xs"
                placeholder="Repeat new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isReady}
              className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 transition active:scale-98 mt-2"
            >
              <span>{loading ? 'Updating Credentials...' : 'Reset Password'}</span>
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-border pt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary transition"
          >
            <ArrowLeft size={16} /> Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
