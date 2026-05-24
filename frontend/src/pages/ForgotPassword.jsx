import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      showToast('Please enter your email address.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setResponseMessage(response.data.message + ` Reset token: ${response.data.resetToken}`);
      showToast('Reset token generated. Open the reset page to continue.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to request reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.3),_transparent_22%),linear-gradient(135deg,_#020617,_#111827)] px-4 py-12">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950/85 p-8 sm:p-10">
        <div className="inline-flex rounded-full bg-cyan-400/10 p-2 text-cyan-200">
          <MailCheck size={18} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-white">Forgot your password?</h1>
        <p className="mt-2 text-sm text-slate-300">
          Enter your registered email and we will generate a secure reset token for you to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              placeholder="shop@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Generate reset token'}
          </button>
        </form>

        {responseMessage && (
          <div className="mt-4 rounded-2xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
            {responseMessage}
          </div>
        )}

        <p className="mt-4 text-sm text-slate-300">
          Remembered your password?{' '}
          <Link to="/login" className="text-cyan-200 hover:text-cyan-100">
            Return to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
