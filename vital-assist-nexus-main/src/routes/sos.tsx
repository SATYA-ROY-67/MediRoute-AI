import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Siren, MapPin, Heart, Phone, Ambulance, Building2, Droplet, CheckCircle2, Loader2, ArrowLeft, Activity } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/common";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sos")({
  head: () => ({ meta: [{ title: "Emergency SOS — MediRoute" }] }),
  component: SosPage,
});

type Severity = "critical" | "high" | "moderate" | "low";
const SEVERITY: { key: Severity; label: string; color: string; desc: string }[] = [
  { key: "critical", label: "Critical", color: "bg-destructive text-destructive-foreground", desc: "Life-threatening" },
  { key: "high",     label: "High",     color: "bg-orange-500 text-white",                    desc: "Urgent care needed" },
  { key: "moderate", label: "Moderate", color: "bg-yellow-500 text-black",                    desc: "Prompt attention" },
  { key: "low",      label: "Low",      color: "bg-emerald-500 text-white",                   desc: "Non-urgent" },
];
const SYMPTOMS = ["Chest pain","Breathing difficulty","Severe bleeding","Unconscious","Fracture","High fever","Head injury","Allergic reaction","Stroke symptoms","Cardiac arrest"];

type Hospital = { id: string; name: string; city: string|null; icu_beds_free: number|null; icu_beds_total: number|null; rating: number|null; phone: string|null };
type BB = { id: string; name: string; inventory: Record<string, { units: number; capacity: number }> | null };
type Contact = { name: string; relation: string|null; phone: string };

function SosPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<"idle" | "confirm" | "assess" | "dispatch" | "enroute">("idle");
  const [severity, setSeverity] = useState<Severity>("critical");
  const [symptoms, setSymptoms] = useState<string[]>(["Chest pain"]);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(6);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BB[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profile, setProfile] = useState<{ address: string|null }>({ address: null });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sosId, setSosId] = useState<string | null>(null);

  const toggle = (s: string) => setSymptoms((p) => p.includes(s) ? p.filter(x=>x!==s) : [...p, s]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: hs }, { data: bb }, { data: ec }, { data: prof }] = await Promise.all([
        supabase.from("hospitals").select("id,name,city,icu_beds_free,icu_beds_total,rating,phone").order("rating", { ascending: false }).limit(5),
        supabase.from("blood_banks").select("id,name,inventory").limit(3),
        supabase.from("emergency_contacts").select("name,relation,phone").eq("user_id", user.id).order("priority"),
        supabase.from("profiles").select("address").eq("user_id", user.id).maybeSingle(),
      ]);
      setHospitals((hs ?? []) as Hospital[]);
      setBloodBanks((bb ?? []) as BB[]);
      setContacts((ec ?? []) as Contact[]);
      setProfile({ address: prof?.address ?? null });
    })();
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {}, { enableHighAccuracy: true, timeout: 4000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (step !== "dispatch") return;
    setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(100, p + 4)), 90);
    const t = setTimeout(() => { setStep("enroute"); clearInterval(iv); }, 2600);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [step]);
  useEffect(() => {
    if (step !== "enroute") return;
    const iv = setInterval(() => setEta(e => Math.max(0, +(e - 0.1).toFixed(1))), 500);
    return () => clearInterval(iv);
  }, [step]);

  const nearest = hospitals[0];
  const amb = { code: `AMB-${String(Math.floor(Math.random()*90)+10)}`, driver: "On-call driver" };

  const confirmSos = async () => {
    if (!user || !nearest) { toast.error("Sign in first"); return; }
    const initialEta = severity === "critical" ? 4 : severity === "high" ? 7 : 12;
    setEta(initialEta);
    const { data, error } = await supabase.from("sos_requests").insert({
      user_id: user.id, priority: severity, reason: symptoms.join(", ") || "Emergency",
      location_text: profile.address ?? "Unknown location",
      lat: coords?.lat ?? null, lng: coords?.lng ?? null,
      status: "dispatched", hospital_name: nearest.name, ambulance_code: amb.code,
      eta_min: initialEta, distance_km: 3.2,
      timeline: [
        { at: new Date().toISOString(), event: "SOS triggered" },
        { at: new Date().toISOString(), event: "AI triage completed" },
        { at: new Date().toISOString(), event: `Dispatched ${amb.code}` },
      ],
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    setSosId(data?.id ?? null);
    // ambulance request record
    if (data?.id) {
      await supabase.from("ambulance_requests").insert({
        user_id: user.id, sos_id: data.id, patient_name: user.name,
        pickup: profile.address, destination: nearest.name,
        status: "dispatched", assigned_ambulance: amb.code, eta_min: initialEta,
      });
      // notify user
      await supabase.from("notifications").insert({
        user_id: user.id, title: "SOS dispatched",
        body: `${amb.code} en route to ${nearest.name}. ETA ${initialEta} min.`, kind: "emergency", read: false,
      });
    }
    setStep("assess");
    setTimeout(() => setStep("dispatch"), 1500);
    toast.success("Emergency dispatched");
  };

  const endSim = async () => {
    if (sosId) await supabase.from("sos_requests").update({ status: "completed", eta_min: 0 }).eq("id", sosId);
    setStep("idle"); setSosId(null); setEta(6);
  };

  const bank0 = bloodBanks[0];
  const oPlusUnits = bank0?.inventory?.["O+"]?.units ?? "—";

  return (
    <DashboardShell role="patient">
      <PageTransition>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard/patient" className="inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3 w-3"/> Back to dashboard</Link>
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Emergency SOS</h1>
            <p className="text-sm text-muted-foreground">AI-assisted triage, hospital routing and ambulance dispatch.</p>
          </div>
          <Badge variant="outline" className="gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive"/> Live</Badge>
        </div>

        {step === "idle" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card className="relative overflow-hidden p-10 text-center">
              <div className="pointer-events-none absolute inset-0 bg-gradient-emergency opacity-10" />
              <motion.button
                onClick={() => setStep("confirm")}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="relative mx-auto grid h-64 w-64 place-items-center rounded-full bg-gradient-emergency text-destructive-foreground shadow-emergency"
              >
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/40" />
                <div className="relative text-center">
                  <Siren className="mx-auto h-16 w-16" />
                  <div className="mt-2 font-display text-2xl font-bold tracking-widest">SOS</div>
                  <div className="text-xs opacity-80">Tap to trigger</div>
                </div>
              </motion.button>
              <p className="mt-6 text-sm text-muted-foreground">One tap alerts the nearest hospital, dispatches an ambulance and notifies your emergency contacts.</p>
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary"/><h3 className="font-semibold">Current location</h3></div>
                <div className="text-sm">{profile.address ?? "Add address in Profile"}</div>
                <div className="mt-1 text-xs text-muted-foreground">{coords ? `GPS lock · ${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}` : "GPS not available"}</div>
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2"><Phone className="h-4 w-4 text-primary"/><h3 className="font-semibold">Emergency contacts</h3></div>
                {contacts.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Add contacts in <Link to="/contacts" className="text-primary hover:underline">Emergency Contacts</Link>.</div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map(c => (
                      <div key={c.phone} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.relation ?? "—"}</div></div>
                        <span className="text-xs text-muted-foreground">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">Assess severity</h2>
              <p className="text-xs text-muted-foreground">Pick the level that best matches the situation.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {SEVERITY.map(s => (
                  <button key={s.key} onClick={() => setSeverity(s.key)}
                    className={cn("rounded-xl border p-4 text-left transition-all", severity===s.key ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50")}>
                    <div className={cn("mb-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.color)}>{s.label}</div>
                    <div className="text-sm text-muted-foreground">{s.desc}</div>
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-semibold">Symptoms</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SYMPTOMS.map(s => (
                    <button key={s} onClick={()=>toggle(s)}
                      className={cn("rounded-full border px-3 py-1 text-xs transition", symptoms.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold">AI recommendation</h2>
              <div className="mt-4 space-y-3">
                <Row icon={Building2} label="Suggested hospital" value={nearest ? `${nearest.name} · ICU ${nearest.icu_beds_free}/${nearest.icu_beds_total}` : "—"} />
                <Row icon={Ambulance} label="Nearest ambulance" value={`${amb.code}`} />
                <Row icon={Droplet} label="Blood availability" value={bank0 ? `${bank0.name} · ${oPlusUnits} units O+` : "—"} />
                <Row icon={Heart} label="Recommended dept." value={severity === "critical" ? "Cardiology / ER" : "ER"} />
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={()=>setStep("idle")}>Cancel</Button>
                <Button className="flex-1 bg-gradient-emergency" onClick={confirmSos}><Siren className="mr-2 h-4 w-4"/>Confirm emergency</Button>
              </div>
            </Card>
          </div>
        )}

        {step === "assess" && (
          <Card className="mx-auto max-w-2xl p-10 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 font-display text-xl font-bold">Running AI triage…</h2>
            <p className="text-sm text-muted-foreground">Analysing symptoms, vitals, hospital load and routing.</p>
            <div className="mx-auto mt-6 max-w-md space-y-3 text-left">
              {["Analysing vitals","Matching hospital capacity","Computing shortest route","Notifying contacts"].map((l,i)=>(
                <motion.div key={l} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.3}} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success"/> {l}
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {step === "dispatch" && (
          <Card className="mx-auto max-w-2xl p-10 text-center">
            <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-destructive/10 text-destructive">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/40" />
              <Ambulance className="h-10 w-10"/>
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">Dispatching {amb.code}</h2>
            <p className="text-sm text-muted-foreground">Driver confirmed. Establishing route…</p>
            <div className="mx-auto mt-6 max-w-sm">
              <Progress value={progress}/>
              <div className="mt-2 text-xs text-muted-foreground">{progress}% · handshake complete</div>
            </div>
          </Card>
        )}

        {step === "enroute" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card className="overflow-hidden p-0">
              <div className="relative h-[420px] bg-gradient-to-br from-primary/10 via-background to-accent/10">
                <MapMock etaMin={eta}/>
              </div>
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Ambulance en route</div>
                    <div className="font-display text-2xl font-bold">{eta.toFixed(1)} min</div>
                  </div>
                  <Badge className="bg-success text-success-foreground">Live</Badge>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <Row icon={Ambulance} label={amb.code} value={amb.driver}/>
                  <Row icon={Building2} label="Destination" value={nearest?.name ?? "—"}/>
                  <Row icon={Activity} label="Priority" value={severity.toUpperCase()}/>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold">Timeline</h3>
                <ol className="mt-3 space-y-3 text-sm">
                  {["SOS triggered","AI triage completed","Ambulance dispatched","Hospital notified","En route to patient"].map((t,i)=>(
                    <li key={t} className="flex items-start gap-3">
                      <div className={cn("mt-1 h-2 w-2 rounded-full", i<4 ? "bg-success" : "bg-primary animate-pulse")}/>
                      <div>{t}</div>
                    </li>
                  ))}
                </ol>
              </Card>
              <Button variant="outline" className="w-full" onClick={endSim}>End simulation</Button>
            </div>
          </div>
        )}
      </PageTransition>
    </DashboardShell>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary"/>{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function MapMock({ etaMin }: { etaMin: number }) {
  const t = Math.max(0, Math.min(1, 1 - etaMin / 6));
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30 0H0V30" fill="none" stroke="currentColor" strokeOpacity="0.08"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" className="text-foreground"/>
        <path d="M40 250 Q 140 200 200 160 T 360 60" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeDasharray="6 6"/>
      </svg>
      <div className="absolute" style={{ left: `${10 + t*80}%`, top: `${80 - t*70}%`, transform: "translate(-50%,-50%)" }}>
        <motion.div animate={{ scale: [1,1.15,1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="grid h-10 w-10 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-emergency">
          <Ambulance className="h-5 w-5"/>
        </motion.div>
      </div>
      <div className="absolute left-[8%] top-[80%] -translate-y-1/2 rounded-lg bg-card px-2 py-1 text-xs shadow"><MapPin className="mr-1 inline h-3 w-3 text-primary"/>You</div>
      <div className="absolute left-[88%] top-[16%] -translate-x-1/2 rounded-lg bg-card px-2 py-1 text-xs shadow"><Building2 className="mr-1 inline h-3 w-3 text-accent"/>Hospital</div>
    </div>
  );
}
