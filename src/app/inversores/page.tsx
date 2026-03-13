"use client";

import { useState } from "react";
import { TrendingUp, Euro, Home, BarChart3, Calculator, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { estimateRentalYield, estimateAirbnbPotential, estimateMortgage } from "@/lib/ranking";
import type { Property } from "@/lib/properties";
import { MOCK_PROPERTIES, formatPrice } from "@/lib/properties";

// ─── Yield calculator ─────────────────────────────────────────────────────────

function YieldCalculator() {
  const [price, setPrice] = useState("350000");
  const [monthlyRent, setMonthlyRent] = useState("1400");
  const [costs, setCosts] = useState("11");
  const [deposit, setDeposit] = useState("20");

  const p = parseFloat(price) || 0;
  const r = parseFloat(monthlyRent) || 0;
  const c = parseFloat(costs) / 100;
  const d = parseFloat(deposit) / 100;

  const annualRent = r * 11;
  const totalInvestment = p * (1 + c);
  const grossYield = p > 0 ? (annualRent / p) * 100 : 0;
  const netYield = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;
  const mortgage = estimateMortgage(p, d);
  const monthlyCashflow = r - mortgage - (p * 0.01) / 12; // rent - mortgage - 1% maintenance

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <h3 className="font-bold text-stone-900 mb-5 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-terracotta" />
        Calculadora de rentabilidad
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Precio de compra (€)", value: price, setter: setPrice, prefix: "€" },
          { label: "Alquiler mensual (€)", value: monthlyRent, setter: setMonthlyRent, prefix: "€" },
          { label: "Costes de compra (%)", value: costs, setter: setCosts, prefix: "%" },
          { label: "Entrada / depósito (%)", value: deposit, setter: setDeposit, prefix: "%" },
        ].map(({ label, value, setter, prefix }) => (
          <div key={label}>
            <label className="text-xs text-stone-500 font-medium mb-1 block">{label}</label>
            <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden focus-within:border-terracotta">
              <span className="px-2.5 text-stone-400 text-sm bg-stone-50 border-r border-stone-200 py-2">{prefix}</span>
              <input
                type="number"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Rentabilidad bruta", value: `${grossYield.toFixed(2)}%`, good: grossYield >= 5 },
          { label: "Rentabilidad neta", value: `${netYield.toFixed(2)}%`, good: netYield >= 4 },
          { label: "Hipoteca estimada/mes", value: `${mortgage.toLocaleString("es-ES")} €`, good: null },
          {
            label: "Cash flow mensual",
            value: `${monthlyCashflow > 0 ? "+" : ""}${Math.round(monthlyCashflow).toLocaleString("es-ES")} €`,
            good: monthlyCashflow > 0,
          },
        ].map(({ label, value, good }) => (
          <div
            key={label}
            className={`rounded-xl p-4 ${good === true ? "bg-green-50 border border-green-200" : good === false ? "bg-red-50 border border-red-200" : "bg-stone-50 border border-stone-200"}`}
          >
            <p className="text-xs text-stone-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${good === true ? "text-green-700" : good === false ? "text-red-700" : "text-stone-900"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400 mt-3">
        Cálculo orientativo. No incluye IBI, seguros, gestión ni vacantes adicionales.
      </p>
    </div>
  );
}

// ─── Top yield properties ─────────────────────────────────────────────────────

const TOP_YIELD = MOCK_PROPERTIES
  .filter((p) => p.operation === "sale")
  .map((p) => ({
    ...p,
    yield: estimateRentalYield(p),
    airbnb: estimateAirbnbPotential(p),
  }))
  .sort((a, b) => b.yield - a.yield)
  .slice(0, 4);

// ─── Market stats ─────────────────────────────────────────────────────────────

const MARKET_DATA = [
  { city: "Valencia", avgYield: 6.8, avgPriceSqm: 3200, yoyChange: +9.8, trend: "up" },
  { city: "Málaga", avgYield: 6.2, avgPriceSqm: 3100, yoyChange: +11.2, trend: "up" },
  { city: "Sevilla", avgYield: 5.9, avgPriceSqm: 2800, yoyChange: +8.4, trend: "up" },
  { city: "Alicante", avgYield: 6.5, avgPriceSqm: 2400, yoyChange: +12.1, trend: "up" },
  { city: "Barcelona", avgYield: 4.8, avgPriceSqm: 5400, yoyChange: +6.1, trend: "stable" },
  { city: "Madrid", avgYield: 4.5, avgPriceSqm: 5100, yoyChange: +7.8, trend: "stable" },
  { city: "Marbella", avgYield: 4.2, avgPriceSqm: 7200, yoyChange: +5.5, trend: "stable" },
  { city: "Ibiza", avgYield: 3.8, avgPriceSqm: 9500, yoyChange: +4.2, trend: "stable" },
];

export default function InversoresPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-stone-900 to-stone-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <TrendingUp className="w-3.5 h-3.5 text-terracotta" />
            Herramientas para inversores
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Invierte en España con
            <span className="block text-terracotta">datos, no con intuición</span>
          </h1>
          <p className="text-stone-300 text-lg mb-8 max-w-2xl mx-auto">
            Rendimientos de alquiler, potencial Airbnb, tendencias de precio y análisis
            de mercado para todas las ciudades españolas.
          </p>
          <Link
            href="/properties?q=piso+inversion+alta+rentabilidad"
            className="inline-flex items-center gap-2 bg-terracotta text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-600 transition-colors"
          >
            Ver propiedades con mayor rentabilidad <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">

        {/* Market overview */}
        <section>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Rentabilidades por ciudad</h2>
          <p className="text-stone-500 text-sm mb-6">Rentabilidad bruta media de alquiler residencial Q1 2025</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MARKET_DATA.map((m) => (
              <div key={m.city} className="bg-white border border-stone-200 rounded-2xl p-5">
                <p className="font-semibold text-stone-800 mb-1">{m.city}</p>
                <p className="text-3xl font-bold text-terracotta">{m.avgYield}%</p>
                <p className="text-xs text-stone-400 mt-1">rentabilidad bruta</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
                  <span>{m.avgPriceSqm.toLocaleString("es-ES")} €/m²</span>
                  <span className="text-green-600 font-medium">+{m.yoyChange}% YoY</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calculator + top yield */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <YieldCalculator />

          {/* Airbnb potential estimator */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h3 className="font-bold text-stone-900 mb-5 flex items-center gap-2">
              <Home className="w-5 h-5 text-terracotta" />
              Potencial alquiler vacacional (Airbnb)
            </h3>
            <div className="space-y-3 mb-5">
              {TOP_YIELD.map((p) => (
                <div key={p.id} className="flex items-center justify-between border border-stone-100 rounded-xl p-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-stone-800 truncate">{p.title}</p>
                    <p className="text-xs text-stone-500">{p.city} · {formatPrice(p.price, p.operation)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">{p.yield.toFixed(1)}%</p>
                    <p className="text-xs text-stone-400">~{Math.round(p.airbnb / 1000)}k €/año Airbnb</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/properties?q=inversion+alta+rentabilidad"
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-terracotta hover:underline"
            >
              Ver todas las oportunidades de inversión <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Investment checklist */}
        <section className="bg-white border border-stone-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-stone-900 mb-2">Guía de compra para inversores extranjeros</h2>
          <p className="text-stone-500 text-sm mb-6">Los pasos clave para comprar propiedad en España como no residente</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { step: "01", title: "Obtener el NIE", desc: "Número de Identificación de Extranjero — imprescindible para cualquier transacción inmobiliaria. Trámite: consulado o en persona en España. Tiempo: 1–4 semanas.", tag: "Legal" },
              { step: "02", title: "Abrir cuenta bancaria española", desc: "Necesaria para transferir fondos, pagar hipoteca e impuestos. Recomendamos Sabadell, CaixaBank o BBVA para no residentes.", tag: "Financiero" },
              { step: "03", title: "Firma del contrato de arras", desc: "Reserva del inmueble con depósito del 10%. Si el vendedor se echa atrás, recibe el doble; si es el comprador, pierde la señal.", tag: "Legal" },
              { step: "04", title: "Due diligence & nota simple", desc: "Comprueba cargas, hipotecas y situación registral. Tu abogado debe revisar el Registro de la Propiedad y el catastro.", tag: "Due diligence" },
              { step: "05", title: "Hipoteca (si aplica)", desc: "Los no residentes pueden financiar hasta el 70% del valor. Requiere NIE, declaración de renta del país de origen y tasación oficial.", tag: "Financiero" },
              { step: "06", title: "Escritura pública ante notario", desc: "Firma ante notario con presencia de todas las partes. Impuestos: ITP 6–10% (segunda mano) o IVA 10% (obra nueva). Plus-valía municipal.", tag: "Notaría" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-terracotta/10 rounded-xl flex items-center justify-center text-sm font-bold text-terracotta">
                  {item.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-stone-800 text-sm">{item.title}</h3>
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{item.tag}</span>
                  </div>
                  <p className="text-xs text-stone-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cost breakdown */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: "Costes de compra (2ª mano)",
              icon: Euro,
              items: [
                "ITP (Impuesto Transmisiones): 6–10%",
                "Notaría: 0.5–1%",
                "Registro de la Propiedad: 0.2–0.5%",
                "Gestoría/abogado: 1–1.5%",
                "Total estimado: 8–13% sobre precio",
              ],
            },
            {
              title: "Costes de compra (obra nueva)",
              icon: Home,
              items: [
                "IVA: 10% (7% en Canarias)",
                "AJD (Actos Jurídicos): 0.5–1.5%",
                "Notaría: 0.5–1%",
                "Registro: 0.2–0.5%",
                "Total estimado: 11–13% sobre precio",
              ],
            },
            {
              title: "Impuestos anuales",
              icon: BarChart3,
              items: [
                "IBI: 0.4–1.1% del valor catastral",
                "Comunidad: varía según edificio",
                "IRNR (no residente): 24% sobre renta imputada",
                "IRPF (si alquila): 19% sobre ingresos netos",
                "Plusvalía al vender: depende del ayuntamiento",
              ],
            },
          ].map(({ title, icon: Icon, items }) => (
            <div key={title} className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-terracotta" />
                <h3 className="font-semibold text-stone-800 text-sm">{title}</h3>
              </div>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-stone-800 to-stone-900 text-white rounded-3xl p-8 text-center">
          <Zap className="w-8 h-8 mx-auto mb-3 text-terracotta" />
          <h2 className="text-2xl font-bold mb-2">¿Listo para invertir?</h2>
          <p className="text-stone-300 text-sm mb-6 max-w-lg mx-auto">
            Encuentra propiedades con alta rentabilidad o habla con nuestros asesores de inversión especializados en compradores extranjeros.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/properties?q=inversion+rentabilidad" className="bg-terracotta text-white font-semibold px-6 py-3 rounded-xl hover:bg-terracotta-600 transition-colors">
              Buscar propiedades
            </Link>
            <Link href="/vender" className="bg-white/10 border border-white/20 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
              Hablar con un asesor
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
