import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({ meta: [{ title: "Verify OTP — MediRoute" }] }),
  component: OtpPage,
});

function OtpPage() {
  const [otp, setOtp] = useState("");
  return (
    <AuthShell title="Verify your identity" subtitle="Enter the 6-digit code we just sent to your email.">
      <div className="space-y-6">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <Button
          size="lg"
          disabled={otp.length < 6}
          onClick={() => toast.success("Verified (demo)")}
          className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
        >
          Verify <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code? <button className="font-semibold text-primary hover:underline">Resend</button>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/reset-password" className="font-semibold text-primary hover:underline">Continue to reset password →</Link>
        </p>
      </div>
    </AuthShell>
  );
}
