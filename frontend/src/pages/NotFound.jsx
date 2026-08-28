import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_transparent_30%),linear-gradient(135deg,_#020617,_#111827)] px-4 py-12">
    <div className="max-w-xl rounded-[28px] border border-white/10 bg-slate-950/85 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">
        The page you are looking for is unavailable
      </h1>
      <p className="mt-3 text-sm text-slate-300">
        It may have been moved, removed, or you might have followed a stale
        link. Use the navigation to return to the dashboard.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
      >
        Go to dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
