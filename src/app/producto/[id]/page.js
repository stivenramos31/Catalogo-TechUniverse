"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useCart } from "../../../context/CartContext";

export default function DetalleProducto({ params }) {
  const { id } = params;
  const { agregarAlCarrito } = useCart();
  
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [imagenActiva, setImagenActiva] = useState("");
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    async function cargarDetalle() {
      try {
        const { data, error } = await supabase.from("productos").select("*").eq("id", id).single();
        if (!error && data) {
          setProducto(data);
          setImagenActiva(data.imagenes?.[0] || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&q=80");
        }
      } catch (error) {
        console.error("Error al cargar producto:", error);
      } finally {
        setCargando(false);
      }
    }
    cargarDetalle();
  }, [id]);

  if (cargando) return <div className="min-h-screen flex justify-center items-center"><p className="text-gray-500 animate-pulse">Cargando detalles...</p></div>;
  if (!producto) return <div className="min-h-screen flex flex-col justify-center items-center gap-4"><h2 className="text-2xl font-bold">Producto no encontrado</h2><Link href="/catalogo" className="text-[#2563eb]">Volver al catálogo</Link></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6 flex gap-2">
        <Link href="/" className="hover:text-[#2563eb]">Inicio</Link><span>/</span><Link href="/catalogo" className="hover:text-[#2563eb]">Catálogo</Link><span>/</span><span className="text-gray-800 font-medium truncate">{producto.titulo}</span>
      </nav>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4 md:p-8 flex flex-col md:flex-row gap-8 lg:gap-12">
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="aspect-square bg-[#f8fafc] rounded-xl border border-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
            <img src={imagenActiva} alt={producto.titulo} className="max-w-full max-h-full object-contain" />
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col">
          <h1 className="text-2xl md:text-3xl font-black text-[#111827] leading-tight mb-3">{producto.titulo}</h1>
          <div className="flex items-end gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-4xl font-black text-[#dc2626]">${Number(producto.precio_actual).toFixed(2)}</span>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700">Cantidad:</span>
            <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200">
              <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-10 h-10 flex items-center justify-center text-gray-600 font-bold">-</button>
              <span className="w-12 text-center font-semibold text-gray-900">{cantidad}</span>
              <button onClick={() => setCantidad(cantidad + 1)} className="w-10 h-10 flex items-center justify-center text-gray-600 font-bold">+</button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <button onClick={() => agregarAlCarrito(producto, cantidad)} className="w-full bg-[#2563eb] hover:bg-[#0f3faf] text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95 flex justify-center items-center gap-2 text-lg">🛒 Agregar a la cotización</button>
          </div>
        </div>
      </div>
    </div>
  );
}