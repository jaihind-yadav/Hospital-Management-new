import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const AppShellEnhanced = ({
  children,
  title = "Dashboard",
  showSidebar = true,
  showUserMenu = true,
  userMenuActions = [],
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
    <div className="min-h-screen text-slate-800">
      <div className="fixed inset-0 -z-10 bg-[#f4f6fb]" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        {showSidebar && (
          <aside
            className={`sidebar-pattern hidden overflow-hidden border-r border-slate-900/10 text-white transition-all duration-300 md:flex md:min-h-screen md:flex-col ${
              collapsed ? "w-20" : "w-[190px]"
            }`}
          >
            <div className="border-b border-white/10 bg-white px-4 py-3">
              <div className="flex items-center justify-center">
                <div className={`${collapsed ? "text-xl" : "text-[20px]"} font-bold tracking-tight text-[#24345f]`}>
                  {collapsed ? "C" : "cogentgdg"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              {!collapsed && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">Menu</p>}
              <button
                onClick={() => setCollapsed((prev) => !prev)}
                className="rounded-md px-2 py-1 text-sm text-white/90 hover:bg-white/10"
              >
                {collapsed ? "=" : "≡"}
              </button>
            </div>

            <div className="flex-1 px-2 py-3">
              <nav className="space-y-2">
                {navItems.map((item, index) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-slate-100 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <span className={`inline-flex h-4 w-4 items-center justify-center text-xs ${collapsed ? "mx-auto" : ""}`}>
                      {index === 0 ? "◫" : "•"}
                    </span>
                    {!collapsed && <span className="ml-2">{item.label}</span>}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>
        )}

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex min-h-[48px] items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-4">
                {!showSidebar && (
                  <button className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
                    ≡
                  </button>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {import.meta.env.VITE_APP_NAME || "Hospital Management"}
                  </p>
                  <h1 className="page-title text-xl font-semibold text-slate-900">{title}</h1>
                </div>
              </div>
              {showUserMenu ? (
              <div className="relative">
                <button
                  onClick={() => setOpenUserMenu((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-[#2d5daa] bg-white px-2 py-1 pr-4 text-right shadow-sm hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2d5daa] text-xs font-semibold text-white">
                    {(user?.name || "G").slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#2d5daa]">
                      {user?.name || "Guest"}
                    </p>
                  </div>
                </button>

                {openUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                    {userMenuActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => {
                          setOpenUserMenu(false);
                          action.onClick?.();
                        }}
                        className="mb-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-[#5672a6] hover:bg-slate-50"
                      >
                        {action.label}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setOpenUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full rounded-md bg-[#2d5daa] px-3 py-2 text-left text-sm font-medium text-white hover:bg-[#244d8f]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Public Access
              </div>
            )}
            </div>
          </header>

          <main className="flex-1 px-3 py-3 md:px-4">{children}</main>

          <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} All rights reserved: Cogent E-Services Limited
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AppShellEnhanced;
