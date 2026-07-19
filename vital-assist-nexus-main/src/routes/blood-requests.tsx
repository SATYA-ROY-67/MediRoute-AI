import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplet, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/db-helpers";

export const Route = createFileRoute("/blood-requests")({
  head: () => ({ meta: [{ title: "Blood Requests — MediRoute" }] }),
  component: BloodRequestsPage,
});

type BR = { id: string; user_id: string; patient_name: string; blood_group: string; units_needed: number; urgency: "critical"|"high"|"moderate"|"low"; hospital: string|null; city: string|null; contact_phone: string|null; status: string|null; notes: string|null; created_at: string };

const GROUPS = ["O+","O-","A+","A-","B+","B-","AB+","AB-"];
const URGS: BR["urgency"][] = ["critical","high","moderate","low"];

function BloodRequestsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BR[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient_name: "", blood_group: "O+", units_needed: 1, urgency: "high" as BR["urgency"], hospital: "", city: "", contact_phone: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("blood_requests").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as BR[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("br")
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_requests" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    if (!user) return;
    if (!form.patient_name.trim()) return toast.error("Patient name required");
    setSaving(true);
    const { error } = await supabase.from("blood_requests").insert({
      user_id: user.id, patient_name: form.patient_name.trim(),
      blood_group: form.blood_group, units_needed: form.units_needed,
      urgency: form.urgency, hospital: form.hospital || null, city: form.city || null,
      contact_phone: form.contact_phone || null, notes: form.notes || null, status: "open",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Request posted");
    setOpen(false);
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("blood_requests").delete().eq("id", id);
    if (error) return toast.error(error.message); else toast.success("Removed");
  };
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("blood_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
  };

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="font-display text-3xl font-bold tracking-tight">Blood Requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">Community-wide urgent blood needs — updates in realtime.</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-emergency text-destructive-foreground"><Plus className="mr-2 h-4 w-4"/>Post request</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New blood request</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Patient / recipient name *</Label><Input value={form.patient_name} onChange={e=>setForm({...form, patient_name: e.target.value})}/></div>
                <div><Label>Blood group</Label><select value={form.blood_group} onChange={e=>setForm({...form, blood_group: e.target.value})} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{GROUPS.map(g=><option key={g}>{g}</option>)}</select></div>
                <div><Label>Units</Label><Input type="number" min={1} max={20} value={form.units_needed} onChange={e=>setForm({...form, units_needed: +e.target.value})}/></div>
                <div><Label>Urgency</Label><select value={form.urgency} onChange={e=>setForm({...form, urgency: e.target.value as BR["urgency"]})} className="h-10 w-full rounded-md border bg-background px-3 text-sm capitalize">{URGS.map(u=><option key={u}>{u}</option>)}</select></div>
                <div><Label>City</Label><Input value={form.city} onChange={e=>setForm({...form, city: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Hospital</Label><Input value={form.hospital} onChange={e=>setForm({...form, hospital: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Contact phone</Label><Input value={form.contact_phone} onChange={e=>setForm({...form, contact_phone: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Post</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="p-5">
          {loading ? <div className="space-y-2">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
            : rows.length === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <Droplet className="h-10 w-10 text-muted-foreground"/>
                <p className="mt-3 font-semibold">No active requests</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {rows.map(r => (
                  <div key={r.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 font-display text-lg font-bold text-destructive">{r.blood_group}</div>
                        <div>
                          <div className="font-semibold">{r.patient_name}</div>
                          <div className="text-xs text-muted-foreground">{r.hospital ?? ""}{r.city ? ` · ${r.city}` : ""}</div>
                        </div>
                      </div>
                      <Badge variant={r.urgency === "critical" ? "destructive" : r.urgency === "high" ? "default" : "secondary"} className="capitalize">{r.urgency}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{r.units_needed} units</span>
                      <span>· {fmtRelative(r.created_at)}</span>
                      <span>· <span className="capitalize">{r.status ?? "open"}</span></span>
                    </div>
                    {r.notes && <div className="mt-2 text-sm">{r.notes}</div>}
                    <div className="mt-3 flex justify-end gap-1">
                      {r.contact_phone && <a href={`tel:${r.contact_phone}`}><Button size="sm" variant="outline">Call donor line</Button></a>}
                      {r.user_id === user?.id && (
                        <>
                          {r.status !== "fulfilled" && <Button size="sm" variant="secondary" onClick={()=>setStatus(r.id, "fulfilled")}>Mark fulfilled</Button>}
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={()=>remove(r.id)}><Trash2 className="h-4 w-4"/></Button>
                        </>
                      )}
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
