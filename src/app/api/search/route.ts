import { NextRequest, NextResponse } from "next/server";
import { MOCK_PROPERTIES } from "@/lib/properties";
import { localSearch } from "@/lib/localSearch";

// Disabled after first billing/auth failure so we stop hitting the API on every request
let aiDisabled = false;

// Optionally enhance with Claude if ANTHROPIC_API_KEY is available and has credits
async function aiEnhancedSearch(query: string) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a Spanish property search assistant for Casalista.

Analyze this query and return a JSON object (no markdown):
{
  "interpretation": "1-2 sentence friendly Spanish description of what they want",
  "filters": {
    "operation": "sale" | "rent" | null,
    "city": "Spanish city name" | null,
    "maxPrice": number | null,
    "minBedrooms": number | null,
    "type": "apartment" | "villa" | "townhouse" | "penthouse" | "studio" | "finca" | null
  },
  "searchTerms": ["key", "feature", "terms"]
}

Query: "${query}"

Spanish property vocabulary: piso/apartamento=apartment, ático=penthouse, chalet=villa, adosado=townhouse, finca/cortijo=finca, alquilar=rent, comprar=sale.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("unexpected");

  const parsed = JSON.parse(content.text);
  const { interpretation, filters, searchTerms = [] } = parsed;

  let results = MOCK_PROPERTIES;
  if (filters.operation === "sale" || filters.operation === "rent")
    results = results.filter((p) => p.operation === filters.operation);
  if (filters.city)
    results = results.filter((p) =>
      p.city.toLowerCase().includes(filters.city.toLowerCase())
    );
  if (typeof filters.maxPrice === "number")
    results = results.filter((p) => p.price <= filters.maxPrice);
  if (typeof filters.minBedrooms === "number")
    results = results.filter((p) => p.bedrooms >= filters.minBedrooms);
  if (filters.type)
    results = results.filter((p) => p.type === filters.type);

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
    if (termFiltered.length > 0) results = termFiltered;
  }

  // Zero exact results — relax type but keep operation + city as hard filters
  if (results.length === 0) {
    let relaxed = MOCK_PROPERTIES;
    if (filters.operation === "sale" || filters.operation === "rent")
      relaxed = relaxed.filter((p) => p.operation === filters.operation);
    if (filters.city)
      relaxed = relaxed.filter((p) => p.city.toLowerCase().includes(filters.city.toLowerCase()));
    results = relaxed.length > 0 ? relaxed : localSearch(query).properties;
  }

  return { properties: results, interpretation };
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ properties: MOCK_PROPERTIES, interpretation: null });
  }

  // Try AI-enhanced search if API key is configured and known-working
  if (process.env.ANTHROPIC_API_KEY && !aiDisabled) {
    try {
      const result = await aiEnhancedSearch(query);
      return NextResponse.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      // Billing/auth errors won't fix themselves — disable AI for the rest of this process
      if (msg.includes("credit balance") || msg.includes("invalid_api_key") || msg.includes("authentication")) {
        aiDisabled = true;
        console.log("ℹ️  Casalista: Anthropic API unavailable (billing/auth), using local NLP parser");
      } else {
        // Transient error — log but keep trying on future requests
        console.warn(`AI search error: ${msg.slice(0, 120)}`);
      }
    }
  }

  // Local NLP parser — zero cost, no API key needed
  const { properties, interpretation } = localSearch(query);
  return NextResponse.json({ properties, interpretation });
}
