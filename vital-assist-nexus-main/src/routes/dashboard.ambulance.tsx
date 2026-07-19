import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ambulance, Clock, Siren, MapPin, Navigation } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/db-helpers";

export const Route = createFileRoute("/dashboard/ambulance")({
  head: () => ({ meta: [{ title: "Ambulance Dashboard — MediRoute" }] }),
  component: AmbulanceDashboard,
});

type Req = { id: string; patient_name: string|null; pickup: string|null; destination: string|null; status: string|null; assigned_ambulance: string|null; eta_min: number|null; created_at: string };

function AmbulanceDashboard() {
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("ambulance_requests").select("*").order("created_at", { ascending: false }).limit(20);
    setRows((data ?? []) as Req[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("amb").on("postgres_changes", { event: "*", schema: "public", table: "ambulance_requests" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const active = rows.filter(r => r.status && !["completed","cancelled"].includes(r.status));
  const completed = rows.filter(r => r.status === "completed");
  const avgEta = active.length ? Math.round(active.reduce((s, r) => s + (r.eta_min ?? 0), 0) / active.length) : 0;

  return (
    <DashboardShell role="ambulance">
      <PageTransition>
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Fleet Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live dispatches from patient SOS.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active dispatches" value={active.length} icon={Siren} accent="destructive" />
          <StatCard label="Completed trips" value={completed.length} icon={Ambulance} accent="success" />
          <StatCard label="Avg ETA" value={`${avgEta} min`} icon={Clock} accent="primary" />
          <StatCard label="Total requests" value={rows.length} icon={Navigation} accent="warning" />
        </div>

        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="font-display text-base font-bold">Active dispatches</h3>
              <p className="text-xs text-muted-foreground">Live from SOS module</p></div>
            <Badge variant="destructive">{active.length}</Badge>
          </div>
          {loading ? <Skeleton className="h-32"/> : active.length === 0 ? (
            <div className="grid place-items-center py-10 text-sm text-muted-foreground">All ambulances on standby.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Patient</TableHead><TableHead>Vehicle</TableHead>
                  <TableHead>Pickup</TableHead><TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead><TableHead>ETA</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {active.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.patient_name ?? "—"}</TableCell>
                      <TableCell className="font-mono">{r.assigned_ambulance ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3"/>{r.pickup ?? "—"}</TableCell>
                      <TableCell>{r.destination ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.status ?? "—"}</Badge></TableCell>
                      <TableCell className="font-semibold">{r.eta_min ?? "—"} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Recent trip history</h3>
          </div>
          {loading ? <Skeleton className="h-32"/> : completed.length === 0 ? (
            <div className="grid place-items-center py-10 text-sm text-muted-foreground">No completed trips yet.</div>
          ) : (
            <div className="space-y-2">
              {completed.slice(0,8).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                  <div>
                    <div className="font-semibold">{r.patient_name ?? "—"} · <span className="font-mono text-xs">{r.assigned_ambulance ?? "—"}</span></div>
                    <div className="text-xs text-muted-foreground">{r.pickup ?? "?"} → {r.destination ?? "?"}</div>
                  </div>
                  <div className="text-right"><Badge variant="secondary">completed</Badge>
                    <div className="mt-1 text-xs text-muted-foreground">{fmtRelative(r.created_at)}</div></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageTransition>
    </DashboardShell>
  );
}
