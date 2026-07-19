import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Activity, ShieldCheck, Zap, HeartPulse } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col justify-between px-6 py-8 md:px-12 md:py-10">
        <Logo />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-md py-10"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
        <div className="text-xs text-muted-foreground">{footer}</div>
      </div>

      {/* Right: hero panel */}
      <div className="relative hidden overflow-hidden bg-gradient-primary lg:block">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <ShieldCheck className="h-4 w-4" /> HIPAA-grade security, end-to-end encryption
          </div>

          <div className="space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-display text-4xl font-bold leading-[1.1]"
            >
              Every second matters.<br />
              <span className="opacity-80">We route them intelligently.</span>
            </motion.h2>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Zap, label: "AI Routing", val: "-42%" },
                { icon: HeartPulse, label: "Response", val: "3.1min" },
                { icon: Activity, label: "Uptime", val: "99.98%" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-2xl bg-white/10 p-4 backdrop-blur-md"
                >
                  <s.icon className="mb-2 h-5 w-5 opacity-80" />
                  <div className="font-display text-2xl font-bold">{s.val}</div>
                  <div className="text-xs opacity-75">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-xs opacity-75">
            "MediRoute reduced our emergency triage time by nearly half." — Dr. R. Sharma, AIIMS
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
      </div>
    </div>
  );
}

export function AuthAltLink({ prompt, to, label }: { prompt: string; to: string; label: string }) {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link to={to} className="font-semibold text-primary hover:underline">{label}</Link>
    </p>
  );
}
