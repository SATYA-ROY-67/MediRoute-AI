import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Download, Trash2, Plus } from "lucide-react";
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
import { downloadTriagePdf, type TriageReportRow } from "@/lib/triage-pdf";

export const Route = createFileRoute("/triage-history")({
  head: () => ({ meta: [{ title: "AI Triage History — MediRoute" }] }),
  component: TriageHistoryPage,
});

function TriageHistoryPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<TriageReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("triage_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setRows((data ?? []) as TriageReportRow[]);
    setLoading(false);
  };
  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("tr:" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "triage_reports", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("triage_reports").delete().eq("id", id);
    if (error) return toast.error(error.message); else toast.success("Deleted");
  };

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="font-display text-3xl font-bold tracking-tight">AI Triage Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Every AI assessment you have run — downloadable as PDF.</p></div>
          <Button asChild className="bg-gradient-primary text-primary-foreground"><Link to="/triage"><Plus className="mr-2 h-4 w-4"/>New assessment</Link></Button>
        </header>
        <Card className="p-5">
          {loading ? <div className="space-y-2">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
            : rows.length === 0 ? (
              <div className="grid place-items-center py-16 text-center"><Brain className="h-10 w-10 text-muted-foreground"/><p className="mt-3 font-semibold">No triage reports yet</p></div>
            ) : (
              <div className="space-y-3">
                {rows.map(r => (
                  <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={r.severity === "critical" ? "destructive" : r.severity === "high" ? "default" : "secondary"} className="capitalize">{r.severity}</Badge>
                        <Badge variant="outline">Risk {r.risk_score}</Badge>
                        <Badge variant="outline">{r.confidence}% conf.</Badge>
                        <Badge variant="outline">{r.department}</Badge>
                        <span className="text-xs text-muted-foreground">{fmtDate(r.created_at, "PPpp")} · {fmtRelative(r.created_at)}</span>
                      </div>
                      <div className="mt-2 text-sm">{r.ai_summary}</div>
                      {r.possible_conditions?.length ? <div className="mt-1 text-xs text-muted-foreground">Possible: {r.possible_conditions.join(", ")}</div> : null}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={()=>downloadTriagePdf(r, user?.name)}><Download className="mr-1 h-3.5 w-3.5"/>PDF</Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={()=>remove(r.id)}><Trash2 className="h-4 w-4"/></Button>
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
