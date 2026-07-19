import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

const responseData = [
  { day: "Mon", value: 4.2 }, { day: "Tue", value: 3.8 }, { day: "Wed", value: 3.5 },
  { day: "Thu", value: 3.9 }, { day: "Fri", value: 3.1 }, { day: "Sat", value: 3.4 }, { day: "Sun", value: 3.0 },
];

const casesData = [
  { day: "Mon", critical: 12, moderate: 24, minor: 40 },
  { day: "Tue", critical: 9, moderate: 30, minor: 44 },
  { day: "Wed", critical: 14, moderate: 26, minor: 38 },
  { day: "Thu", critical: 8, moderate: 32, minor: 41 },
  { day: "Fri", critical: 16, moderate: 34, minor: 47 },
  { day: "Sat", critical: 11, moderate: 28, minor: 39 },
  { day: "Sun", critical: 7, moderate: 22, minor: 33 },
];

export function ResponseChart({ title = "Avg response time (min)" }: { title?: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold">{title}</h3>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold gradient-text">3.1<span className="text-sm">min</span></div>
          <div className="text-xs text-success">↓ 12% vs last week</div>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={responseData}>
            <defs>
              <linearGradient id="rt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
            <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#rt)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function CasesChart() {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-bold">Cases by severity</h3>
        <p className="text-xs text-muted-foreground">This week</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={casesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
            <Bar dataKey="critical" stackId="a" fill="var(--color-destructive)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="moderate" stackId="a" fill="var(--color-warning)" />
            <Bar dataKey="minor" stackId="a" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <Legend color="var(--color-destructive)" label="Critical" />
        <Legend color="var(--color-warning)" label="Moderate" />
        <Legend color="var(--color-accent)" label="Minor" />
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{label}</span>;
}
