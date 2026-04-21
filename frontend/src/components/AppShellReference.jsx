import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";

const SidebarIcon = ({ kind }) => {
  const iconClass = "h-4 w-4";

  if (kind === "doctor") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
        <rect x="4" y="4" width="16" height="16" rx="4" />
      </svg>
    );
  }

  if (kind === "patient") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  if (kind === "executive") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  if (kind === "users") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <path d="M16 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
        <path d="M9.5 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M17 11a3 3 0 1 0 0-6" />
        <path d="M21 21v-1a4 4 0 0 0-3-3.87" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 12h8" />
    </svg>
  );
};

const ToggleIcon = ({ open = false }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    {open ? (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h10" />
        <path d="M4 18h16" />
      </>
    ) : (
      <>
        <path d="M4 6h16" />
        <path d="M10 12h10" />
        <path d="M4 18h16" />
      </>
    )}
  </svg>
);

const getNavIconKind = (item) => {
  const value = `${item.label || ""} ${item.to || ""}`.toLowerCase();
  if (value.includes("doctor")) return "doctor";
  if (value.includes("patient")) return "patient";
  if (value.includes("executive")) return "executive";
  if (value.includes("user") || value.includes("admin")) return "users";
  return "default";
};

const AppShellReference = ({
  children,
  title = "Dashboard",
  showSidebar = true,
  showUserMenu = true,
  userMenuActions = [],
  navItems = [],
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      {mobileSidebarOpen && showSidebar && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      <div className="flex min-h-screen w-full">
        {showSidebar && (
          <>
            <aside
              className={`sidebar-pattern fixed inset-y-0 left-0 z-40 overflow-hidden border-r border-slate-900/20 text-white transition-transform duration-300 md:hidden ${
                mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              } w-[250px]`}
            >
              <div className="border-b border-white/10 bg-[#f8fafc] px-4">
                <div className="flex min-h-[58px] items-center justify-between">
                  <img
                    src="/CogentLogo.svg"
                    alt="Cogent"
                    className="h-9 w-auto object-contain"
                  />
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="rounded-md px-2 py-1 text-sm text-[#24345f] hover:bg-slate-200"
                  >
                    X
                  </button>
                </div>
              </div>

              <div className="flex-1 px-2 py-3">
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={`mobile-${item.to}`}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center rounded-md px-4 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "text-slate-100 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center text-xs">
                        <SidebarIcon kind={getNavIconKind(item)} />
                      </span>
                      <span className="ml-2">{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            </aside>

            <aside
              className={`sidebar-pattern hidden overflow-hidden border-r border-slate-900/20 text-white transition-all duration-300 md:flex md:min-h-screen md:flex-col ${
                collapsed ? "md:w-24" : "md:w-[240px]"
              }`}
              style={{ position: "fixed", top: 0, left: 0, height: "100vh" }}
            >
              <div className="border-b border-white/10 bg-[#f8fafc] px-4">
                <div className="flex min-h-[58px] items-center justify-center">
                  <img
                    src={collapsed ? "/cogent_small.png" : "/CogentLogo.svg"}
                    alt="Cogent"
                    className={collapsed ? "h-10 w-10 object-contain" : "h-9 w-auto object-contain"}
                  />
                </div>
              </div>

              <div className="flex-1 px-2 py-3">
                <nav className="space-y-2">
                  {navItems.map((item) => (
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
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center text-xs ${
                          collapsed ? "mx-auto" : ""
                        }`}
                      >
                        <SidebarIcon kind={getNavIconKind(item)} />
                      </span>
                      {!collapsed && <span className="ml-2">{item.label}</span>}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </aside>
          </>
        )}

        <div
          className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ease-in-out ${
            showSidebar ? (collapsed ? "md:ml-24" : "md:ml-[240px]") : ""
          }`}
        >
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex min-h-[58px] items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-4">
                {showSidebar ? (
                  <>
                    <button
                      onClick={() => setCollapsed((prev) => !prev)}
                      className="hidden items-center justify-center rounded-xl bg-[#10284c] p-2 text-white shadow-sm transition hover:bg-[#0c1f3a] md:inline-flex"
                      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                      <ToggleIcon open={!collapsed} />
                    </button>
                    <button
                      onClick={() => setMobileSidebarOpen(true)}
                      className="inline-flex items-center justify-center rounded-xl bg-[#10284c] p-2 text-white shadow-sm transition hover:bg-[#0c1f3a] md:hidden"
                      aria-label="Open sidebar"
                    >
                      <ToggleIcon open />
                    </button>
                  </>
                ) : (
                  <button
                    className="inline-flex items-center justify-center rounded-xl bg-[#10284c] p-2 text-white shadow-sm transition hover:bg-[#0c1f3a]"
                    aria-label="Menu"
                  >
                    <ToggleIcon open />
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
                    className="flex items-center gap-2 rounded-full border border-[#1f3f75] bg-white px-2 py-1 pr-4 text-right shadow-sm hover:bg-slate-50"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1f3f75] text-xs font-semibold text-white">
                      {(user?.name || "G").slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#1f3f75]">
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
                          className="mb-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-[#1f3f75] hover:bg-slate-50"
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setOpenUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full rounded-md bg-[#1f3f75] px-3 py-2 text-left text-sm font-medium text-white hover:bg-[#18325d]"
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

          <main className="flex-1 bg-[#f4f6fb] px-3 py-3 md:px-4">{children}</main>

          <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} All rights reserved: Cogent E-Services Limited
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AppShellReference;
