import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/properties";
import { getRepository } from "@/lib/repository";
import {
  BedDouble, Bath, Maximize2, MapPin, Zap, Calendar,
  ChevronLeft, Phone, Mail, CheckCircle2, TrendingUp, Euro, Flame
} from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ENERGY_COLORS: Record<string, string> = {
  A: "bg-green-500", B: "bg-lime-500", C: "bg-yellow-400",
  D: "bg-orange-400", E: "bg-orange-500", F: "bg-red-500", G: "bg-red-700",
};

const TYPE_LABELS: Record<string, string> = {
  apartment: "Piso", villa: "Villa", townhouse: "Adosado",
  penthouse: "Ático", studio: "Estudio", finca: "Finca",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const repo = getRepository();
  const property = await repo.getById(id);

  if (!property) notFound();

  const similar = repo.getSimilar
    ? await repo.getSimilar(id, 3)
    : await repo.getMany({ city: property.city, operation: property.operation }, 3).then(
        (r) => r.filter((p) => p.id !== id).slice(0, 3)
      );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Back nav */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a resultados
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
              <div className="col-span-2 aspect-[16/9]">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {property.images.slice(1, 3).map((img, i) => (
                <div key={i} className="aspect-video">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        property.operation === "sale" ? "bg-terracotta text-white" : "bg-blue-600 text-white"
                      )}
                    >
                      {property.operation === "sale" ? "EN VENTA" : "EN ALQUILER"}
                    </span>
                    <span className="text-xs bg-stone-100 text-stone-600 font-medium px-2.5 py-1 rounded-full">
                      {TYPE_LABELS[property.type]}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-stone-900 mb-2">{property.title}</h1>
                  <p className="flex items-center gap-1.5 text-stone-500">
                    <MapPin className="w-4 h-4" />
                    {property.neighbourhood}, {property.city}, {property.region}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-stone-900">
                    {formatPrice(property.price, property.operation)}
                  </p>
                  {property.pricePerSqm && (
                    <p className="text-sm text-stone-400 mt-1">
                      {property.pricePerSqm.toLocaleString("es-ES")} €/m²
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: BedDouble, label: "Habitaciones", value: property.bedrooms > 0 ? `${property.bedrooms}` : "Estudio" },
                { icon: Bath, label: "Baños", value: `${property.bathrooms}` },
                { icon: Maximize2, label: "Superficie", value: `${property.size} m²` },
                { icon: Calendar, label: "Año", value: property.yearBuilt ? `${property.yearBuilt}` : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white border border-stone-200 rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-terracotta mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-stone-900">{value}</p>
                  <p className="text-xs text-stone-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="font-semibold text-stone-800 mb-3">Descripción</h2>
              <p className="text-stone-600 text-sm leading-relaxed">{property.description}</p>
            </div>

            {/* Features */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="font-semibold text-stone-800 mb-4">Características</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {property.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-stone-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial details */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-terracotta" />
                Detalles financieros
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-stone-400 mb-1">Precio total</p>
                  <p className="font-semibold text-stone-800">{formatPrice(property.price, property.operation)}</p>
                </div>
                {property.pricePerSqm && (
                  <div>
                    <p className="text-xs text-stone-400 mb-1">Precio por m²</p>
                    <p className="font-semibold text-stone-800">{property.pricePerSqm.toLocaleString("es-ES")} €</p>
                  </div>
                )}
                {property.communityFees && (
                  <div>
                    <p className="text-xs text-stone-400 mb-1">Comunidad/mes</p>
                    <p className="font-semibold text-stone-800">{property.communityFees} €</p>
                  </div>
                )}
                {property.ibiTax && (
                  <div>
                    <p className="text-xs text-stone-400 mb-1">IBI anual</p>
                    <p className="font-semibold text-stone-800">{property.ibiTax.toLocaleString("es-ES")} €</p>
                  </div>
                )}
                {property.floor !== undefined && (
                  <div>
                    <p className="text-xs text-stone-400 mb-1">Planta</p>
                    <p className="font-semibold text-stone-800">
                      {property.floor === 0 ? "Bajo" : `${property.floor}ª`}
                      {property.totalFloors && ` / ${property.totalFloors}`}
                    </p>
                  </div>
                )}
                {property.energyRating && (
                  <div>
                    <p className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Eficiencia energética</p>
                    <span className={cn("text-white text-sm font-bold px-2.5 py-0.5 rounded inline-block", ENERGY_COLORS[property.energyRating])}>
                      {property.energyRating}
                    </span>
                  </div>
                )}
              </div>

              {/* Mortgage estimate */}
              {property.operation === "sale" && (
                <div className="mt-5 pt-5 border-t border-stone-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Euro className="w-4 h-4 text-terracotta" />
                    <p className="text-sm font-medium text-stone-700">Cuota hipotecaria estimada</p>
                  </div>
                  <p className="text-2xl font-bold text-stone-900">
                    {Math.round((property.price * 0.8 * 0.004)).toLocaleString("es-ES")} €/mes
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    80% financiación, 30 años, tipo fijo ~3.5%. Cálculo orientativo.
                  </p>
                  <button className="mt-3 text-xs font-medium text-terracotta hover:underline flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    Calcular hipoteca exacta con nuestro partner bancario
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: agent card + contact */}
          <div className="space-y-5">
            {/* Agent card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100">
                <div className="w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center text-lg font-bold text-terracotta">
                  {property.agentName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{property.agentName}</p>
                  <p className="text-xs text-stone-500">{property.agentAgency}</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <button className="w-full flex items-center justify-center gap-2 bg-terracotta text-white font-medium px-4 py-3 rounded-xl hover:bg-terracotta-600 transition-colors text-sm">
                  <Phone className="w-4 h-4" />
                  Llamar al agente
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-700 font-medium px-4 py-3 rounded-xl hover:bg-stone-200 transition-colors text-sm">
                  <Mail className="w-4 h-4" />
                  Enviar mensaje
                </button>
              </div>

              {/* Quick form */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-stone-500">O déjanos tus datos</p>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-terracotta bg-stone-50"
                />
                <input
                  type="email"
                  placeholder="Tu email"
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-terracotta bg-stone-50"
                />
                <input
                  type="tel"
                  placeholder="Tu teléfono"
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-terracotta bg-stone-50"
                />
                <textarea
                  placeholder="Estoy interesado en esta propiedad..."
                  rows={3}
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 outline-none focus:border-terracotta bg-stone-50 resize-none"
                />
                <button className="w-full bg-stone-900 text-white font-medium px-4 py-2.5 rounded-xl hover:bg-stone-800 transition-colors text-sm">
                  Solicitar información
                </button>
                <p className="text-xs text-stone-400 text-center">
                  Tus datos solo se compartirán con el agente
                </p>
              </div>
            </div>

            {/* Services upsell */}
            <div className="bg-gradient-to-br from-stone-800 to-stone-900 text-white rounded-2xl p-5">
              <p className="font-semibold mb-1 text-sm">¿Necesitas ayuda con la compra?</p>
              <p className="text-xs text-stone-300 mb-4">
                Te conectamos con abogados, gestores de NIE, tasadores y bancos con las mejores hipotecas.
              </p>
              <div className="space-y-2 text-xs">
                {["Tramitación de NIE/TIE", "Abogado inmobiliario", "Hipoteca con mejor tipo", "Tasación oficial"].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full bg-white text-stone-900 font-medium px-4 py-2 rounded-lg text-xs hover:bg-stone-100 transition-colors">
                Ver servicios de apoyo
              </button>
            </div>
          </div>
        </div>

        {/* Similar properties */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-stone-900 mb-6">Propiedades similares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
