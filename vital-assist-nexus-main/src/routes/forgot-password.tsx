import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, AuthAltLink } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — MediRoute" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const { resetPassword } = useAuth();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email — we'll send you a secure reset link.">
      <form onSubmit={handleSubmit(async (d) => {
        try {
          await resetPassword(d.email);
          toast.success(`Reset link sent to ${d.email}. Check your inbox.`);
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Could not send reset link.");
        }
      })} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" placeholder="you@example.com" className="pl-9" {...register("email", { required: true })} />
          </div>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
          {isSubmitting ? "Sending..." : <>Send reset link <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </form>
      <AuthAltLink prompt="Remember your password?" to="/login" label="Back to sign in" />
    </AuthShell>
  );
}
