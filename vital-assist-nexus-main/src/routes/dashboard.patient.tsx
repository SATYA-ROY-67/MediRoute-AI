import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeartPulse, Calendar, FileText, Siren, MapPin, Phone, Activity, Droplet, Weight, Ruler } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResponseChart } from "@/components/dashboard/DashboardCharts";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { calcAge, calcBmi, bmiCategory, fmtDate, fmtRelative, profileCompletion } from "@/lib/db-helpers";

export const Route = createFileRoute("/dashboard/patient")({
  head: () => ({ meta: [{ title: "Patient Dashboard — MediRoute" }] }),
  component: PatientDashboard,
});

type Profile = { full_name: string|null; blood_group: string|null; height_cm: number|null; weight_kg: number|null; dob: string|null; address: string|null; allergies: string[]|null; conditions: string[]|null; avatar_url: string|null; phone: string|null };
type Appt = { id: string; doctor_name: string; specialty: string|null; hospital: string|null; appt_at: string; status: string };
type Rec = { id: string; title: string; record_type: string; doctor: string|null; record_date: string|null; status: string|null };
type Contact = { id: string; name: string; relation: string|null; phone: string };
type Sos = { id: string; status: string; priority: string; reason: string; created_at: string };

function PatientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sosCount, setSosCount] = useState(0);
  const [lastSos, setLastSos] = useState<Sos | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: prof }, { data: a }, { data: r }, { data: c }, { data: sos }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("appointments").select("*").eq("user_id", user.id).order("appt_at", { ascending: true }).limit(5),
      supabase.from("medical_records").select("*").eq("user_id", user.id).order("record_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(4),
      supabase.from("emergency_contacts").select("*").eq("user_id", user.id).order("priority").limit(3),
      supabase.from("sos_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    setProfile(prof as Profile);
    setAppts((a ?? []) as Appt[]);
    setRecords((r ?? []) as Rec[]);
    setContacts((c ?? []) as Contact[]);
    setLastSos((sos?.[0] as Sos) ?? null);
    const { count } = await supabase.from("sos_requests").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    setSosCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("patient-dash:" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "medical_records", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_contacts", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const firstName = (profile?.full_name || user?.name || "there").split(" ")[0];
  const age = calcAge(profile?.dob);
  const bmi = calcBmi(profile?.height_cm, profile?.weight_kg);
  const bmiCat = bmiCategory(bmi);
  const completion = profileCompletion(profile as unknown as Record<string, unknown>);
  const upcoming = appts.filter(a => a.status === "scheduled" && new Date(a.appt_at).getTime() >= Date.now());
  const nextAppt = upcoming[0];

  return (
    <DashboardShell role="patient">
      <PageTransition>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Hello, {firstName} 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Here's your health snapshot for today.</p>
          </div>
          <SosBanner />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Blood group" value={profile?.blood_group ?? "—"} icon={Droplet} accent="destructive" />
          <StatCard label="BMI" value={bmi ?? "—"} deltaLabel={bmiCat.label} icon={Activity} accent="primary" />
          <StatCard label="Age" value={age ?? "—"} icon={HeartPulse} accent="accent" />
          <StatCard label="SOS triggered" value={sosCount} icon={Siren} accent={sosCount > 0 ? "destructive" : "success"} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold">Profile completion</h3>
                  <p className="text-xs text-muted-foreground">Complete your medical profile for faster emergency response.</p>
                </div>
                <Button asChild size="sm" variant="outline"><Link to="/profile">Edit profile</Link></Button>
              </div>
              <Progress value={completion} />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{completion}% complete</span>
                {completion < 80 && <Badge variant="destructive" className="text-[10px]">Add missing fields</Badge>}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
                <Fact icon={Ruler}  label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "—"} />
                <Fact icon={Weight} label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "—"} />
                <Fact icon={MapPin} label="Address" value={profile?.address ?? "—"} />
              </div>
            </Card>
            <ResponseChart title="Weekly vitals trend" />
          </div>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Upcoming appointments</h3>
              <Button asChild size="sm" variant="ghost"><Link to="/appointments">View all</Link></Button>
            </div>
            {loading ? <Skeleton className="mt-4 h-24" /> : upcoming.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No upcoming visits.<Link to="/appointments" className="ml-1 text-primary hover:underline">Book one →</Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {upcoming.slice(0,3).map(a => (
                  <div key={a.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">{a.doctor_name}</div>
                        <div className="text-xs text-muted-foreground">{a.specialty ?? "General"} · {fmtDate(a.appt_at, "PP p")}</div>
                        <div className="text-[10px] text-muted-foreground">{fmtRelative(a.appt_at)}</div>
                      </div>
                      <Badge variant="default">{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to="/appointments">Book appointment</Link></Button>
          </Card>
        </div>

        {lastSos && lastSos.status !== "completed" && (
          <Card className="mt-6 border-destructive/40 bg-destructive/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-destructive">Active SOS</div>
                <div className="mt-1 font-semibold">{lastSos.reason}</div>
                <div className="text-xs text-muted-foreground">Priority {lastSos.priority} · {fmtRelative(lastSos.created_at)}</div>
              </div>
              <Button asChild variant="destructive"><Link to="/sos-history">View</Link></Button>
            </div>
          </Card>
        )}

        <Card className="mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold">Recent medical records</h3>
              <p className="text-xs text-muted-foreground">Prescriptions, lab reports and imaging.</p>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/records"><FileText className="mr-2 h-3.5 w-3.5"/>Manage records</Link></Button>
          </div>
          {loading ? <Skeleton className="h-24"/> : records.length === 0 ? (
            <div className="grid place-items-center py-10 text-center text-sm text-muted-foreground">No records yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {records.map(r => (
                <div key={r.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-sm">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.doctor ?? "—"} · {fmtDate(r.record_date)}</div>
                    </div>
                    <Badge variant="outline">{r.record_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Health profile</h3>
              <Badge variant="secondary" className={bmiCat.color}>{bmiCat.label}</Badge>
            </div>
            <div className="grid gap-2 text-sm">
              <Row label="Allergies" value={profile?.allergies?.length ? profile.allergies.join(", ") : "None reported"} />
              <Row label="Conditions" value={profile?.conditions?.length ? profile.conditions.join(", ") : "None reported"} />
              <Row label="Phone" value={profile?.phone ?? user?.email ?? "—"} />
            </div>
          </Card>
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Emergency contacts</h3>
              <Button asChild size="sm" variant="ghost"><Link to="/contacts">Manage</Link></Button>
            </div>
            {contacts.length === 0 ? (
              <div className="text-xs text-muted-foreground">Add contacts to enable quick-dial during SOS.</div>
            ) : (
              <div className="space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Phone className="h-4 w-4" /></div>
                      <div>
                        <div className="text-sm font-semibold">{c.name} <span className="font-normal text-muted-foreground">({c.relation ?? "—"})</span></div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </div>
                    </div>
                    <a href={`tel:${c.phone}`}><Button size="sm" variant="ghost">Call</Button></a>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </PageTransition>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="max-w-[60%] text-right text-sm font-medium">{value}</span>
  </div>;
}
function Fact({ icon: Icon, label, value }: { icon: typeof Ruler; label: string; value: string }) {
  return <div className="flex items-center gap-2 rounded-lg border border-border p-2">
    <Icon className="h-4 w-4 text-primary"/>
    <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium truncate">{value}</div></div>
  </div>;
}

function SosBanner() {
  return (
    <Link to="/sos" className="relative inline-flex" id="sos">
      <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-destructive/40" />
      <div className="relative flex items-center gap-3 rounded-2xl bg-gradient-emergency px-5 py-3 text-destructive-foreground shadow-emergency">
        <Siren className="h-5 w-5" />
        <div className="text-left">
          <div className="text-xs font-semibold uppercase tracking-widest opacity-90">Emergency</div>
          <div className="font-display text-lg font-bold leading-tight">Trigger SOS</div>
        </div>
        <MapPin className="ml-4 h-4 w-4 opacity-70" />
      </div>
    </Link>
  );
}

export { Calendar };
