import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, delta, deltaLabel, icon: Icon, accent = "primary",
}: {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  accent?: "primary" | "accent" | "destructive" | "success" | "warning";
}) {
  const positive = (delta ?? 0) >= 0;
  const accentMap: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    accent: "from-accent/20 to-accent/5 text-accent",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
    >
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-70 blur-2xl transition-opacity group-hover:opacity-100", accentMap[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div className="relative mt-3 flex items-center gap-1 text-xs">
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
            positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">{deltaLabel ?? "vs last week"}</span>
        </div>
      )}
    </motion.div>
  );
}
