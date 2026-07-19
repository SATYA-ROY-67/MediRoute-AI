import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, Plus, Trash2, Edit2, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Emergency Contacts — MediRoute" }] }),
  component: ContactsPage,
});

type Contact = { id: string; name: string; relation: string|null; phone: string; priority: number };

function ContactsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", relation: "", phone: "", priority: 1 });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("emergency_contacts").select("*").eq("user_id", user.id).order("priority");
    setRows((data ?? []) as Contact[]);
    setLoading(false);
  };
  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("ec:" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_contacts", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openNew = () => { setEditing(null); setForm({ name: "", relation: "", phone: "", priority: (rows.length + 1) }); setOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setForm({ name: c.name, relation: c.relation ?? "", phone: c.phone, priority: c.priority }); setOpen(true); };

  const submit = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.phone.trim()) return toast.error("Name and phone are required");
    setSaving(true);
    const payload = { user_id: user.id, name: form.name.trim(), relation: form.relation || null, phone: form.phone.trim(), priority: form.priority || 1 };
    const { error } = editing
      ? await supabase.from("emergency_contacts").update(payload).eq("id", editing.id)
      : await supabase.from("emergency_contacts").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Contact updated" : "Contact added");
    setOpen(false);
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
    if (error) return toast.error(error.message); else toast.success("Removed");
  };

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="font-display text-3xl font-bold tracking-tight">Emergency Contacts</h1>
            <p className="mt-1 text-sm text-muted-foreground">Priority-ordered — the top contact is auto-called during SOS.</p></div>
          <Button onClick={openNew} className="bg-gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4"/>Add contact</Button>
        </header>

        <Card className="p-5">
          {loading ? <div className="space-y-2">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
            : rows.length === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <Phone className="h-10 w-10 text-muted-foreground"/>
                <p className="mt-3 font-semibold">No contacts yet</p>
                <p className="text-sm text-muted-foreground">Add at least one so responders can reach your family.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map(c => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><UserIcon className="h-5 w-5"/></div>
                      <div>
                        <div className="font-semibold">{c.name} <Badge variant="secondary" className="ml-1 text-[10px]">#{c.priority}</Badge></div>
                        <div className="text-xs text-muted-foreground">{c.relation ?? "—"} · {c.phone}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <a href={`tel:${c.phone}`}><Button size="sm" variant="outline"><Phone className="mr-1 h-3.5 w-3.5"/>Call</Button></a>
                      <Button size="icon" variant="ghost" onClick={()=>openEdit(c)}><Edit2 className="h-4 w-4"/></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={()=>remove(c.id)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit contact" : "New emergency contact"}</DialogTitle></DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Full name *</Label><Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/></div>
              <div><Label>Relation</Label><Input value={form.relation} onChange={e=>setForm({...form, relation: e.target.value})} placeholder="e.g. Spouse"/></div>
              <div><Label>Priority</Label><Input type="number" min={1} max={9} value={form.priority} onChange={e=>setForm({...form, priority: +e.target.value})}/></div>
              <div className="sm:col-span-2"><Label>Phone *</Label><Input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="+91 …"/></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{editing ? "Save" : "Add"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </DashboardShell>
  );
}
