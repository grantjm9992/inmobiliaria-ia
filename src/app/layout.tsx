import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Casalista — La búsqueda de propiedades inteligente para España",
  description:
    "Encuentra tu próximo hogar en España con búsqueda por inteligencia artificial. Compra, alquila o vende propiedades en Barcelona, Madrid, Marbella, Valencia y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-stone-50">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
