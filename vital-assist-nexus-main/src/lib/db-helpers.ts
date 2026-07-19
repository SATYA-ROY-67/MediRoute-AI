// Shared helpers for date and BMI formatting across dashboards.
import { format, formatDistanceToNow } from "date-fns";

export function fmtDate(v: string | Date | null | undefined, fmt = "PP") {
  if (!v) return "—";
  try { return format(new Date(v), fmt); } catch { return String(v); }
}
export function fmtRelative(v: string | Date | null | undefined) {
  if (!v) return "—";
  try { return formatDistanceToNow(new Date(v), { addSuffix: true }); } catch { return String(v); }
}
export function calcAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age;
}
export function calcBmi(height_cm?: number | null, weight_kg?: number | null): number | null {
  if (!height_cm || !weight_kg || height_cm <= 0) return null;
  const m = height_cm / 100;
  return +(weight_kg / (m * m)).toFixed(1);
}
export function bmiCategory(bmi: number | null): { label: string; color: string } {
  if (bmi == null) return { label: "—", color: "text-muted-foreground" };
  if (bmi < 18.5) return { label: "Underweight", color: "text-warning" };
  if (bmi < 25)   return { label: "Normal",       color: "text-success" };
  if (bmi < 30)   return { label: "Overweight",   color: "text-warning" };
  return { label: "Obese", color: "text-destructive" };
}
export function profileCompletion(p: Record<string, unknown> | null | undefined): number {
  if (!p) return 0;
  const fields = ["full_name","phone","address","dob","gender","blood_group","height_cm","weight_kg","allergies","conditions","avatar_url"];
  let filled = 0;
  for (const f of fields) {
    const v = p[f];
    if (Array.isArray(v)) { if (v.length > 0) filled++; }
    else if (v !== null && v !== undefined && v !== "") filled++;
  }
  return Math.round((filled / fields.length) * 100);
}
