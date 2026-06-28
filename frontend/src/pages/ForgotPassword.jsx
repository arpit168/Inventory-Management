import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      const msg = response.data.resetToken
        ? `${response.data.message} Reset token: ${response.data.resetToken}`
        : response.data.message;
      setResponseMessage(msg);
      showToast('Reset request submitted. Check below for your reset token.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to request reset.', 'error');
    } finally {
      setLoading(false);
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
            <p className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary">Security Center</p>
            <h1 className="text-2xl font-black text-text tracking-tight">Forgot Password?</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-text-muted leading-relaxed">
          Enter your registered email address below and our authentication system will generate a secure reset token for you to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition shadow-xs"
              placeholder="shopkeeper@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 transition active:scale-98"
          >
            <span>{loading ? 'Generating Token...' : 'Generate Reset Token'}</span>
          </button>
        </form>

        {responseMessage && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-text break-words space-y-2 animate-scale-up">
            <div className="flex items-center gap-2 font-bold text-primary">
              <MailCheck size={18} /> Token Generated Successfully
            </div>
            <p className="text-xs font-mono bg-background p-3 rounded-xl select-all border border-border font-bold">
              {responseMessage}
            </p>
            <div className="pt-2">
              <Link
                to="/reset-password"
                className="inline-block rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover transition"
              >
                Proceed to Reset Password &rarr;
              </Link>
            </div>
          </div>
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

export default ForgotPassword;
