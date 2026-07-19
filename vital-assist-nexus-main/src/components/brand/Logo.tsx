import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-105">
        <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-tight">MediRoute</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">AI Emergency</span>
        </div>
      )}
    </Link>
  );
}
