import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  Hero, Features, Stats, HowItWorks, Testimonials, FAQ, ContactCTA,
} from "@/components/site/landing-sections";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  );
}
