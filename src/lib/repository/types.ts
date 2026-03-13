/**
 * PropertyRepository — the single interface every part of the app uses.
 *
 * To swap data sources (mock → Supabase → Idealista API):
 *   1. Implement this interface in a new file
 *   2. Change the factory in src/lib/repository/index.ts
 *   3. Done — nothing else changes
 */

import type { Property, PropertyType, OperationType } from "@/lib/properties";

export interface PropertyFilters {
  operation?: OperationType;
  city?: string;
  type?: PropertyType;
  maxPrice?: number;
  minPrice?: number;
  minBedrooms?: number;
  neighbourhood?: string;
  tags?: string[];           // any of these tags must match
  ids?: string[];            // fetch specific IDs
}

export interface PropertyPage {
  properties: Property[];
  total: number;
  cursor?: string;           // for cursor-based pagination
}

export interface PropertyRepository {
  /** Full-text + structured search. Returns ranked results. */
  search(query: string, filters?: PropertyFilters, limit?: number, cursor?: string): Promise<PropertyPage>;

  /** Get one property by its platform ID. Returns null if not found. */
  getById(id: string): Promise<Property | null>;

  /** Get multiple properties, e.g. for "similar listings". */
  getMany(filters: PropertyFilters, limit?: number): Promise<Property[]>;

  /** Optional: find listings similar to a given property (pgvector / tag overlap). */
  getSimilar?(propertyId: string, limit?: number): Promise<Property[]>;
}
