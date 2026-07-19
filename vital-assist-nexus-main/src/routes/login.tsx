import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User as UserIcon, Building2, Ambulance, Droplet, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, AuthAltLink } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth, roleHome } from "@/lib/auth";
import type { Role } from "@/types/models";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — MediRoute" }, { name: "description", content: "Sign in to MediRoute." }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(120),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const roleOptions: { value: Role; label: string; icon: typeof UserIcon; desc: string }[] = [
  { value: "patient",     label: "Patient",       icon: UserIcon,     desc: "Individual user" },
  { value: "hospital",    label: "Hospital",      icon: Building2,    desc: "Hospital staff" },
  { value: "ambulance",   label: "Ambulance",     icon: Ambulance,    desc: "Driver / dispatch" },
  { value: "blood-bank",  label: "Blood Bank",    icon: Droplet,      desc: "Blood bank ops" },
  { value: "admin",       label: "Administrator", icon: ShieldCheck,  desc: "Platform admin" },
];

function LoginPage() {
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<Role>("patient");
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (d: FormValues) => {
    try {
      const u = await login(d.email, d.password, role);
      toast.success(`Welcome back, ${u.name}`);
      navigate({ to: roleHome(u.role) });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed. Please try again.";
      toast.error(msg.includes("Invalid") ? "Wrong email or password." : msg);
    }
  };

  const onGoogle = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
      // Session lands via onAuthStateChange; navigate happens after that if same window
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your MediRoute account to continue."
      footer={<p>© {new Date().getFullYear()} MediRoute. All rights reserved.</p>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Sign in as</Label>
          <div className="grid grid-cols-5 gap-2">
            {roleOptions.map((r) => {
              const active = role === r.value;
              return (
                <button
                  type="button" key={r.value} onClick={() => setRole(r.value)}
                  title={`${r.label} · ${r.desc}`}
                  className={cn(
                    "group flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-semibold transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-glow"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <r.icon className="h-4 w-4" />
                  <span className="leading-none">{r.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">Your actual role comes from your account — this is a routing hint only.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@example.com" className="pl-9" {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type={show ? "text" : "password"} placeholder="••••••••" className="px-9" {...register("password")} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" {...register("remember")} />
          <Label htmlFor="remember" className="text-sm font-normal">Keep me signed in</Label>
        </div>

        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
          {isSubmitting ? "Signing in..." : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>

        <div className="relative py-2">
          <Separator />
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">or continue with</span>
          </span>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={googleLoading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1 0-3.37 2.69-6.1 6-6.1 1.89 0 3.15.8 3.87 1.48l2.64-2.55C16.9 3.32 14.7 2.4 12 2.4 6.87 2.4 2.7 6.55 2.7 12s4.17 9.6 9.3 9.6c5.37 0 8.93-3.78 8.93-9.1 0-.61-.07-1.08-.15-1.55L12 10.2Z"/>
          </svg>
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </Button>
      </form>
      <AuthAltLink prompt="New to MediRoute?" to="/signup" label="Create an account" />
    </AuthShell>
  );
}
