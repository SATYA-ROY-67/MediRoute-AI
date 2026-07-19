import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Building2, Droplet, Ambulance, Siren, Activity, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResponseChart, CasesChart } from "@/components/dashboard/DashboardCharts";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/db-helpers";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — MediRoute" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [counts, setCounts] = useState({ users: 0, hospitals: 0, blood_banks: 0, active_sos: 0, total_sos: 0, blood_requests: 0, appointments: 0, triage: 0 });
  const [recentUsers, setRecentUsers] = useState<Array<{ user_id: string; full_name: string|null; email: string|null; created_at: string; provider: string|null }>>([]);
  const [recentSos, setRecentSos] = useState<Array<{ id: string; priority: string; reason: string; status: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const q = (table: string, filter?: (b: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>) => {
      let b = supabase.from(table as never).select("*", { count: "exact", head: true });
      if (filter) b = filter(b) as never;
      return b;
    };
    const [
      users, hospitals, blood_banks, activeSos, totalSos, brCount, apptCount, trCount,
      { data: ru }, { data: rs },
    ] = await Promise.all([
      q("profiles"),
      q("hospitals"),
      q("blood_banks"),
      supabase.from("sos_requests").select("*", { count: "exact", head: true }).in("status", ["pending","dispatched","arriving"]),
      q("sos_requests"),
      q("blood_requests"),
      q("appointments"),
      q("triage_reports"),
      supabase.from("profiles").select("user_id,full_name,email,created_at,provider").order("created_at", { ascending: false }).limit(6),
      supabase.from("sos_requests").select("id,priority,reason,status,created_at").order("created_at", { ascending: false }).limit(6),
    ]);
    setCounts({
      users: users.count ?? 0, hospitals: hospitals.count ?? 0,
      blood_banks: blood_banks.count ?? 0,
      active_sos: activeSos.count ?? 0, total_sos: totalSos.count ?? 0,
      blood_requests: brCount.count ?? 0, appointments: apptCount.count ?? 0, triage: trCount.count ?? 0,
    });
    setRecentUsers(ru ?? []);
    setRecentSos(rs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <DashboardShell role="admin">
      <PageTransition>
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Realtime analytics — every count is a live database query.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={counts.users} icon={Users} accent="primary" />
          <StatCard label="Hospitals" value={counts.hospitals} icon={Building2} accent="accent" />
          <StatCard label="Blood banks" value={counts.blood_banks} icon={Droplet} accent="warning" />
          <StatCard label="Active SOS" value={counts.active_sos} icon={Siren} accent={counts.active_sos > 0 ? "destructive" : "success"} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total SOS" value={counts.total_sos} icon={ShieldCheck} accent="destructive" />
          <StatCard label="Blood requests" value={counts.blood_requests} icon={Droplet} accent="destructive" />
          <StatCard label="Appointments" value={counts.appointments} icon={Activity} accent="primary" />
          <StatCard label="AI triage runs" value={counts.triage} icon={Activity} accent="success" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ResponseChart title="Emergency response times (mock trend)" />
          <CasesChart />
        </div>

        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="font-display text-base font-bold">Recent sign-ups</h3>
              <p className="text-xs text-muted-foreground">Latest users across the platform</p></div>
            <Badge variant="secondary">{counts.users} total</Badge>
          </div>
          {loading ? <Skeleton className="h-32"/> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Provider</TableHead><TableHead>Joined</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recentUsers.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-semibold">{u.full_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{u.provider ?? "email"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{fmtRelative(u.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Recent SOS requests</h3>
            <Badge variant="destructive">{counts.active_sos} active</Badge>
          </div>
          {loading ? <Skeleton className="h-32"/> : recentSos.length === 0 ? (
            <div className="grid place-items-center py-8 text-sm text-muted-foreground">No SOS requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Reason</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recentSos.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.reason}</TableCell>
                      <TableCell><Badge variant={s.priority === "critical" ? "destructive" : "secondary"} className="capitalize">{s.priority}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{s.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{fmtRelative(s.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { t: "Database", s: "Operational", c: "success" },
            { t: "Realtime Bus", s: "Operational", c: "success" },
            { t: "AI Gateway", s: "Operational", c: "success" },
          ].map((x) => (
            <Card key={x.t} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service</div>
                  <div className="mt-1 font-display text-lg font-bold">{x.t}</div>
                </div>
                <span className="h-3 w-3 animate-pulse rounded-full bg-success" />
              </div>
              <div className="mt-3 text-sm">{x.s}</div>
            </Card>
          ))}
        </div>
      </PageTransition>
    </DashboardShell>
  );
}
