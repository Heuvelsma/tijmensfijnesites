import "server-only";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "tfs_admin";

/** Comes from ADMIN_PASSWORD. Without it nobody can log in and the archive is read only. */
export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export function adminConfigured(): boolean {
  return adminPassword().length > 0;
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The cookie holds an HMAC of the password, never the password itself. Changing the password logs everyone out. */
export async function adminToken(): Promise<string> {
  const password = adminPassword();
  const secret = process.env.AUTH_SECRET || `tfs-admin-${password}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`admin:${password}`));
  return hex(sig);
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAdminRequest(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, await adminToken());
}

export async function assertAdmin(): Promise<void> {
  if (!(await isAdminRequest())) throw new Error("Log eerst in als beheerder");
}

export async function setAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
