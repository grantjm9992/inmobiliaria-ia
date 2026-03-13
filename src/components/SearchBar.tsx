"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLE_QUERIES = [
  "Piso moderno de 3 habitaciones en Barcelona cerca del mar",
  "Villa con piscina privada en Marbella por menos de 3 millones",
  "Cortijo andaluz con terreno para uso como alojamiento rural",
  "Ático luminoso con terraza en Madrid para comprar",
  "Apartamento para alquilar en Valencia con vistas al mar",
  "Finca con olivos en Andalucía ideal para inversión",
];

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  className?: string;
  size?: "lg" | "sm";
}

export function SearchBar({ onSearch, isLoading, className, size = "lg" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(EXAMPLE_QUERIES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % EXAMPLE_QUERIES.length;
      setPlaceholder(EXAMPLE_QUERIES[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div
        className={cn(
          "flex items-center bg-white border-2 border-stone-200 rounded-2xl shadow-lg focus-within:border-terracotta transition-colors",
          size === "lg" ? "p-2" : "p-1.5"
        )}
      >
        <div className="flex items-center pl-3 pr-2 flex-shrink-0">
          <Sparkles
            className={cn(
              "text-terracotta",
              size === "lg" ? "w-5 h-5" : "w-4 h-4"
            )}
          />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent outline-none text-stone-700 placeholder:text-stone-400 min-w-0",
            size === "lg" ? "text-base py-2 px-2" : "text-sm py-1 px-2"
          )}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "flex-shrink-0 bg-terracotta hover:bg-terracotta-600 text-white font-medium rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60",
            size === "lg" ? "px-5 py-3 text-sm" : "px-3 py-2 text-xs"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {size === "lg" && <span>Buscar</span>}
        </button>
      </div>
    </form>
  );
}
