"use client";

import { Property, formatPrice } from "@/lib/properties";
import { cn } from "@/lib/utils";
import { BedDouble, Bath, Maximize2, MapPin, Zap } from "lucide-react";
import Link from "next/link";

interface PropertyCardProps {
  property: Property;
  className?: string;
}

const ENERGY_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-lime-500",
  C: "bg-yellow-400",
  D: "bg-orange-400",
  E: "bg-orange-500",
  F: "bg-red-500",
  G: "bg-red-700",
};

const TYPE_LABELS: Record<string, string> = {
  apartment: "Piso",
  villa: "Villa",
  townhouse: "Adosado",
  penthouse: "Ático",
  studio: "Estudio",
  finca: "Finca",
};

export function PropertyCard({ property, className }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.id}`}>
      <article
        className={cn(
          "group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-terracotta-400 hover:shadow-xl transition-all duration-300 cursor-pointer",
          className
        )}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-stone-100">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Operation badge */}
          <span
            className={cn(
              "absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full",
              property.operation === "sale"
                ? "bg-terracotta text-white"
                : "bg-blue-600 text-white"
            )}
          >
            {property.operation === "sale" ? "EN VENTA" : "EN ALQUILER"}
          </span>
          {/* Type badge */}
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {TYPE_LABELS[property.type]}
          </span>
          {/* Energy rating */}
          {property.energyRating && (
            <span
              className={cn(
                "absolute bottom-3 right-3 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1",
                ENERGY_COLORS[property.energyRating] ?? "bg-stone-400"
              )}
            >
              <Zap className="w-3 h-3" />
              {property.energyRating}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-xl font-bold text-stone-900">
              {formatPrice(property.price, property.operation)}
            </p>
            {property.pricePerSqm && (
              <p className="text-xs text-stone-400">
                {property.pricePerSqm.toLocaleString("es-ES")} €/m²
              </p>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-stone-700 line-clamp-2 mb-2 group-hover:text-terracotta transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <p className="flex items-center gap-1 text-xs text-stone-500 mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {property.neighbourhood}, {property.city}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-stone-600 pt-3 border-t border-stone-100">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5" />
                {property.bedrooms} hab.
              </span>
            )}
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {property.bathrooms} baños
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              {property.size} m²
            </span>
          </div>

          {/* Tags */}
          {property.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {property.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
