const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

export function isValidContactEmail(value: string): boolean {
  if (value !== value.trim() || value.length > 254 || !emailPattern.test(value)) return false;
  const local = value.slice(0, value.lastIndexOf("@"));
  return local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..");
}

export function toSafeMailtoHref(value: string): string | undefined {
  if (!isValidContactEmail(value)) return undefined;
  const at = value.lastIndexOf("@");
  return `mailto:${encodeURIComponent(value.slice(0, at))}@${value.slice(at + 1)}`;
}

export function isValidHttpWebsite(value: string): boolean {
  if (value !== value.trim() || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function toSafeWebsiteHref(value: string): string | undefined {
  return isValidHttpWebsite(value) ? value : undefined;
}

export function toSafeTelHref(value: string): string | undefined {
  if (value !== value.trim() || !/^\+?[0-9][0-9 ().-]*$/.test(value)) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return undefined;
  return `tel:${value.startsWith("+") ? "+" : ""}${digits}`;
}
