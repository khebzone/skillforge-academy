import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import { Spinner } from "@/components/ui/Misc";
import type { Role } from "@/api/types";

export const homeFor = (role: Role) => (role === "admin" ? "/admin" : "/learn");

export function RequireRole({ role }: { role: Role }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
