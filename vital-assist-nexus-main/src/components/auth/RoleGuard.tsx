import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, roleHome } from "@/lib/auth";
import type { Role } from "@/types/models";

/**
 * Client-side role guard. Waits for the Supabase session to hydrate, then:
 *  - redirects unauthenticated users to /login (preserving `redirect`)
 *  - redirects users whose active role doesn't match this dashboard to their own home
 */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirect = typeof window !== "undefined" ? window.location.pathname : "/";
      navigate({ to: "/login", search: { redirect } as never });
      return;
    }
    if (user.role !== role) navigate({ to: roleHome(user.role) });
  }, [user, loading, role, navigate]);

  return <>{children}</>;
}
