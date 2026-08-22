import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABEL } from "../lib/constants";

const NAV = [
  { to: "/", label: "Dashboard", icon: "🏨", roles: null },
  { to: "/reservations", label: "Reservations", icon: "📅", roles: null },
  { to: "/rooms", label: "Rooms", icon: "🛏️", roles: null },
  { to: "/room-types", label: "Room Types", icon: "🏷️", roles: ["ADMIN", "MANAGER"] },
  { to: "/guests", label: "Guests", icon: "🧑‍🤝‍🧑", roles: null },
  { to: "/billing", label: "Billing", icon: "💳", roles: null },
  { to: "/housekeeping", label: "Housekeeping", icon: "🧹", roles: null },
  { to: "/users", label: "Staff", icon: "🪪", roles: ["ADMIN"] },
] as const;

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="text-xl">🏩</span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Hotel Business</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.filter((item) => !item.roles || (item.roles as readonly string[]).includes(user?.role ?? "")).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
          <p className="text-xs text-slate-400">{user ? ROLE_LABEL[user.role] : ""}</p>
          <button onClick={logout} className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-800">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <span className="text-sm font-semibold">🏩 Hotel Business</span>
          <button onClick={logout} className="text-xs font-medium text-slate-500">
            Sign out
          </button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
