export function normalizeUrl(input: string): string {
  let raw = input.trim();
  if (!raw) throw new Error("Geen URL opgegeven");
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  const u = new URL(raw);
  if (!/^https?:$/.test(u.protocol)) throw new Error("Alleen http(s) links");
  u.hash = "";
  return u.toString();
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Turns a page title like "Home - Vektor | Mobility" into something short. */
export function cleanTitle(title: string | undefined, url: string): string {
  const domain = domainOf(url);
  const fallback = domain.split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (!title) return fallback;
  let t = title.replace(/\s+/g, " ").trim();
  if (!t || /^www\./i.test(t) || t.toLowerCase() === domain) return fallback;
  const parts = t.split(/\s+[|•·–—-]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const generic = /^(home|homepage|welcome|welkom|start|index|official site|official website)$/i;
    const meaningful = parts.filter((p) => !generic.test(p));
    const base = domain.split(".")[0].toLowerCase();
    const brand = meaningful.find((p) => p.toLowerCase().replace(/[^a-z0-9]/g, "").includes(base.replace(/[^a-z0-9]/g, "")));
    t = brand ?? meaningful[0] ?? parts[0];
  }
  if (t.length > 42) t = `${t.slice(0, 40).trim()}…`;
  return t || fallback;
}

export function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
