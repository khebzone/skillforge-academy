import { NavLink, Outlet } from "react-router";
import { Logo } from "@/components/Brand";
import { LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/auth/AuthContext";
import { homeFor } from "@/auth/guards";
import { BRAND } from "@/config";
import { cn } from "@/lib/utils";

export function PublicLayout() {
  const { user } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) =>
    cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive ? "text-brand-700" : "text-ink-600 hover:text-ink-900");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink to="/" end className={link}>Home</NavLink>
              <NavLink to="/catalog" className={link}>Course catalog</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <LinkButton to={homeFor(user.role)}>Go to my account</LinkButton>
            ) : (
              <LinkButton to="/login" variant="secondary">Sign in</LinkButton>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-ink-200 bg-ink-50">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-ink-500 sm:flex-row sm:items-center sm:px-8">
          <Logo />
          <p>
            Questions? <a className="font-medium text-brand-700 hover:underline" href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
          </p>
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

