import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Siren, Ambulance, Building2, Droplet, ShieldCheck, Brain, Map, Bell,
  Clock, HeartPulse, Activity, ArrowRight, CheckCircle2, Star, Sparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/common";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="absolute inset-0 bg-hero" />
      <div className="absolute inset-0 grid-bg" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AI-Powered Emergency Response Platform
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            The fastest way from <br className="hidden sm:block" />
            <span className="gradient-text">emergency to care.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            MediRoute connects patients, ambulances, hospitals, and blood banks in real time.
            AI-driven triage and routing that shaves precious minutes off every emergency.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 bg-gradient-primary px-7 text-base font-semibold text-primary-foreground shadow-glow hover:opacity-95">
              <Link to="/signup">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <SosButton />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {["HIPAA-ready", "24/7 dispatch AI", "Sub-second alerts", "Trusted by 40+ hospitals"].map((t) => (
              <div key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> {t}</div>
            ))}
          </div>
        </motion.div>

        <HeroVisual />
      </div>
    </section>
  );
}

function SosButton() {
  return (
    <Link to="/dashboard/patient" className="relative inline-flex">
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/40" />
      <button className="relative inline-flex h-12 items-center gap-2 rounded-full bg-gradient-emergency px-7 text-base font-bold text-destructive-foreground shadow-emergency transition-transform hover:scale-[1.02]">
        <Siren className="h-5 w-5" /> Emergency SOS
      </button>
    </Link>
  );
}

function HeroVisual() {
  const nodes = [
    { icon: HeartPulse, label: "Patient", pos: "left-4 top-4 sm:left-10 sm:top-10", tone: "from-destructive to-destructive/70" },
    { icon: Ambulance,  label: "Ambulance", pos: "right-4 top-14 sm:right-16 sm:top-24", tone: "from-primary to-primary-glow" },
    { icon: Building2,  label: "Hospital", pos: "right-10 bottom-6 sm:right-24 sm:bottom-16", tone: "from-accent to-primary" },
    { icon: Droplet,    label: "Blood Bank", pos: "left-6 bottom-8 sm:left-20 sm:bottom-20", tone: "from-destructive to-accent" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.7 }}
      className="relative mx-auto mt-16 h-[340px] max-w-5xl md:h-[440px]"
    >
      <div className="absolute inset-0 rounded-3xl border border-border glass shadow-lg" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      {/* central AI brain */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-primary shadow-glow">
            <Brain className="h-10 w-10 text-primary-foreground" strokeWidth={2} />
          </div>
          <div className="mt-3 text-center text-xs font-semibold uppercase tracking-widest text-primary">MediRoute AI</div>
        </div>
      </div>

      {nodes.map((n, i) => (
        <motion.div
          key={n.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.15 }}
          className={`absolute ${n.pos} animate-float`}
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          <div className="glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-md">
            <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${n.tone} text-primary-foreground`}>
              <n.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Node</div>
              <div className="text-sm font-bold">{n.label}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

const features = [
  { icon: Brain, title: "AI Triage Engine", desc: "Prioritizes cases by severity in milliseconds using medical NLP models." },
  { icon: Map, title: "Smart Route Planning", desc: "Real-time GPS routing that adapts to traffic and hospital bed availability." },
  { icon: Siren, title: "One-Tap SOS", desc: "Instantly notifies the nearest ambulance, hospital and family contacts." },
  { icon: Building2, title: "Hospital Sync", desc: "Live bed, ICU, and specialist availability across every partner hospital." },
  { icon: Droplet, title: "Blood Bank Network", desc: "Match rare blood groups with nearby banks in under 30 seconds." },
  { icon: ShieldCheck, title: "End-to-End Encrypted", desc: "Compliance-ready architecture with granular role-based access control." },
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Features"
          title="Built for the moments that matter most"
          description="A complete operating system for emergency healthcare — from the patient's first tap to hospital handoff."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group h-full overflow-hidden border-border/60 p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 text-primary transition-transform group-hover:scale-110">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Stats() {
  const stats = [
    { value: "3.1 min", label: "Avg. response time" },
    { value: "42%", label: "Faster triage" },
    { value: "40+", label: "Partner hospitals" },
    { value: "99.98%", label: "Platform uptime" },
  ];
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="glass-strong grid grid-cols-2 gap-6 rounded-3xl p-8 shadow-lg md:grid-cols-4 md:p-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="font-display text-3xl font-bold gradient-text md:text-5xl">{s.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground md:text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: Siren, title: "Tap SOS", desc: "Patient or bystander taps the SOS button; location and vitals are shared instantly." },
    { icon: Brain, title: "AI Triage", desc: "Our engine determines severity, required specialty, and best-fit destination." },
    { icon: Ambulance, title: "Smart Dispatch", desc: "Nearest ambulance is dispatched on the fastest live-traffic route." },
    { icon: Building2, title: "Hospital Ready", desc: "Hospital pre-warned with case details, ETA and reserved bed on arrival." },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="How it works" title="From emergency to treatment in four steps" />
        <div className="relative grid gap-6 md:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative text-center"
            >
              <div className="relative z-10 mx-auto grid h-18 w-18 place-items-center rounded-2xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">Step {i + 1}</div>
              <h3 className="mt-1 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const items = [
    { name: "Dr. R. Sharma", role: "Head of Emergency, AIIMS", text: "MediRoute cut our door-to-doctor time by 41%. It's become part of our daily protocol." },
    { name: "Priya M.", role: "Ambulance Fleet Manager", text: "Dispatch is nearly hands-free now. The AI routes as well as my most senior operator." },
    { name: "Rohan K.", role: "Patient family", text: "The SOS button reached the hospital before we did. I don't know what would have happened otherwise." },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Trusted by teams" title="Loved by clinicians, dispatchers, and families" />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full p-6">
                <div className="mb-3 flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm leading-relaxed">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const items = [
    { q: "Is MediRoute available across India?", a: "We're onboarding hospitals city-by-city. Currently live in Delhi-NCR, Bengaluru, Mumbai, and Hyderabad with rapid expansion." },
    { q: "Does the ambulance dispatch really run on AI?", a: "Yes. Our routing engine combines live traffic, hospital load, patient severity, and specialty matching in a single optimization loop." },
    { q: "How is patient data protected?", a: "End-to-end encryption, role-based access, audit logging, and full compliance with Indian DPDP Act and HIPAA-aligned practices." },
    { q: "Can hospitals integrate with existing EMRs?", a: "Yes — we ship REST APIs and HL7/FHIR adapters. Full documentation is provided to partner IT teams." },
    { q: "Is there a cost for patients?", a: "No. Patients use MediRoute completely free. We partner with hospitals and government bodies on the operations side." },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        <Accordion type="single" collapsible className="glass-strong overflow-hidden rounded-2xl">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b border-border/60 px-5 last:border-0">
              <AccordionTrigger className="text-left text-base font-semibold">{it.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function ContactCTA() {
  return (
    <section id="contact" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-glow md:p-14">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-10 md:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <MessageSquare className="h-3.5 w-3.5" /> Talk to us
              </div>
              <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
                Partner your hospital or fleet with MediRoute
              </h2>
              <p className="mt-3 text-sm opacity-90 md:text-base">
                We onboard hospitals, ambulance networks, and blood banks in under 2 weeks. Get a personalized demo.
              </p>
              <div className="mt-6 space-y-2 text-sm opacity-90">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Response within 24 hours</div>
                <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Live pilot in your city</div>
                <div className="flex items-center gap-2"><Bell className="h-4 w-4" /> Dedicated integration support</div>
              </div>
            </div>
            <div className="glass-strong space-y-3 rounded-2xl p-6 text-foreground">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First name" />
                <Input placeholder="Last name" />
              </div>
              <Input type="email" placeholder="Work email" />
              <Input placeholder="Organization" />
              <Textarea placeholder="How can we help?" rows={3} />
              <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-95">
                Request a demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
