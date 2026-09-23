"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/store/ProductCard";

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .limit(4);

        if (!error && data) setProductos(data);
      } catch (err) {
        console.error("Error al cargar productos", err);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  return (
    <div className="bg-[#f5f7fa] min-h-screen pb-12">
      <div className="max-w-[1440px] mx-auto px-4 mt-6">
        <section className="bg-[#0f3faf] rounded-2xl overflow-hidden shadow-lg mb-8 flex flex-col md:flex-row relative">
          <div className="p-8 md:p-12 z-10 w-full md:w-1/2 flex flex-col justify-center">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md">
              TECNOLOGÍA Y <span className="text-yellow-400">HERRAMIENTAS</span><br/>
              <span className="text-xl md:text-3xl font-medium tracking-wide">para tus proyectos</span>
            </h1>
            <p className="text-blue-100 text-sm md:text-base mb-6">Calidad, variedad y los mejores precios.</p>
            <Link href="/catalogo" className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold px-6 py-3 rounded-full w-max shadow-md transition-transform hover:scale-105">
              Ver catálogo
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-30 md:opacity-100 bg-gradient-to-l from-transparent to-[#0f3faf] md:from-transparent">
             <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" alt="Banner" className="w-full h-full object-cover mix-blend-overlay" />
          </div>
        </section>

        <section className="mb-10">
          <div className="bg-[#dc2626] rounded-t-xl px-4 py-3 flex items-center justify-between text-white">
             <div className="flex items-center gap-2">
                <span className="text-xl font-bold">⚡ OFERTAS FLASH</span>
             </div>
          </div>
          <div className="bg-white border border-[#e2e8f0] border-t-0 rounded-b-xl p-4 shadow-sm min-h-[200px]">
            {cargando ? (
              <p className="text-center text-gray-500 py-10">Cargando catálogo...</p>
            ) : productos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {productos.map((prod) => (
                  <ProductCard key={prod.id} producto={prod} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-10">Aún no hay productos en la base de datos.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}