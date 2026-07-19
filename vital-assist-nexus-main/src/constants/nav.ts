import {
  Activity, Ambulance, Building2, Droplet, LayoutDashboard, ShieldCheck, User,
  Settings, Bell, FileText, Users, Map, Calendar, BarChart3, Package, Siren,
  Phone, ClipboardList, Stethoscope, BedDouble, TrendingUp, Fuel, History, Navigation,
  Brain, GitBranch,
} from "lucide-react";

export const siteNav = [
  { label: "Home", to: "/" as const },
  { label: "Features", to: "/features" as const },
  { label: "About", to: "/about" as const },
  { label: "Contact", to: "/contact" as const },
];

export type DashboardRole = "patient" | "hospital" | "ambulance" | "blood-bank" | "admin";

export const roleMeta: Record<DashboardRole, { label: string; icon: typeof User; accent: string }> = {
  patient:      { label: "Patient",     icon: User,       accent: "from-primary to-primary-glow" },
  hospital:     { label: "Hospital",    icon: Building2,  accent: "from-accent to-primary" },
  ambulance:    { label: "Ambulance",   icon: Ambulance,  accent: "from-destructive to-primary" },
  "blood-bank": { label: "Blood Bank",  icon: Droplet,    accent: "from-destructive to-accent" },
  admin:        { label: "Admin",       icon: ShieldCheck,accent: "from-primary to-accent" },
};

export const dashboardNav: Record<DashboardRole, Array<{ label: string; to: string; icon: typeof User }>> = {
  patient: [
    { label: "Dashboard",         to: "/dashboard/patient",  icon: LayoutDashboard },
    { label: "Emergency SOS",     to: "/sos",                icon: Siren },
    { label: "AI Triage",         to: "/triage",             icon: Brain },
    { label: "Triage History",    to: "/triage-history",     icon: History },
    { label: "Live Map",          to: "/map",                icon: Map },
    { label: "Dijkstra Route",    to: "/dijkstra",           icon: GitBranch },
    { label: "Medical Records",   to: "/records",            icon: FileText },
    { label: "Appointments",      to: "/appointments",       icon: Calendar },
    { label: "Emergency Contacts",to: "/contacts",           icon: Phone },
    { label: "Blood Requests",    to: "/blood-requests",     icon: Droplet },
    { label: "SOS History",       to: "/sos-history",        icon: History },
    { label: "Profile",           to: "/profile",            icon: User },
    { label: "Settings",          to: "/settings",           icon: Settings },
  ],
  hospital: [
    { label: "Dashboard",           to: "/dashboard/hospital",   icon: LayoutDashboard },
    { label: "Emergency Requests",  to: "/dashboard/hospital",   icon: Siren },
    { label: "ICU / Beds",          to: "/dashboard/hospital",   icon: BedDouble },
    { label: "Doctors",             to: "/dashboard/hospital",   icon: Stethoscope },
    { label: "Blood Requests",      to: "/blood-requests",       icon: Droplet },
    { label: "Live Map",            to: "/map",                  icon: Map },
    { label: "Profile",             to: "/profile",              icon: User },
    { label: "Settings",            to: "/settings",             icon: Settings },
  ],
  ambulance: [
    { label: "Dashboard",           to: "/dashboard/ambulance",  icon: LayoutDashboard },
    { label: "Dispatch",            to: "/dashboard/ambulance",  icon: Siren },
    { label: "Trip History",        to: "/dashboard/ambulance",  icon: History },
    { label: "Vehicle",             to: "/dashboard/ambulance",  icon: Fuel },
    { label: "Live Map",            to: "/map",                  icon: Map },
    { label: "Dijkstra Route",      to: "/dijkstra",             icon: Navigation },
    { label: "Profile",             to: "/profile",              icon: User },
    { label: "Settings",            to: "/settings",             icon: Settings },
  ],
  "blood-bank": [
    { label: "Dashboard",           to: "/dashboard/blood-bank", icon: LayoutDashboard },
    { label: "Inventory",           to: "/dashboard/blood-bank", icon: Package },
    { label: "Requests",            to: "/blood-requests",       icon: Bell },
    { label: "Donors",              to: "/dashboard/blood-bank", icon: Users },
    { label: "Availability",        to: "/dashboard/blood-bank", icon: Activity },
    { label: "Profile",             to: "/profile",              icon: User },
    { label: "Settings",            to: "/settings",             icon: Settings },
  ],
  admin: [
    { label: "Dashboard",           to: "/dashboard/admin",      icon: LayoutDashboard },
    { label: "Users",               to: "/dashboard/admin",      icon: Users },
    { label: "Hospitals",           to: "/dashboard/admin",      icon: Building2 },
    { label: "Ambulances",          to: "/dashboard/admin",      icon: Ambulance },
    { label: "Blood Banks",         to: "/dashboard/admin",      icon: Droplet },
    { label: "SOS Requests",        to: "/dashboard/admin",      icon: Siren },
    { label: "Analytics",           to: "/dashboard/admin",      icon: TrendingUp },
    { label: "Reports",             to: "/dashboard/admin",      icon: BarChart3 },
    { label: "Profile",             to: "/profile",              icon: User },
    { label: "Settings",            to: "/settings",             icon: Settings },
  ],
};
