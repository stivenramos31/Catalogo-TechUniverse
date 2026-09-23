"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import ProductCard from "../../components/store/ProductCard";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarCatalogo() {
      try {
        const { data, error } = await supabase.from("productos").select("*").eq("activo", true);
        if (!error && data) setProductos(data);
      } catch (error) {
        console.error("Error cargando el catálogo:", error);
      } finally {
        setCargando(false);
      }
    }
    cargarCatalogo();
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm h-fit">
        <h2 className="font-bold text-lg mb-5 text-[#111827] border-b pb-2">Filtros</h2>
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Categorías</h3>
          <ul className="space-y-2.5 text-sm text-gray-600">
            <li><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-[#2563eb]" /> Herramientas</label></li>
            <li><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-[#2563eb]" /> Electrónica</label></li>
            <li><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-[#2563eb]" /> Accesorios</label></li>
          </ul>
        </div>
      </aside>

      <main className="flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
          <h1 className="text-2xl font-black text-[#111827]">Catálogo de Productos</h1>
          <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border shadow-sm">{productos.length} resultados</span>
        </div>
        {cargando ? (
          <div className="flex justify-center items-center h-40"><p className="text-gray-500 font-medium animate-pulse">Cargando catálogo...</p></div>
        ) : productos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productos.map((prod) => <ProductCard key={prod.id} producto={prod} />)}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
            <span className="text-4xl mb-3 block">📦</span>
            <h3 className="text-lg font-bold text-gray-800">No hay productos disponibles</h3>
          </div>
        )}
      </main>
    </div>
  );
}