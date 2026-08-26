import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/reservations", label: "Reservations", icon: "🗓️" },
  { to: "/rooms", label: "Rooms", icon: "🛏️" },
  { to: "/guests", label: "Guests", icon: "🧳" },
  { to: "/billing", label: "Billing", icon: "💳" },
  { to: "/housekeeping", label: "Housekeeping", icon: "🧹" },
  { to: "/staff", label: "Staff", icon: "👥", roles: ["ADMIN", "MANAGER"] },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white leading-tight">🏨 Hotelier</h1>
          <p className="text-xs text-slate-400">Business Software</p>
        </div>
        <nav className="flex-1 py-3 space-y-1 px-2">
          {NAV.filter((item) => !item.roles || item.roles.includes(user?.role || "")).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 text-sm">
          <p className="font-medium text-white">{user?.name}</p>
          <p className="text-xs text-slate-400 mb-2">{user?.role}</p>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-white underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
