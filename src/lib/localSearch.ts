import { MOCK_PROPERTIES, Property } from "./properties";

// ─── Vocabulary maps ──────────────────────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  // Spanish → English type key
  piso: "apartment",
  pisos: "apartment",
  apartamento: "apartment",
  apartamentos: "apartment",
  "piso moderno": "apartment",
  estudio: "studio",
  estudios: "studio",
  ático: "penthouse",
  atico: "penthouse",
  áticos: "penthouse",
  aticos: "penthouse",
  penthouse: "penthouse",
  villa: "villa",
  villas: "villa",
  chalet: "villa",
  chalets: "villa",
  "chalet independiente": "villa",
  adosado: "townhouse",
  adosados: "townhouse",
  "chalet adosado": "townhouse",
  townhouse: "townhouse",
  finca: "finca",
  fincas: "finca",
  cortijo: "finca",
  cortijos: "finca",
  masía: "finca",
  masia: "finca",
  // English
  apartment: "apartment",
  apartments: "apartment",
  flat: "apartment",
  flats: "apartment",
  studio: "studio",
  studios: "studio",
  duplex: "apartment",
};

const CITY_MAP: Record<string, string> = {
  barcelona: "Barcelona",
  madrid: "Madrid",
  marbella: "Marbella",
  valencia: "Valencia",
  sevilla: "Sevilla",
  seville: "Sevilla",
  málaga: "Málaga",
  malaga: "Málaga",
  ibiza: "Ibiza",
  eivissa: "Ibiza",
  ronda: "Ronda",
  pozuelo: "Madrid",
};

const RENT_WORDS = new Set([
  "alquiler", "alquilar", "alquilo", "arrendar", "arriendo",
  "rent", "rental", "renting", "let", "letting",
]);

const BUY_WORDS = new Set([
  "compra", "comprar", "venta", "en venta", "sale", "buy", "purchase", "buying",
]);

const PRICE_REGEX = [
  // "menos de 500k", "bajo 1 millón", "máximo 300.000", "max 500k"
  /(?:menos de|bajo|máximo|max(?:imo)?|por menos de|under|below|up to)\s*(\d[\d.,]*)\s*(k|mil|mill[oó]n(?:es)?|m(?:illones)?)?/i,
  // "hasta 800.000", "hasta 1M"
  /hasta\s+(\d[\d.,]*)\s*(k|mil|mill[oó]n(?:es)?|m(?:illones)?)?/i,
  // "500k", "1.2M" standalone
  /\b(\d[\d.,]*)\s*(k|mil|mill[oó]n(?:es)?|m(?:illones)?)\b/i,
  // bare number like "500000"
  /\b(\d{5,})\b/,
];

const BEDS_REGEX = [
  /(\d+)\s*(?:habitacion(?:es)?|dormitorio(?:s)?|cuarto(?:s)?|bed(?:room)?s?|hab\.?)/i,
  /(\d+)\s*(?:dorm|habs?)\b/i,
];

// ─── Parser ───────────────────────────────────────────────────────────────────

export interface ParsedQuery {
  operation: "sale" | "rent" | null;
  city: string | null;
  type: string | null;
  maxPrice: number | null;
  minBedrooms: number | null;
  keywords: string[];
  interpretation: string;
}

function parsePrice(raw: string, unit: string | undefined): number {
  const n = parseFloat(raw.replace(/[.,]/g, (m, i, s) => {
    // European decimal: "1.200.000" → strip dots; "1,5" → replace comma with dot
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (m === "," && lastComma > lastDot) return ".";
    return "";
  }));
  const u = (unit ?? "").toLowerCase();
  if (u.startsWith("k") || u === "mil") return n * 1000;
  if (u.startsWith("m")) return n * 1_000_000;
  return n;
}

export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents for matching

  let operation: "sale" | "rent" | null = null;
  let city: string | null = null;
  let type: string | null = null;
  let maxPrice: number | null = null;
  let minBedrooms: number | null = null;

  // Operation
  for (const w of RENT_WORDS) if (q.includes(w)) { operation = "rent"; break; }
  if (!operation) for (const w of BUY_WORDS) if (q.includes(w)) { operation = "sale"; break; }

  // City
  for (const [key, val] of Object.entries(CITY_MAP)) {
    if (q.includes(key)) { city = val; break; }
  }

  // Type (longest match first to avoid partial matches)
  const typeEntries = Object.entries(TYPE_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, val] of typeEntries) {
    if (q.includes(key)) { type = val; break; }
  }

  // Max price
  for (const rx of PRICE_REGEX) {
    const m = q.match(rx);
    if (m) {
      const candidate = parsePrice(m[1], m[2]);
      if (candidate > 0) { maxPrice = candidate; break; }
    }
  }

  // Bedrooms
  for (const rx of BEDS_REGEX) {
    const m = q.match(rx);
    if (m) { minBedrooms = parseInt(m[1]); break; }
  }

  // Remaining keywords (words not already captured by structured filters)
  const stopWords = new Set([
    "en", "de", "con", "por", "una", "un", "que", "para", "los", "las",
    "el", "la", "del", "al", "sus", "con", "sin", "the", "and", "with",
    "for", "in", "a", "an", "of", "to", "at", "or", "is", "are",
  ]);
  const keywords = q
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .filter((w) => !Object.keys(TYPE_MAP).some((k) => k.includes(w) || w.includes(k)))
    .filter((w) => !Object.keys(CITY_MAP).includes(w));

  // Build human-readable interpretation in Spanish
  const parts: string[] = [];
  if (type) {
    const typeLabel: Record<string, string> = {
      apartment: "un piso", villa: "una villa", penthouse: "un ático",
      studio: "un estudio", townhouse: "un adosado", finca: "una finca",
    };
    parts.push(`Buscando ${typeLabel[type] ?? type}`);
  } else {
    parts.push("Buscando propiedades");
  }
  if (city) parts.push(`en ${city}`);
  if (minBedrooms) parts.push(`con ${minBedrooms}+ habitaciones`);
  if (maxPrice) parts.push(`hasta ${maxPrice.toLocaleString("es-ES")} €`);
  if (operation === "rent") parts.push("(alquiler)");
  else if (operation === "sale") parts.push("(venta)");

  const interpretation = parts.join(" ") + ".";

  return { operation, city, type, maxPrice, minBedrooms, keywords, interpretation };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface LocalSearchResult {
  properties: Property[];
  interpretation: string;
  fallback: false | { reason: string };
}

export function localSearch(query: string): LocalSearchResult {
  if (!query.trim()) return { properties: MOCK_PROPERTIES, interpretation: "", fallback: false };

  const parsed = parseQuery(query);
  let results = MOCK_PROPERTIES;

  if (parsed.operation) results = results.filter((p) => p.operation === parsed.operation);
  if (parsed.city) results = results.filter((p) => p.city.toLowerCase() === parsed.city!.toLowerCase());
  if (parsed.type) results = results.filter((p) => p.type === parsed.type);
  if (parsed.maxPrice) results = results.filter((p) => p.price <= parsed.maxPrice!);
  if (parsed.minBedrooms) results = results.filter((p) => p.bedrooms >= parsed.minBedrooms!);

  const exactResults = results;

  // Keyword fuzzy pass when no results or no structure was parsed
  if (results.length === 0 || (!parsed.city && !parsed.type && !parsed.operation && !parsed.maxPrice)) {
    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    if (words.length > 0) {
      // Base for fuzzy: honour hard filters (operation, city) but relax type/price
      let fuzzyBase = MOCK_PROPERTIES;
      if (parsed.operation) fuzzyBase = fuzzyBase.filter((p) => p.operation === parsed.operation);
      if (parsed.city) fuzzyBase = fuzzyBase.filter((p) => p.city.toLowerCase() === parsed.city!.toLowerCase());

      const fuzzy = fuzzyBase.filter((p) =>
        words.some(
          (w) =>
            p.title.toLowerCase().includes(w) ||
            p.city.toLowerCase().includes(w) ||
            p.neighbourhood.toLowerCase().includes(w) ||
            p.type.toLowerCase().includes(w) ||
            p.tags.some((t) => t.toLowerCase().includes(w)) ||
            p.features.some((f) => f.toLowerCase().includes(w)) ||
            p.description.toLowerCase().includes(w)
        )
      );
      // Merge: structured results first, then fuzzy extras
      const ids = new Set(results.map((p) => p.id));
      results = [...results, ...fuzzy.filter((p) => !ids.has(p.id))];
    }
  }

  if (results.length === 0) results = MOCK_PROPERTIES;

  // Determine whether we're showing a fallback
  const isExact = exactResults.length > 0;
  let fallback: false | { reason: string } = false;

  if (!isExact && results.length > 0) {
    const parts: string[] = [];
    if (parsed.type) {
      const typeLabel: Record<string, string> = {
        villa: "chalets/villas", apartment: "pisos", penthouse: "áticos",
        studio: "estudios", townhouse: "adosados", finca: "fincas",
      };
      parts.push(`no hay ${typeLabel[parsed.type] ?? parsed.type} disponibles`);
    }
    if (parsed.city) parts.push(`en ${parsed.city}`);
    const qualifier = parsed.city ? ` en ${parsed.city}` : "";
    fallback = {
      reason: parts.length > 0
        ? `No encontramos ${parts.join(" ")}. Mostrando otras propiedades${qualifier} que podrían interesarte.`
        : "No encontramos resultados exactos. Mostrando propiedades similares.",
    };
  }

  return { properties: results, interpretation: parsed.interpretation, fallback };
}
