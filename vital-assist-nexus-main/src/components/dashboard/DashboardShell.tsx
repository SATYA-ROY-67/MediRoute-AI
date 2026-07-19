import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { dashboardNav, roleMeta, type DashboardRole } from "@/constants/nav";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function DashboardShell({ role, children }: { role: DashboardRole; children: ReactNode }) {
  const meta = roleMeta[role];
  const nav = dashboardNav[role];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name ?? `${meta.label} User`;
  const initials = displayName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = () => { logout(); navigate({ to: "/login" }); };

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar lg:block">
        <SidebarContent role={role} nav={nav} pathname={pathname} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-sidebar lg:hidden"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
            >
              <SidebarContent role={role} nav={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <GlobalSearch />
            <div className="flex flex-1 items-center justify-end gap-2">
              <ThemeToggle />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3 text-sm transition-colors hover:bg-muted">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-gradient-primary text-[11px] font-semibold text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden font-medium sm:inline">{displayName}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <div className="text-xs font-normal text-muted-foreground">Signed in as</div>
                    <div className="truncate text-sm font-semibold">{user?.email ?? "guest@mediroute.io"}</div>
                    <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{meta.label}</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  role, nav, pathname, onNavigate,
}: {
  role: DashboardRole;
  nav: { label: string; to: string; icon: any }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const meta = roleMeta[role];
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-5 py-4">
        <Logo />
      </div>
      <div className="px-4 py-4">
        <div className={cn("rounded-xl bg-gradient-to-br p-3 text-primary-foreground shadow-glow", meta.accent)}>
          <div className="mb-1 flex items-center gap-2">
            <meta.icon className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Role</span>
          </div>
          <div className="font-display text-lg font-bold">{meta.label} Portal</div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-0.5 px-3 pb-4">
          {nav.map((item) => {
            const [base, hash] = item.to.split("#");
            const active = pathname === base && !hash;
            return (
              <Link
                key={item.to}
                to={base as string}
                hash={hash}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent p-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-semibold">System Online</div>
            <div className="text-muted-foreground">All services operational</div>
          </div>
          <Badge variant="secondary" className="text-[10px]">v1.0</Badge>
        </div>
      </div>
    </div>
  );
}
