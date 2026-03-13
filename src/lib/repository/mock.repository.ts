/**
 * MockRepository — in-memory implementation backed by MOCK_PROPERTIES.
 * Used when NEXT_PUBLIC_DATA_SOURCE=mock (the default for local dev).
 *
 * All search/filter logic lives here, not scattered across route handlers.
 */

import { MOCK_PROPERTIES, type Property } from "@/lib/properties";
import { parseQuery } from "@/lib/localSearch";
import { computeRankingScore } from "@/lib/ranking";
import type { PropertyFilters, PropertyPage, PropertyRepository } from "./types";

function applyFilters(properties: Property[], filters: PropertyFilters): Property[] {
  let results = properties;
  if (filters.ids)            results = results.filter((p) => filters.ids!.includes(p.id));
  if (filters.operation)      results = results.filter((p) => p.operation === filters.operation);
  if (filters.city)           results = results.filter((p) => p.city.toLowerCase() === filters.city!.toLowerCase());
  if (filters.type)           results = results.filter((p) => p.type === filters.type);
  if (filters.maxPrice)       results = results.filter((p) => p.price <= filters.maxPrice!);
  if (filters.minPrice)       results = results.filter((p) => p.price >= filters.minPrice!);
  if (filters.minBedrooms)    results = results.filter((p) => p.bedrooms >= filters.minBedrooms!);
  if (filters.neighbourhood)  results = results.filter((p) => p.neighbourhood.toLowerCase().includes(filters.neighbourhood!.toLowerCase()));
  if (filters.tags?.length) {
    results = results.filter((p) =>
      filters.tags!.some((tag) => p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())))
    );
  }
  return results;
}

function keywordScore(p: Property, words: string[]): number {
  // Simple relevance score: count how many fields each keyword hits
  return words.reduce((score, w) => {
    const wl = w.toLowerCase();
    if (p.title.toLowerCase().includes(wl)) score += 3;
    if (p.neighbourhood.toLowerCase().includes(wl)) score += 2;
    if (p.tags.some((t) => t.toLowerCase().includes(wl))) score += 2;
    if (p.features.some((f) => f.toLowerCase().includes(wl))) score += 1;
    if (p.description.toLowerCase().includes(wl)) score += 1;
    return score;
  }, 0);
}

export class MockRepository implements PropertyRepository {
  async search(
    query: string,
    filters: PropertyFilters = {},
    limit = 50,
    _cursor?: string
  ): Promise<PropertyPage> {
    const parsed = query.trim() ? parseQuery(query) : null;

    // Merge query-parsed filters with explicit filters (explicit wins)
    const merged: PropertyFilters = {
      operation: filters.operation ?? parsed?.operation ?? undefined,
      city:      filters.city      ?? parsed?.city      ?? undefined,
      type:      filters.type      ?? (parsed?.type as PropertyFilters["type"]) ?? undefined,
      maxPrice:  filters.maxPrice  ?? parsed?.maxPrice  ?? undefined,
      minBedrooms: filters.minBedrooms ?? parsed?.minBedrooms ?? undefined,
      ...filters,
    };

    let results = applyFilters(MOCK_PROPERTIES, merged);

    // Keyword scoring on remaining results
    const keywords = parsed?.keywords ?? [];
    if (keywords.length > 0) {
      const scored = results
        .map((p) => ({ p, score: keywordScore(p, keywords) }))
        .sort((a, b) => b.score - a.score || computeRankingScore(b.p) - computeRankingScore(a.p));

      // If we have keyword hits, prefer them; otherwise keep structural results
      const hits = scored.filter((s) => s.score > 0);
      results = (hits.length > 0 ? hits : scored).map((s) => s.p);
    } else {
      results = results.sort((a, b) => computeRankingScore(b) - computeRankingScore(a));
    }

    return {
      properties: results.slice(0, limit),
      total: results.length,
    };
  }

  async getById(id: string): Promise<Property | null> {
    return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
  }

  async getMany(filters: PropertyFilters, limit = 20): Promise<Property[]> {
    const results = applyFilters(MOCK_PROPERTIES, filters);
    return results
      .sort((a, b) => computeRankingScore(b) - computeRankingScore(a))
      .slice(0, limit);
  }

  async getSimilar(propertyId: string, limit = 4): Promise<Property[]> {
    const target = MOCK_PROPERTIES.find((p) => p.id === propertyId);
    if (!target) return [];

    // Score by overlap: same city > same type > overlapping tags
    return MOCK_PROPERTIES
      .filter((p) => p.id !== propertyId)
      .map((p) => {
        let score = 0;
        if (p.city === target.city) score += 3;
        if (p.type === target.type) score += 2;
        if (p.operation === target.operation) score += 1;
        const sharedTags = p.tags.filter((t) => target.tags.includes(t)).length;
        score += sharedTags;
        // Penalise large price difference
        const priceDiff = Math.abs(p.price - target.price) / target.price;
        if (priceDiff < 0.2) score += 2;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.p);
  }
}
