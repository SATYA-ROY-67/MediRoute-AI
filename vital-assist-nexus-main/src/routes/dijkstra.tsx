import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, ArrowLeft, GitBranch, Timer, Layers, Cpu } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PageTransition } from "@/components/common";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dijkstra")({
  head: () => ({ meta: [{ title: "Dijkstra Visualiser — MediRoute" }] }),
  component: DijkstraPage,
});

/* ---------- Graph (hospitals as nodes) ---------- */

type Node = { id: string; label: string; x: number; y: number; kind: "patient" | "hospital" | "junction" | "blood" };
type Edge = { a: string; b: string; w: number };

const NODES: Node[] = [
  { id: "P",  label: "Patient",       x:  60, y: 300, kind: "patient"  },
  { id: "J1", label: "Signal 1",      x: 180, y: 220, kind: "junction" },
  { id: "J2", label: "Signal 2",      x: 180, y: 380, kind: "junction" },
  { id: "H1", label: "City General",  x: 340, y: 140, kind: "hospital" },
  { id: "B1", label: "Red Cross BB",  x: 340, y: 300, kind: "blood"    },
  { id: "J3", label: "Signal 3",      x: 340, y: 440, kind: "junction" },
  { id: "H2", label: "Apollo",        x: 520, y: 200, kind: "hospital" },
  { id: "H3", label: "Manipal",       x: 520, y: 360, kind: "hospital" },
  { id: "H4", label: "Fortis",        x: 680, y: 260, kind: "hospital" },
];

const EDGES: Edge[] = [
  { a: "P",  b: "J1", w: 3 },
  { a: "P",  b: "J2", w: 5 },
  { a: "J1", b: "H1", w: 4 },
  { a: "J1", b: "B1", w: 2 },
  { a: "J2", b: "B1", w: 3 },
  { a: "J2", b: "J3", w: 2 },
  { a: "H1", b: "H2", w: 3 },
  { a: "B1", b: "H2", w: 4 },
  { a: "B1", b: "H3", w: 3 },
  { a: "J3", b: "H3", w: 2 },
  { a: "H2", b: "H4", w: 4 },
  { a: "H3", b: "H4", w: 3 },
];

/* ---------- Dijkstra with step-by-step trace ---------- */

type Step = {
  visiting: string;
  visited: string[];
  dist: Record<string, number>;
  prev: Record<string, string | null>;
  pq: { id: string; d: number }[];
  note: string;
};

function runDijkstra(start: string, target: string) {
  const adj: Record<string, { to: string; w: number }[]> = {};
  NODES.forEach(n => (adj[n.id] = []));
  EDGES.forEach(e => { adj[e.a].push({ to: e.b, w: e.w }); adj[e.b].push({ to: e.a, w: e.w }); });

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  NODES.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null; });
  dist[start] = 0;

  const visited = new Set<string>();
  const pq: { id: string; d: number }[] = [{ id: start, d: 0 }];
  const steps: Step[] = [];

  while (pq.length) {
    pq.sort((x, y) => x.d - y.d);
    const { id: u } = pq.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);

    steps.push({
      visiting: u,
      visited: [...visited],
      dist: { ...dist },
      prev: { ...prev },
      pq: [...pq],
      note: `Pop ${u} (d=${dist[u]}) from priority queue`,
    });

    if (u === target) break;
    for (const { to, w } of adj[u]) {
      if (visited.has(to)) continue;
      const nd = dist[u] + w;
      if (nd < dist[to]) {
        dist[to] = nd;
        prev[to] = u;
        pq.push({ id: to, d: nd });
        steps.push({
          visiting: u,
          visited: [...visited],
          dist: { ...dist },
          prev: { ...prev },
          pq: [...pq],
          note: `Relax ${u} → ${to}: dist[${to}] = ${nd}`,
        });
      }
    }
  }

  // path
  const path: string[] = [];
  let cur: string | null = target;
  while (cur) { path.unshift(cur); cur = prev[cur]; }
  return { steps, path, totalCost: dist[target] };
}

/* ---------- UI ---------- */

function DijkstraPage() {
  const [target, setTarget] = useState("H4");
  const [speed, setSpeed] = useState([700]);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);

  const { steps, path, totalCost } = useMemo(() => runDijkstra("P", target), [target]);
  const step = steps[Math.min(idx, steps.length - 1)];

  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setIdx(i => {
        if (i >= steps.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 1100 - speed[0]);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, speed, steps.length]);

  const reset = () => { setPlaying(false); setIdx(0); };

  const pathEdges = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const [a, b] = [path[i], path[i + 1]];
    pathEdges.add([a, b].sort().join("-"));
  }
  const inPath = (a: string, b: string) => pathEdges.has([a, b].sort().join("-"));
  const isDone = idx >= steps.length - 1;

  return (
    <DashboardShell role="patient">
      <PageTransition>
        <div className="mb-6">
          <Link to="/dashboard/patient" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3"/>Back to dashboard</Link>
          <div className="mt-1 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><GitBranch className="h-5 w-5"/></div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Dijkstra's Algorithm</h1>
              <p className="text-sm text-muted-foreground">Shortest-path routing for ambulance dispatch — visualised on the hospital road network.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button size="sm" variant={playing ? "secondary" : "default"} onClick={()=>setPlaying(p=>!p)}>
                {playing ? <><Pause className="mr-1 h-3.5 w-3.5"/>Pause</> : <><Play className="mr-1 h-3.5 w-3.5"/>Play</>}
              </Button>
              <Button size="sm" variant="outline" onClick={reset}><RotateCcw className="mr-1 h-3.5 w-3.5"/>Reset</Button>
              <Button size="sm" variant="ghost" onClick={()=>setIdx(i=>Math.min(steps.length-1, i+1))}>Step ▸</Button>
              <div className="ml-auto flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Target</span>
                <Select value={target} onValueChange={v=>{setTarget(v); reset();}}>
                  <SelectTrigger className="h-8 w-40"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {NODES.filter(n=>n.kind==="hospital").map(n=>(
                      <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Speed</span>
              <Slider value={speed} onValueChange={setSpeed} min={100} max={1000} step={50} className="flex-1"/>
              <Badge variant="secondary" className="text-[10px]">Step {Math.min(idx+1, steps.length)}/{steps.length}</Badge>
            </div>

            <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5">
              <svg viewBox="0 0 760 520" className="h-[520px] w-full">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M30 0H0V30" fill="none" stroke="currentColor" strokeOpacity="0.06"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" className="text-foreground"/>

                {EDGES.map(e => {
                  const a = NODES.find(n=>n.id===e.a)!, b = NODES.find(n=>n.id===e.b)!;
                  const onPath = isDone && inPath(e.a, e.b);
                  const relaxed = step?.prev[e.b] === e.a || step?.prev[e.a] === e.b;
                  return (
                    <g key={e.a+e.b}>
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                        stroke={onPath ? "hsl(var(--destructive))" : relaxed ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                        strokeWidth={onPath ? 4 : relaxed ? 3 : 1.5}
                        strokeOpacity={onPath ? 1 : relaxed ? 0.9 : 0.35}/>
                      <text x={(a.x+b.x)/2} y={(a.y+b.y)/2 - 4} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">{e.w}</text>
                    </g>
                  );
                })}

                {NODES.map(n => {
                  const visited = step?.visited.includes(n.id);
                  const visiting = step?.visiting === n.id;
                  const d = step?.dist[n.id];
                  const onPath = isDone && path.includes(n.id);
                  const fill =
                    onPath ? "hsl(var(--destructive))" :
                    visiting ? "hsl(var(--primary))" :
                    visited ? "hsl(var(--accent))" :
                    n.kind === "patient" ? "hsl(var(--primary))" :
                    n.kind === "hospital" ? "hsl(var(--card))" :
                    n.kind === "blood" ? "hsl(var(--destructive))" : "hsl(var(--muted))";
                  return (
                    <motion.g key={n.id} animate={visiting ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.6 }} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                      <circle cx={n.x} cy={n.y} r={n.kind === "patient" || n.kind === "hospital" ? 22 : 16}
                        fill={fill} stroke="hsl(var(--border))" strokeWidth={2}/>
                      <text x={n.x} y={n.y+4} textAnchor="middle" className={cn("text-[11px] font-bold", onPath || visiting || n.kind === "patient" || n.kind === "blood" ? "fill-white" : "fill-foreground")}>{n.id}</text>
                      <text x={n.x} y={n.y + (n.kind==="patient"||n.kind==="hospital" ? 40 : 34)} textAnchor="middle" className="fill-muted-foreground text-[10px]">{n.label}</text>
                      {d !== undefined && d !== Infinity && (
                        <g>
                          <rect x={n.x+16} y={n.y-30} width={30} height={16} rx={4} fill="hsl(var(--background))" stroke="hsl(var(--primary))"/>
                          <text x={n.x+31} y={n.y-18} textAnchor="middle" className="fill-primary text-[10px] font-bold">{d}</text>
                        </g>
                      )}
                    </motion.g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">{step?.note}</div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="mb-3 font-display text-sm font-bold">Priority Queue (min-heap)</h3>
              <div className="space-y-1.5">
                {step?.pq.length ? [...step.pq].sort((a,b)=>a.d-b.d).map((e,i)=>(
                  <motion.div key={e.id+i} layout className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-1.5 text-xs">
                    <span className="font-semibold">{e.id}</span>
                    <Badge variant={i===0 ? "default" : "secondary"} className="text-[10px]">d = {e.d}</Badge>
                  </motion.div>
                )) : <div className="text-xs text-muted-foreground">Queue empty</div>}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="mb-3 font-display text-sm font-bold">Distance table</h3>
              <div className="max-h-56 overflow-auto text-xs">
                <table className="w-full">
                  <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="py-1 text-left">Node</th><th className="text-right">Dist</th><th className="text-right">Prev</th></tr></thead>
                  <tbody>
                    {NODES.map(n => (
                      <tr key={n.id} className={cn("border-t border-border/60", step?.visited.includes(n.id) && "text-primary")}>
                        <td className="py-1 font-mono">{n.id}</td>
                        <td className="text-right">{step && step.dist[n.id] !== Infinity ? step.dist[n.id] : "∞"}</td>
                        <td className="text-right font-mono text-muted-foreground">{step?.prev[n.id] ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {isDone && (
              <Card className="border-destructive/40 bg-destructive/5 p-5">
                <div className="text-xs uppercase tracking-wider text-destructive">Shortest path</div>
                <div className="mt-1 font-display text-lg font-bold">{path.join(" → ")}</div>
                <div className="text-xs text-muted-foreground">Total cost: {totalCost}</div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-primary"/><h3 className="font-display text-sm font-bold">Pseudo-code</h3></div>
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted/60 p-3 text-[11px] leading-relaxed">
{`function Dijkstra(G, src):
  for each v in V: dist[v] = ∞, prev[v] = null
  dist[src] = 0
  PQ = MinHeap((0, src))
  while PQ not empty:
    (d, u) = PQ.extractMin()
    if u in visited: continue
    visited.add(u)
    for (u, v, w) in edges(u):
      if dist[u] + w < dist[v]:
        dist[v] = dist[u] + w
        prev[v] = u
        PQ.insert((dist[v], v))
  return dist, prev`}
            </pre>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary"/><h3 className="font-display text-sm font-bold">Complexity</h3></div>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-md border border-border p-3"><div className="text-xs text-muted-foreground">Time</div><div className="font-mono font-bold">O((V + E) log V)</div></div>
              <div className="rounded-md border border-border p-3"><div className="text-xs text-muted-foreground">Space</div><div className="font-mono font-bold">O(V + E)</div></div>
              <div className="rounded-md border border-border p-3"><div className="text-xs text-muted-foreground">Data structures</div><div className="font-medium">Adjacency list · Min-heap PQ</div></div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary"/><h3 className="font-display text-sm font-bold">Why this matters</h3></div>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><b className="text-foreground">Graphs</b> model the road network: hospitals are nodes, roads are weighted edges (distance + traffic).</li>
              <li><b className="text-foreground">Dijkstra</b> guarantees the optimal ambulance route on non-negative weights — critical when seconds count.</li>
              <li><b className="text-foreground">Priority queue</b> always expands the closest frontier node, minimising redundant work vs. BFS.</li>
            </ul>
          </Card>
        </div>
      </PageTransition>
    </DashboardShell>
  );
}
