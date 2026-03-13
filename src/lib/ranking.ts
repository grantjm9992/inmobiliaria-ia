/**
 * Smart ranking engine
 *
 * Scores properties on multiple signals beyond price.
 * All scores are 0–100. The composite ranking_score weights them.
 *
 * When Supabase is connected, these enriched fields are stored on the
 * properties table and used for the "Smart" sort order.
 * For the mock-data path, scores are computed on the fly.
 */

import type { PropertyRow } from "./database.types";
import type { Property } from "./properties";

// ─── Neighbourhood signal tables ─────────────────────────────────────────────
// In production these come from the `neighbourhoods` Supabase table.
// Hard-coded here for the mock/offline path.

const NEIGHBOURHOOD_SIGNALS: Record<string, {
  sunlight: number;   // 0–10
  transport: number;  // 0–10
  walkability: number;// 0–10
  noise: number;      // 0–10 (10 = very quiet)
  safety: number;     // 0–10
  expatFriendly: number;
}> = {
  // Barcelona
  "barceloneta":          { sunlight: 7.5, transport: 8.0, walkability: 9.0, noise: 5.5, safety: 6.5, expatFriendly: 9.5 },
  "eixample esquerra":    { sunlight: 6.5, transport: 9.5, walkability: 9.5, noise: 6.0, safety: 8.0, expatFriendly: 9.0 },
  "sarrià-sant gervasi":  { sunlight: 8.5, transport: 6.5, walkability: 7.5, noise: 8.5, safety: 9.0, expatFriendly: 7.0 },
  "pedralbes":            { sunlight: 8.5, transport: 5.5, walkability: 6.5, noise: 9.0, safety: 9.5, expatFriendly: 8.0 },
  "barri gòtic":          { sunlight: 6.0, transport: 9.0, walkability: 9.5, noise: 4.0, safety: 6.5, expatFriendly: 8.5 },
  "vila olímpica":        { sunlight: 8.0, transport: 7.5, walkability: 8.0, noise: 7.0, safety: 7.5, expatFriendly: 8.5 },
  // Madrid
  "barrio salamanca":     { sunlight: 7.0, transport: 9.0, walkability: 9.5, noise: 5.5, safety: 9.0, expatFriendly: 9.0 },
  "pozuelo de alarcón":   { sunlight: 8.0, transport: 5.5, walkability: 6.5, noise: 9.0, safety: 9.5, expatFriendly: 8.5 },
  // Marbella
  "la zagaleta":          { sunlight: 9.0, transport: 4.0, walkability: 4.0, noise: 10.0, safety: 9.5, expatFriendly: 8.0 },
  "campo":                { sunlight: 8.5, transport: 3.0, walkability: 3.0, noise: 10.0, safety: 8.5, expatFriendly: 5.0 },
  // Valencia
  "la marina":            { sunlight: 8.5, transport: 7.5, walkability: 8.5, noise: 7.0, safety: 7.5, expatFriendly: 8.5 },
};

function getNeighbourhoodSignals(neighbourhood: string) {
  const key = neighbourhood.toLowerCase();
  for (const [k, v] of Object.entries(NEIGHBOURHOOD_SIGNALS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // Defaults for unknown neighbourhoods
  return { sunlight: 6.0, transport: 6.0, walkability: 6.0, noise: 6.0, safety: 7.0, expatFriendly: 6.0 };
}

// ─── Individual signal scorers ────────────────────────────────────────────────

function sunlightScore(p: Property): number {
  const signals = getNeighbourhoodSignals(p.neighbourhood);
  let score = signals.sunlight * 10; // 0–100
  // South/sea-facing penthouse gets a boost
  if (p.type === "penthouse") score = Math.min(100, score + 10);
  if (p.tags.some((t) => t.includes("sea view") || t.includes("vistas"))) score = Math.min(100, score + 8);
  return Math.round(score);
}

function transportScore(p: Property): number {
  const signals = getNeighbourhoodSignals(p.neighbourhood);
  let score = signals.transport * 10;
  if (p.features.some((f) => f.toLowerCase().includes("metro") || f.toLowerCase().includes("tren"))) {
    score = Math.min(100, score + 5);
  }
  return Math.round(score);
}

function walkabilityScore(p: Property): number {
  const signals = getNeighbourhoodSignals(p.neighbourhood);
  return Math.round(signals.walkability * 10);
}

function noiseScore(p: Property): number {
  const signals = getNeighbourhoodSignals(p.neighbourhood);
  let score = signals.noise * 10;
  // High floor = less street noise
  if (p.floor && p.floor >= 4) score = Math.min(100, score + 8);
  // Rural properties are quiet
  if (p.type === "finca") score = 95;
  return Math.round(score);
}

function valueScore(p: Property): number {
  // Price per m² vs city median
  const CITY_MEDIANS: Record<string, number> = {
    Barcelona: 5500, Madrid: 5000, Marbella: 7000, Valencia: 3500,
    Ronda: 2000, Sevilla: 3000, Málaga: 3500,
  };
  const median = CITY_MEDIANS[p.city] ?? 4500;
  const ppm = p.pricePerSqm ?? (p.price / p.size);
  // Score 100 = 30% below median, 0 = 30% above median
  const diff = (median - ppm) / median; // positive = cheaper than median
  return Math.round(Math.max(0, Math.min(100, 50 + diff * 167)));
}

function investmentScore(p: Property): number {
  if (p.operation !== "sale") return 0;
  const yield_ = estimateRentalYield(p);
  // 8%+ yield = 100, 3% yield = 0
  return Math.round(Math.max(0, Math.min(100, (yield_ - 3) / 5 * 100)));
}

// ─── Rental yield estimator ──────────────────────────────────────────────────

// Monthly rent benchmarks per m² by city
const RENT_BENCHMARKS: Record<string, number> = {
  Barcelona: 20,
  Madrid: 18,
  Marbella: 22,
  Valencia: 14,
  Ronda: 8,
  Sevilla: 12,
  Málaga: 15,
};

export function estimateRentalYield(p: Property): number {
  const rentPerSqm = RENT_BENCHMARKS[p.city] ?? 14;
  const monthlyRent = p.size * rentPerSqm;
  const annualRent = monthlyRent * 11; // 1 month vacancy
  const totalCost = p.price + p.price * 0.11; // +11% purchase costs (ITP, notario, etc.)
  return parseFloat(((annualRent / totalCost) * 100).toFixed(2));
}

export function estimateAirbnbPotential(p: Property): number {
  // Average nightly rate by city * 70% occupancy * 12 months
  const NIGHTLY: Record<string, number> = {
    Barcelona: 120, Madrid: 100, Marbella: 180, Valencia: 90, Ibiza: 250,
    Sevilla: 85, Málaga: 95, Ronda: 70,
  };
  const nightly = NIGHTLY[p.city] ?? 90;
  // Scale by size
  const sizeFactor = Math.min(2, p.size / 80);
  const annualRevenue = nightly * 365 * 0.70 * sizeFactor;
  return Math.round(annualRevenue);
}

export function estimateMortgage(price: number, deposit = 0.20, years = 30, rate = 0.035): number {
  const loan = price * (1 - deposit);
  const monthlyRate = rate / 12;
  const n = years * 12;
  return Math.round((loan * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1));
}

// ─── Composite ranking score ─────────────────────────────────────────────────

const WEIGHTS = {
  sunlight:    0.15,
  transport:   0.20,
  walkability: 0.15,
  noise:       0.10,
  value:       0.25,
  investment:  0.15,
};

export function computeRankingScore(p: Property): number {
  const scores = {
    sunlight:    sunlightScore(p),
    transport:   transportScore(p),
    walkability: walkabilityScore(p),
    noise:       noiseScore(p),
    value:       valueScore(p),
    investment:  investmentScore(p),
  };

  const composite = Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + scores[key as keyof typeof scores] * weight,
    0
  );

  return Math.round(composite);
}

export function enrichProperty(p: Property): Property & {
  rankingScore: number;
  sunlightScore: number;
  transportScore: number;
  walkabilityScore: number;
  noiseScore: number;
  rentalYield: number;
  airbnbPotential: number;
  neighbourhoodSignals: ReturnType<typeof getNeighbourhoodSignals>;
} {
  return {
    ...p,
    rankingScore:     computeRankingScore(p),
    sunlightScore:    sunlightScore(p),
    transportScore:   transportScore(p),
    walkabilityScore: walkabilityScore(p),
    noiseScore:       noiseScore(p),
    rentalYield:      estimateRentalYield(p),
    airbnbPotential:  estimateAirbnbPotential(p),
    neighbourhoodSignals: getNeighbourhoodSignals(p.neighbourhood),
  };
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

export type SortMode = "relevance" | "price_asc" | "price_desc" | "newest" | "yield" | "value";

export function sortProperties(properties: Property[], mode: SortMode): Property[] {
  const copy = [...properties];
  switch (mode) {
    case "relevance":  return copy.sort((a, b) => computeRankingScore(b) - computeRankingScore(a));
    case "price_asc":  return copy.sort((a, b) => a.price - b.price);
    case "price_desc": return copy.sort((a, b) => b.price - a.price);
    case "newest":     return copy.sort((a, b) => b.listedDate.localeCompare(a.listedDate));
    case "yield":      return copy.sort((a, b) => estimateRentalYield(b) - estimateRentalYield(a));
    case "value":      return copy.sort((a, b) => valueScore(b) - valueScore(a));
    default:           return copy;
  }
}

// ─── DB row adapter ──────────────────────────────────────────────────────────

export function dbRowToProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    operation: row.operation,
    price: row.price,
    pricePerSqm: row.price_per_sqm ?? undefined,
    size: row.size,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    city: row.city,
    neighbourhood: row.neighbourhood ?? "",
    region: row.region,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    images: row.images,
    features: row.features,
    description: row.description ?? "",
    yearBuilt: row.year_built ?? undefined,
    floor: row.floor ?? undefined,
    totalFloors: row.total_floors ?? undefined,
    energyRating: row.energy_rating ?? undefined,
    agentName: row.agent_name ?? "",
    agentAgency: row.agent_agency ?? "",
    listedDate: row.created_at.slice(0, 10),
    communityFees: row.community_fees ?? undefined,
    ibiTax: row.ibi_tax ?? undefined,
    tags: row.tags,
  };
}
