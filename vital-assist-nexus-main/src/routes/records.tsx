import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Trash2, Download, Plus, Search, Loader2 } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/db-helpers";

export const Route = createFileRoute("/records")({
  head: () => ({ meta: [{ title: "Medical Records — MediRoute" }] }),
  component: RecordsPage,
});

type Rec = {
  id: string; record_type: string; title: string;
  doctor: string | null; hospital: string | null;
  diagnosis: string | null; prescription: string | null;
  record_date: string | null; status: string | null;
  file_path: string | null; file_name: string | null; file_type: string | null;
  notes: string | null; created_at: string;
};

const TYPES = ["Prescription","Lab Report","Imaging","Discharge","Vaccination","Other"];

function RecordsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    record_type: "Prescription", title: "", doctor: "", hospital: "",
    diagnosis: "", prescription: "", record_date: "", notes: "",
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("medical_records")
      .select("*").eq("user_id", user.id).order("record_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
    setRows((data ?? []) as Rec[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("mr:" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "medical_records", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const submit = async () => {
    if (!user || !form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    let file_path: string | null = null; let file_name: string | null = null;
    let file_size: number | null = null; let file_type: string | null = null;
    const f = fileRef.current?.files?.[0];
    if (f) {
      if (f.size > 15 * 1024 * 1024) { setSaving(false); return toast.error("Max file size 15 MB"); }
      const ext = f.name.split(".").pop() ?? "bin";
      file_path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("medical-records").upload(file_path, f, { upsert: false, contentType: f.type });
      if (upErr) { setSaving(false); return toast.error(upErr.message); }
      file_name = f.name; file_size = f.size; file_type = f.type;
    }
    const { error } = await supabase.from("medical_records").insert({
      user_id: user.id, record_type: form.record_type, title: form.title.trim(),
      doctor: form.doctor || null, hospital: form.hospital || null,
      diagnosis: form.diagnosis || null, prescription: form.prescription || null,
      record_date: form.record_date || null, notes: form.notes || null,
      file_path, file_name, file_size, file_type, status: "active",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Record added");
    setOpen(false);
    setForm({ record_type: "Prescription", title: "", doctor: "", hospital: "", diagnosis: "", prescription: "", record_date: "", notes: "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (r: Rec) => {
    if (r.file_path) await supabase.storage.from("medical-records").remove([r.file_path]);
    const { error } = await supabase.from("medical_records").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Record removed");
  };

  const download = async (r: Rec) => {
    if (!r.file_path) return;
    const { data, error } = await supabase.storage.from("medical-records").createSignedUrl(r.file_path, 60);
    if (error || !data) return toast.error(error?.message ?? "Cannot open file");
    window.open(data.signedUrl, "_blank");
  };

  const filtered = rows.filter(r =>
    !q || `${r.title} ${r.doctor} ${r.hospital} ${r.record_type} ${r.diagnosis}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Medical Records</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload, organise and share your clinical history.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4"/>New record</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add medical record</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Type</Label><select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.record_type} onChange={e=>setForm({...form, record_type: e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                <div><Label>Date</Label><Input type="date" value={form.record_date} onChange={e=>setForm({...form, record_date: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="e.g. Blood work — Aug 2026" /></div>
                <div><Label>Doctor</Label><Input value={form.doctor} onChange={e=>setForm({...form, doctor: e.target.value})}/></div>
                <div><Label>Hospital / Lab</Label><Input value={form.hospital} onChange={e=>setForm({...form, hospital: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={e=>setForm({...form, diagnosis: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Prescription</Label><Textarea rows={2} value={form.prescription} onChange={e=>setForm({...form, prescription: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/></div>
                <div className="sm:col-span-2"><Label>Attachment (PDF/Image, ≤15 MB)</Label><Input ref={fileRef} type="file" accept="application/pdf,image/*" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}Save record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search records…" className="pl-9"/>
            </div>
            <Badge variant="secondary">{filtered.length} of {rows.length}</Badge>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-12"/>)}</div>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground"/>
              <p className="mt-3 font-semibold">No records yet</p>
              <p className="text-sm text-muted-foreground">Upload your first prescription or lab report.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Title</TableHead><TableHead>Type</TableHead>
                  <TableHead>Doctor</TableHead><TableHead>Date</TableHead>
                  <TableHead>File</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}<div className="text-xs text-muted-foreground">{r.diagnosis}</div></TableCell>
                      <TableCell><Badge variant="outline">{r.record_type}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{r.doctor ?? "—"}<div className="text-xs">{r.hospital ?? ""}</div></TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(r.record_date)}</TableCell>
                      <TableCell>{r.file_path ? <Badge variant="secondary" className="truncate max-w-[140px]">{r.file_name}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {r.file_path && <Button size="icon" variant="ghost" onClick={()=>download(r)}><Download className="h-4 w-4"/></Button>}
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete record?</AlertDialogTitle>
                                <AlertDialogDescription>This permanently removes "{r.title}" and any attached file.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive" onClick={()=>remove(r)}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </PageTransition>
    </DashboardShell>
  );
}
