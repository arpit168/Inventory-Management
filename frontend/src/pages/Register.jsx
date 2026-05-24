import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password) {
      showToast('Please complete the form.', 'warning');
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
      await register({ name: form.name, email: form.email, password: form.password });
      showToast('Account created successfully.', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.response?.data?.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background: radial-gradient(circle at top, rgba(244,114,182,0.3), transparent 25%),
            linear-gradient(135deg, #020617, #111827);
 px-4 py-12">
      <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-slate-950/85 p-8 shadow-[0_30px_90px_rgba(244,114,182,0.18)] sm:p-10">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-fuchsia-400/15 p-2 text-fuchsia-200">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-fuchsia-300">Inventory Pro</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">Create your shopkeeper account</h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Register in seconds to access dashboards, stock analytics, notifications, and secure profile controls.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-200">Full name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
              placeholder="Asha Patel"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-200">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
              placeholder="shop@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-200">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
              placeholder="••••••••"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-200">Confirm password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-fuchsia-400"
              placeholder="Repeat password"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-fuchsia-300 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="text-fuchsia-200 hover:text-fuchsia-100">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
