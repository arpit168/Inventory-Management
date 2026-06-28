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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 animate-fade-in">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-xl lg:grid-cols-[1.1fr_0.9fr] transition-shadow">
        
        {/* Info Column */}
        <div className="p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary font-extrabold">Inventory Management Pro</p>
            <h1 className="mt-3 text-3xl font-black text-text tracking-tight">Secure Access Control Center</h1>
            <p className="mt-3 max-w-xl text-sm text-text-muted leading-relaxed">
              Monitor inventory stock, analyze profit and loss margins, and receive real-time low stock notifications from one unified enterprise dashboard.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                'JWT Auth Security',
                'Role-Based Dashboard',
                'Real-Time Alerting',
                'Fully Responsive UI',
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-background px-4 py-3 text-xs font-bold text-text flex items-center gap-2 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-text-muted mt-8 pt-4 border-t border-border">
            Protected by enterprise-grade token encryption & strict CORS enforcement.
          </p>
        </div>

        {/* Form Column */}
        <div className="bg-background/60 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-extrabold text-primary w-fit">
            <ShieldCheck size={14} />
            <span>Authorized Portal</span>
          </div>

          <h2 className="text-2xl font-black text-text tracking-tight">Sign In</h2>
          <p className="mt-1 text-xs font-medium text-text-muted">Enter your account email and password credentials.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text font-semibold placeholder:text-text-muted focus:border-primary focus:outline-hidden transition shadow-xs"
                placeholder="admin@inventory.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-text-muted uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text font-semibold placeholder:text-text-muted focus:border-primary focus:outline-hidden transition shadow-xs"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 transition active:scale-98 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Continue to Dashboard'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <Link to="/forgot-password" className="text-primary hover:underline transition">
              Forgot password?
            </Link>
            <Link to="/register" className="text-text hover:text-primary transition">
              Create an account &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
