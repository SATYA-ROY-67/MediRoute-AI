import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            AI-powered emergency response, ambulance routing, and hospital coordination — built to save lives.
          </p>
          <div className="flex gap-2">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border transition-colors hover:bg-muted hover:text-primary"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Services</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Emergency SOS</li>
            <li>Ambulance Routing</li>
            <li>Hospital Coordination</li>
            <li>Blood Bank Network</li>
            <li>Patient Records</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Emergency Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-destructive" /> 108 / 112</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> help@mediroute.ai</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} MediRoute. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy Policy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
