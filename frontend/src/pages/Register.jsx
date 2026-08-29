import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.password) {
      showToast("Please complete the form.", "warning");
      return;
    }

    if (form.password.length < 8) {
      showToast("Password must be at least 8 characters.", "warning");
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast("Passwords do not match.", "warning");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      showToast("Account created successfully.", "success");
      navigate("/dashboard");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Registration failed.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 animate-fade-in">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-8 shadow-xl sm:p-10">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary font-extrabold">
              Inventory Management Pro
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-text tracking-tight">
              Create Administrator Account
            </h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-text-muted max-w-2xl leading-relaxed">
          Register to set up your shop workspace, track real-time stock
          valuations, generate invoices, and manage customer ledgers.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-text-muted uppercase tracking-wider">
              Full Name *
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition shadow-xs"
              placeholder="e.g., Arpit Sharma"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-muted uppercase tracking-wider">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition shadow-xs"
              placeholder="shop@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-text-muted uppercase tracking-wider">
              Password (8+ chars) *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition shadow-xs"
              placeholder="••••••••"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-bold text-text-muted uppercase tracking-wider">
              Confirm Password *
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text placeholder:text-text-muted focus:border-primary focus:outline-hidden transition shadow-xs"
              placeholder="Repeat exact password"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-primary/20 hover:bg-primary-hover disabled:opacity-50 transition active:scale-98"
            >
              <span>
                {loading
                  ? "Creating Account Workspace..."
                  : "Create Account & Access Dashboard"}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-text-muted">
          <div className="flex items-center gap-1.5 text-success">
            <ShieldCheck size={16} />
            <span>Instant workspace setup</span>
          </div>
          <p>
            Already registered?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline transition"
            >
              Sign in here &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
