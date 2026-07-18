export function isAllowedRenderRequest(requestUrl: string, localOrigin: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(requestUrl);
  } catch {
    return false;
  }
  if (parsed.protocol === "data:" || parsed.protocol === "blob:") return true;
  return (parsed.protocol === "http:" || parsed.protocol === "https:")
    && parsed.origin === localOrigin;
}

export function isAllowedRenderSocket(socketUrl: string, localOrigin: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(socketUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return false;
  const comparable = new URL(parsed.href);
  comparable.protocol = parsed.protocol === "ws:" ? "http:" : "https:";
  return comparable.origin === localOrigin;
}
