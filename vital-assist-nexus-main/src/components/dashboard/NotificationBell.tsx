import { useEffect, useState } from "react";
import { Bell, Siren, Calendar, Droplet, Building2, Info, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NotifRow = { id: string; title: string; body: string | null; kind: string; read: boolean; created_at: string };

const iconMap: Record<string, { icon: typeof Info; class: string }> = {
  emergency:   { icon: Siren,     class: "text-destructive bg-destructive/10" },
  appointment: { icon: Calendar,  class: "text-primary bg-primary/10" },
  blood:       { icon: Droplet,   class: "text-destructive bg-destructive/10" },
  hospital:    { icon: Building2, class: "text-accent bg-accent/10" },
  system:      { icon: Info,      class: "text-muted-foreground bg-muted" },
};
const iconFor = (k: string) => iconMap[k] ?? iconMap.system;

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotifRow[]>([]);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,kind,read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled && data) setItems(data as NotifRow[]);
    };
    load();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems((prev) => [payload.new as NotifRow, ...prev].slice(0, 30)))
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  const markAll = async () => {
    if (!user) return;
    setItems((p) => p.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  };
  const markOne = async (id: string) => {
    setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">{unread} unread</div>
          </div>
          <Button variant="ghost" size="sm" onClick={markAll} className="h-8 text-xs" disabled={!unread}>
            <Check className="mr-1 h-3.5 w-3.5" /> Mark all
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">You're all caught up.</div>
          ) : (
            <AnimatePresence initial={false}>
              {items.map((n) => {
                const meta = iconFor(n.kind);
                return (
                  <motion.button
                    key={n.id}
                    onClick={() => markOne(n.id)}
                    layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                      !n.read && "bg-primary/[0.03]",
                    )}
                  >
                    <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", meta.class)}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-semibold">{n.title}</div>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
