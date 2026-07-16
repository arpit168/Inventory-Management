import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, ArrowLeft, KeyRound, Mail, Copy, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'Check your email for a reset token.');
      setResetToken(response.data.resetToken || '');
      showToast('Reset request submitted.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to request reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-8 sm:p-10 shadow-xl transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary">Account Recovery</p>
            <h1 className="text-2xl font-black text-text tracking-tight">Forgot your password?</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-text-muted leading-relaxed">
          Enter the email on your account and we'll generate a reset token so you can choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition shadow-xs"
                placeholder="shopkeeper@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-98"
          >
            {loading ? 'Generating token…' : 'Generate reset token'}
          </button>
        </form>

        {message && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4 space-y-3 animate-scale-up">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <MailCheck size={18} /> {message}
            </div>

            {resetToken && (
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">Reset token</p>
                <div className="flex items-stretch gap-2">
                  <p className="flex-1 overflow-x-auto text-ellipsis rounded-xl border border-border bg-background p-3 text-xs font-mono font-bold text-text select-all">
                    {resetToken}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-background px-3 text-text-muted hover:text-primary hover:border-primary transition"
                    aria-label="Copy reset token"
                  >
                    {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}

            <Link
              to="/reset-password"
              className="inline-block rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition"
            >
              Continue to reset password &rarr;
            </Link>
          </div>
        )}

        <div className="mt-8 border-t border-border pt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary transition"
          >
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;