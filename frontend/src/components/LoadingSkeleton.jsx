export const LoadingSkeleton = ({ count = 4 }) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5"
      >
        <div className="h-4 w-24 rounded bg-slate-800" />
        <div className="mt-4 h-8 w-16 rounded bg-slate-800" />
        <div className="mt-3 h-3 w-32 rounded bg-slate-800" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
        <div className="h-4 w-1/3 rounded bg-slate-800" />
        <div className="mt-3 h-3 w-2/3 rounded bg-slate-800" />
      </div>
    ))}
  </div>
);
