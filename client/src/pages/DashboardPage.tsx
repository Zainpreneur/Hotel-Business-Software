import { useCallback } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardApi } from "../api/endpoints";
import { useAsync } from "../hooks/useAsync";
import { Card, CardHeader, ErrorBanner, Spinner, StatCard } from "../components/ui";
import { currency, dateShort } from "../lib/format";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const summary = useAsync(useCallback(() => dashboardApi.summary(), []));
  const revenue = useAsync(useCallback(() => dashboardApi.revenueSeries(14), []));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">Here's what's happening at your property today.</p>
      </div>

      {summary.error && <ErrorBanner message={summary.error} />}
      {summary.loading && <Spinner />}

      {summary.data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Occupancy"
              value={`${summary.data.rooms.occupancyRate}%`}
              sub={`${summary.data.rooms.occupied} of ${summary.data.rooms.total} rooms occupied`}
            />
            <StatCard label="Arrivals today" value={summary.data.today.arrivals} sub="Bookings starting today" />
            <StatCard label="Departures today" value={summary.data.today.departures} sub="Checkouts due today" />
            <StatCard
              label="Revenue MTD"
              value={currency(summary.data.revenue.monthToDate)}
              sub="Paid this calendar month"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rooms available</p>
              <p className="mt-1.5 text-2xl font-semibold text-emerald-600">{summary.data.rooms.available}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">In-house guests</p>
              <p className="mt-1.5 text-2xl font-semibold text-blue-600">{summary.data.today.inHouseGuests}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending housekeeping</p>
              <p className="mt-1.5 text-2xl font-semibold text-amber-600">{summary.data.housekeeping.pendingTasks}</p>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader title="Revenue" subtitle="Paid amount over the last 14 days" />
        <div className="h-64 px-2 py-4">
          {revenue.loading ? (
            <Spinner />
          ) : revenue.data && revenue.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => dateShort(v).replace(/,.*/, "")}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip formatter={(v) => currency(Number(v))} labelFormatter={(v) => dateShort(String(v))} />
                <Area type="monotone" dataKey="total" stroke="#0f172a" strokeWidth={2} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">No revenue recorded yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
