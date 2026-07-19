import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-hero" />
      <div className="relative max-w-md text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-primary shadow-glow">
          <span className="font-display text-2xl font-bold text-primary-foreground">404</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-lg bg-gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-95"
          >
            Go home
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-6 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a href="/" className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-5 text-sm font-semibold hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MediRoute — AI-Powered Smart Hospital Emergency Response" },
      { name: "description", content: "AI-powered emergency response and ambulance routing platform. Connect patients, ambulances, hospitals, and blood banks in real time to save lives." },
      { name: "author", content: "MediRoute" },
      { property: "og:title", content: "MediRoute — AI-Powered Smart Hospital Emergency Response" },
      { property: "og:description", content: "AI-powered emergency response and ambulance routing platform. Connect patients, ambulances, hospitals, and blood banks in real time to save lives." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#2563EB" },
      { name: "twitter:title", content: "MediRoute — AI-Powered Smart Hospital Emergency Response" },
      { name: "twitter:description", content: "AI-powered emergency response and ambulance routing platform. Connect patients, ambulances, hospitals, and blood banks in real time to save lives." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/21aca319-3adf-421c-96ab-ee35cb659005/id-preview-7f062bfc--19f82247-e9f4-4b12-8791-b0d7a789839b.lovable.app-1784184009063.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/21aca319-3adf-421c-96ab-ee35cb659005/id-preview-7f062bfc--19f82247-e9f4-4b12-8791-b0d7a789839b.lovable.app-1784184009063.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
