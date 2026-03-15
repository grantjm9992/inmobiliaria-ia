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

import { chromium, type Page } from "playwright";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

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
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500 + Math.random() * 1000); // polite delay

  // Debug: show page title and first article-like elements found
  const debug = await page.evaluate(() => ({
    title: document.title,
    articleTags: document.querySelectorAll("article").length,
    sampleClasses: Array.from(document.querySelectorAll("article")).slice(0, 3).map(a => a.className),
    bodySnippet: document.body.innerHTML.slice(0, 500),
  }));
  console.log("  [debug] title:", debug.title);
  console.log("  [debug] <article> count:", debug.articleTags);
  console.log("  [debug] sample classes:", debug.sampleClasses);
  if (debug.articleTags === 0) {
    console.log("  [debug] body snippet:", debug.bodySnippet);
  }

  const listings = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("article.item"));
    return cards.map((card) => {
      const title = card.querySelector(".item-title a")?.textContent?.trim() ?? "";
      const href = card.querySelector(".item-title a")?.getAttribute("href") ?? "";
      const priceText = card.querySelector(".item-price")?.textContent?.trim().replace(/[^\d]/g, "") ?? "0";
      const sizeText = card.querySelector(".item-detail-char .item-detail")?.textContent?.trim() ?? "0";
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
  await page.waitForTimeout(1000 + Math.random() * 800);

  return page.evaluate(() => {
    const description = document.querySelector("#details .adCommentsLanguage")?.textContent?.trim() ?? "";
    const images = Array.from(document.querySelectorAll(".detail-image img"))
      .map((img) => img.getAttribute("src") ?? "")
      .filter(Boolean)
      .slice(0, 8);
    const features: string[] = Array.from(document.querySelectorAll(".details-property_features li"))
      .map((li) => li.textContent?.trim() ?? "")
      .filter(Boolean);
    const energyRating = document.querySelector(".energy-rating .letter")?.textContent?.trim() ?? null;
    const floor = document.querySelector(".floor")?.textContent?.match(/\d+/)?.[0] ?? null;
    const yearBuilt = document.querySelector(".antiquity")?.textContent?.match(/\d{4}/)?.[0] ?? null;
    const community = document.querySelector(".community-cost")?.textContent?.match(/[\d.]+/)?.[0] ?? null;
    const lat = (window as unknown as Record<string, string>)["latitude"] ?? null;
    const lng = (window as unknown as Record<string, string>)["longitude"] ?? null;
    return { description, images, features, energyRating, floor, yearBuilt, community, lat, lng };
  });
}

async function run() {
  const citySlug = CITY_SLUGS[CITY] ?? CITY;
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "es-ES",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

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

      await page.waitForTimeout(800 + Math.random() * 700); // polite between requests
    }
  }

  await browser.close();
  console.log(`\nDone. Saved: ${saved}, Skipped (already in DB): ${skipped}`);
}

run().catch(console.error);
