import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, Building2, Droplet, Ambulance, Navigation, Layers } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/common";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "Live Map — MediRoute" }] }),
  component: MapPage,
});

type Hospital = { id: string; name: string; icu_beds_free: number|null; emergency_queue: number|null };
type Bank = { id: string; name: string; city: string|null };
type AmbReq = { id: string; assigned_ambulance: string|null; pickup: string|null; destination: string|null; status: string|null; eta_min: number|null };

const PATIENT = { x: 12, y: 76 };
const HOS_POS = [{ x: 78, y: 22 }, { x: 62, y: 44 }, { x: 84, y: 58 }, { x: 46, y: 18 }, { x: 90, y: 82 }];
const BB_POS  = [{ x: 30, y: 40 }, { x: 56, y: 68 }, { x: 20, y: 22 }];

function MapPage() {
  const [t, setT] = useState(0);
  const [layer, setLayer] = useState<"all" | "hospitals" | "blood" | "ambulances">("all");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [ambs, setAmbs] = useState<AmbReq[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: h }, { data: b }, { data: a }] = await Promise.all([
      supabase.from("hospitals").select("id,name,icu_beds_free,emergency_queue").limit(5),
      supabase.from("blood_banks").select("id,name,city").limit(3),
      supabase.from("ambulance_requests").select("id,assigned_ambulance,pickup,destination,status,eta_min").in("status", ["dispatched","en-route"]).order("created_at", { ascending: false }).limit(6),
    ]);
    setHospitals((h ?? []) as Hospital[]);
    setBanks((b ?? []) as Bank[]);
    setAmbs((a ?? []) as AmbReq[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const iv = setInterval(() => setT(x => (x + 0.008) % 1), 40);
    const ch = supabase.channel("map")
      .on("postgres_changes", { event: "*", schema: "public", table: "ambulance_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "hospitals" }, load)
      .subscribe();
    return () => { clearInterval(iv); supabase.removeChannel(ch); };
  }, []);

  return (
    <DashboardShell role="patient">
      <PageTransition>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to="/dashboard/patient" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3"/>Back to dashboard</Link>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Live Emergency Map</h1>
            <p className="text-sm text-muted-foreground">Realtime positions of ambulances, hospitals and blood banks.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all","hospitals","blood","ambulances"] as const).map(k => (
              <Button key={k} size="sm" variant={layer===k?"default":"outline"} onClick={()=>setLayer(k)} className="capitalize">
                <Layers className="mr-1 h-3.5 w-3.5"/>{k}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden p-0">
            <div className="relative h-[560px] bg-gradient-to-br from-primary/10 via-background to-accent/10">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <defs>
                  <pattern id="mg" width="6" height="6" patternUnits="userSpaceOnUse">
                    <path d="M6 0H0V6" fill="none" stroke="currentColor" strokeOpacity="0.08"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#mg)" className="text-foreground"/>
                <path d="M0 76 L100 20" stroke="hsl(var(--muted-foreground))" strokeWidth="0.4" opacity="0.4"/>
                <path d="M0 30 L100 90" stroke="hsl(var(--muted-foreground))" strokeWidth="0.4" opacity="0.4"/>
                <path d="M50 0 L50 100" stroke="hsl(var(--muted-foreground))" strokeWidth="0.4" opacity="0.3"/>

                {(layer === "all" || layer === "ambulances") && ambs.slice(0, 3).map((_, i) => (
                  <line key={i} x1={PATIENT.x} y1={PATIENT.y} x2={HOS_POS[i % HOS_POS.length].x} y2={HOS_POS[i % HOS_POS.length].y}
                    stroke="hsl(var(--destructive))" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.7"/>
                ))}
              </svg>

              <Pin x={PATIENT.x} y={PATIENT.y} color="bg-primary" label="You" icon={MapPin} pulse/>

              {(layer === "all" || layer === "hospitals") && hospitals.map((h, i) => {
                const pos = HOS_POS[i % HOS_POS.length];
                return <Pin key={h.id} x={pos.x} y={pos.y} color="bg-accent" label={h.name.split(" ")[0]} icon={Building2}/>;
              })}

              {(layer === "all" || layer === "blood") && banks.map((b,i) => {
                const pos = BB_POS[i % BB_POS.length];
                return <Pin key={b.id} x={pos.x} y={pos.y} color="bg-destructive" label={b.name.split(" ")[0]} icon={Droplet}/>;
              })}

              {(layer === "all" || layer === "ambulances") && ambs.slice(0, 3).map((a, i) => {
                const to = HOS_POS[i % HOS_POS.length];
                const p = (t + i * 0.3) % 1;
                const x = PATIENT.x + (to.x - PATIENT.x) * p;
                const y = PATIENT.y + (to.y - PATIENT.y) * p;
                return (
                  <motion.div key={a.id} className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}>
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-emergency">
                      <Ambulance className="h-4 w-4"/>
                    </div>
                    <div className="mt-1 whitespace-nowrap rounded bg-card px-1.5 py-0.5 text-center text-[10px] font-bold">{a.assigned_ambulance ?? "AMB"}</div>
                  </motion.div>
                );
              })}

              <div className="absolute bottom-4 left-4 rounded-xl bg-card/90 px-4 py-3 backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Traffic</div>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <LegendDot color="bg-emerald-500" label="Clear"/>
                  <LegendDot color="bg-yellow-500" label="Moderate"/>
                  <LegendDot color="bg-destructive" label="Heavy"/>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-display text-sm font-bold">Nearest hospitals</h3>
              {loading ? <Skeleton className="mt-3 h-24"/> : (
                <div className="mt-3 space-y-2">
                  {hospitals.slice(0,4).map(h => (
                    <div key={h.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <div className="text-sm font-semibold">{h.name}</div>
                        <div className="text-xs text-muted-foreground">{h.icu_beds_free ?? 0} ICU · Queue {h.emergency_queue ?? 0}</div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]"><Navigation className="mr-1 h-3 w-3"/>Live</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="font-display text-sm font-bold">Active ambulances</h3>
              {loading ? <Skeleton className="mt-3 h-24"/> : ambs.length === 0 ? (
                <div className="mt-3 text-xs text-muted-foreground">No active dispatches.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {ambs.slice(0,4).map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <div className="text-sm font-semibold">{a.assigned_ambulance ?? "AMB"}</div>
                        <div className="text-xs text-muted-foreground">{a.pickup ?? "?"} → {a.destination ?? "?"}</div>
                      </div>
                      <Badge className="bg-destructive text-destructive-foreground text-[10px]">{a.eta_min ?? "—"} min</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageTransition>
    </DashboardShell>
  );
}

function Pin({ x, y, color, label, icon: Icon, pulse }: { x: number; y: number; color: string; label: string; icon: typeof MapPin; pulse?: boolean }) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-100%)" }}>
      <div className="relative">
        {pulse && <span className={cn("absolute inset-0 -m-1 animate-pulse-ring rounded-full", color, "opacity-40")}/>}
        <div className={cn("relative grid h-8 w-8 place-items-center rounded-full text-white shadow-lg", color)}>
          <Icon className="h-4 w-4"/>
        </div>
      </div>
      <div className="mt-1 whitespace-nowrap rounded bg-card px-1.5 py-0.5 text-center text-[10px] font-semibold shadow">{label}</div>
    </div>
  );
}
function LegendDot({ color, label }: { color: string; label: string }) {
  return <div className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", color)}/>{label}</div>;
}
