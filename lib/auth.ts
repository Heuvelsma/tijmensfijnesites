export const AUTH_COOKIE = "tfs_key";

export function authEnabled(): boolean {
  return Boolean(process.env.SITE_PASSWORD);
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The cookie value is an HMAC of the password, so the password itself never travels in a cookie. */
export async function expectedToken(): Promise<string> {
  const password = process.env.SITE_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET || `tfs-${password}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`tfs:${password}`));
  return hex(sig);
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!authEnabled() || !token) return false;
  return safeEqual(token, await expectedToken());
}
