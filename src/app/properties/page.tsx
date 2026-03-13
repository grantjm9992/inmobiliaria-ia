"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { MOCK_PROPERTIES, Property } from "@/lib/properties";
import { SlidersHorizontal, Sparkles, X, BedDouble, Euro } from "lucide-react";
import { cn } from "@/lib/utils";

const CITIES = ["Barcelona", "Madrid", "Marbella", "Valencia", "Sevilla", "Málaga", "Ibiza"];
const TYPES = [
  { value: "apartment", label: "Piso" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Adosado" },
  { value: "penthouse", label: "Ático" },
  { value: "studio", label: "Estudio" },
  { value: "finca", label: "Finca" },
];

function PropertiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Quick filter state
  const [opFilter, setOpFilter] = useState<string>(searchParams.get("op") ?? "");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [bedsFilter, setBedsFilter] = useState("");

  const doSearch = async (q: string) => {
    setIsLoading(true);
    setInterpretation(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      let results: Property[] = data.properties;

      // Apply client-side quick filters on top
      if (opFilter) results = results.filter((p) => p.operation === opFilter);
      if (cityFilter) results = results.filter((p) => p.city.toLowerCase().includes(cityFilter.toLowerCase()));
      if (typeFilter) results = results.filter((p) => p.type === typeFilter);
      if (maxPriceFilter) results = results.filter((p) => p.price <= parseInt(maxPriceFilter));
      if (bedsFilter) results = results.filter((p) => p.bedrooms >= parseInt(bedsFilter));

      setProperties(results);
      setInterpretation(data.interpretation);
    } catch {
      setProperties(MOCK_PROPERTIES);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount: run search if URL has ?q=
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (query) doSearch(query); }, []);

  // Re-run when quick filters change (without re-invoking AI if there's a query)
  useEffect(() => {
    if (query) {
      doSearch(query);
    } else {
      let results = MOCK_PROPERTIES;
      if (opFilter) results = results.filter((p) => p.operation === opFilter);
      if (cityFilter) results = results.filter((p) => p.city.toLowerCase().includes(cityFilter.toLowerCase()));
      if (typeFilter) results = results.filter((p) => p.type === typeFilter);
      if (maxPriceFilter) results = results.filter((p) => p.price <= parseInt(maxPriceFilter));
      if (bedsFilter) results = results.filter((p) => p.bedrooms >= parseInt(bedsFilter));
      setProperties(results);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opFilter, cityFilter, typeFilter, maxPriceFilter, bedsFilter]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    router.replace(`/properties?q=${encodeURIComponent(newQuery)}`);
    doSearch(newQuery);
  };

  const clearFilters = () => {
    setOpFilter("");
    setCityFilter("");
    setTypeFilter("");
    setMaxPriceFilter("");
    setBedsFilter("");
    setQuery("");
    setInterpretation(null);
    setProperties(MOCK_PROPERTIES);
    router.replace("/properties");
  };

  const activeFilterCount = [opFilter, cityFilter, typeFilter, maxPriceFilter, bedsFilter].filter(Boolean).length;

  return (
    <div className="min-h-screen">
      {/* Search header */}
      <div className="bg-white border-b border-stone-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} size="sm" className="flex-1" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors flex-shrink-0",
              showFilters || activeFilterCount > 0
                ? "border-terracotta bg-terracotta/5 text-terracotta"
                : "border-stone-200 text-stone-600 hover:border-stone-300"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-terracotta text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter drawer */}
        {showFilters && (
          <div className="border-t border-stone-100 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-3 items-end">
              {/* Operation */}
              <div>
                <label className="text-xs text-stone-500 font-medium mb-1 block">Operación</label>
                <div className="flex rounded-lg overflow-hidden border border-stone-200">
                  {[
                    { v: "", l: "Todas" },
                    { v: "sale", l: "Comprar" },
                    { v: "rent", l: "Alquilar" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setOpFilter(o.v)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-colors",
                        opFilter === o.v ? "bg-terracotta text-white" : "bg-white text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="text-xs text-stone-500 font-medium mb-1 block">Ciudad</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 outline-none focus:border-terracotta"
                >
                  <option value="">Todas las ciudades</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs text-stone-500 font-medium mb-1 block">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 outline-none focus:border-terracotta"
                >
                  <option value="">Todos los tipos</option>
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Max price */}
              <div>
                <label className="text-xs text-stone-500 font-medium mb-1 flex items-center gap-1">
                  <Euro className="w-3 h-3" /> Precio máx.
                </label>
                <select
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value)}
                  className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 outline-none focus:border-terracotta"
                >
                  <option value="">Sin límite</option>
                  <option value="300000">300.000 €</option>
                  <option value="500000">500.000 €</option>
                  <option value="1000000">1.000.000 €</option>
                  <option value="2000000">2.000.000 €</option>
                  <option value="5000">5.000 €/mes</option>
                </select>
              </div>

              {/* Beds */}
              <div>
                <label className="text-xs text-stone-500 font-medium mb-1 flex items-center gap-1">
                  <BedDouble className="w-3 h-3" /> Habitaciones
                </label>
                <div className="flex rounded-lg overflow-hidden border border-stone-200">
                  {["", "1", "2", "3", "4"].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBedsFilter(b)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-colors",
                        bedsFilter === b ? "bg-terracotta text-white" : "bg-white text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {b === "" ? "Todas" : `${b}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-terracotta transition-colors ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* AI interpretation banner */}
        {interpretation && (
          <div className="flex items-start gap-3 bg-terracotta/5 border border-terracotta/20 rounded-xl p-4 mb-6">
            <Sparkles className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-terracotta mb-0.5">Búsqueda con IA</p>
              <p className="text-sm text-stone-600">{interpretation}</p>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{properties.length}</span>{" "}
            {properties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
            {query && <span className="text-stone-400"> para "{query}"</span>}
          </p>
          <select className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-600 outline-none">
            <option>Más relevantes</option>
            <option>Precio ascendente</option>
            <option>Precio descendente</option>
            <option>Más recientes</option>
          </select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-stone-200 animate-pulse">
                <div className="h-52 bg-stone-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-stone-200 rounded w-2/3" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🏠</p>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No encontramos resultados</h3>
            <p className="text-stone-500 text-sm mb-6">
              Prueba a modificar tu búsqueda o ampliar los filtros
            </p>
            <button
              onClick={clearFilters}
              className="bg-terracotta text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-terracotta-600 transition-colors"
            >
              Ver todas las propiedades
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-stone-400">Cargando...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
