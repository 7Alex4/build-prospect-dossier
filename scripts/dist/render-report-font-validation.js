import { createHash } from "node:crypto";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ROLES = ["display", "body", "mono"];
const STYLES = ["normal", "italic"];
const WEIGHTS = [400, 500, 600, 700, 800, 900];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nonEmpty(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function canonical(value) {
    if (Array.isArray(value))
        return `[${value.map(canonical).join(",")}]`;
    if (!isRecord(value))
        return JSON.stringify(value) ?? "null";
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}
function hash(value) {
    return createHash("sha256").update(value).digest("hex");
}
function key(role, family, style, weight) {
    return `${String(role)}:${String(family)}:${String(style)}:${String(weight)}`;
}
function normalized(value) {
    return value.trim().toLocaleLowerCase("en");
}
function inspectContract(value, issues) {
    const expected = new Map();
    value.forEach((entry, index) => {
        if (!isRecord(entry) || !ROLES.includes(String(entry.role)) || !nonEmpty(entry.family)
            || !STYLES.includes(String(entry.style)) || !Array.isArray(entry.weights)
            || entry.weights.length === 0 || !isRecord(entry.source) || !nonEmpty(entry.source.license)) {
            issues.push(`Render report fontAudit.contract[${index}] is incomplete.`);
            return;
        }
        const source = entry.source;
        const family = String(entry.family);
        const license = String(entry.source.license);
        const sourceKind = source.kind === "local" || source.kind === "system" ? source.kind : null;
        if (sourceKind === null) {
            issues.push(`Render report fontAudit.contract[${index}] source kind is invalid.`);
            return;
        }
        const systemFamilies = Array.isArray(source.allowedResolvedFamilies)
            ? source.allowedResolvedFamilies.filter(nonEmpty)
            : [];
        const localValid = sourceKind === "local" && nonEmpty(source.file) && nonEmpty(source.sha256)
            && SHA256_PATTERN.test(source.sha256);
        if ((sourceKind === "system" && systemFamilies.length === 0) || (sourceKind === "local" && !localValid)) {
            issues.push(`Render report fontAudit.contract[${index}] source is incomplete.`);
        }
        entry.weights.forEach((weight, weightIndex) => {
            if (!WEIGHTS.includes(Number(weight))) {
                issues.push(`Render report fontAudit.contract[${index}].weights[${weightIndex}] is invalid.`);
                return;
            }
            const faceKey = key(entry.role, entry.family, entry.style, weight);
            if (expected.has(faceKey))
                issues.push(`Render report font contract contains duplicate face: ${faceKey}.`);
            expected.set(faceKey, {
                allowed: new Set((sourceKind === "system" ? systemFamilies : [family]).map((name) => normalized(String(name)))),
                file: sourceKind === "local" && nonEmpty(source.file) ? source.file : null,
                kind: sourceKind,
                license,
                sourceSha256: sourceKind === "local" && nonEmpty(source.sha256)
                    ? source.sha256
                    : hash(canonical({ family, source })),
            });
        });
    });
    return expected;
}
export function validateRenderFonts(value, issues) {
    if (!isRecord(value) || !Array.isArray(value.contract) || value.contract.length === 0
        || !nonEmpty(value.contractSha256) || !SHA256_PATTERN.test(value.contractSha256)
        || !Array.isArray(value.faces)) {
        issues.push("Render report fontAudit is missing or invalid.");
        return;
    }
    if (hash(canonical(value.contract)) !== value.contractSha256) {
        issues.push("Render report font contract hash does not match its declaration.");
    }
    const expected = inspectContract(value.contract, issues);
    const actual = new Set();
    value.faces.forEach((entry, index) => {
        if (!isRecord(entry) || !ROLES.includes(String(entry.role)) || !nonEmpty(entry.family)
            || !STYLES.includes(String(entry.style)) || !WEIGHTS.includes(Number(entry.weight))
            || !nonEmpty(entry.license) || !nonEmpty(entry.resolvedFamily) || !nonEmpty(entry.postScriptName)
            || !nonEmpty(entry.sourceKind) || !nonEmpty(entry.sourceSha256)
            || !SHA256_PATTERN.test(entry.sourceSha256) || typeof entry.isCustomFont !== "boolean") {
            issues.push(`Render report fontAudit.faces[${index}] is incomplete.`);
            return;
        }
        const faceKey = key(entry.role, entry.family, entry.style, entry.weight);
        const contract = expected.get(faceKey);
        if (actual.has(faceKey))
            issues.push(`Render report font audit contains duplicate face: ${faceKey}.`);
        actual.add(faceKey);
        if (contract === undefined) {
            issues.push(`Render report font audit contains undeclared face: ${faceKey}.`);
            return;
        }
        if (entry.sourceKind !== contract.kind || entry.sourceFile !== contract.file
            || entry.sourceSha256 !== contract.sourceSha256 || entry.license !== contract.license
            || !contract.allowed.has(normalized(entry.resolvedFamily))) {
            issues.push(`Render report font audit does not match its contract: ${faceKey}.`);
        }
        if ((contract.kind === "local") !== entry.isCustomFont) {
            issues.push(`Render report font audit has an invalid custom-font state: ${faceKey}.`);
        }
    });
    [...expected.keys()].filter((faceKey) => !actual.has(faceKey))
        .forEach((faceKey) => issues.push(`Render report font audit is missing face: ${faceKey}.`));
}
//# sourceMappingURL=render-report-font-validation.js.map