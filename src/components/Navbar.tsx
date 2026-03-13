"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-terracotta text-white p-1.5 rounded-lg">
              <Home className="w-4 h-4" />
            </span>
            <span className="text-stone-900">Casa<span className="text-terracotta">lista</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/properties?op=sale" className="text-stone-600 hover:text-terracotta transition-colors font-medium">
              Comprar
            </Link>
            <Link href="/properties?op=rent" className="text-stone-600 hover:text-terracotta transition-colors font-medium">
              Alquilar
            </Link>
            <Link href="/vender" className="text-stone-600 hover:text-terracotta transition-colors font-medium">
              Vender
            </Link>
            <Link href="/agentes" className="text-stone-600 hover:text-terracotta transition-colors font-medium">
              Para Agentes
            </Link>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/agentes"
              className="text-sm font-medium text-terracotta hover:text-terracotta-700 transition-colors"
            >
              Publicar inmueble
            </Link>
            <Link
              href="/properties"
              className="text-sm font-medium bg-terracotta text-white px-4 py-2 rounded-lg hover:bg-terracotta-600 transition-colors"
            >
              Buscar con IA
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-stone-600"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 space-y-3">
          <Link href="/properties?op=sale" className="block text-stone-700 font-medium py-2" onClick={() => setOpen(false)}>Comprar</Link>
          <Link href="/properties?op=rent" className="block text-stone-700 font-medium py-2" onClick={() => setOpen(false)}>Alquilar</Link>
          <Link href="/vender" className="block text-stone-700 font-medium py-2" onClick={() => setOpen(false)}>Vender</Link>
          <Link href="/agentes" className="block text-stone-700 font-medium py-2" onClick={() => setOpen(false)}>Para Agentes</Link>
          <Link
            href="/properties"
            className="block text-center font-medium bg-terracotta text-white px-4 py-2.5 rounded-lg"
            onClick={() => setOpen(false)}
          >
            Buscar con IA
          </Link>
        </div>
      )}
    </nav>
  );
}
