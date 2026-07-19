import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, AuthAltLink } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — MediRoute" }] }),
  component: ResetPage,
});

function ResetPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<{ pw: string; confirm: string }>();
  const pw = watch("pw", "");
  const strong = pw.length >= 8;

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={handleSubmit(async (d) => {
        if (d.pw !== d.confirm) return toast.error("Passwords don't match");
        try {
          await updatePassword(d.pw);
          toast.success("Password updated — please sign in.");
          navigate({ to: "/login" });
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Could not update password. Open the reset link from your email.");
        }
      })} className="space-y-4">
        <div className="space-y-1.5">
          <Label>New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="At least 8 characters" className="pl-9" {...register("pw", { required: true, minLength: 8 })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="Repeat password" className="pl-9" {...register("confirm", { required: true })} />
          </div>
        </div>
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${strong ? "border-success/40 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground"}`}>
          <CheckCircle2 className="h-4 w-4" /> Password must be at least 8 characters.
        </div>
        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>
      <AuthAltLink prompt="All set?" to="/login" label="Back to sign in" />
    </AuthShell>
  );
}
