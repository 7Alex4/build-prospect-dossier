import type { ValidationIssue } from "./validation";
import type { DossierSlide } from "./types";
import { clientFacingAuditStrings, structuralAuditStrings } from "./content-claims";
import { validateFinalEvidenceVisibility } from "./governance-visibility-validation";
import { validateGenerativeAuthorization } from "./generative-authorization-validation";

type UnknownRecord = Record<string, unknown>;

const claimKinds = ["fact", "quote", "observation", "interpretation", "proposal"] as const;
const evidenceStatuses = ["verified", "official-only", "needs-check", "internal-only", "rejected"] as const;
const objectiveKinds = new Set(["fact", "quote", "observation"]);
const usableStatuses = new Set(["verified", "official-only"]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ level: "error", code, path, message });
}

function allowed(value: unknown, choices: readonly string[]): boolean {
  return typeof value === "string" && choices.includes(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateMeta(meta: unknown, issues: ValidationIssue[]): UnknownRecord | undefined {
  if (!isRecord(meta)) return undefined;
  const enums: ReadonlyArray<readonly [string, readonly string[]]> = [
    ["frameworkProfile", ["black-flower", "neutral"]],
    ["distributionMode", ["private-prospecting", "client-project", "public"]],
    ["relationshipStatus", ["independent-proposal", "client-approved", "commissioned"]],
    ["generativeAssets", ["forbidden", "authorized"]],
    ["stage", ["draft", "final"]],
  ];
  enums.forEach(([key, choices]) => {
    if (!allowed(meta[key], choices)) {
      error(issues, "governance-enum", `meta.${key}`, `Valeur attendue: ${choices.join(", ")}.`);
    }
  });
  if (meta.studio !== undefined && !nonEmpty(meta.studio)) {
    error(issues, "governance-text", "meta.studio", "Nom de studio non vide requis lorsqu'il est fourni.");
  }
  if (meta.studioIdentity !== undefined) {
    const identity = meta.studioIdentity;
    if (!isRecord(identity)) {
      error(issues, "studio-identity-shape", "meta.studioIdentity", "Objet d'identité studio requis.");
    } else {
      ["canonicalName", "signature"].forEach((key) => {
        if (!nonEmpty(identity[key])) {
          error(issues, "studio-identity-text", `meta.studioIdentity.${key}`, "Texte non vide requis.");
        }
      });
    }
  }
  if (meta.forbiddenClientTerms !== undefined) {
    if (!Array.isArray(meta.forbiddenClientTerms)) {
      error(issues, "forbidden-terms-shape", "meta.forbiddenClientTerms", "Liste de termes requise.");
    } else {
      meta.forbiddenClientTerms.forEach((term, index) => {
        if (!nonEmpty(term)) {
          error(issues, "forbidden-term-empty", `meta.forbiddenClientTerms[${index}]`, "Terme non vide requis.");
        }
      });
    }
  }
  validateGenerativeAuthorization(meta, issues);
  return meta;
}

function validateRegistry(value: unknown, issues: ValidationIssue[]): Map<string, UnknownRecord> {
  const registry = new Map<string, UnknownRecord>();
  if (!Array.isArray(value)) {
    error(issues, "evidence-required", "evidence", "Registre de preuves requis, même vide.");
    return registry;
  }
  value.forEach((entry, index) => {
    const path = `evidence[${index}]`;
    if (!isRecord(entry)) {
      error(issues, "evidence-shape", path, "Objet de preuve requis.");
      return;
    }
    ["id", "claim"].forEach((key) => {
      if (!nonEmpty(entry[key])) error(issues, "evidence-text", `${path}.${key}`, "Texte non vide requis.");
    });
    if (!allowed(entry.kind, claimKinds)) {
      error(issues, "evidence-kind", `${path}.kind`, "Type de preuve invalide.");
    }
    if (!allowed(entry.status, evidenceStatuses)) {
      error(issues, "evidence-status-enum", `${path}.status`, "Statut de preuve invalide.");
    }
    if (entry.sourceUrl !== undefined && (!nonEmpty(entry.sourceUrl) || !validWebUrl(entry.sourceUrl))) {
      error(issues, "evidence-url", `${path}.sourceUrl`, "URL HTTP ou HTTPS valide requise.");
    }
    if (nonEmpty(entry.id)) {
      if (registry.has(entry.id)) error(issues, "evidence-duplicate", `${path}.id`, "Identifiant de preuve dupliqué.");
      else registry.set(entry.id, entry);
    }
  });
  return registry;
}

function validateEvidenceId(
  id: unknown,
  path: string,
  expectedKind: unknown,
  registry: ReadonlyMap<string, UnknownRecord>,
  issues: ValidationIssue[],
): void {
  if (!nonEmpty(id)) return;
  const evidence = registry.get(id);
  if (!evidence) {
    error(issues, "evidence-unknown", path, `Preuve inconnue: ${id}.`);
    return;
  }
  const evidenceKind = String(evidence.kind);
  const compatibleKind = expectedKind === "proposal"
    || (expectedKind === "interpretation"
      && ["fact", "observation", "interpretation"].includes(evidenceKind))
    || evidence.kind === expectedKind;
  if (typeof expectedKind === "string" && !compatibleKind) {
    error(issues, "evidence-kind-mismatch", path, "Le type du claim et celui de la preuve doivent correspondre.");
  }
  if (evidence.status === "rejected") {
    error(issues, "evidence-unusable", path, "Une preuve rejetée ne peut pas être citée.");
    return;
  }
  if (typeof expectedKind === "string" && objectiveKinds.has(expectedKind)
    && !usableStatuses.has(String(evidence.status))) {
    const subject = expectedKind === "quote" ? "Une citation" : "Ce claim factuel";
    error(issues, "evidence-unusable", path, `${subject} exige une preuve verified ou official-only.`);
  }
}

function validateSlideEvidence(
  slides: unknown,
  registry: ReadonlyMap<string, UnknownRecord>,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(slides)) return;
  slides.forEach((slide, slideIndex) => {
    if (!isRecord(slide)) return;
    if (Array.isArray(slide.evidenceIds)) {
      slide.evidenceIds.forEach((id, index) =>
        validateEvidenceId(id, `slides[${slideIndex}].evidenceIds[${index}]`, undefined, registry, issues),
      );
    }
    if (!Array.isArray(slide.claims)) return;
    slide.claims.forEach((claim, claimIndex) => {
      if (!isRecord(claim) || !Array.isArray(claim.evidenceIds)) return;
      claim.evidenceIds.forEach((id, idIndex) => validateEvidenceId(
        id,
        `slides[${slideIndex}].claims[${claimIndex}].evidenceIds[${idIndex}]`,
        claim.kind,
        registry,
        issues,
      ));
    });
  });
}

function normalized(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

function explicitIndependentLabel(label: string, client: string, studio?: string): boolean {
  const value = normalized(label);
  const relation = (value.includes("proposition") || value.includes("proposal"))
    && (value.includes("independant") || value.includes("independent"));
  const identities = value.includes(normalized(client))
    && (studio === undefined || value.includes(normalized(studio)));
  return relation && identities;
}

function validateRelationship(meta: UnknownRecord, slides: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(slides)) return;
  slides.forEach((slide, index) => {
    if (isRecord(slide) && slide.relationshipLabel !== undefined && !nonEmpty(slide.relationshipLabel)) {
      error(issues, "relationship-label", `slides[${index}].relationshipLabel`, "Libellé de relation non vide requis.");
    }
  });
  if (meta.relationshipStatus !== "independent-proposal") return;
  const client = nonEmpty(meta.client) ? meta.client : "";
  const studio = nonEmpty(meta.studio) ? meta.studio : undefined;
  ["cover"].forEach((type) => {
    const matches = slides.flatMap((slide, index) => isRecord(slide) && slide.type === type ? [{ slide, index }] : []);
    if (matches.length === 0) {
      error(issues, "relationship-slide", "slides", `Une slide ${type} est requise pour une proposition indépendante.`);
    }
    matches.forEach(({ slide, index }) => {
      if (!nonEmpty(slide.relationshipLabel)
        || !explicitIndependentLabel(slide.relationshipLabel, client, studio)) {
        error(
          issues,
          "relationship-label",
          `slides[${index}].relationshipLabel`,
          studio
            ? `Relation explicite requise. Exemple: Proposition indépendante pour ${client}, par ${studio}.`
            : `Relation explicite requise. Exemple: Proposition indépendante pour ${client}.`,
        );
      }
    });
  });
}

function validateForbiddenEntries(
  entries: readonly { readonly path: string; readonly value: string }[],
  basePath: string,
  terms: readonly string[],
  issues: ValidationIssue[],
): void {
  entries.forEach((entry) => {
    const value = entry.value.normalize("NFKC").toLocaleLowerCase("fr");
    terms.forEach((term) => {
      if (value.includes(term.normalize("NFKC").toLocaleLowerCase("fr"))) {
        error(issues, "forbidden-client-term", `${basePath}.${entry.path}`, `Terme client interdit détecté: ${term}.`);
      }
    });
  });
}

function validateForbiddenTerms(
  meta: UnknownRecord,
  slides: unknown,
  theme: unknown,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(meta.forbiddenClientTerms)) return;
  const terms = meta.forbiddenClientTerms.filter(nonEmpty);
  if (Array.isArray(slides)) {
    slides.forEach((slide, index) => {
      if (isRecord(slide)) {
        validateForbiddenEntries(
          clientFacingAuditStrings(slide as unknown as DossierSlide),
          `slides[${index}]`,
          terms,
          issues,
        );
      }
    });
  }
  validateForbiddenEntries(structuralAuditStrings(theme), "theme", terms, issues);
}

function validateReferenceUrls(slides: unknown, issues: ValidationIssue[]): void {
  if (!Array.isArray(slides)) return;
  slides.forEach((slide, slideIndex) => {
    if (!isRecord(slide) || slide.type !== "references" || !Array.isArray(slide.references)) return;
    slide.references.forEach((reference, referenceIndex) => {
      if (!isRecord(reference) || reference.url === undefined) return;
      if (!nonEmpty(reference.url) || !validWebUrl(reference.url)) {
        error(issues, "reference-url", `slides[${slideIndex}].references[${referenceIndex}].url`, "URL HTTP ou HTTPS valide requise.");
      }
    });
  });
}

export function validateGovernance(value: UnknownRecord, issues: ValidationIssue[]): void {
  const meta = validateMeta(value.meta, issues);
  const registry = validateRegistry(value.evidence, issues);
  validateSlideEvidence(value.slides, registry, issues);
  validateFinalEvidenceVisibility(meta, value.slides, registry, issues);
  if (meta) {
    validateRelationship(meta, value.slides, issues);
    validateForbiddenTerms(meta, value.slides, value.theme, issues);
  }
  validateReferenceUrls(value.slides, issues);
}
