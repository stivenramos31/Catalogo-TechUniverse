"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="bg-[#0f3faf] text-white shadow-md sticky top-0 z-50">
      {/* Barra Principal */}
      <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 transition-transform hover:scale-105">
          <span className="text-2xl">💻🛠️</span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            TECH <span className="text-yellow-400">UNIVERSE</span>
          </h1>
        </Link>

        {/* Barra de Búsqueda (Visual) */}
        <div className="hidden md:flex flex-1 max-w-2xl bg-white rounded-full overflow-hidden px-4 py-2 items-center shadow-inner">
          <input 
            type="text" 
            placeholder="Buscar productos, marcas o modelos..." 
            className="w-full outline-none text-gray-700 text-sm"
          />
          <button className="text-gray-500 hover:text-[#0f3faf]">🔍</button>
        </div>

        {/* Ícono del Carrito Dinámico */}
        <Link href="/carrito" className="relative flex items-center p-2 hover:bg-blue-800 rounded-full transition-colors">
          <span className="text-2xl cursor-pointer">🛒</span>
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-[#dc2626] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0f3faf] animate-bounce-short">
              {totalItems}
            </span>
          )}
        </Link>
      </div>

      {/* Enlaces de Navegación */}
      <nav className="bg-[#0a2b7a] border-t border-blue-800">
        <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex gap-6 text-sm font-bold overflow-x-auto no-scrollbar">
          <Link href="/" className="hover:text-yellow-400 whitespace-nowrap transition-colors">Inicio</Link>
          <Link href="/catalogo" className="hover:text-yellow-400 whitespace-nowrap transition-colors">Catálogo</Link>
          <Link href="/" className="hover:text-yellow-400 whitespace-nowrap flex items-center gap-1 transition-colors">
            🔥 Ofertas Flash
          </Link>
        </div>
      </nav>
    </header>
  );
}