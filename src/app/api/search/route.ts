import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/repository";
import { parseQuery } from "@/lib/localSearch";

// Disabled after first billing/auth failure so we stop hitting the API on every request
let aiDisabled = false;

/**
 * Use Claude tool_use to parse a natural-language query into structured filters.
 * Falls back to local NLP parser if API key is unavailable or billing fails.
 */
async function parseWithClaude(query: string) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    tools: [
      {
        name: "parse_property_search",
        description: "Extract structured property search filters from a natural language query",
        input_schema: {
          type: "object" as const,
          properties: {
            interpretation: {
              type: "string",
              description: "1-2 sentence friendly Spanish summary of what the user is looking for",
            },
            operation:    { type: "string", enum: ["sale", "rent"], description: "sale or rent" },
            city:         { type: "string", description: "Spanish city name, e.g. Barcelona, Madrid" },
            type:         { type: "string", enum: ["apartment", "villa", "townhouse", "penthouse", "studio", "finca"] },
            maxPrice:     { type: "number", description: "Maximum price in euros" },
            minBedrooms:  { type: "integer", description: "Minimum number of bedrooms" },
            keywords:     { type: "array", items: { type: "string" }, description: "Key lifestyle/feature terms to search for" },
          },
          required: ["interpretation"],
        },
      },
    ],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: `Spanish property search. Vocabulary: piso/apartamento=apartment, ático=penthouse, chalet=villa, adosado=townhouse, finca/cortijo=finca, alquilar=rent, comprar=sale.\n\nQuery: "${query}"`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") return null;

  return toolUse.input as {
    interpretation: string;
    operation?: "sale" | "rent";
    city?: string;
    type?: string;
    maxPrice?: number;
    minBedrooms?: number;
    keywords?: string[];
  };
}

export async function POST(req: NextRequest) {
  const { query, filters: explicitFilters = {} } = await req.json();
  const repo = getRepository();

  if (!query?.trim()) {
    const { properties, total } = await repo.search("", explicitFilters);
    return NextResponse.json({ properties, total, interpretation: null, fallback: false });
  }

  // ── Try Claude tool_use for query parsing ────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY && !aiDisabled) {
    try {
      const parsed = await parseWithClaude(query);
      if (parsed) {
        const filters = {
          ...explicitFilters,
          ...(parsed.operation    ? { operation: parsed.operation }         : {}),
          ...(parsed.city         ? { city: parsed.city }                   : {}),
          ...(parsed.type         ? { type: parsed.type as PropertyFilters["type"] } : {}),
          ...(parsed.maxPrice     ? { maxPrice: parsed.maxPrice }           : {}),
          ...(parsed.minBedrooms  ? { minBedrooms: parsed.minBedrooms }     : {}),
        };

        // Search with AI-parsed filters; pass remaining keywords as query
        const keywordQuery = parsed.keywords?.join(" ") ?? "";
        const { properties, total } = await repo.search(keywordQuery, filters);

        const fallback = properties.length === 0
          ? { reason: "No encontramos resultados exactos. Mostrando propiedades similares." }
          : false;

        return NextResponse.json({ properties, total, interpretation: parsed.interpretation, fallback });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("credit balance") || msg.includes("invalid_api_key") || msg.includes("authentication")) {
        aiDisabled = true;
        console.log("ℹ️  Casalista: Anthropic API unavailable, using local NLP parser");
      } else {
        console.warn(`AI parse error: ${msg.slice(0, 120)}`);
      }
    }
  }

  // ── Local NLP parser fallback ────────────────────────────────────────────────
  const parsed = parseQuery(query);
  const filters = {
    ...explicitFilters,
    ...(parsed.operation   ? { operation: parsed.operation }                    : {}),
    ...(parsed.city        ? { city: parsed.city }                              : {}),
    ...(parsed.type        ? { type: parsed.type as PropertyFilters["type"] }   : {}),
    ...(parsed.maxPrice    ? { maxPrice: parsed.maxPrice }                      : {}),
    ...(parsed.minBedrooms ? { minBedrooms: parsed.minBedrooms }                : {}),
  };

  const { properties, total } = await repo.search(parsed.keywords.join(" "), filters);
  const fallback = properties.length === 0
    ? { reason: "No encontramos resultados exactos. Mostrando propiedades similares." }
    : false;

  return NextResponse.json({ properties, total, interpretation: parsed.interpretation, fallback });
}

// Import type so the file compiles without touching the rest of the codebase
import type { PropertyFilters } from "@/lib/repository";
