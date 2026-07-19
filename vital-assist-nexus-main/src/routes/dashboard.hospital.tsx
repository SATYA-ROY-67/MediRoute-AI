import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bed, Users, Activity, Siren } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResponseChart, CasesChart } from "@/components/dashboard/DashboardCharts";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/db-helpers";

export const Route = createFileRoute("/dashboard/hospital")({
  head: () => ({ meta: [{ title: "Hospital Dashboard — MediRoute" }] }),
  component: HospitalDashboard,
});

type Hospital = { id: string; name: string; city: string|null; icu_beds_free: number|null; icu_beds_total: number|null; general_beds_free: number|null; general_beds_total: number|null; doctors_on_duty: number|null; emergency_queue: number|null; rating: number|null; specialties: string[]|null };
type Incoming = { id: string; reason: string; priority: string; status: string; hospital_name: string|null; ambulance_code: string|null; eta_min: number|null; created_at: string };

function HospitalDashboard() {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: h }, { data: sos }, active] = await Promise.all([
      supabase.from("hospitals").select("*").order("rating", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("sos_requests").select("id,reason,priority,status,hospital_name,ambulance_code,eta_min,created_at").in("status", ["pending","dispatched","arriving","reached"]).order("created_at", { ascending: false }).limit(10),
      supabase.from("sos_requests").select("*", { count: "exact", head: true }).in("status", ["pending","dispatched","arriving"]),
    ]);
    setHospital(h as Hospital);
    setIncoming((sos ?? []) as Incoming[]);
    setActiveCount(active.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("hospital")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "hospitals" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const bedsFree = (hospital?.general_beds_free ?? 0) + (hospital?.icu_beds_free ?? 0);
  const bedsTotal = (hospital?.general_beds_total ?? 0) + (hospital?.icu_beds_total ?? 0);
  const icuPct = hospital ? Math.round(((hospital.icu_beds_total ?? 0) - (hospital.icu_beds_free ?? 0)) / Math.max(1, hospital.icu_beds_total ?? 0) * 100) : 0;

  return (
    <DashboardShell role="hospital">
      <PageTransition>
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">{hospital?.name ?? "Hospital"} Operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live overview of emergency and inpatient flows.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Incoming cases" value={activeCount} icon={Siren} accent="destructive" />
          <StatCard label="Beds available" value={`${bedsFree}/${bedsTotal}`} icon={Bed} accent="primary" />
          <StatCard label="ICU occupancy" value={`${icuPct}%`} icon={Activity} accent="warning" />
          <StatCard label="Doctors on duty" value={hospital?.doctors_on_duty ?? 0} icon={Users} accent="success" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ResponseChart title="Door-to-doctor time" />
          <CasesChart />
        </div>

        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="font-display text-base font-bold">Incoming SOS cases</h3>
              <p className="text-xs text-muted-foreground">Realtime dispatches from patients</p></div>
            <Badge variant="destructive">{activeCount} active</Badge>
          </div>
          {loading ? <Skeleton className="h-32"/> : incoming.length === 0 ? (
            <div className="grid place-items-center py-10 text-sm text-muted-foreground">No incoming cases right now.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Case</TableHead><TableHead>Severity</TableHead>
                  <TableHead>Ambulance</TableHead><TableHead>ETA</TableHead>
                  <TableHead>Status</TableHead><TableHead>When</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {incoming.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.reason}</TableCell>
                      <TableCell><Badge variant={c.priority === "critical" ? "destructive" : "secondary"} className="capitalize">{c.priority}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{c.ambulance_code ?? "—"}</TableCell>
                      <TableCell className="font-semibold">{c.eta_min != null ? `${c.eta_min} min` : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{c.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{fmtRelative(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {hospital && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-display text-base font-bold">Ward capacity</h3>
              <div className="mt-4 space-y-4">
                <Ward name="General ward" used={(hospital.general_beds_total ?? 0) - (hospital.general_beds_free ?? 0)} total={hospital.general_beds_total ?? 0} />
                <Ward name="ICU" used={(hospital.icu_beds_total ?? 0) - (hospital.icu_beds_free ?? 0)} total={hospital.icu_beds_total ?? 0} />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-display text-base font-bold">Specialties</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(hospital.specialties ?? []).map(s => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
              <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Rating</div>
                <div className="font-display text-xl font-bold">{hospital.rating?.toFixed(1) ?? "—"} <span className="text-xs font-normal text-muted-foreground">/ 5</span></div>
              </div>
            </Card>
          </div>
        )}
      </PageTransition>
    </DashboardShell>
  );
}

function Ward({ name, used, total }: { name: string; used: number; total: number }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{name}</span><span className="font-semibold">{used}/{total}</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
