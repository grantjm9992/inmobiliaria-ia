"use client";

import { useState } from "react";
import { Sun, Train, Navigation, Volume2, Shield, Globe2, TrendingUp, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Neighbourhood data (mirrors Supabase seed) ───────────────────────────────

const NEIGHBOURHOODS = [
  { city: "Barcelona", name: "Barceloneta",       slug: "barceloneta",       sunlight: 7.5, transport: 8.0, walkability: 9.0, noise: 5.5, safety: 6.5, expat: 9.5, avgSale: 6800, avgRent: 25, yoy: 8.2,  tags: ["playa","turístico","animado","expats"], description: "El barrio de la playa de Barcelona. Ambiente vibrante, ideal para expatriados y amantes del mar." },
  { city: "Barcelona", name: "Eixample Esquerra", slug: "eixample-esquerra",  sunlight: 6.5, transport: 9.5, walkability: 9.5, noise: 6.0, safety: 8.0, expat: 9.0, avgSale: 5200, avgRent: 19, yoy: 6.1,  tags: ["modernista","central","LGBTQ+","cafés"], description: "Cuadrícula modernista con excelente transporte, comercio y vida cultural. Muy demandado." },
  { city: "Barcelona", name: "Sarrià",            slug: "sarria",            sunlight: 8.5, transport: 6.5, walkability: 7.5, noise: 8.5, safety: 9.0, expat: 7.0, avgSale: 6200, avgRent: 22, yoy: 4.8,  tags: ["tranquilo","familias","verde","prestigioso"], description: "Pueblo dentro de la ciudad, tranquilo y verde. Preferido por familias." },
  { city: "Barcelona", name: "Pedralbes",         slug: "pedralbes",         sunlight: 8.5, transport: 5.5, walkability: 6.5, noise: 9.0, safety: 9.5, expat: 8.0, avgSale: 8000, avgRent: 28, yoy: 5.2,  tags: ["lujo","embajadas","villas","exclusivo"], description: "La zona más exclusiva de Barcelona. Villas, embajadas y residencias de lujo." },
  { city: "Barcelona", name: "Barri Gòtic",       slug: "barri-gotic",       sunlight: 6.0, transport: 9.0, walkability: 9.5, noise: 4.0, safety: 6.5, expat: 8.5, avgSale: 5800, avgRent: 22, yoy: 7.3,  tags: ["histórico","central","turismo","medieval"], description: "El corazón medieval de Barcelona. Ideal para vivir en el centro histórico." },
  { city: "Barcelona", name: "Vila Olímpica",     slug: "vila-olimpica",     sunlight: 8.0, transport: 7.5, walkability: 8.0, noise: 7.0, safety: 7.5, expat: 8.5, avgSale: 5500, avgRent: 21, yoy: 5.9,  tags: ["moderno","marina","jóvenes profesionales","playa"], description: "Zona moderna junto al mar con buenas infraestructuras y vida activa." },
  { city: "Madrid",    name: "Barrio Salamanca",  slug: "salamanca",         sunlight: 7.0, transport: 9.0, walkability: 9.5, noise: 5.5, safety: 9.0, expat: 9.0, avgSale: 7500, avgRent: 30, yoy: 7.8,  tags: ["lujo","shopping","expats","embajadas"], description: "El barrio más prestigioso de Madrid. Boutiques de lujo, restaurantes de alto nivel." },
  { city: "Madrid",    name: "Pozuelo",           slug: "pozuelo",           sunlight: 8.0, transport: 5.5, walkability: 6.5, noise: 9.0, safety: 9.5, expat: 8.5, avgSale: 3800, avgRent: 16, yoy: 3.2,  tags: ["suburbio","familias","colegios","tranquilo"], description: "Suburbio residencial preferido por familias con niños y colegios internacionales." },
  { city: "Marbella",  name: "La Zagaleta",       slug: "la-zagaleta",       sunlight: 9.0, transport: 4.0, walkability: 4.0, noise: 10.0, safety: 9.5, expat: 8.0, avgSale: 12000, avgRent: 40, yoy: 6.5, tags: ["ultra-lujo","privacidad","golf","seguridad 24h"], description: "La urbanización más exclusiva y cara de España. Máxima privacidad." },
  { city: "Valencia",  name: "La Marina",         slug: "la-marina",         sunlight: 8.5, transport: 7.5, walkability: 8.5, noise: 7.0, safety: 7.5, expat: 8.5, avgSale: 4200, avgRent: 18, yoy: 9.8,  tags: ["moderno","marina","playa","inversión"], description: "El barrio de moda de Valencia. Modernizado con la Copa América, alta rentabilidad." },
];

const CITIES = [...new Set(NEIGHBOURHOODS.map((n) => n.city))];

const SCORE_CONFIG = [
  { key: "sunlight",    label: "Sol",           icon: Sun,        color: "text-amber-500",  bg: "bg-amber-100" },
  { key: "transport",   label: "Transporte",    icon: Train,      color: "text-blue-500",   bg: "bg-blue-100" },
  { key: "walkability", label: "A pie",         icon: Navigation, color: "text-green-500",  bg: "bg-green-100" },
  { key: "noise",       label: "Tranquilidad",  icon: Volume2,    color: "text-purple-500", bg: "bg-purple-100" },
  { key: "safety",      label: "Seguridad",     icon: Shield,     color: "text-teal-500",   bg: "bg-teal-100" },
  { key: "expat",       label: "Expat-friendly",icon: Globe2,     color: "text-indigo-500", bg: "bg-indigo-100" },
] as const;

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-stone-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color.replace("text-", "bg-")}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="text-xs font-medium text-stone-600 w-6 text-right">{score}</span>
    </div>
  );
}

function overallScore(n: typeof NEIGHBOURHOODS[number]) {
  return Math.round((n.sunlight + n.transport + n.walkability + n.noise + n.safety + n.expat) / 6 * 10) / 10;
}

export default function BarriosPage() {
  const [selectedCity, setSelectedCity] = useState("Barcelona");
  const [sortBy, setSortBy] = useState<keyof typeof NEIGHBOURHOODS[number]>("sunlight");
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const filtered = NEIGHBOURHOODS
    .filter((n) => n.city === selectedCity)
    .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-stone-900 to-stone-800 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <MapPin className="w-3.5 h-3.5 text-terracotta" />
            Inteligencia de barrios
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Encuentra el barrio perfecto para ti
          </h1>
          <p className="text-stone-300 mb-8 max-w-xl mx-auto">
            Puntuaciones de sol, transporte, ruido, seguridad y más para cada barrio de las principales ciudades de España.
          </p>
          {/* City selector */}
          <div className="flex flex-wrap justify-center gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  selectedCity === city
                    ? "bg-terracotta text-white"
                    : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                )}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Sort controls */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm text-stone-500 font-medium">Ordenar por:</span>
          {SCORE_CONFIG.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as keyof typeof NEIGHBOURHOODS[number])}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
                sortBy === key
                  ? `${color} border-current bg-current/10`
                  : "text-stone-500 border-stone-200 hover:border-stone-300"
              )}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setSortBy("yoy" as keyof typeof NEIGHBOURHOODS[number])}
            className={cn(
              "text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
              sortBy === "yoy"
                ? "text-terracotta border-current bg-current/10"
                : "text-stone-500 border-stone-200 hover:border-stone-300"
            )}
          >
            Revalorización
          </button>
        </div>

        {/* Neighbourhood cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-12">
          {filtered.map((n) => {
            const overall = overallScore(n);
            const isHighlighted = highlighted === n.slug;
            return (
              <div
                key={n.slug}
                className={cn(
                  "bg-white border rounded-2xl p-5 cursor-pointer transition-all",
                  isHighlighted
                    ? "border-terracotta shadow-lg"
                    : "border-stone-200 hover:border-stone-300 hover:shadow-md"
                )}
                onClick={() => setHighlighted(isHighlighted ? null : n.slug)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-stone-900">{n.name}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">{n.city}</p>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-lg font-bold rounded-xl px-3 py-1",
                      overall >= 8 ? "bg-green-100 text-green-700" :
                      overall >= 6 ? "bg-amber-100 text-amber-700" :
                      "bg-stone-100 text-stone-600"
                    )}>
                      {overall}
                    </div>
                    <p className="text-xs text-stone-400 mt-1">puntuación</p>
                  </div>
                </div>

                <p className="text-xs text-stone-500 mb-4 line-clamp-2">{n.description}</p>

                {/* Score bars */}
                <div className="space-y-2 mb-4">
                  {SCORE_CONFIG.map(({ key, label, color }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 w-20 flex-shrink-0">{label}</span>
                      <ScoreBar score={n[key]} color={color} />
                    </div>
                  ))}
                </div>

                {/* Price + trend */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-500">
                  <span>{n.avgSale.toLocaleString("es-ES")} €/m² venta</span>
                  <span>{n.avgRent} €/m² alquiler</span>
                  <span className="text-green-600 font-medium flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +{n.yoy}%
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {n.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>

                {/* Search CTA */}
                {isHighlighted && (
                  <Link
                    href={`/properties?q=${encodeURIComponent(n.name + " " + n.city)}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full bg-terracotta text-white text-sm font-medium py-2.5 rounded-xl hover:bg-terracotta-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver propiedades en {n.name} <MapPin className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison note */}
        <div className="bg-stone-100 rounded-2xl p-6 text-center">
          <p className="text-stone-600 text-sm">
            Las puntuaciones se calculan a partir de datos de OpenStreetMap, INE, registros municipales y ruido de tráfico.
            Se actualizan trimestralmente. <span className="font-medium text-stone-800">Haz clic en un barrio</span> para ver las propiedades disponibles.
          </p>
        </div>
      </div>
    </div>
  );
}
