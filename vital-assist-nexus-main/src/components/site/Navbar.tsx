import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Siren } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { Button } from "@/components/ui/button";
import { siteNav } from "@/constants/nav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all",
            scrolled ? "glass-strong shadow-md" : "bg-transparent",
          )}
        >
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {siteNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "text-foreground bg-muted/60" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                activeOptions={{ exact: true }}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground hover:bg-muted/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="hidden bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95 sm:inline-flex">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="destructive"
              className="hidden shadow-emergency md:inline-flex"
            >
              <Link to="/dashboard/patient">
                <Siren className="mr-1 h-4 w-4" /> SOS
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="glass-strong mt-2 overflow-hidden rounded-2xl p-3 md:hidden"
            >
              <div className="flex flex-col gap-1">
                {siteNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground">
                    <Link to="/signup" onClick={() => setOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
