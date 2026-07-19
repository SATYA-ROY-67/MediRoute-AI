import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — MediRoute" },
      { name: "description", content: "Get in touch with the MediRoute team." },
      { property: "og:title", content: "Contact MediRoute" },
    ],
  }),
  component: ContactPage,
});

type ContactForm = { name: string; email: string; org: string; message: string };

function ContactPage() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ContactForm>();
  const onSubmit = async (data: ContactForm) => {
    // TODO: connect Spring Boot backend
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Message sent — we'll get back within 24 hours.");
    reset();
    console.log("contact form", data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-16">
        <section className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              Contact
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Let's build a safer city together.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Hospitals, ambulance networks, blood banks and government bodies — reach out and we'll onboard you within two weeks.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Mail, title: "Email us", val: "hello@mediroute.ai", sub: "Response in 24h" },
              { icon: Phone, title: "Emergency line", val: "108 / 112", sub: "Nationwide, 24/7" },
              { icon: MapPin, title: "Head office", val: "Bengaluru, India", sub: "Also in Delhi & Mumbai" },
            ].map((c) => (
              <Card key={c.title} className="p-5">
                <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.title}</div>
                <div className="mt-1 font-display text-lg font-bold">{c.val}</div>
                <div className="text-xs text-muted-foreground">{c.sub}</div>
              </Card>
            ))}
          </div>

          <Card className="mx-auto mt-10 max-w-3xl p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Ada Lovelace" {...register("name", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@hospital.org" {...register("email", { required: true })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org">Organization</Label>
                <Input id="org" placeholder="City General Hospital" {...register("org")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={5} placeholder="Tell us about your team..." {...register("message", { required: true })} />
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95">
                {isSubmitting ? "Sending..." : <>Send message <Send className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
