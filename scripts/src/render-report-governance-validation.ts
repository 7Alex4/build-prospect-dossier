type UnknownRecord = Record<string, unknown>;

const DISTRIBUTION_MODES = ["private-prospecting", "client-project", "public"];
const RELATIONSHIP_STATUSES = ["independent-proposal", "client-approved", "commissioned"];
const GENERATIVE_POLICIES = ["forbidden", "authorized"];

export interface ReportAssetPolicy {
  readonly distributionMode: string | null;
  readonly generativeAssets: string | null;
  readonly generativeAuthorizationValid: boolean;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validAuthorization(value: unknown): boolean {
  return isRecord(value)
    && value.status === "explicitly-authorized"
    && nonEmpty(value.authorizedBy)
    && nonEmpty(value.reference);
}

export function validateRenderGovernance(
  value: unknown,
  stage: string | null,
  issues: string[],
): ReportAssetPolicy {
  if (!isRecord(value)) {
    issues.push("Render report governance is missing or invalid.");
    return { distributionMode: null, generativeAssets: null, generativeAuthorizationValid: false };
  }
  const distributionMode = DISTRIBUTION_MODES.includes(String(value.distributionMode))
    ? String(value.distributionMode)
    : null;
  const generativeAssets = GENERATIVE_POLICIES.includes(String(value.generativeAssets))
    ? String(value.generativeAssets)
    : null;
  if (distributionMode === null) issues.push("Render report governance distributionMode is invalid.");
  if (!RELATIONSHIP_STATUSES.includes(String(value.relationshipStatus))) {
    issues.push("Render report governance relationshipStatus is invalid.");
  }
  if (generativeAssets === null) issues.push("Render report governance generativeAssets is invalid.");
  if (value.stage !== stage) issues.push("Render report governance stage must match the root stage.");
  if (!Number.isInteger(value.forbiddenClientTermsConfigured)
    || Number(value.forbiddenClientTermsConfigured) < 0) {
    issues.push("Render report governance forbiddenClientTermsConfigured is invalid.");
  }
  const authorization = value.generativeAssetsAuthorization;
  const generativeAuthorizationValid = generativeAssets === "authorized"
    ? validAuthorization(authorization)
    : authorization === null;
  if (!generativeAuthorizationValid) {
    const expectation = generativeAssets === "authorized"
      ? "must contain status, authorizedBy and reference"
      : "must be null when generation is forbidden";
    issues.push(`Render report generative authorization ${expectation}.`);
  }
  return { distributionMode, generativeAssets, generativeAuthorizationValid };
}
