import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { User, Role } from "@/types/models";

/**
 * MediRoute auth — powered by Lovable Cloud (Supabase under the hood).
 * Keeps the previous `useAuth()` shape so existing consumers don't break,
 * but every value is now backed by a real session, database profile, and
 * the `user_roles` table.
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: Role) => Promise<User>;
  register: (name: string, email: string, password: string, role: Role) => Promise<User>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** DB roles use underscore (`blood_bank`), the UI keeps the legacy hyphen (`blood-bank`). Normalise both ways. */
function toUiRole(dbRole: string | null | undefined): Role {
  if (!dbRole) return "patient";
  if (dbRole === "blood_bank") return "blood-bank";
  return dbRole as Role;
}
function toDbRole(uiRole: Role): string {
  return uiRole === "blood-bank" ? "blood_bank" : uiRole;
}

export function roleHome(role: Role | string): string {
  const r = toUiRole(String(role));
  return `/dashboard/${r}`;
}

async function loadUserFromSession(session: Session): Promise<User> {
  const uid = session.user.id;
  // Fetch profile + role in parallel (RLS scopes to auth.uid())
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", uid).limit(1).maybeSingle(),
  ]);

  const role = toUiRole(roleRow?.role);
  return {
    id: uid,
    name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "MediRoute user",
    email: session.user.email ?? "",
    role,
    phone: profile?.phone ?? undefined,
    avatarUrl: profile?.avatar_url ?? undefined,
    verified: !!session.user.email_confirmed_at || session.user.app_metadata?.provider !== "email",
    createdAt: session.user.created_at ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Register listener FIRST (per Supabase auth-state pattern)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess) {
        // Defer DB reads a tick to keep the listener non-blocking
        setTimeout(() => {
          if (!mounted) return;
          loadUserFromSession(sess).then((u) => mounted && setUser(u));
        }, 0);
      } else {
        setUser(null);
      }
    });

    // 2. Then check existing session
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        const u = await loadUserFromSession(data.session);
        if (mounted) setUser(u);
      }
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string, _role?: Role): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error("No session returned");
    const u = await loadUserFromSession(data.session);
    // touch last_login
    await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("user_id", u.id);
    setUser(u);
    return u;
  };

  const register = async (name: string, email: string, password: string, role: Role): Promise<User> => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: name, role: toDbRole(role) },
      },
    });
    if (error) throw error;
    // Trigger auto-creates profile + role + settings row via handle_new_user()
    if (data.session) {
      const u = await loadUserFromSession(data.session);
      setUser(u);
      return u;
    }
    // No session = email confirmation required
    return {
      id: data.user?.id ?? "",
      name, email, role, verified: false,
      createdAt: data.user?.created_at ?? new Date().toISOString(),
    };
  };

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if (result.error) throw result.error;
  };

  const resetPassword = async (email: string) => {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUser = async (patch: Partial<User>) => {
    if (!user) return;
    const dbPatch: { full_name?: string; phone?: string; avatar_url?: string } = {};
    if (patch.name !== undefined) dbPatch.full_name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    if (Object.keys(dbPatch).length) {
      await supabase.from("profiles").update(dbPatch).eq("user_id", user.id);
    }
    setUser({ ...user, ...patch });
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) setUser(await loadUserFromSession(data.session));
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      isAuthenticated: !!session,
      login, register, signInWithGoogle, resetPassword, updatePassword, logout, updateUser, refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
