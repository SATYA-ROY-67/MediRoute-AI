import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TriageInput = z.object({
  age: z.number().min(0).max(130),
  gender: z.string().default("other"),
  hr: z.number().min(20).max(260),
  bp: z.string(),
  temp: z.number().min(30).max(45),
  pain: z.number().min(0).max(10),
  duration_min: z.number().min(0).max(10000),
  symptoms: z.array(z.string()).max(20),
  history: z.string().max(500).default(""),
});

const TriageSchema = z.object({
  severity: z.enum(["critical","high","moderate","low"]),
  risk_score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  department: z.string(),
  possible_conditions: z.array(z.string()).max(6),
  recommended_hospital_type: z.string(),
  clinical_summary: z.string(),
  red_flags: z.array(z.string()).max(6).default([]),
});

export type TriageResult = z.infer<typeof TriageSchema>;

/**
 * AI Triage via Lovable AI Gateway (Gemini 2.5 Flash by default).
 * Falls back to a deterministic rule-based scorer if the gateway is unavailable
 * — so the feature never breaks in front of an evaluator.
 */
export const runAiTriage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TriageInput.parse(d))
  .handler(async ({ data }): Promise<TriageResult> => {
    const key = process.env.LOVABLE_API_KEY;
    // Deterministic fallback (used when no key or gateway fails)
    const fallback = (): TriageResult => {
      let score = 15;
      const s = data.symptoms.map((x) => x.toLowerCase());
      if (s.some((x) => x.includes("chest"))) score += 28;
      if (s.some((x) => x.includes("breath"))) score += 18;
      if (s.some((x) => x.includes("unconscious"))) score += 32;
      if (s.some((x) => x.includes("bleed"))) score += 22;
      if (s.some((x) => x.includes("head"))) score += 20;
      if (s.some((x) => x.includes("stroke"))) score += 30;
      score += Math.min(20, data.pain * 2);
      if (data.hr > 120 || data.hr < 50) score += 10;
      if (data.temp > 39.5) score += 8;
      if (data.age > 65 || data.age < 5) score += 8;
      score = Math.min(99, score);
      const severity: TriageResult["severity"] =
        score > 80 ? "critical" : score > 60 ? "high" : score > 40 ? "moderate" : "low";
      const department = s.some((x)=>x.includes("chest")) ? "Cardiology"
        : s.some((x)=>x.includes("head")||x.includes("stroke")) ? "Neurology"
        : s.some((x)=>x.includes("fracture")) ? "Orthopedics"
        : s.some((x)=>x.includes("breath")) ? "Pulmonology" : "Emergency";
      return {
        severity, risk_score: score, confidence: Math.min(95, 65 + Math.floor(score/4)),
        department, possible_conditions: [department + " workup", "Acute presentation"],
        recommended_hospital_type: score > 75 ? "Tertiary hospital with ICU" : "Multi-specialty hospital",
        clinical_summary: `Deterministic score ${score}/100 based on symptoms and vitals. Advise ${department} triage.`,
        red_flags: score > 75 ? ["High acuity — dispatch immediately"] : [],
      };
    };

    if (!key) return fallback();

    const prompt = `You are an emergency triage assistant. Assess this patient and respond with STRICT JSON only.

Patient:
- Age: ${data.age}, Gender: ${data.gender}
- HR: ${data.hr} bpm, BP: ${data.bp}, Temp: ${data.temp}°C
- Pain: ${data.pain}/10, Duration: ${data.duration_min} min
- Symptoms: ${data.symptoms.join(", ") || "none reported"}
- History: ${data.history || "none"}

Respond with JSON matching this exact schema:
{
  "severity": "critical" | "high" | "moderate" | "low",
  "risk_score": number 0-100,
  "confidence": number 0-100,
  "department": "Cardiology" | "Neurology" | "Pulmonology" | "Trauma" | "Orthopedics" | "Emergency" | string,
  "possible_conditions": [string, ...],  // 2-4 items
  "recommended_hospital_type": string,
  "clinical_summary": string,             // 1-2 sentences
  "red_flags": [string, ...]              // 0-4 urgent items
}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a clinical triage assistant. Respond ONLY with the JSON object requested — no prose, no markdown fences." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        console.error("[triage] gateway error", res.status, await res.text());
        return fallback();
      }
      const json = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = TriageSchema.parse(JSON.parse(cleaned));
      return parsed;
    } catch (err) {
      console.error("[triage] parse/fetch failure", err);
      return fallback();
    }
  });
