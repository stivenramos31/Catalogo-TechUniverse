"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { useEffect, useState } from "react";

export default function Header() {
  // ⚡ Extraemos cantidadTotal en lugar de cart
  const { cantidadTotal } = useCart(); 
  const [animar, setAnimar] = useState(false);

  // ⚡ Efecto que activa la animación por 300ms cada vez que la cantidad cambia
  useEffect(() => {
    if (cantidadTotal > 0) {
      setAnimar(true);
      const timer = setTimeout(() => setAnimar(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cantidadTotal]);

  return (
    <header className="bg-[#0f3faf] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
        
        {/* Logo y Enlaces */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-black text-xl md:text-2xl tracking-wider flex items-center gap-2">
            <span>💻 🛠️</span> TECH UNIVERSE
          </Link>
          <nav className="hidden md:flex gap-4 text-sm font-bold">
            <Link href="/" className="hover:text-blue-300 transition-colors">Inicio</Link>
            <Link href="/catalogo" className="hover:text-blue-300 transition-colors">Catálogo</Link>
            <Link href="/ofertas" className="hover:text-yellow-400 transition-colors flex items-center gap-1">🔥 Ofertas Flash</Link>
          </nav>
        </div>

        {/* Barra de Búsqueda (Con el supresor de hidratación de Proton Pass) */}
        <div suppressHydrationWarning className="hidden md:flex flex-1 max-w-2xl bg-white rounded-full overflow-hidden px-4 py-2 items-center shadow-inner mx-6">
          <input 
            type="text" 
            placeholder="Buscar productos, marcas o modelos..." 
            className="w-full text-gray-800 outline-none text-sm font-medium bg-transparent"
          />
          <button className="text-gray-400 hover:text-[#0f3faf]">🔍</button>
        </div>

        {/* Ícono del Carrito */}
        <Link href="/carrito" className="relative p-2 hover:bg-blue-800 rounded-full transition-colors flex items-center">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          
          {/* ⚡ Burbuja dinámica con animación */}
          {cantidadTotal > 0 && (
            <span 
              className={`absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md transition-all duration-300 ease-out ${animar ? 'scale-150 bg-red-500' : 'scale-100'}`}
            >
              {cantidadTotal}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}