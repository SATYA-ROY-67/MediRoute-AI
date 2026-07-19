import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Siren, MapPin, Ambulance, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, fmtRelative } from "@/lib/db-helpers";

export const Route = createFileRoute("/sos-history")({
  head: () => ({ meta: [{ title: "SOS History — MediRoute" }] }),
  component: SosHistoryPage,
});

type Sos = { id: string; priority: string; reason: string; location_text: string|null; status: string; hospital_name: string|null; ambulance_code: string|null; eta_min: number|null; distance_km: number|null; created_at: string };

function SosHistoryPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Sos[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("sos_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRows((data ?? []) as Sos[]);
    setLoading(false);
  };
  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("sos:" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("sos_requests").delete().eq("id", id);
    if (error) return toast.error(error.message); else toast.success("Removed");
  };

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-6"><h1 className="font-display text-3xl font-bold tracking-tight">SOS History</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every emergency you have triggered — status, dispatched vehicle and hospital.</p></header>
        <Card className="p-5">
          {loading ? <div className="space-y-2">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
            : rows.length === 0 ? (
              <div className="grid place-items-center py-16 text-center"><Siren className="h-10 w-10 text-muted-foreground"/><p className="mt-3 font-semibold">No SOS activity yet</p></div>
            ) : (
              <div className="space-y-3">
                {rows.map(s => (
                  <div key={s.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={s.priority === "critical" ? "destructive" : "secondary"} className="capitalize">{s.priority}</Badge>
                          <Badge variant="outline" className="capitalize">{s.status}</Badge>
                          <span className="text-xs text-muted-foreground">{fmtDate(s.created_at, "PPpp")} · {fmtRelative(s.created_at)}</span>
                        </div>
                        <div className="mt-2 font-semibold">{s.reason}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3"/>{s.location_text ?? "—"}</span>
                          {s.ambulance_code && <span className="ml-3 inline-flex items-center gap-1"><Ambulance className="h-3 w-3"/>{s.ambulance_code}</span>}
                          {s.hospital_name && <span className="ml-3 inline-flex items-center gap-1"><Building2 className="h-3 w-3"/>{s.hospital_name}</span>}
                          {s.eta_min != null && <span className="ml-3">ETA {s.eta_min} min</span>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={()=>remove(s.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </Card>
      </PageTransition>
    </DashboardShell>
  );
}
