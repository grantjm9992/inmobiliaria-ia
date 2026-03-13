import { CheckCircle2, TrendingUp, Users, Zap, Star, ArrowRight, BarChart3, Globe2 } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Básico",
    price: "Gratis",
    description: "Perfecto para empezar",
    features: [
      "Hasta 5 propiedades activas",
      "Perfil de agente verificado",
      "Aparición en búsquedas IA",
      "Formulario de contacto",
      "Estadísticas básicas",
    ],
    cta: "Empezar gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€149/mes",
    description: "Para agentes activos",
    features: [
      "Propiedades ilimitadas",
      "Posicionamiento destacado",
      "Badge «Agente Verificado»",
      "Estadísticas avanzadas",
      "Leads prioritarios",
      "Integración CRM (Inmovilla, Witei)",
      "Soporte dedicado",
    ],
    cta: "Prueba 30 días gratis",
    highlighted: true,
  },
  {
    name: "Agencia",
    price: "€399/mes",
    description: "Para equipos y agencias",
    features: [
      "Todo lo de Pro",
      "Hasta 10 agentes en la cuenta",
      "Marca blanca opcional",
      "API de integración",
      "Campañas de email a compradores",
      "Gestión de nuevas promociones",
      "Account manager dedicado",
    ],
    cta: "Hablar con ventas",
    highlighted: false,
  },
];

const STATS = [
  { value: "48.000+", label: "Propiedades activas" },
  { value: "127", label: "Ciudades cubiertas" },
  { value: "92%", label: "Leads cualificados" },
  { value: "3x", label: "Más contactos que portales tradicionales" },
];

export default function AgentesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-stone-900 to-stone-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <TrendingUp className="w-3.5 h-3.5 text-terracotta" />
            Para agentes inmobiliarios
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            Más compradores cualificados.
            <span className="block text-terracotta">Menos trabajo inútil.</span>
          </h1>
          <p className="text-stone-300 text-lg max-w-2xl mx-auto mb-10">
            Casalista conecta tus propiedades directamente con compradores que saben exactamente lo que buscan,
            gracias a nuestra búsqueda por inteligencia artificial. Sin pagar por cada lead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#precios"
              className="bg-terracotta text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-terracotta-600 transition-colors"
            >
              Ver planes y precios
            </Link>
            <Link
              href="#como-funciona"
              className="bg-white/10 border border-white/20 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors"
            >
              Cómo funciona
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-stone-200 text-center">
          {STATS.map((s) => (
            <div key={s.label} className="px-4">
              <p className="text-2xl font-bold text-stone-900">{s.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Cómo funciona para agentes</h2>
          <p className="text-stone-500">Publicar y conseguir contactos nunca fue tan sencillo</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              step: "01",
              title: "Crea tu perfil",
              desc: "Regístrate, verifica tu licencia y configura tu perfil profesional en 5 minutos.",
            },
            {
              icon: Globe2,
              step: "02",
              title: "Publica tus propiedades",
              desc: "Sube propiedades manualmente o importa desde tu CRM (Inmovilla, Witei, etc.).",
            },
            {
              icon: Zap,
              step: "03",
              title: "La IA trabaja por ti",
              desc: "Nuestro motor de IA hace aparecer tus propiedades en búsquedas relevantes 24/7.",
            },
            {
              icon: BarChart3,
              step: "04",
              title: "Recibe contactos",
              desc: "Los compradores te contactan directamente. Mide todo con estadísticas detalladas.",
            },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="relative">
              <div className="text-xs font-bold text-stone-300 mb-3">{step}</div>
              <div className="w-10 h-10 bg-terracotta/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-terracotta" />
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">{title}</h3>
              <p className="text-sm text-stone-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Casalista */}
      <section className="bg-stone-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-stone-900 mb-10 text-center">
            Por qué Casalista es diferente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: "Compradores que ya saben lo que quieren",
                desc: "La búsqueda por IA filtra a los compradores indecisos. Los que llegan a tu propiedad han buscado exactamente lo que tú ofreces.",
              },
              {
                title: "Sin pago por lead, jamás",
                desc: "A diferencia de Rightmove o Fotocasa, no te cobramos por cada contacto. Pagas una cuota fija mensual y el resto es tuyo.",
              },
              {
                title: "Precio por m² siempre visible",
                desc: "Fomentamos la transparencia. Los compradores comparan propiedades con datos reales, lo que reduce el tiempo de negociación.",
              },
              {
                title: "Expats y compradores internacionales",
                desc: "España atrae miles de compradores de UK, Alemania, EEUU y Países Bajos. Nuestra IA entiende búsquedas en inglés y alemán.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-stone-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-1">{item.title}</h3>
                    <p className="text-sm text-stone-500">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Planes y precios</h2>
          <p className="text-stone-500">Sin permanencia. Cancela cuando quieras.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border ${
                plan.highlighted
                  ? "border-terracotta bg-terracotta/5 relative"
                  : "border-stone-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta text-white text-xs font-bold px-4 py-1 rounded-full">
                  MÁS POPULAR
                </div>
              )}
              <h3 className="font-bold text-stone-900 mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold text-stone-900 mb-1">{plan.price}</p>
              <p className="text-xs text-stone-400 mb-5">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-terracotta text-white hover:bg-terracotta-600"
                    : "bg-stone-900 text-white hover:bg-stone-700"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-stone-400 mt-6">
          Todos los precios incluyen IVA. Prueba gratuita de 30 días en el plan Pro, sin necesidad de tarjeta.
        </p>
      </section>

      {/* Testimonials */}
      <section className="bg-white border-t border-stone-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-stone-900 text-center mb-8">Lo que dicen nuestros agentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                text: "En Fotocasa pagaba 300€ al mes y recibía leads que no se convertían. En Casalista pago menos y los contactos son gente seria que ya ha visto la propiedad en detalle.",
                author: "Carlos R., agente en Madrid",
                rating: 5,
              },
              {
                text: "El 40% de mis clientes son extranjeros buscando en inglés. Casalista es el único portal que captura ese mercado con eficacia.",
                author: "Emma V., agente en Marbella",
                rating: 5,
              },
            ].map((r, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(r.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-stone-600 italic mb-3">"{r.text}"</p>
                <p className="text-xs font-medium text-stone-500">— {r.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-900 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Empieza hoy, gratis</h2>
          <p className="text-stone-300 mb-8 text-sm">
            Crea tu cuenta en 2 minutos, sube tus primeras propiedades y empieza a recibir consultas.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 bg-terracotta text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-terracotta-600 transition-colors"
          >
            Crear cuenta gratis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
