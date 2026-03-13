// Auto-generated Supabase types — run `supabase gen types` to regenerate
// Manual version kept in sync with schema.sql

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          source: "idealista" | "fotocasa" | "habitaclia" | "direct" | "manual";
          source_id: string | null;
          source_url: string | null;
          title: string;
          description: string | null;
          type: "apartment" | "villa" | "townhouse" | "penthouse" | "studio" | "finca";
          operation: "sale" | "rent";
          price: number;
          price_per_sqm: number | null;
          size: number;
          bedrooms: number;
          bathrooms: number;
          floor: number | null;
          total_floors: number | null;
          year_built: number | null;
          energy_rating: string | null;
          city: string;
          neighbourhood: string | null;
          region: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          images: string[];
          features: string[];
          tags: string[];
          agent_name: string | null;
          agent_agency: string | null;
          agent_phone: string | null;
          agent_email: string | null;
          community_fees: number | null;
          ibi_tax: number | null;
          // Computed / enriched fields
          ranking_score: number | null;
          sunlight_score: number | null;
          transport_score: number | null;
          walkability_score: number | null;
          noise_score: number | null;
          rental_yield_estimate: number | null;
          airbnb_potential: number | null;
          price_vs_market: number | null; // % above/below market
          is_featured: boolean;
          is_active: boolean;
          scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["properties"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          filters: Record<string, unknown>;
          alert_enabled: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["saved_searches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["saved_searches"]["Insert"]>;
      };
      favourites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["favourites"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["favourites"]["Insert"]>;
      };
      neighbourhoods: {
        Row: {
          id: string;
          city: string;
          name: string;
          slug: string;
          description: string | null;
          sunlight_score: number | null;
          transport_score: number | null;
          walkability_score: number | null;
          noise_score: number | null;
          safety_score: number | null;
          expat_friendliness: number | null;
          avg_price_sqm_sale: number | null;
          avg_price_sqm_rent: number | null;
          yoy_price_change: number | null; // % YoY
          lat: number | null;
          lng: number | null;
          polygon: unknown | null; // GeoJSON
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["neighbourhoods"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["neighbourhoods"]["Insert"]>;
      };
      price_history: {
        Row: {
          id: string;
          property_id: string;
          price: number;
          recorded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["price_history"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["price_history"]["Insert"]>;
      };
    };
  };
}

// Convenience type aliases
export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type NeighbourhoodRow = Database["public"]["Tables"]["neighbourhoods"]["Row"];
