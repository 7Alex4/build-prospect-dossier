import type { ValidationIssue } from "./validation";

type UnknownRecord = Record<string, unknown>;

const TEXT_LIMITS: Readonly<Record<string, number>> = {
  alt: 320,
  asset: 180,
  audio: 200,
  axisLabel: 160,
  beat: 140,
  body: 360,
  caption: 220,
  client: 120,
  closing: 220,
  conclusion: 240,
  consequence: 260,
  constraints: 220,
  context: 180,
  counterpoint: 240,
  credit: 220,
  deliverable: 180,
  deliverables: 220,
  detail: 360,
  duration: 80,
  email: 254,
  eyebrow: 80,
  footer: 120,
  format: 80,
  from: 160,
  implication: 260,
  intro: 320,
  label: 140,
  lead: 380,
  legal: 180,
  lines: 220,
  logline: 420,
  message: 320,
  name: 120,
  nextStep: 180,
  note: 240,
  number: 32,
  onScreen: 140,
  outcomes: 180,
  owner: 100,
  phase: 80,
  phone: 40,
  proofPoints: 240,
  proposition: 180,
  quote: 420,
  reason: 280,
  relationshipLabel: 220,
  role: 180,
  sequence: 180,
  signal: 80,
  source: 180,
  statement: 300,
  studio: 120,
  subtitle: 180,
  tag: 80,
  text: 420,
  textFallback: 120,
  textMark: 120,
  timecode: 32,
  title: 120,
  to: 160,
  toneWords: 60,
  value: 48,
  visual: 300,
  website: 240,
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function walkText(
  value: unknown,
  path: string,
  key: string,
  issues: ValidationIssue[],
): void {
  if (typeof value === "string") {
    const limit = TEXT_LIMITS[key];
    if (limit !== undefined && value.length > limit) {
      issues.push({
        level: "error",
        code: "text-limit",
        path,
        message: `${value.length} caractères, maximum ${limit}.`,
      });
    }
    if (/\s{3,}/.test(value)) {
      issues.push({ level: "warning", code: "whitespace", path, message: "Espaces consécutives à vérifier." });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkText(item, `${path}[${index}]`, key, issues));
    return;
  }
  if (isRecord(value)) {
    Object.entries(value).forEach(([childKey, child]) =>
      walkText(child, path ? `${path}.${childKey}` : childKey, childKey, issues),
    );
  }
}

export function validateTextLimits(value: unknown, issues: ValidationIssue[]): void {
  walkText(value, "", "", issues);
}
