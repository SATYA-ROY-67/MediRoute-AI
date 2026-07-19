import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Building2, Droplet, FileText, Calendar, Siren, User as UserIcon, Loader2 } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Row = { id: string; label: string; sub: string; group: string; icon: typeof Building2; to: string };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen(v => !v); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    setLoading(true);
    const t = setTimeout(async () => {
      const like = term ? `%${term}%` : null;
      const [hosp, banks, recs, appts, sos, brs, contacts] = await Promise.all([
        like ? supabase.from("hospitals").select("id,name,city").or(`name.ilike.${like},city.ilike.${like}`).limit(6)
             : supabase.from("hospitals").select("id,name,city").limit(6),
        like ? supabase.from("blood_banks").select("id,name,city").or(`name.ilike.${like},city.ilike.${like}`).limit(6)
             : supabase.from("blood_banks").select("id,name,city").limit(6),
        user && like ? supabase.from("medical_records").select("id,title,record_type,doctor").eq("user_id", user.id).or(`title.ilike.${like},doctor.ilike.${like},diagnosis.ilike.${like}`).limit(6) : { data: [] as never[] },
        user && like ? supabase.from("appointments").select("id,doctor_name,specialty,appt_at").eq("user_id", user.id).or(`doctor_name.ilike.${like},specialty.ilike.${like},hospital.ilike.${like}`).limit(6) : { data: [] as never[] },
        user ? supabase.from("sos_requests").select("id,reason,priority,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4) : { data: [] as never[] },
        like ? supabase.from("blood_requests").select("id,patient_name,blood_group,hospital,urgency").or(`patient_name.ilike.${like},hospital.ilike.${like},blood_group.ilike.${like}`).limit(6) : { data: [] as never[] },
        user && like ? supabase.from("emergency_contacts").select("id,name,relation,phone").eq("user_id", user.id).or(`name.ilike.${like},relation.ilike.${like},phone.ilike.${like}`).limit(6) : { data: [] as never[] },
      ]);
      const out: Row[] = [];
      (hosp.data ?? []).forEach((h: { id: string; name: string; city: string | null }) => out.push({ id: h.id, label: h.name, sub: h.city ?? "", group: "Hospitals", icon: Building2, to: "/map" }));
      (banks.data ?? []).forEach((b: { id: string; name: string; city: string | null }) => out.push({ id: b.id, label: b.name, sub: b.city ?? "", group: "Blood Banks", icon: Droplet, to: "/dashboard/blood-bank" }));
      (recs.data ?? []).forEach((r: { id: string; title: string; record_type: string; doctor: string | null }) => out.push({ id: r.id, label: r.title, sub: `${r.record_type} · ${r.doctor ?? ""}`, group: "Medical Records", icon: FileText, to: "/records" }));
      (appts.data ?? []).forEach((a: { id: string; doctor_name: string; specialty: string | null; appt_at: string }) => out.push({ id: a.id, label: a.doctor_name, sub: `${a.specialty ?? ""} · ${new Date(a.appt_at).toLocaleDateString()}`, group: "Appointments", icon: Calendar, to: "/appointments" }));
      (sos.data ?? []).forEach((s: { id: string; reason: string; priority: string; status: string }) => out.push({ id: s.id, label: s.reason, sub: `${s.priority} · ${s.status}`, group: "SOS", icon: Siren, to: "/sos-history" }));
      (brs.data ?? []).forEach((r: { id: string; patient_name: string; blood_group: string; hospital: string | null; urgency: string }) => out.push({ id: r.id, label: `${r.blood_group} — ${r.patient_name}`, sub: `${r.hospital ?? "—"} · ${r.urgency}`, group: "Blood Requests", icon: Droplet, to: "/blood-requests" }));
      (contacts.data ?? []).forEach((c: { id: string; name: string; relation: string | null; phone: string }) => out.push({ id: c.id, label: c.name, sub: `${c.relation ?? "—"} · ${c.phone}`, group: "Contacts", icon: UserIcon, to: "/contacts" }));
      setRows(out);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, open, user]);

  const grouped = useMemo(() => {
    const map: Record<string, Row[]> = {};
    for (const r of rows) (map[r.group] ??= []).push(r);
    return map;
  }, [rows]);

  const go = (to: string) => { setOpen(false); navigate({ to }); };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative hidden max-w-md flex-1 md:block"
        type="button"
      >
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <Input
          readOnly
          placeholder="Search hospitals, records, appointments…"
          className="pl-9 pr-14 cursor-pointer group-hover:bg-muted/60"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search across MediRoute…" value={q} onValueChange={setQ} />
        <CommandList>
          {loading && <div className="flex items-center justify-center py-6 text-xs text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Searching…</div>}
          {!loading && rows.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
          {Object.entries(grouped).map(([group, items], idx) => (
            <div key={group}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map(r => (
                  <CommandItem key={`${group}-${r.id}`} value={`${group} ${r.label} ${r.sub}`} onSelect={() => go(r.to)}>
                    <r.icon className="mr-2 h-4 w-4 text-primary" />
                    <div className="flex flex-col"><span className="font-medium">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.sub}</span></div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
