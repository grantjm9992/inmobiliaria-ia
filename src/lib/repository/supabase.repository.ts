/**
 * SupabaseRepository — live database implementation.
 * Activated when NEXT_PUBLIC_DATA_SOURCE=supabase.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

import { createServerSupabase } from "@/lib/supabase";
import { dbRowToProperty } from "@/lib/ranking";
import { parseQuery } from "@/lib/localSearch";
import type { PropertyFilters, PropertyPage, PropertyRepository } from "./types";
import type { Property } from "@/lib/properties";

export class SupabaseRepository implements PropertyRepository {
  private get db() {
    return createServerSupabase();
  }

  async search(
    query: string,
    filters: PropertyFilters = {},
    limit = 50,
    cursor?: string
  ): Promise<PropertyPage> {
    const parsed = query.trim() ? parseQuery(query) : null;

    const operation = filters.operation ?? parsed?.operation ?? undefined;
    const city      = filters.city      ?? parsed?.city      ?? undefined;
    const type      = filters.type      ?? (parsed?.type as PropertyFilters["type"]) ?? undefined;
    const maxPrice  = filters.maxPrice  ?? parsed?.maxPrice  ?? undefined;
    const minBeds   = filters.minBedrooms ?? parsed?.minBedrooms ?? undefined;

    let q = this.db
      .from("properties")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("ranking_score", { ascending: false })
      .limit(limit);

    if (operation)  q = q.eq("operation", operation);
    if (city)       q = q.ilike("city", city);
    if (type)       q = q.eq("type", type);
    if (maxPrice)   q = q.lte("price", maxPrice);
    if (minBeds)    q = q.gte("bedrooms", minBeds);
    if (filters.minPrice) q = q.gte("price", filters.minPrice);
    if (filters.neighbourhood) q = q.ilike("neighbourhood", `%${filters.neighbourhood}%`);
    if (cursor)     q = q.lt("created_at", cursor);

    // Full-text search on the generated tsvector column
    if (parsed?.keywords.length) {
      const tsQuery = parsed.keywords.join(" & ");
      q = q.textSearch("search_vector", tsQuery, { type: "websearch" });
    }

    const { data, error, count } = await q;
    if (error) throw new Error(`Supabase search error: ${error.message}`);

    const properties = (data ?? []).map(dbRowToProperty);
    return {
      properties,
      total: count ?? properties.length,
      cursor: (data as Array<{ created_at: string }> | null)?.at(-1)?.created_at ?? undefined,
    };
  }

  async getById(id: string): Promise<Property | null> {
    const { data, error } = await this.db
      .from("properties")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return dbRowToProperty(data);
  }

  async getMany(filters: PropertyFilters, limit = 20): Promise<Property[]> {
    const { properties } = await this.search("", filters, limit);
    return properties;
  }

  async getSimilar(propertyId: string, limit = 4): Promise<Property[]> {
    // Get the target property first
    const target = await this.getById(propertyId);
    if (!target) return [];

    const { data } = await this.db
      .from("properties")
      .select("*")
      .eq("is_active", true)
      .eq("city", target.city)
      .eq("operation", target.operation)
      .neq("id", propertyId)
      .order("ranking_score", { ascending: false })
      .limit(limit);

    return (data ?? []).map(dbRowToProperty);
  }
}
