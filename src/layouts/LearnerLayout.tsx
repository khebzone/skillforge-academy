import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { ChevronDown, LayoutGrid, LogOut } from "lucide-react";
import { Logo } from "@/components/Brand";
import { Avatar } from "@/components/ui/Misc";
import { useAuth } from "@/auth/AuthContext";
import { useOrgs } from "@/api/hooks";
import { cn } from "@/lib/utils";

export function LearnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: orgs } = useOrgs();
  const org = orgs?.find((o) => o.id === user?.orgId);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Logo to="/learn" />
            <nav className="hidden sm:block">
              <NavLink
                to="/learn"
                end
                className={({ isActive }) =>
                  cn("inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium", isActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-100")
                }
              >
                <LayoutGrid className="size-4" /> My learning
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {org && <span className="hidden text-sm text-ink-500 md:block">{org.name}</span>}
            <div className="relative" ref={ref}>
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-ink-100" aria-haspopup="menu" aria-expanded={menu}>
                <Avatar name={user?.name ?? "?"} size={32} />
                <ChevronDown className="size-4 text-ink-400" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl bg-white shadow-pop ring-1 ring-ink-200">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                    <p className="truncate text-xs text-ink-500">{user?.email}</p>
                  </div>
                  <button
                    role="menuitem"
                    onClick={async () => {
                      await logout();
                      navigate("/");
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
