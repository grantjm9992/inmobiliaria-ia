import { CheckCircle2, TrendingUp, Zap, Euro, ArrowRight, Clock, Shield } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Valoración gratuita con IA",
    desc: "Introduce los datos de tu propiedad y nuestra IA te dará una valoración de mercado instantánea basada en comparables reales.",
  },
  {
    n: "02",
    title: "Elige cómo quieres vender",
    desc: "Con agente de nuestra red, por tu cuenta (FSBO), o a través de nuestro servicio de compra directa. Tú decides.",
  },
  {
    n: "03",
    title: "Publicación y marketing",
    desc: "Tu propiedad aparece en Casalista y en los principales portales. Fotografía profesional incluida en el plan premium.",
  },
  {
    n: "04",
    title: "Cierre y documentación",
    desc: "Te acompañamos con abogados, notaría, cancelación de hipoteca y entrega de llaves. Sin sorpresas.",
  },
];

export default function VenderPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-stone-800 to-stone-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <TrendingUp className="w-3.5 h-3.5 text-terracotta" />
            Vende tu propiedad
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Vende más rápido,
            <span className="block text-terracotta">sin comisiones abusivas</span>
          </h1>
          <p className="text-stone-300 text-lg mb-10">
            Descubre el valor real de tu propiedad y conéctate con compradores cualificados directamente.
          </p>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-sm font-medium mb-4">Valoración instantánea gratuita</p>
            <input
              type="text"
              placeholder="Dirección de tu propiedad"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-400 outline-none focus:border-terracotta mb-3"
            />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="number"
                placeholder="Superficie (m²)"
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder:text-stone-400 outline-none focus:border-terracotta"
              />
              <select className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-stone-300 outline-none">
                <option value="">Tipo</option>
                <option value="apartment">Piso</option>
                <option value="villa">Villa</option>
                <option value="townhouse">Adosado</option>
                <option value="penthouse">Ático</option>
                <option value="finca">Finca</option>
              </select>
            </div>
            <button className="w-full bg-terracotta text-white font-semibold py-3 rounded-xl hover:bg-terracotta-600 transition-colors flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Ver valoración gratuita
            </button>
          </div>
        </div>
      </section>

      {/* Why sell with us */}
      <section className="bg-white border-b border-stone-200 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: Euro, stat: "1–2%", label: "Comisión media con nuestros agentes vs. 3–5% del mercado" },
            { icon: Clock, stat: "62 días", label: "Tiempo medio de venta en nuestra plataforma" },
            { icon: Shield, stat: "100%", label: "De los trámites legales cubiertos por nuestra red jurídica" },
          ].map(({ icon: Icon, stat, label }) => (
            <div key={stat}>
              <Icon className="w-8 h-8 text-terracotta mx-auto mb-3" />
              <p className="text-3xl font-bold text-stone-900 mb-2">{stat}</p>
              <p className="text-sm text-stone-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-stone-900 text-center mb-12">El proceso paso a paso</h2>
        <div className="space-y-8">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-terracotta/10 rounded-2xl flex items-center justify-center font-bold text-terracotta text-sm">
                  {step.n}
                </div>
              </div>
              <div className="pt-2">
                <h3 className="font-semibold text-stone-800 mb-1">{step.title}</h3>
                <p className="text-sm text-stone-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-stone-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-10">
            Servicios adicionales para vendedores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Fotografía profesional",
                price: "Desde 150 €",
                desc: "Fotógrafo inmobiliario certificado. Tour virtual 360° incluido en el pack premium.",
              },
              {
                title: "Home staging virtual",
                price: "Desde 99 €",
                desc: "Renders con IA de los espacios amueblados para mostrar el potencial de la propiedad.",
              },
              {
                title: "Certificado energético",
                price: "Desde 120 €",
                desc: "Técnico oficial. Obligatorio para vender o alquilar en España.",
              },
              {
                title: "Tasación oficial",
                price: "Desde 300 €",
                desc: "Informe de tasación homologado por el Banco de España para financiación hipotecaria.",
              },
              {
                title: "Asesoría fiscal",
                price: "Consulta gratuita",
                desc: "Cálculo de IRPF, plusvalía municipal y costes de transmisión. Optimización fiscal incluida.",
              },
              {
                title: "Abogado inmobiliario",
                price: "Desde 500 €",
                desc: "Revisión de contratos, debido proceso y acompañamiento a notaría.",
              },
            ].map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-5 border border-stone-200">
                <h3 className="font-semibold text-stone-800 mb-1">{s.title}</h3>
                <p className="text-sm font-bold text-terracotta mb-2">{s.price}</p>
                <p className="text-sm text-stone-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-3">¿Listo para vender?</h2>
        <p className="text-stone-500 mb-8">
          Obtén una valoración gratuita en menos de 2 minutos y decide con información real.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#"
            className="inline-flex items-center justify-center gap-2 bg-terracotta text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-terracotta-600 transition-colors"
          >
            Valoración gratuita <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/agentes"
            className="inline-flex items-center justify-center gap-2 bg-stone-100 text-stone-700 font-medium px-8 py-3.5 rounded-xl hover:bg-stone-200 transition-colors"
          >
            Soy agente inmobiliario
          </Link>
        </div>
      </section>
    </div>
  );
}
