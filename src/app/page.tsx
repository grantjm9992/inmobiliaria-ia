"use client";

import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { MOCK_PROPERTIES } from "@/lib/properties";
import { TrendingUp, Shield, Zap, Users, Star, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

const FEATURED = MOCK_PROPERTIES.slice(0, 4);

const POPULAR_SEARCHES = [
  { label: "Pisos en Barcelona", query: "piso Barcelona" },
  { label: "Villas en Marbella", query: "villa Marbella" },
  { label: "Áticos en Madrid", query: "ático Madrid" },
  { label: "Fincas en Andalucía", query: "finca Andalucía" },
  { label: "Apartamentos en Valencia", query: "apartamento Valencia" },
];

const CITIES = [
  { name: "Barcelona", count: 2840, img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400" },
  { name: "Madrid", count: 4120, img: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400" },
  { name: "Marbella", count: 1650, img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400" },
  { name: "Valencia", count: 1890, img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400" },
];

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/properties?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/properties");
    }
  };

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 to-stone-900/80" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5 text-terracotta" />
            Búsqueda con Inteligencia Artificial
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Encuentra tu hogar en España
            <span className="block text-terracotta">como nunca antes</span>
          </h1>
          <p className="text-lg text-stone-300 mb-10 max-w-2xl mx-auto">
            Describe el hogar que buscas con tus propias palabras. Nuestra IA entiende
            lo que quieres decir — en español o en inglés.
          </p>

          <SearchBar onSearch={handleSearch} size="lg" className="max-w-2xl mx-auto" />

          {/* Popular searches */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {POPULAR_SEARCHES.map((s) => (
              <button
                key={s.query}
                onClick={() => handleSearch(s.query)}
                className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-3 divide-x divide-stone-200 text-center">
          <div className="px-4">
            <p className="text-2xl font-bold text-stone-900">48.000+</p>
            <p className="text-xs text-stone-500 mt-0.5">Propiedades activas</p>
          </div>
          <div className="px-4">
            <p className="text-2xl font-bold text-stone-900">127 ciudades</p>
            <p className="text-xs text-stone-500 mt-0.5">Por toda España</p>
          </div>
          <div className="px-4">
            <p className="text-2xl font-bold text-stone-900">IA 24/7</p>
            <p className="text-xs text-stone-500 mt-0.5">Búsqueda inteligente</p>
          </div>
        </div>
      </section>

      {/* Featured properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">Propiedades destacadas</h2>
            <p className="text-stone-500 text-sm mt-1">Selección editorial de las mejores propiedades</p>
          </div>
          <Link
            href="/properties"
            className="flex items-center gap-1.5 text-sm font-medium text-terracotta hover:text-terracotta-700 transition-colors"
          >
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURED.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* Browse by city */}
      <section className="bg-stone-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Buscar por ciudad</h2>
          <p className="text-stone-500 text-sm mb-8">Los mercados más activos de España</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CITIES.map((city) => (
              <Link
                key={city.name}
                href={`/properties?q=${encodeURIComponent(city.name)}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-200"
              >
                <img
                  src={city.img}
                  alt={city.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <p className="font-bold">{city.name}</p>
                  </div>
                  <p className="text-xs text-stone-300">{city.count.toLocaleString("es-ES")} propiedades</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Cómo funciona Casalista</h2>
          <p className="text-stone-500">Encontrar tu hogar nunca ha sido tan fácil</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-terracotta" />
            </div>
            <h3 className="font-semibold text-stone-800 mb-2">Describe lo que quieres</h3>
            <p className="text-sm text-stone-500">
              Escribe en lenguaje natural: "ático luminoso con terraza en Barcelona, máx 800k". Nuestra IA lo entiende.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-terracotta" />
            </div>
            <h3 className="font-semibold text-stone-800 mb-2">Compara con transparencia</h3>
            <p className="text-sm text-stone-500">
              Precio por m², calificación energética, gastos de comunidad e IBI. Sin sorpresas.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-terracotta/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-terracotta" />
            </div>
            <h3 className="font-semibold text-stone-800 mb-2">Conecta con el agente</h3>
            <p className="text-sm text-stone-500">
              Contacta directamente con el agente, sin intermediarios. Te ayudamos con la hipoteca, el NIE y el notario.
            </p>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-white border-y border-stone-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-stone-600 text-sm font-medium">4.9/5 de más de 3.200 usuarios</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: "Encontré mi piso en Barcelona en 3 días. La búsqueda por IA es increíble — escribí exactamente lo que quería y me salieron resultados perfectos.",
                author: "Sarah M., compradora en Barcelona",
              },
              {
                text: "Me mudé de Londres a Marbella y Casalista fue clave. Entendía mis búsquedas en inglés y me mostraba precios por m² para comparar bien.",
                author: "James T., comprador en Marbella",
              },
              {
                text: "Como agente, la plataforma me trae clientes mucho más cualificados que otros portales. Saben exactamente lo que buscan.",
                author: "Carlos R., agente inmobiliario en Madrid",
              },
            ].map((r, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-5">
                <p className="text-sm text-stone-600 mb-3 italic">"{r.text}"</p>
                <p className="text-xs font-medium text-stone-500">— {r.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For agents CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-gradient-to-br from-terracotta to-terracotta-700 rounded-3xl p-8 md:p-12 text-white text-center">
          <Users className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Eres agente inmobiliario?</h2>
          <p className="text-white/80 max-w-lg mx-auto mb-8 text-sm">
            Publica tus propiedades gratis y llega a miles de compradores cualificados. Sin pago por lead, solo resultados.
          </p>
          <Link
            href="/agentes"
            className="inline-flex items-center gap-2 bg-white text-terracotta font-semibold px-6 py-3 rounded-xl hover:bg-stone-100 transition-colors"
          >
            Empieza gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-3">Casalista</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/properties?op=sale" className="hover:text-white transition-colors">Comprar</Link></li>
                <li><Link href="/properties?op=rent" className="hover:text-white transition-colors">Alquilar</Link></li>
                <li><Link href="/vender" className="hover:text-white transition-colors">Vender</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Para agentes</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/agentes" className="hover:text-white transition-colors">Publicar propiedad</Link></li>
                <li><Link href="/agentes#precios" className="hover:text-white transition-colors">Precios</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Destinos</h4>
              <ul className="space-y-2 text-sm">
                {CITIES.map((c) => (
                  <li key={c.name}>
                    <Link href={`/properties?q=${c.name}`} className="hover:text-white transition-colors">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="cursor-pointer hover:text-white transition-colors">Privacidad</span></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">Términos de uso</span></li>
                <li><span className="cursor-pointer hover:text-white transition-colors">Cookies</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-sm">© 2025 Casalista. Todos los derechos reservados.</p>
            <p className="text-xs">Hecho con IA · Búsqueda inteligente para el mercado español</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
