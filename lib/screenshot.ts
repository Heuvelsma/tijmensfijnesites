import "server-only";
import sharp from "sharp";
import type { Browser, Page } from "playwright-core";

export type Capture = { image: Buffer; contentType: "image/webp"; title: string };

export const VIEWPORT = { width: 1440, height: 900 };
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Cookie banners we hide before the snapshot is taken. Conservative list, easy to extend. */
const HIDE_CSS = `#onetrust-consent-sdk,#CybotCookiebotDialog,#CybotCookiebotDialogBodyUnderlay,.cc-window,#cookie-banner,[id^="cookiescript"],.cookie-notice,#usercentrics-root,.osano-cm-window,#hs-eu-cookie-confirmation,.qc-cmp2-container,#didomi-host,.cky-consent-container,#cmpbox,#cookiebanner,.cookie-banner,#cookie-consent,.cookieconsent,#cookiefirst-root,#axeptio_overlay,.iubenda-cs-container,#pum-overlay,#cookie-law-info-bar,#ccc,#truste-consent-track,.termly-styles-root,#cookie-notice,#gdpr-cookie-message,.cmp-container,[id^="sp_message_container_"],.sp_veil,#CookieConsent,#cookieConsent,.cookie-consent,.cookie-popup,.cookie-modal,#cookie-modal,.cookiebar,#cookiebar,.cookie-bar,#cookie-bar,#cookies-banner,.cookies-banner,.cookies-popup,#cookieNotice,.cookie-message,#cookie-message{display:none!important;visibility:hidden!important}html,body{overflow:auto!important}`;

const DROP_RES = new Set([
  "content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive", "set-cookie",
  "content-security-policy", "content-security-policy-report-only", "strict-transport-security", "x-frame-options",
  "cross-origin-opener-policy", "cross-origin-embedder-policy", "cross-origin-resource-policy",
]);

/**
 * Takes a viewport snapshot of a site. Tries a real Chromium first (installed Chrome locally,
 * @sparticuz/chromium on Vercel) and falls back to the Microlink API if that fails.
 */
export async function captureSite(url: string): Promise<Capture> {
  let png: Buffer | null = null;
  let title = "";
  try {
    const r = await captureWithChromium(url);
    png = r.png;
    title = r.title;
  } catch (err) {
    console.warn("[screenshot] chromium mislukt, val terug op Microlink:", (err as Error).message);
  }
  if (!png) {
    png = await captureWithMicrolink(url);
  }
  if (!title) title = await fetchTitle(url).catch(() => "");

  const image = await sharp(png)
    .resize(VIEWPORT.width, VIEWPORT.height, { fit: "cover", position: "top" })
    .webp({ quality: 82 })
    .toBuffer();

  return { image, contentType: "image/webp", title };
}

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright-core");
  const onServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (onServerless) {
    const sparticuz = (await import("@sparticuz/chromium")).default;
    sparticuz.setGraphicsMode = true;
    const executablePath = await sparticuz.executablePath();
    return chromium.launch({ args: sparticuz.args, executablePath, headless: true });
  }

  const args = ["--disable-background-networking", "--disable-sync", "--no-first-run", "--hide-scrollbars"];
  if (process.env.CHROME_PATH) {
    return chromium.launch({ executablePath: process.env.CHROME_PATH, args: [...args, "--no-sandbox"], headless: true });
  }
  // Locally: use the Chrome that is already installed on the machine.
  return chromium.launch({ channel: "chrome", args, headless: true });
}

async function captureWithChromium(url: string): Promise<{ png: Buffer; title: string }> {
  const browser = await launchBrowser();
  try {
    const first = await captureInContext(browser, url, false);
    if (!(await looksBlank(first.png))) return first;
    // Some preloaders never finish in a headless browser. Asking for reduced motion often skips them.
    const second = await captureInContext(browser, url, true);
    return (await looksBlank(second.png)) ? first : second;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

async function captureInContext(browser: Browser, url: string, reducedMotion: boolean): Promise<{ png: Buffer; title: string }> {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    userAgent: UA,
    locale: "nl-NL",
    colorScheme: "light",
    ignoreHTTPSErrors: true,
    serviceWorkers: "block",
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);

    if (process.env.TFS_ROUTE_VIA_FETCH === "1") await routeViaFetch(page);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(() => undefined);
    await page.waitForTimeout(2_500);
    await page.addStyleTag({ content: HIDE_CSS }).catch(() => undefined);
    await hideCookieBanners(page);
    await page.waitForTimeout(300);

    let png = Buffer.from(await page.screenshot({ type: "png" }));
    // Sites with a preloader sometimes render blank at first. Nudge the page and try again.
    for (const wait of [3_500]) {
      if (!(await looksBlank(png))) break;
      await page.mouse.wheel(0, 320).catch(() => undefined);
      await page.waitForTimeout(600);
      await page.mouse.wheel(0, -320).catch(() => undefined);
      await page.waitForTimeout(wait);
      png = Buffer.from(await page.screenshot({ type: "png" }));
    }
    const title = await page.title().catch(() => "");
    return { png, title };
  } finally {
    await context.close().catch(() => undefined);
  }
}

/** Generic sweep: fixed or sticky elements that talk about cookies are almost always consent banners. */
async function hideCookieBanners(page: Page) {
  await page
    .evaluate(() => {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "sticky") continue;
        const text = (el.textContent || "") + (el.shadowRoot ? el.shadowRoot.textContent || "" : "");
        const label = `${el.tagName} ${el.id} ${typeof el.className === "string" ? el.className : ""}`;
        const byName = /consent|cookie|gdpr|cmp-|-cmp|privacy-banner/i.test(label);
        if (byName || (text.length < 1500 && /cookie/i.test(text))) el.style.setProperty("display", "none", "important");
      }
    })
    .catch(() => undefined);
}

async function looksBlank(png: Buffer): Promise<boolean> {
  const stats = await sharp(png).stats();
  return Math.max(...stats.channels.map((c) => c.stdev)) < 4;
}

/** Fallback without a browser: Microlink renders the page and returns the image. */
async function captureWithMicrolink(url: string): Promise<Buffer> {
  const api = new URL("https://api.microlink.io/");
  api.searchParams.set("url", url);
  api.searchParams.set("screenshot", "true");
  api.searchParams.set("meta", "false");
  api.searchParams.set("embed", "screenshot.url");
  api.searchParams.set("viewport.width", String(VIEWPORT.width));
  api.searchParams.set("viewport.height", String(VIEWPORT.height));
  api.searchParams.set("waitForTimeout", "2500");
  api.searchParams.set("colorScheme", "light");
  const res = await fetch(api, { signal: AbortSignal.timeout(50_000) });
  if (!res.ok) throw new Error(`Microlink antwoordde met ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error("Microlink gaf geen afbeelding terug");
  return Buffer.from(await res.arrayBuffer());
}

export async function fetchTitle(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,*/*" },
    signal: AbortSignal.timeout(10_000),
    redirect: "follow",
  });
  const html = (await res.text()).slice(0, 200_000);
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return "";
  return decodeEntities(m[1]);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .trim();
}

/**
 * Only used in sandboxed environments where Chromium cannot reach the network directly
 * but Node fetch can (through an HTTPS proxy). Every request is fulfilled via fetch.
 */
async function routeViaFetch(page: Page) {
  await page.route("**/*", async (route) => {
    const req = route.request();
    const target = req.url();
    if (!/^https?:/.test(target)) return route.continue();
    if (req.resourceType() === "websocket") return route.abort("blockedbyclient");
    try {
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(await req.allHeaders())) {
        const lk = k.toLowerCase();
        if (lk.startsWith(":") || ["host", "connection", "content-length", "accept-encoding"].includes(lk)) continue;
        headers[lk] = v;
      }
      headers["accept-encoding"] = "gzip, deflate, br";
      const res = await fetch(target, {
        method: req.method(),
        headers,
        body: req.postDataBuffer() ? new Uint8Array(req.postDataBuffer()!) : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
      });
      const len = Number(res.headers.get("content-length") || 0);
      if (len > 30_000_000) {
        await res.body?.cancel().catch(() => undefined);
        return route.abort("failed");
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 30_000_000) return route.abort("failed");
      const out: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        if (!DROP_RES.has(k.toLowerCase())) out[k] = v;
      });
      await route.fulfill({ status: res.status, headers: out, body: buf });
    } catch {
      await route.abort("failed").catch(() => undefined);
    }
  });
}
