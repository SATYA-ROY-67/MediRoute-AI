import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplet, Bell, Package, Activity } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/db-helpers";

export const Route = createFileRoute("/dashboard/blood-bank")({
  head: () => ({ meta: [{ title: "Blood Bank Dashboard — MediRoute" }] }),
  component: BloodBankDashboard,
});

type Bank = { id: string; name: string; city: string|null; inventory: Record<string, { units: number; capacity: number }> | null; critical_requests: number|null };
type Req = { id: string; patient_name: string; blood_group: string; units_needed: number; urgency: string; hospital: string|null; created_at: string };

const GROUPS = ["O+","O-","A+","A-","B+","B-","AB+","AB-"];

function BloodBankDashboard() {
  const [bank, setBank] = useState<Bank | null>(null);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: b }, { data: r }] = await Promise.all([
      supabase.from("blood_banks").select("*").limit(1).maybeSingle(),
      supabase.from("blood_requests").select("*").eq("status","open").order("created_at", { ascending: false }).limit(10),
    ]);
    setBank(b as Bank);
    setReqs((r ?? []) as Req[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("bb")
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_banks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const inv = bank?.inventory ?? {};
  const totalUnits = Object.values(inv).reduce((s, v) => s + (v?.units ?? 0), 0);
  const totalCap = Object.values(inv).reduce((s, v) => s + (v?.capacity ?? 0), 0);
  const pending = reqs.length;

  return (
    <DashboardShell role="blood-bank">
      <PageTransition>
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">{bank?.name ?? "Blood Bank"} Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track stock and pending requests in real time.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total units" value={totalUnits} icon={Droplet} accent="destructive" />
          <StatCard label="Capacity" value={totalCap} icon={Package} accent="primary" />
          <StatCard label="Fill rate" value={totalCap ? `${Math.round((totalUnits/totalCap)*100)}%` : "—"} icon={Activity} accent="success" />
          <StatCard label="Pending requests" value={pending} icon={Bell} accent={pending > 0 ? "warning" : "success"} />
        </div>

        <Card className="mt-6 p-5">
          <h3 className="font-display text-base font-bold">Inventory by blood group</h3>
          {loading ? <Skeleton className="mt-4 h-32"/> : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GROUPS.map(g => {
                const b = inv[g] ?? { units: 0, capacity: 0 };
                const pct = b.capacity > 0 ? (b.units / b.capacity) * 100 : 0;
                const low = pct < 30;
                return (
                  <div key={g} className={`rounded-2xl border p-4 transition-colors ${low ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-display text-2xl font-bold">{g}</div>
                      <div className={`grid h-8 w-8 place-items-center rounded-lg ${low ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
                        <Droplet className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-display text-xl font-bold">{b.units}</span>
                      <span className="text-xs text-muted-foreground">/ {b.capacity} units</span>
                    </div>
                    <Progress value={pct} className="mt-2" />
                    {low && <Badge variant="destructive" className="mt-2 text-[10px]">Low stock</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Open requests</h3>
            <Badge variant="destructive">{pending}</Badge>
          </div>
          {loading ? <Skeleton className="h-32"/> : reqs.length === 0 ? (
            <div className="grid place-items-center py-10 text-sm text-muted-foreground">No open requests.</div>
          ) : (
            <div className="space-y-3">
              {reqs.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 font-display text-sm font-bold text-destructive">{r.blood_group}</div>
                    <div>
                      <div className="text-sm font-semibold">{r.hospital ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.units_needed} units · {r.patient_name} · {fmtRelative(r.created_at)}</div>
                    </div>
                  </div>
                  <Badge variant={r.urgency === "critical" ? "destructive" : r.urgency === "high" ? "default" : "secondary"} className="capitalize">{r.urgency}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageTransition>
    </DashboardShell>
  );
}
