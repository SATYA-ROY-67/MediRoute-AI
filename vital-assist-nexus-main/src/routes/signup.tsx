import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User as UserIcon, ArrowRight, Building2, Ambulance, Droplet, ShieldCheck } from "lucide-react";
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

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — MediRoute" }] }),
  component: SignupPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(120),
  terms: z.boolean().refine((v) => v, { message: "Please accept the terms" }),
});
type FormValues = z.infer<typeof schema>;

const roleOptions: { value: Role; label: string; icon: typeof UserIcon }[] = [
  { value: "patient",    label: "Patient",       icon: UserIcon },
  { value: "hospital",   label: "Hospital",      icon: Building2 },
  { value: "ambulance",  label: "Ambulance",     icon: Ambulance },
  { value: "blood-bank", label: "Blood Bank",    icon: Droplet },
  { value: "admin",      label: "Administrator", icon: ShieldCheck },
];

function SignupPage() {
  const [role, setRole] = useState<Role>("patient");
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register: registerUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (d: FormValues) => {
    try {
      const u = await registerUser(d.name, d.email, d.password, role);
      if (u.id && u.verified) {
        toast.success(`Welcome, ${u.name}`);
        navigate({ to: roleHome(u.role) });
      } else {
        toast.success("Account created — check your email to verify.", { duration: 6000 });
        navigate({ to: "/login" });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Sign up failed. Please try again.");
    }
  };

  const onGoogle = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the MediRoute network in under a minute.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Choose your role</Label>
          <div className="grid grid-cols-5 gap-2">
            {roleOptions.map((r) => {
              const active = role === r.value;
              return (
                <button
                  type="button" key={r.value} onClick={() => setRole(r.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-semibold transition-all",
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
        </div>

        <div className="space-y-1.5">
          <Label>Full name</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Your name" className="pl-9" {...register("name")} />
          </div>
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" placeholder="you@example.com" className="pl-9" {...register("email")} />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="At least 8 characters" className="pl-9" {...register("password")} />
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="flex items-start gap-2">
          <Checkbox id="terms" {...register("terms")} className="mt-0.5" />
          <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
            I agree to the <a className="text-primary underline">Terms</a> and <a className="text-primary underline">Privacy Policy</a>.
          </Label>
        </div>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
          {isSubmitting ? "Creating account..." : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>

        <div className="relative py-2">
          <Separator />
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">or</span>
          </span>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={googleLoading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1 0-3.37 2.69-6.1 6-6.1 1.89 0 3.15.8 3.87 1.48l2.64-2.55C16.9 3.32 14.7 2.4 12 2.4 6.87 2.4 2.7 6.55 2.7 12s4.17 9.6 9.3 9.6c5.37 0 8.93-3.78 8.93-9.1 0-.61-.07-1.08-.15-1.55L12 10.2Z"/>
          </svg>
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </Button>
      </form>
      <AuthAltLink prompt="Already have an account?" to="/login" label="Sign in" />
    </AuthShell>
  );
}
