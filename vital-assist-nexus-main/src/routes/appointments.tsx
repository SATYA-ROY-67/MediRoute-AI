import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, Loader2, Check, X } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, fmtRelative } from "@/lib/db-helpers";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "Appointments — MediRoute" }] }),
  component: AppointmentsPage,
});

type Appt = { id: string; doctor_name: string; specialty: string|null; hospital: string|null; appt_at: string; status: "upcoming"|"completed"|"cancelled"; notes: string|null };

function AppointmentsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ doctor_name: "", specialty: "", hospital: "", appt_at: "", notes: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("appointments").select("*").eq("user_id", user.id).order("appt_at", { ascending: true });
    setRows((data ?? []) as Appt[]);
    setLoading(false);
  };
  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("appt:" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const submit = async () => {
    if (!user) return;
    if (!form.doctor_name.trim() || !form.appt_at) return toast.error("Doctor and date/time are required");
    setSaving(true);
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id, doctor_name: form.doctor_name.trim(),
      specialty: form.specialty || null, hospital: form.hospital || null,
      appt_at: new Date(form.appt_at).toISOString(),
      notes: form.notes || null, status: "upcoming",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Appointment booked");
    setOpen(false);
    setForm({ doctor_name: "", specialty: "", hospital: "", appt_at: "", notes: "" });
  };

  const setStatus = async (id: string, status: Appt["status"]) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
  };

  const now = Date.now();
  const upcoming = rows.filter(r => r.status === "upcoming" && new Date(r.appt_at).getTime() >= now);
  const past = rows.filter(r => r.status !== "upcoming" || new Date(r.appt_at).getTime() < now);

  const renderList = (list: Appt[]) => (
    list.length === 0 ? (
      <div className="grid place-items-center py-16 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground"/>
        <p className="mt-3 font-semibold">Nothing here yet</p>
      </div>
    ) : (
      <div className="space-y-3">
        {list.map(a => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div>
              <div className="font-semibold">{a.doctor_name} <span className="text-muted-foreground font-normal">· {a.specialty ?? "General"}</span></div>
              <div className="text-xs text-muted-foreground">{a.hospital ?? "—"} · {fmtDate(a.appt_at, "PPpp")} <span className="opacity-70">({fmtRelative(a.appt_at)})</span></div>
              {a.notes && <div className="mt-1 text-xs">{a.notes}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={a.status === "upcoming" ? "default" : a.status === "completed" ? "secondary" : "destructive"} className="capitalize">{a.status}</Badge>
              {a.status === "upcoming" && (
                <>
                  <Button size="icon" variant="ghost" onClick={()=>setStatus(a.id, "completed")}><Check className="h-4 w-4 text-success"/></Button>
                  <Button size="icon" variant="ghost" onClick={()=>setStatus(a.id, "cancelled")}><X className="h-4 w-4 text-destructive"/></Button>
                </>
              )}
              <Button size="icon" variant="ghost" className="text-destructive" onClick={()=>remove(a.id)}><Trash2 className="h-4 w-4"/></Button>
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="font-display text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="mt-1 text-sm text-muted-foreground">Book, track and manage clinical visits.</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4"/>Book appointment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New appointment</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Doctor *</Label><Input value={form.doctor_name} onChange={e=>setForm({...form, doctor_name: e.target.value})}/></div>
                <div><Label>Specialty</Label><Input value={form.specialty} onChange={e=>setForm({...form, specialty: e.target.value})}/></div>
                <div><Label>Hospital</Label><Input value={form.hospital} onChange={e=>setForm({...form, hospital: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Date & time *</Label><Input type="datetime-local" value={form.appt_at} onChange={e=>setForm({...form, appt_at: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Book</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="p-5">
          {loading ? <div className="space-y-2">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-16"/>)}</div> : (
            <Tabs defaultValue="upcoming">
              <TabsList><TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger><TabsTrigger value="past">Past ({past.length})</TabsTrigger></TabsList>
              <TabsContent value="upcoming" className="mt-4">{renderList(upcoming)}</TabsContent>
              <TabsContent value="past" className="mt-4">{renderList(past)}</TabsContent>
            </Tabs>
          )}
        </Card>
      </PageTransition>
    </DashboardShell>
  );
}
