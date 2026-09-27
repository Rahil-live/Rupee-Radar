import { Link } from "react-router-dom";

interface AppHeaderProps {
  status?: "loading" | "ok" | "error";
}

const STATUS_LABEL = {
  loading: "Connecting…",
  ok: "Backend connected",
  error: "Backend not connected",
} as const;

const STATUS_CLASS = {
  loading: "bg-slate-100 text-slate-600",
  ok: "bg-brand-100 text-brand-900",
  error: "bg-amber-100 text-amber-900",
} as const;

export default function AppHeader({ status }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Rupee<span className="text-brand-700">Radar</span>
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">Bank statement insights</span>
        </Link>
        {status && (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>
    </header>
  );
}
