import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await login(form);
      showToast('Signed in successfully.', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.response?.data?.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/80 shadow-xl hover:shadow-2xl lg:grid-cols-[1.1fr_0.9fr] transition-shadow">
        <div className="p-8 sm:p-10 border-r border-slate-200 dark:border-white/10">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-600 dark:text-cyan-300 font-semibold">Inventory Pro</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">Secure access for your shop dashboard</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Monitor stock, control profit and loss, and stay ahead of low stock alerts from one premium control center.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              'JWT authentication',
              'Role-based dashboard',
              'Real-time notifications',
              'Mobile optimized layout',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 p-8 sm:p-10 lg:border-l lg:border-t-0">
          <div className="mb-4 inline-flex rounded-full border border-cyan-300 dark:border-cyan-400/40 bg-cyan-50 dark:bg-cyan-400/10 px-3 py-1 text-sm text-cyan-700 dark:text-cyan-100 font-semibold">
            <ShieldCheck size={16} className="mr-2" />
            Protected shop access
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Login</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use your registered email and password to continue.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300 font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none ring-0 transition focus:border-cyan-500 dark:focus:border-cyan-400 shadow-sm"
                placeholder="shopkeeper@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300 font-medium">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-white outline-none ring-0 transition focus:border-cyan-500 dark:focus:border-cyan-400 shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 dark:bg-cyan-400 px-4 py-3 font-bold text-white dark:text-slate-950 hover:bg-cyan-600 dark:hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
            >
              {loading ? 'Signing in...' : 'Continue'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link to="/forgot-password" className="text-cyan-600 dark:text-cyan-200 hover:text-cyan-700 dark:hover:text-cyan-100 font-medium transition">
              Forgot password?
            </Link>
            <Link to="/register" className="text-cyan-600 dark:text-cyan-200 hover:text-cyan-700 dark:hover:text-cyan-100 font-medium transition">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
