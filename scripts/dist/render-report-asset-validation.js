const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const DISTRIBUTION_MODES = ["private-prospecting", "client-project", "public"];
const ORIGINS = [
    "provided",
    "official-site",
    "press-kit",
    "licensed-library",
    "editorial",
    "screenshot",
    "studio-created",
    "generated",
];
const SOURCE_KINDS = ["data-uri", "local-src", "ledger-id", "unresolved"];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nonEmpty(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function validHash(value) {
    return typeof value === "string" && SHA256_PATTERN.test(value);
}
function stringArray(value) {
    return Array.isArray(value) && value.every((entry) => typeof entry === "string") ? value : null;
}
function validateAssetShape(entry, index, issues) {
    const scopes = stringArray(entry.allowedDistributionScopes);
    if (!nonEmpty(entry.id) || !nonEmpty(entry.origin) || !nonEmpty(entry.rightsBasis)
        || !nonEmpty(entry.status) || scopes === null || !isRecord(entry.sourceIdentity)
        || !nonEmpty(entry.sourceIdentity.kind) || !validHash(entry.sourceIdentity.sha256)) {
        issues.push(`Render report assetRegistry[${index}] is incomplete.`);
        return null;
    }
    if (!ORIGINS.includes(entry.origin)) {
        issues.push(`Render report assetRegistry[${index}] origin is invalid.`);
    }
    if (entry.status !== "approved") {
        issues.push(`Render report assetRegistry[${index}] status must be approved.`);
    }
    if (scopes.length === 0 || scopes.some((scope) => !DISTRIBUTION_MODES.includes(scope))) {
        issues.push(`Render report assetRegistry[${index}] distribution scopes are invalid.`);
    }
    if (!SOURCE_KINDS.includes(String(entry.sourceIdentity.kind))) {
        issues.push(`Render report assetRegistry[${index}] source identity kind is invalid.`);
    }
    if ("src" in entry)
        issues.push(`Render report assetRegistry[${index}] must not expose src.`);
    return scopes;
}
export function validateRenderAssets(value, policy, issues) {
    if (!Array.isArray(value)) {
        issues.push("Render report assetRegistry must be an array.");
        return new Set();
    }
    const ids = new Set();
    value.forEach((entry, index) => {
        if (!isRecord(entry)) {
            issues.push(`Render report assetRegistry[${index}] is incomplete.`);
            return;
        }
        const scopes = validateAssetShape(entry, index, issues);
        if (!nonEmpty(entry.id))
            return;
        if (ids.has(entry.id))
            issues.push(`Render report contains duplicate asset ID: ${entry.id}.`);
        ids.add(entry.id);
        if (scopes !== null && policy.distributionMode !== null
            && !scopes.includes(policy.distributionMode)) {
            issues.push(`Render report asset ${entry.id} is not cleared for ${policy.distributionMode}.`);
        }
        if (entry.origin === "generated"
            && (policy.generativeAssets !== "authorized" || !policy.generativeAuthorizationValid)) {
            issues.push(`Render report asset ${entry.id} violates the generative asset policy.`);
        }
    });
    return ids;
}
//# sourceMappingURL=render-report-asset-validation.js.map