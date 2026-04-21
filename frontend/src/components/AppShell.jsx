import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const AppShell = ({
  children,
  title = "Dashboard",
  showSidebar = true,
  navItems = [],
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const user = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">
        {showSidebar && (
          <aside
            className={`border-r border-slate-200 bg-white transition-all duration-300 ${
              collapsed ? "w-20" : "w-64"
            }`}
          >
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <span className={`font-semibold ${collapsed ? "hidden" : "block"}`}>
                HMS Panel
              </span>
              <button
                onClick={() => setCollapsed((prev) => !prev)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
              >
                {collapsed ? ">>" : "<<"}
              </button>
            </div>

            <nav className="space-y-2 p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  <span className="text-base">•</span>
                  {!collapsed && <span className="ml-2">{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-xs text-slate-500">{import.meta.env.VITE_APP_NAME}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setOpenUserMenu((prev) => !prev)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-right hover:bg-slate-100"
              >
                <p className="text-sm font-medium">{user?.name || "Guest"}</p>
                <p className="text-xs text-slate-500">{user?.role || "public"}</p>
              </button>

              {openUserMenu && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-md">
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>

          <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-xs text-slate-500">
            {new Date().getFullYear()} Hospital Management System - Secure API Driven App
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
