import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Lock, Palette, Trash2, Loader2, ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageTransition } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — MediRoute" }] }),
  component: SettingsPage,
});

type NotifPrefs = { email: boolean; push: boolean; sms: boolean; appointments: boolean; emergency: boolean };
type SosPrefs   = { share_location: boolean; auto_call_contact: boolean; severity_default: string };
type EmailPrefs = { marketing: boolean; product: boolean };

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [notif, setNotif] = useState<NotifPrefs>({ email: true, push: true, sms: false, appointments: true, emergency: true });
  const [sos, setSos] = useState<SosPrefs>({ share_location: true, auto_call_contact: true, severity_default: "high" });
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>({ marketing: false, product: true });
  const [twoFA, setTwoFA] = useState(false);
  const [language, setLanguage] = useState("en");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        if (data.notifications) setNotif({ ...notif, ...(data.notifications as Partial<NotifPrefs>) });
        if (data.sos_prefs) setSos({ ...sos, ...(data.sos_prefs as Partial<SosPrefs>) });
        if (data.email_prefs) setEmailPrefs({ ...emailPrefs, ...(data.email_prefs as Partial<EmailPrefs>) });
        setTwoFA(!!data.two_factor_enabled);
        setLanguage(data.language ?? "en");
        if (data.theme && data.theme !== "system") setTheme(data.theme as "light" | "dark");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveSettings = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, ...patch });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Preferences saved");
  };

  const onChangePassword = async () => {
    if (pw.next !== pw.confirm) return toast.error("Passwords don't match");
    if (pw.next.length < 8) return toast.error("Password must be at least 8 characters");
    try {
      await updatePassword(pw.next);
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Password updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update password");
    }
  };

  const onDeleteAccount = async () => {
    // Client-side cannot delete auth users. Delete profile data + sign out.
    if (!user) return;
    await supabase.from("profiles").delete().eq("user_id", user.id);
    await logout();
    toast.success("Account data removed. Contact support to permanently delete your login.");
    navigate({ to: "/" });
  };

  return (
    <DashboardShell role={user?.role ?? "patient"}>
      <PageTransition>
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your preferences, security and account.</p>
        </header>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general"><Palette className="mr-2 h-4 w-4" /> General</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="sos"><ShieldCheck className="mr-2 h-4 w-4" /> SOS &amp; Privacy</TabsTrigger>
            <TabsTrigger value="security"><Lock className="mr-2 h-4 w-4" /> Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold">Appearance</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose how MediRoute looks to you.</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {(["light", "dark"] as const).map((t) => (
                  <button key={t} onClick={() => { setTheme(t); saveSettings({ theme: t }); }}
                    className={`overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${theme === t ? "border-primary shadow-glow" : "border-border hover:border-primary/50"}`}>
                    <div className={`mb-3 h-24 rounded-lg ${t === "light" ? "bg-gradient-to-br from-white to-blue-50" : "bg-gradient-to-br from-slate-900 to-slate-800"}`} />
                    <div className="font-semibold capitalize">{t} mode</div>
                    <div className="text-xs text-muted-foreground">{t === "light" ? "Clean, bright interface" : "Easy on the eyes"}</div>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold">Language</h3>
              <div className="mt-4 max-w-xs">
                <select value={language} onChange={(e) => { setLanguage(e.target.value); saveSettings({ language: e.target.value }); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="en">English</option><option value="hi">हिन्दी</option><option value="kn">ಕನ್ನಡ</option>
                  <option value="es">Español</option><option value="fr">Français</option>
                </select>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold">Notification channels</h3>
              <div className="mt-6 space-y-4">
                {([
                  ["emergency","Emergency alerts","Critical events, dispatches, and SOS triggers"],
                  ["appointments","Appointment reminders","24h & 1h before scheduled visits"],
                  ["email","Email notifications","General email delivery"],
                  ["push","Push notifications","Browser & mobile push"],
                  ["sms","SMS alerts","Text messages for critical events"],
                ] as const).map(([k,l,d]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div><div className="font-semibold">{l}</div><div className="text-xs text-muted-foreground">{d}</div></div>
                    <Switch checked={notif[k]} onCheckedChange={(v) => { const n = {...notif, [k]: v}; setNotif(n); saveSettings({ notifications: n }); }} />
                  </div>
                ))}
              </div>
              <Separator className="my-6"/>
              <h3 className="font-display text-lg font-bold">Email preferences</h3>
              <div className="mt-4 space-y-4">
                {([["marketing","Marketing","Product news and updates"],["product","Product","Feature announcements and tips"]] as const).map(([k,l,d]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div><div className="font-semibold">{l}</div><div className="text-xs text-muted-foreground">{d}</div></div>
                    <Switch checked={emailPrefs[k]} onCheckedChange={(v) => { const n = {...emailPrefs, [k]: v}; setEmailPrefs(n); saveSettings({ email_prefs: n }); }} />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sos" className="mt-4">
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold">SOS preferences</h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div><div className="font-semibold">Share location on SOS</div><div className="text-xs text-muted-foreground">Send your live GPS to responders</div></div>
                  <Switch checked={sos.share_location} onCheckedChange={(v) => { const n = {...sos, share_location: v}; setSos(n); saveSettings({ sos_prefs: n }); }} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div><div className="font-semibold">Auto-call top contact</div><div className="text-xs text-muted-foreground">Ring priority-1 contact after SOS</div></div>
                  <Switch checked={sos.auto_call_contact} onCheckedChange={(v) => { const n = {...sos, auto_call_contact: v}; setSos(n); saveSettings({ sos_prefs: n }); }} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div><div className="font-semibold">Default severity</div><div className="text-xs text-muted-foreground">Pre-selected on the SOS screen</div></div>
                  <select value={sos.severity_default} onChange={(e) => { const n = {...sos, severity_default: e.target.value}; setSos(n); saveSettings({ sos_prefs: n }); }}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                    <option value="critical">Critical</option><option value="high">High</option><option value="moderate">Moderate</option><option value="low">Low</option>
                  </select>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-4">
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold">Two-factor authentication</h3>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-4">
                <div><div className="font-semibold">Enable 2FA</div><div className="text-xs text-muted-foreground">Coming soon — adds a one-time code at sign-in.</div></div>
                <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); saveSettings({ two_factor_enabled: v }); }} />
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-display text-lg font-bold">Change password</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><Label>New password</Label><Input type="password" value={pw.next} onChange={(e)=>setPw({...pw, next: e.target.value})} /></div>
                <div><Label>Confirm password</Label><Input type="password" value={pw.confirm} onChange={(e)=>setPw({...pw, confirm: e.target.value})} /></div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={onChangePassword} disabled={!pw.next || saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Update password</Button>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div><div className="font-semibold">Sign out from this device</div><div className="text-xs text-muted-foreground">Ends the current session.</div></div>
                <Button variant="outline" onClick={async () => { await logout(); navigate({ to: "/login" }); }}><LogOut className="mr-2 h-4 w-4"/>Sign out</Button>
              </div>
            </Card>
            <Card className="border-destructive/40 bg-destructive/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-destructive">Delete account data</div>
                  <div className="text-xs text-muted-foreground">Permanently removes your profile, records, appointments and settings. This cannot be undone.</div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will erase your profile data and sign you out. Contact support to remove your login credentials permanently.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteAccount} className="bg-destructive">Delete data</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageTransition>
    </DashboardShell>
  );
}
