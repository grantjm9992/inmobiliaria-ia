/**
 * Idealista scraper — MVP validation only
 *
 * IMPORTANT: Scraping may violate Idealista's Terms of Service.
 * This is intended for early-stage validation only.
 * Long-term plan: transition to Idealista's official API or agency feeds.
 *
 * Usage:
 *   npx tsx scripts/scraper/idealista.ts --city=barcelona --operation=sale --pages=5
 *
 * Requires:
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   npx playwright install chromium
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require("playwright-extra");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
import type { Page, BrowserContext } from "playwright";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

chromium.use(StealthPlugin());

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace("--", "").split("=") as [string, string])
);

const CITY: string = args.city ?? "barcelona";
const OPERATION: "sale" | "rent" = (args.operation as "sale" | "rent") ?? "sale";
const MAX_PAGES: number = parseInt(args.pages ?? "3");

const CITY_SLUGS: Record<string, string> = {
  barcelona: "barcelona-barcelona",
  madrid: "madrid-madrid",
  valencia: "valencia-valencia",
  sevilla: "sevilla-sevilla",
  marbella: "marbella",
  malaga: "malaga-malaga",
  ibiza: "eivissa",
};

const OPERATION_PATH: Record<string, string> = {
  sale: "venta",
  rent: "alquiler",
};

// ─── Supabase client ──────────────────────────────────────────────────────────

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ─── Human-like helpers ───────────────────────────────────────────────────────

function randomDelay(min: number, max: number): Promise<void> {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

async function humanScroll(page: Page) {
  // Use mouse.wheel to avoid esbuild-transpiled async code in page.evaluate
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 100 + Math.random() * 150);
    await randomDelay(80, 180);
  }
}

async function randomMouseMove(page: Page) {
  const x = 200 + Math.random() * 900;
  const y = 200 + Math.random() * 500;
  await page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 10) });
}

// ─── DataDome challenge handler ───────────────────────────────────────────────

async function waitForDataDome(page: Page, timeoutMs = 15000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const isChallenge = await page.evaluate(() =>
      document.body.innerHTML.includes("captcha-delivery.com") ||
      document.title === "idealista.com" && document.querySelectorAll("article").length === 0
    );
    if (!isChallenge) return true;
    console.log("  [wait] DataDome challenge active, waiting...");
    await randomDelay(2000, 3000);
    await randomMouseMove(page);
  }
  return false;
}

// ─── Context factory ──────────────────────────────────────────────────────────

async function createContext(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const context: BrowserContext = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
  });

  // Patch navigator.webdriver and other automation tells at the JS level
  await context.addInitScript(() => {
    // Remove webdriver property
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // Fake plugins list
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" },
        { name: "Native Client", filename: "internal-nacl-plugin" },
      ],
    });
    // Fake languages
    Object.defineProperty(navigator, "languages", { get: () => ["es-ES", "es", "en"] });
    // Remove automation-related chrome properties
    // @ts-ignore
    if (window.chrome) {
      // @ts-ignore
      window.chrome.runtime = {};
    } else {
      // @ts-ignore
      window.chrome = { runtime: {} };
    }
  });

  return context;
}

// ─── Type mapping ─────────────────────────────────────────────────────────────

function guessType(title: string, typozText: string): string {
  const t = (title + " " + typozText).toLowerCase();
  if (t.includes("ático") || t.includes("atico") || t.includes("penthouse")) return "penthouse";
  if (t.includes("estudio") || t.includes("studio")) return "studio";
  if (t.includes("chalet") || t.includes("villa") || t.includes("casa independiente")) return "villa";
  if (t.includes("adosado") || t.includes("townhouse")) return "townhouse";
  if (t.includes("finca") || t.includes("cortijo") || t.includes("masía")) return "finca";
  return "apartment";
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

async function scrapePage(page: Page, url: string) {
  console.log(`  → ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

  // Let JS execute + DataDome challenge potentially auto-resolve
  await randomDelay(3000, 5000);
  await randomMouseMove(page);
  await humanScroll(page);
  await randomDelay(1500, 2500);

  const resolved = await waitForDataDome(page, 20000);
  if (!resolved) {
    console.warn("  [warn] DataDome challenge not resolved after waiting");
  }

  // Debug info
  const debug = await page.evaluate(() => ({
    title: document.title,
    articleTags: document.querySelectorAll("article").length,
    sampleClasses: Array.from(document.querySelectorAll("article")).slice(0, 3).map((a) => a.className),
    bodySnippet: document.body.innerHTML.slice(0, 500),
  }));
  console.log("  [debug] title:", debug.title);
  console.log("  [debug] <article> count:", debug.articleTags);
  if (debug.articleTags === 0) {
    console.log("  [debug] body snippet:", debug.bodySnippet);
  }

  const listings = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("article.item"));
    return cards.map((card) => {
      const title = card.querySelector(".item-title a")?.textContent?.trim() ?? "";
      const href = card.querySelector(".item-title a")?.getAttribute("href") ?? "";
      const priceText =
        card.querySelector(".item-price")?.textContent?.trim().replace(/[^\d]/g, "") ?? "0";
      const sizeText =
        card.querySelector(".item-detail-char .item-detail")?.textContent?.trim() ?? "0";
      const rooms = card.querySelectorAll(".item-detail-char .item-detail");
      const imgSrc = card.querySelector("img")?.getAttribute("src") ?? "";
      const location = card.querySelector(".item-detail-location")?.textContent?.trim() ?? "";
      const typeText = card.querySelector(".item-type")?.textContent?.trim() ?? "";
      return { title, href, priceText, sizeText, rooms: rooms.length, imgSrc, location, typeText };
    });
  });

  return listings;
}

async function scrapeDetail(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await randomDelay(1500, 2500);
  await randomMouseMove(page);

  return page.evaluate(() => {
    const description =
      document.querySelector("#details .adCommentsLanguage")?.textContent?.trim() ?? "";
    const images = Array.from(document.querySelectorAll(".detail-image img"))
      .map((img) => img.getAttribute("src") ?? "")
      .filter(Boolean)
      .slice(0, 8);
    const features: string[] = Array.from(
      document.querySelectorAll(".details-property_features li")
    )
      .map((li) => li.textContent?.trim() ?? "")
      .filter(Boolean);
    const energyRating =
      document.querySelector(".energy-rating .letter")?.textContent?.trim() ?? null;
    const floor = document.querySelector(".floor")?.textContent?.match(/\d+/)?.[0] ?? null;
    const yearBuilt =
      document.querySelector(".antiquity")?.textContent?.match(/\d{4}/)?.[0] ?? null;
    const community =
      document.querySelector(".community-cost")?.textContent?.match(/[\d.]+/)?.[0] ?? null;
    const lat = (window as unknown as Record<string, string>)["latitude"] ?? null;
    const lng = (window as unknown as Record<string, string>)["longitude"] ?? null;
    return { description, images, features, energyRating, floor, yearBuilt, community, lat, lng };
  });
}

async function run() {
  const citySlug = CITY_SLUGS[CITY] ?? CITY;
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-site-isolation-trials",
      "--flag-switches-begin",
      "--flag-switches-end",
    ],
  });

  const context = await createContext(browser);
  const page = await context.newPage();

  // Warm up: visit Google Spain first, behave like a real user
  console.log("  [warmup] Visiting google.es...");
  await page.goto("https://www.google.es", { waitUntil: "domcontentloaded", timeout: 20000 });
  await randomDelay(2000, 4000);
  await humanScroll(page);
  await randomDelay(1000, 2000);

  let saved = 0;
  let skipped = 0;

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const listUrl =
      pageNum === 1
        ? `https://www.idealista.com/${OPERATION_PATH[OPERATION]}-viviendas/${citySlug}/`
        : `https://www.idealista.com/${OPERATION_PATH[OPERATION]}-viviendas/${citySlug}/pagina-${pageNum}.htm`;

    let listings: Awaited<ReturnType<typeof scrapePage>>;
    try {
      listings = await scrapePage(page, listUrl);
    } catch (e) {
      console.warn(`  ✗ Failed to load listing page ${pageNum}:`, (e as Error).message);
      break;
    }

    if (listings.length === 0) {
      console.log(`  ℹ No listings found on page ${pageNum}, stopping.`);
      break;
    }

    console.log(`  Page ${pageNum}: ${listings.length} listings`);

    for (const listing of listings) {
      const sourceId = listing.href.match(/\/inmueble\/(\d+)\//)?.[1] ?? null;
      if (!sourceId) continue;

      // Check if already in DB
      const { data: existing } = await db
        .from("properties")
        .select("id")
        .eq("source", "idealista")
        .eq("source_id", sourceId)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Optionally fetch detail page
      let detail: Awaited<ReturnType<typeof scrapeDetail>> | null = null;
      try {
        const detailUrl = `https://www.idealista.com${listing.href}`;
        detail = await scrapeDetail(page, detailUrl);
      } catch (e) {
        console.warn(`    ✗ Detail failed for ${sourceId}:`, (e as Error).message);
      }

      const price = parseInt(listing.priceText) || 0;
      const size = parseFloat(listing.sizeText) || 0;
      const locationParts = listing.location.split(",").map((s: string) => s.trim());

      const property = {
        source: "idealista" as const,
        source_id: sourceId,
        source_url: `https://www.idealista.com${listing.href}`,
        title: listing.title,
        description: detail?.description ?? null,
        type: guessType(listing.title, listing.typeText) as "apartment",
        operation: OPERATION,
        price,
        price_per_sqm: size > 0 ? Math.round(price / size) : null,
        size,
        bedrooms: 0,
        bathrooms: 1,
        floor: detail?.floor ? parseInt(detail.floor) : null,
        year_built: detail?.yearBuilt ? parseInt(detail.yearBuilt) : null,
        energy_rating: detail?.energyRating ?? null,
        city: CITY.charAt(0).toUpperCase() + CITY.slice(1),
        neighbourhood: locationParts[0] ?? null,
        region: locationParts[locationParts.length - 1] ?? "",
        lat: detail?.lat ? parseFloat(detail.lat) : null,
        lng: detail?.lng ? parseFloat(detail.lng) : null,
        images: detail?.images ?? (listing.imgSrc ? [listing.imgSrc] : []),
        features: detail?.features ?? [],
        tags: [],
        community_fees: detail?.community ? parseFloat(detail.community) : null,
        is_featured: false,
        is_active: true,
        scraped_at: new Date().toISOString(),
      };

      const { error } = await db.from("properties").insert(property);
      if (error) {
        console.warn(`    ✗ DB insert failed for ${sourceId}:`, error.message);
      } else {
        saved++;
        console.log(`    ✓ Saved: ${listing.title.slice(0, 60)}`);
      }

      await randomDelay(1200, 2200); // polite delay between requests
    }

    // Longer pause between pages
    if (pageNum < MAX_PAGES) {
      await randomDelay(3000, 6000);
    }
  }

  await browser.close();
  console.log(`\nDone. Saved: ${saved}, Skipped (already in DB): ${skipped}`);
}

run().catch(console.error);
