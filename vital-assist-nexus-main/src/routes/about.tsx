import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Target, Heart, Users, Award } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SectionHeading } from "@/components/common";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MediRoute" },
      { name: "description", content: "Learn about MediRoute's mission to save lives through AI-powered emergency response." },
      { property: "og:title", content: "About MediRoute" },
      { property: "og:description", content: "Our mission, team, and story." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Heart, title: "Patient First", desc: "Every design decision optimizes for the person on the other side of the SOS button." },
  { icon: Target, title: "Precision", desc: "Emergency care demands accuracy. Our models are audited by clinicians every quarter." },
  { icon: Users, title: "Open Network", desc: "We integrate with existing hospital, ambulance, and government infrastructure." },
  { icon: Award, title: "Trust", desc: "Enterprise-grade security, transparent AI, and a public reliability dashboard." },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32">
        <section className="relative overflow-hidden py-16">
          <div className="absolute inset-0 bg-hero" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              About Us
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              We're building the <span className="gradient-text">emergency response</span> layer for healthcare.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Every year, avoidable delays in emergency care cost thousands of lives. MediRoute exists to remove those delays with intelligent coordination.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-3xl font-bold">Our Mission</h2>
              <p className="mt-4 text-muted-foreground">
                Cut India's average emergency response time in half by 2028. We connect every actor in the emergency chain — patients, ambulances, hospitals, blood banks — into a single AI-orchestrated network.
              </p>
              <p className="mt-3 text-muted-foreground">
                Built with the guidance of emergency physicians, ambulance operators, and open-source contributors.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="glass-strong rounded-3xl p-8 shadow-lg">
                <div className="grid grid-cols-2 gap-6 text-center">
                  {[
                    { v: "2024", l: "Founded" },
                    { v: "40+", l: "Partner hospitals" },
                    { v: "12k+", l: "Emergencies handled" },
                    { v: "4 cities", l: "Live coverage" },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="font-display text-3xl font-bold gradient-text">{s.v}</div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading eyebrow="What we value" title="The principles behind every line of code" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v, i) => (
                <motion.div key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="h-full p-6">
                    <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 text-primary">
                      <v.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold">{v.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
