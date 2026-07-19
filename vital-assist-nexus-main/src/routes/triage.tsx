import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Brain, ArrowLeft, Activity, Timer, Stethoscope, Building2, Ambulance, Droplet, BedDouble, Download, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageTransition } from "@/components/common";
import { cn } from "@/lib/utils";
import { runAiTriage, type TriageResult } from "@/lib/triage.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { downloadTriagePdf } from "@/lib/triage-pdf";

export const Route = createFileRoute("/triage")({
  head: () => ({ meta: [{ title: "AI Triage — MediRoute" }] }),
  component: TriagePage,
});

const SYMPTOMS = ["Chest pain","Breathing difficulty","Bleeding","Unconscious","Fracture","Fever","Head injury","Nausea","Stroke symptoms"];

function TriagePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const triage = useServerFn(runAiTriage);
  const [age, setAge] = useState(34);
  const [gender, setGender] = useState("male");
  const [hr, setHr] = useState(96);
  const [bp, setBp] = useState("140/90");
  const [temp, setTemp] = useState(38.4);
  const [pain, setPain] = useState([7]);
  const [duration, setDuration] = useState(45);
  const [symptoms, setSymptoms] = useState<string[]>(["Chest pain"]);
  const [history, setHistory] = useState("Hypertension");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const toggle = (s: string) => setSymptoms(p => p.includes(s) ? p.filter(x=>x!==s) : [...p, s]);

  const run = async () => {
    if (!user) { toast.error("Sign in first"); return; }
    setRunning(true); setResult(null); setSavedId(null);
    try {
      const r = await triage({ data: { age, gender, hr, bp, temp, pain: pain[0], duration_min: duration, symptoms, history } });
      setResult(r);
      const vitals = { age, gender, hr, bp, temp, pain: pain[0], duration_min: duration };
      const { data, error } = await supabase.from("triage_reports").insert({
        user_id: user.id, symptoms, vitals, severity: r.severity,
        risk_score: r.risk_score, confidence: r.confidence, department: r.department,
        hospital_recommendation: r.recommended_hospital_type,
        possible_conditions: r.possible_conditions, ai_summary: r.clinical_summary,
      }).select("id").single();
      if (!error && data) setSavedId(data.id);
      toast.success("Triage report generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Triage failed");
    } finally { setRunning(false); }
  };

  const download = async () => {
    if (!savedId || !result) return;
    const { data } = await supabase.from("triage_reports").select("*").eq("id", savedId).single();
    if (data) downloadTriagePdf(data as never, user?.name);
  };

  const sevColor = result?.severity === "critical" ? "bg-destructive" : result?.severity === "high" ? "bg-orange-500" : result?.severity === "moderate" ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <DashboardShell role="patient">
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/dashboard/patient" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3"/>Back to dashboard</Link>
            <div className="mt-1 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><Brain className="h-5 w-5"/></div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">AI Triage</h1>
                <p className="text-sm text-muted-foreground">Clinical decision support powered by Lovable AI.</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={()=>nav({ to: "/triage-history" })}><History className="mr-2 h-4 w-4"/>Previous reports</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold">Patient inputs</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Age"><Input type="number" value={age} onChange={e=>setAge(+e.target.value)}/></Field>
              <Field label="Gender">
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Heart rate (bpm)"><Input type="number" value={hr} onChange={e=>setHr(+e.target.value)}/></Field>
              <Field label="Blood pressure"><Input value={bp} onChange={e=>setBp(e.target.value)}/></Field>
              <Field label="Temperature (°C)"><Input type="number" step="0.1" value={temp} onChange={e=>setTemp(+e.target.value)}/></Field>
              <Field label="Duration (min)"><Input type="number" value={duration} onChange={e=>setDuration(+e.target.value)}/></Field>
            </div>
            <div className="mt-5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pain level · {pain[0]}/10</Label>
              <Slider value={pain} onValueChange={setPain} min={0} max={10} step={1} className="mt-2"/>
            </div>
            <div className="mt-5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Symptoms</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SYMPTOMS.map(s => (
                  <button key={s} onClick={()=>toggle(s)}
                    className={cn("rounded-full border px-3 py-1 text-xs transition", symptoms.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <Field label="Medical history"><Input value={history} onChange={e=>setHistory(e.target.value)}/></Field>
            </div>
            <Button className="mt-6 w-full" onClick={run} disabled={running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Brain className="mr-2 h-4 w-4"/>}
              {running ? "Running AI triage…" : "Run AI triage"}
            </Button>
          </Card>

          <div className="space-y-4">
            <Card className="overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">AI assessment</h2>
                {result && <Badge className={cn("text-white capitalize", sevColor)}>{result.severity}</Badge>}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Gauge label="Confidence" value={result?.confidence ?? 0} color="hsl(var(--primary))"/>
                <Gauge label="Risk score" value={result?.risk_score ?? 0} color="hsl(var(--destructive))"/>
              </div>
              <div className="mt-6 space-y-3">
                <Meter label="Ambulance required" active={!!result && result.risk_score > 55} icon={Ambulance}/>
                <Meter label="Blood required"     active={!!result && (symptoms.includes("Bleeding") || result.risk_score > 85)} icon={Droplet}/>
                <Meter label="ICU required"       active={!!result && result.risk_score > 75} icon={BedDouble}/>
                <Meter label="Specialist"         active={!!result && result.risk_score > 50} icon={Stethoscope}/>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold">Recommendation</h3>
              <div className="mt-3 space-y-2 text-sm">
                <RecRow icon={Stethoscope} label="Department" value={result?.department ?? "—"}/>
                <RecRow icon={Building2}   label="Hospital"   value={result?.recommended_hospital_type ?? "—"}/>
                <RecRow icon={Timer}       label="Priority"   value={result?.severity.toUpperCase() ?? "—"}/>
                <RecRow icon={Activity}    label="Conditions" value={result?.possible_conditions.slice(0,2).join(", ") ?? "—"}/>
              </div>
              {result && (
                <>
                  <p className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{result.clinical_summary}</p>
                  <div className="mt-4 flex gap-2">
                    <Button asChild className="flex-1 bg-gradient-emergency"><Link to="/sos">Proceed to SOS</Link></Button>
                    <Button variant="outline" onClick={download} disabled={!savedId}><Download className="mr-2 h-4 w-4"/>PDF</Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </PageTransition>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>{children}</div>;
}
function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 42, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} stroke="hsl(var(--muted))" strokeWidth="8" fill="none"/>
          <motion.circle cx="50" cy="50" r={r} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }} transition={{ duration: 1, ease: "easeOut" }}/>
        </svg>
        <div className="absolute inset-0 grid place-items-center font-display text-2xl font-bold">{value}%</div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Meter({ label, active, icon: Icon }: { label: string; active: boolean; icon: typeof Activity }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm"><Icon className={cn("h-4 w-4", active ? "text-destructive" : "text-muted-foreground")}/>{label}</div>
      <div className="w-32"><Progress value={active ? 100 : 15}/></div>
    </div>
  );
}
function RecRow({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary"/>{label}</div>
      <div className="font-medium truncate max-w-[220px] text-right">{value}</div>
    </div>
  );
}
