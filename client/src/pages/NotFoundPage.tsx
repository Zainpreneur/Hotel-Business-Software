import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 text-center">
      <p className="text-4xl">🧭</p>
      <h1 className="text-lg font-semibold text-slate-900">Page not found</h1>
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
