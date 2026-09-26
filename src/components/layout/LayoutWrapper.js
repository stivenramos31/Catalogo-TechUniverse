"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from './Header';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const esAdmin = pathname?.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!esAdmin && (
        <>
          <Header />
          {/* 📱 Barra de Navegación Rápida exclusiva para Android / Móvil (Debajo del Header) */}
          <div className="lg:hidden bg-[#081d54] text-white border-b border-blue-900 px-3 py-2 flex items-center justify-around text-xs font-black shadow-inner sticky top-16 z-30">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
                pathname === "/" ? "bg-[#0f3faf] text-white shadow-xs" : "text-blue-200 hover:text-white"
              }`}
            >
              <span>🏠</span> Inicio
            </Link>
            <Link
              href="/catalogo"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
                pathname?.startsWith("/catalogo") ? "bg-[#0f3faf] text-white shadow-xs" : "text-blue-200 hover:text-white"
              }`}
            >
              <span>📦</span> Catálogo
            </Link>
            <Link
              href="/ofertas"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 ${
                pathname?.startsWith("/ofertas") ? "bg-amber-500 text-white shadow-xs" : "text-amber-300 hover:text-white"
              }`}
            >
              <span>🔥</span> Ofertas
            </Link>
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}