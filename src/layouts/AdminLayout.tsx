import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { BookOpen, Building2, ClipboardList, ExternalLink, Inbox, LayoutDashboard, LogOut, Menu, Users, X } from "lucide-react";
import { Logo } from "@/components/Brand";
import { Avatar } from "@/components/ui/Misc";
import { useAuth } from "@/auth/AuthContext";
import { useRequests } from "@/api/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/organizations", label: "Organizations", icon: Building2 },
  { to: "/admin/enrollments", label: "Enrollments", icon: ClipboardList },
  { to: "/admin/learners", label: "Learners", icon: Users },
  { to: "/admin/requests", label: "Requests", icon: Inbox, badge: true },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: requests } = useRequests();
  const pending = requests?.filter((r) => r.status === "new").length ?? 0;

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-950 text-ink-300">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo to="/admin" dark />
        <button className="rounded-md p-1 text-ink-400 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <nav className="mt-2 flex-1 space-y-0.5 px-3">
        <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Manage</p>
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-ink-400 hover:bg-white/5 hover:text-white",
              )
            }
          >
            <Icon className="size-[18px]" />
            <span className="flex-1">{label}</span>
            {badge && pending > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">{pending}</span>
            )}
          </NavLink>
        ))}
        <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Preview</p>
        <NavLink to="/catalog" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-400 hover:bg-white/5 hover:text-white">
          <ExternalLink className="size-[18px]" />
          Public catalog
        </NavLink>
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user?.name ?? "A"} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-ink-500">Administrator</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1.5 text-ink-400 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 shadow-pop">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-1.5 text-ink-600 hover:bg-ink-100">
            <Menu className="size-5" />
          </button>
          <Logo to="/admin" />
        </div>
        <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

