import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/keys", label: "API Keys" },
  { to: "/plans", label: "Plans" },
  { to: "/playground", label: "Playground" },
];

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-slate-800">SimpleAPI</span>
            </NavLink>

            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `nav-link px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive ? "text-sky-600 active" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `nav-link px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive ? "text-amber-600 active" : "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.name || "User"}</span>
            <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600 font-medium">
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="sm:hidden p-2" aria-label="Open menu">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-6 shadow-xl animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-10 flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-800 mb-2">{user?.name || "User"}</p>
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm font-medium rounded-md ${isActive ? "bg-sky-50 text-sky-600" : "text-slate-600 hover:bg-slate-50"}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink to="/admin/users" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm font-medium rounded-md text-amber-600 hover:bg-amber-50">
                  Admin Panel
                </NavLink>
              )}
              <hr className="my-2 border-slate-100" />
              <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md text-left">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
