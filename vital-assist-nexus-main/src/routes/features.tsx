import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Features, HowItWorks, ContactCTA } from "@/components/site/landing-sections";
import { SectionHeading } from "@/components/common";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — MediRoute" },
      { name: "description", content: "Every capability of MediRoute: AI triage, smart routing, hospital sync, blood-bank network, and more." },
      { property: "og:title", content: "MediRoute Features" },
      { property: "og:description", content: "Explore the AI-powered features that make MediRoute the fastest way from emergency to care." },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32">
        <section className="relative overflow-hidden py-12">
          <div className="absolute inset-0 bg-hero" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <SectionHeading
              eyebrow="Product"
              title="Every capability, in one platform"
              description="A complete emergency operating system, built module-by-module for hospitals, dispatchers, and patients."
            />
          </div>
        </section>
        <Features />
        <HowItWorks />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  );
}
