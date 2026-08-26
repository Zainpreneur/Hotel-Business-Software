import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { DashboardStats } from "../types";
import Badge from "../components/Badge";

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading dashboard…</p>;
  if (!stats) return <p className="text-slate-500">Could not load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-slate-500 text-sm">Today's snapshot of your property</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Occupancy" value={`${stats.occupancyRate}%`} icon="🏨" sub={`${stats.occupiedRooms}/${stats.totalRooms} rooms`} />
        <StatCard label="Arrivals Today" value={stats.arrivalsToday} icon="🛬" />
        <StatCard label="Departures Today" value={stats.departuresToday} icon="🛫" />
        <StatCard label="Guests In-House" value={stats.guestsInHouse} icon="🧳" />
        <StatCard label="Revenue Today" value={`$${stats.revenueToday.toFixed(2)}`} icon="💵" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Room Status Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(stats.roomStatusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <Badge value={status} />
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(stats.roomStatusCounts).length === 0 && (
              <p className="text-sm text-slate-400">No rooms yet.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Upcoming Arrivals</h3>
            <Link to="/reservations" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {stats.upcomingArrivals.length === 0 && <p className="text-sm text-slate-400">No upcoming arrivals.</p>}
            {stats.upcomingArrivals.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <div>
                  <p className="font-medium">
                    {r.guest.firstName} {r.guest.lastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    Room {r.room.number} · {new Date(r.checkIn).toLocaleDateString()}
                  </p>
                </div>
                <Badge value={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
