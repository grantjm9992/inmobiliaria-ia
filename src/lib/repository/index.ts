/**
 * Repository factory — the only place where the data source is decided.
 *
 * Set NEXT_PUBLIC_DATA_SOURCE in .env.local:
 *   NEXT_PUBLIC_DATA_SOURCE=mock       ← default, works offline
 *   NEXT_PUBLIC_DATA_SOURCE=supabase   ← live DB (requires Supabase env vars)
 *
 * To add a new source (e.g. "idealista-api"):
 *   1. Create src/lib/repository/idealista.repository.ts
 *   2. Implement PropertyRepository
 *   3. Add a case below
 */

import type { PropertyRepository } from "./types";

let _instance: PropertyRepository | null = null;

export function getRepository(): PropertyRepository {
  if (_instance) return _instance;

  const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

  switch (source) {
    case "supabase": {
      // Dynamic import keeps Supabase client out of the mock bundle
      const { SupabaseRepository } = require("./supabase.repository");
      _instance = new SupabaseRepository();
      break;
    }
    default: {
      const { MockRepository } = require("./mock.repository");
      _instance = new MockRepository();
      break;
    }
  }

  return _instance!;
}

export type { PropertyRepository, PropertyFilters, PropertyPage } from "./types";
