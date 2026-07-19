import { motion } from "motion/react";
import { Loader2, Inbox, AlertTriangle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-primary", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 h-4 w-24 rounded bg-muted" />
      <div className="mb-2 h-8 w-32 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border p-10 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      {description && <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
      <p className="mb-3 text-sm text-destructive">{message}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-10 space-y-3", center && "text-center")}>
      {eyebrow && (
        <div className={cn("inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-primary", center && "mx-auto")}>
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {eyebrow}
        </div>
      )}
      <h2 className={cn("font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl", center ? "mx-auto max-w-3xl" : "")}>{title}</h2>
      {description && (
        <p className={cn("text-base text-muted-foreground sm:text-lg", center ? "mx-auto max-w-2xl" : "max-w-2xl")}>{description}</p>
      )}
    </div>
  );
}
