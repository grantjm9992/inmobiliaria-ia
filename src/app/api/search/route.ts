import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { MOCK_PROPERTIES, searchProperties } from "@/lib/properties";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ properties: MOCK_PROPERTIES, interpretation: null });
  }

  try {
    // Use Claude to interpret the natural language query and extract structured filters
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an AI assistant for a Spanish property search engine called Casalista.

Analyze this property search query and extract structured information from it.
Query: "${query}"

Respond with a JSON object (no markdown, just raw JSON) with these fields:
{
  "interpretation": "A friendly 1-2 sentence Spanish summary of what the user is looking for",
  "filters": {
    "operation": "sale" | "rent" | null,
    "city": "city name in Spanish" | null,
    "maxPrice": number | null,
    "minBedrooms": number | null,
    "type": "apartment" | "villa" | "townhouse" | "penthouse" | "studio" | "finca" | null
  },
  "searchTerms": ["array", "of", "key", "terms", "to", "text", "search"]
}

For example:
- "3 bed apartment in Barcelona under 500k" → operation: "sale", city: "Barcelona", maxPrice: 500000, minBedrooms: 3, type: "apartment"
- "villa with pool Marbella" → city: "Marbella", type: "villa", searchTerms: ["pool", "villa"]
- "modern flat to rent in Madrid" → operation: "rent", city: "Madrid", type: "apartment", searchTerms: ["modern"]
- "cortijo andaluz con olivos" → type: "finca", city: null, searchTerms: ["olivos", "cortijo", "andaluz"]

Be smart about interpreting Spanish and English property terms. "piso" = apartment, "chalet" = villa, "ático" = penthouse, "finca/cortijo" = finca.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    let parsed: { interpretation: string; filters: Record<string, unknown>; searchTerms: string[] };
    try {
      parsed = JSON.parse(content.text);
    } catch {
      // Fall back to simple text search
      return NextResponse.json({
        properties: searchProperties(query),
        interpretation: null,
      });
    }

    const { interpretation, filters, searchTerms = [] } = parsed;

    // Apply structured filters
    let results = MOCK_PROPERTIES;

    if (filters.operation === "sale" || filters.operation === "rent") {
      results = results.filter((p) => p.operation === filters.operation);
    }
    if (filters.city && typeof filters.city === "string") {
      results = results.filter((p) =>
        p.city.toLowerCase().includes((filters.city as string).toLowerCase())
      );
    }
    if (typeof filters.maxPrice === "number") {
      results = results.filter((p) => p.price <= (filters.maxPrice as number));
    }
    if (typeof filters.minBedrooms === "number") {
      results = results.filter((p) => p.bedrooms >= (filters.minBedrooms as number));
    }
    if (filters.type && typeof filters.type === "string") {
      results = results.filter((p) => p.type === filters.type);
    }

    // Apply text search with extracted terms
    if (searchTerms.length > 0) {
      const termFiltered = results.filter((p) =>
        searchTerms.some(
          (term: string) =>
            p.title.toLowerCase().includes(term.toLowerCase()) ||
            p.tags.some((t) => t.toLowerCase().includes(term.toLowerCase())) ||
            p.features.some((f) => f.toLowerCase().includes(term.toLowerCase())) ||
            p.description.toLowerCase().includes(term.toLowerCase())
        )
      );
      // Only apply term filter if it returns results, otherwise keep filter-only results
      if (termFiltered.length > 0) results = termFiltered;
    }

    // If no filters matched anything meaningful, return all with text search
    if (results.length === 0) {
      results = searchProperties(query);
    }

    return NextResponse.json({ properties: results, interpretation });
  } catch (error) {
    console.error("AI search error:", error);
    // Graceful fallback to simple text search
    return NextResponse.json({
      properties: searchProperties(query),
      interpretation: null,
    });
  }
}
