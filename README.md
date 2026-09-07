# Tijmens Fijne Sites

Persoonlijk webinspiratie archief. Snapshots van homepages in een strak raster, elke snapshot is een link naar de site. Toevoegen, verwijderen, zoeken, dark en light, en een intro die de titel op z'n plek zet.

Gebouwd met Next.js 16, GSAP, Lenis en Vercel Blob. Lettertype DM Sans.

## Lokaal draaien

```bash
npm install
npm run dev
```

Open http://localhost:3000. Zonder Blob token slaat de app alles op in `.data/` (staat in `.gitignore`). Snapshots worden lokaal gemaakt met de Chrome die op je Mac staat. Geen Chrome? Zet `CHROME_PATH` naar een Chromium binary.

Op een lege site zie je de knop **Startlijst importeren**. Die zet de 53 sites uit `seed/` in één keer neer, inclusief snapshots.

## Live zetten op Vercel

1. Importeer deze repo in Vercel (New Project, framework wordt automatisch herkend).
2. Ga in het project naar **Storage**, kies **Create Database → Blob** en koppel de store aan het project. Vercel zet zelf `BLOB_READ_WRITE_TOKEN` in de environment variables.
3. Zet bij **Settings → Environment Variables** het wachtwoord: `SITE_PASSWORD=jouwwachtwoord`. Zonder wachtwoord staat de site open voor iedereen met de URL.
4. Deploy (of redeploy na het koppelen van de store).
5. Open de site, vul het wachtwoord in en klik **Startlijst importeren**.

Snapshots op Vercel worden gemaakt met `@sparticuz/chromium` (een headless Chromium voor serverless). De eerste snapshot na een tijdje stilte duurt iets langer door de koude start. Lukt een snapshot niet, dan probeert de app de Microlink API. Blokkeert een site robots helemaal, dan wordt de site opgeslagen met een placeholder en upload je zelf een afbeelding via het pijltje op de kaart.

## Environment variables

| Naam                    | Wat                                                                   |
| ----------------------- | --------------------------------------------------------------------- |
| `SITE_PASSWORD`         | Wachtwoord voor de poort. Eén keer invullen per apparaat (cookie, 1 jaar). |
| `AUTH_SECRET`           | Optioneel. Eigen geheim voor de cookie handtekening.                    |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob. Automatisch gezet als je de store koppelt.                |
| `CHROME_PATH`           | Optioneel, alleen lokaal. Pad naar een Chromium of Chrome binary.      |

Zie `.env.example`.

## Hoe het in elkaar zit

```
app/
  page.tsx            laadt de sites (server) en rendert SiteApp
  actions.ts          server actions: toevoegen, verwijderen, snapshot vernieuwen, afbeelding vervangen, import
  unlock/             wachtwoordpagina
  api/shots/[file]    serveert lokale snapshots (alleen zonder Blob)
  globals.css         alle styling: tokens, dark en light, componenten
components/
  SiteApp.tsx         client root: state, zoeken, intro en scroll choreografie (GSAP)
  Intro.tsx, Nav.tsx, Hero.tsx, Ticker.tsx, Grid.tsx, SiteCard.tsx, AddSheet.tsx, Button.tsx, ThemeToggle.tsx
lib/
  screenshot.ts       snapshot maken (Chromium, Microlink als vangnet)
  store.ts            opslag: Vercel Blob (index.json + afbeeldingen) of lokaal in .data/
  auth.ts             cookie handtekening
  seed.ts             import van de startlijst
proxy.ts              wachtwoordpoort (Next 16 proxy, voorheen middleware)
seed/                 startlijst: sites.json en shots/*.webp
```

## Dingen die je snel wilt aanpassen

- **Kleuren en lijnen**: de tokens bovenin `app/globals.css` (`:root` en `:root[data-theme="dark"]`). De accentkleur is `--accent`.
- **Titel**: `.hero__title` in `globals.css`. De horizontale versmalling zit in `--title-squeeze` (nu 0.82). Wil je een echt condensed font, wissel dan `DM_Sans` in `app/layout.tsx` voor bijvoorbeeld `Instrument_Sans` met `axes: ["wdth"]` en zet `--title-squeeze: 1`.
- **Intro timing**: de timeline in `components/SiteApp.tsx` onder "intro choreography".
- **Raster**: kolommen per breakpoint in `.grid` in `globals.css`.
- **Snapshotformaat**: `VIEWPORT` in `lib/screenshot.ts` (nu 1440 × 900).
- **Cookiebanners**: worden verborgen via een lijst en een heuristiek in `lib/screenshot.ts`. Sluipt er eentje door, voeg de selector toe aan `HIDE_CSS`.

## Bekende beperkingen

- Sites met zware WebGL of video hero's geven soms een lege of donkere snapshot. Vernieuw de snapshot (rondje op de kaart) of upload een eigen afbeelding.
- Sites achter een botcheck (Cloudflare, Vercel Security Checkpoint) laten geen headless browser binnen. Die staan met een placeholder in de lijst tot je een afbeelding uploadt.
- Microlink als vangnet heeft een gratis daglimiet per IP. Zie het als bonus, niet als garantie.
