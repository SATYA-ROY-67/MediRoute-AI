import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Camera, Mail, Phone, MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — MediRoute" }] }),
  component: ProfilePage,
});

type ProfileForm = {
  full_name: string;
  phone: string;
  address: string;
  dob: string;
  gender: string;
  blood_group: string;
  height_cm: string;
  weight_kg: string;
  allergies: string;
  conditions: string;
};

function ProfilePage() {
  const { user, updateUser, refresh, loading: authLoading } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProfileForm>();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        reset({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          dob: data.dob ?? "",
          gender: data.gender ?? "",
          blood_group: data.blood_group ?? "",
          height_cm: data.height_cm?.toString() ?? "",
          weight_kg: data.weight_kg?.toString() ?? "",
          allergies: (data.allergies ?? []).join(", "),
          conditions: (data.conditions ?? []).join(", "),
        });
        if (data.avatar_url) {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(data.avatar_url, 3600);
          setAvatarUrl(signed?.signedUrl ?? null);
        }
      }
      setLoading(false);
    })();
  }, [user, reset]);

  const onSubmit = async (d: ProfileForm) => {
    if (!user) return;
    const payload = {
      full_name: d.full_name.trim() || null,
      phone: d.phone.trim() || null,
      address: d.address.trim() || null,
      dob: d.dob || null,
      gender: d.gender || null,
      blood_group: d.blood_group || null,
      height_cm: d.height_cm ? Number(d.height_cm) : null,
      weight_kg: d.weight_kg ? Number(d.weight_kg) : null,
      allergies: d.allergies ? d.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
      conditions: d.conditions ? d.conditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    await updateUser({ name: payload.full_name ?? undefined, phone: payload.phone ?? undefined });
    await refresh();
    toast.success("Profile updated");
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("Max avatar size is 4 MB.");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setUploading(false); return toast.error(error.message); }
    await supabase.from("profiles").update({ avatar_url: path }).eq("user_id", user.id);
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    setAvatarUrl(signed?.signedUrl ?? null);
    await updateUser({ avatarUrl: path });
    setUploading(false);
    toast.success("Profile photo updated");
  };

  const initials = (user?.name ?? "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update your personal and medical information.</p>
        </header>

        {authLoading || loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80" /><Skeleton className="h-96 lg:col-span-2" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.name ?? ""} />}
                    <AvatarFallback className="bg-gradient-primary text-2xl font-bold text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-95 disabled:opacity-60">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Badge className="capitalize">{user?.role}</Badge>
                  {user?.verified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="destructive">Unverified</Badge>}
                </div>
                <div className="mt-6 w-full space-y-2 border-t border-border pt-4 text-left">
                  <Row icon={Mail} label={user?.email ?? ""} />
                  {user?.phone && <Row icon={Phone} label={user.phone} />}
                </div>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="font-display text-lg font-bold">Personal &amp; medical information</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><Input {...register("full_name")} /></Field>
                <Field label="Phone"><Input placeholder="+91 …" {...register("phone")} /></Field>
                <Field label="Date of birth"><Input type="date" {...register("dob")} /></Field>
                <Field label="Gender">
                  <select {...register("gender")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Blood group">
                  <select {...register("blood_group")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Unknown</option>
                    {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map((g)=><option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Height (cm)"><Input type="number" step="0.1" {...register("height_cm")} /></Field>
                <Field label="Weight (kg)"><Input type="number" step="0.1" {...register("weight_kg")} /></Field>
                <div className="sm:col-span-2"><Field label="Address"><Textarea rows={2} placeholder="Street, city, pincode" {...register("address")} /></Field></div>
                <div className="sm:col-span-2"><Field label="Allergies (comma separated)"><Input {...register("allergies")} placeholder="Peanuts, Penicillin" /></Field></div>
                <div className="sm:col-span-2"><Field label="Medical conditions (comma separated)"><Input {...register("conditions")} placeholder="Hypertension, Asthma" /></Field></div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-primary text-primary-foreground shadow-glow">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} Save changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </PageTransition>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function Row({ icon: Icon, label }: { icon: typeof Mail; label: string }) {
  return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>;
}
// re-export map icon so unused-import tsc doesn't complain
export { MapPin };
