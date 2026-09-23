"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function ProductCard({ producto }) {
  const { agregarAlCarrito } = useCart();

  // Calcular porcentaje de descuento si existe un precio anterior
  const descuento =
    producto.precio_anterior && producto.precio_anterior > producto.precio_actual
      ? Math.round(
          ((producto.precio_anterior - producto.precio_actual) /
            producto.precio_anterior) *
            100
        )
      : null;

  // Imagen por defecto como respaldo y URL amigable
  const imagenPrincipal = producto.imagenes?.[0] || "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=500&q=80";
  const enlaceDetalle = `/producto/${producto.slug || producto.id}`;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      
      {/* 1. Imagen y Badge de Descuento */}
      <Link href={enlaceDetalle} className="relative aspect-square bg-[#f8fafc] p-3 flex items-center justify-center overflow-hidden">
        {descuento && (
          <span className="absolute top-2 left-2 bg-[#dc2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10 shadow-sm">
            -{descuento}%
          </span>
        )}
        <img
          src={imagenPrincipal}
          alt={producto.titulo}
          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </Link>

      {/* 2. Información del Producto */}
      <div className="p-3 md:p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Estrellas de calificación */}
          <div className="flex items-center gap-1 text-yellow-400 text-[10px] md:text-xs mb-1.5">
            <span>★★★★★</span>
            <span className="text-gray-400">({producto.calificacion_promedio || "4.8"})</span>
          </div>
          
          <Link href={enlaceDetalle}>
            <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 leading-snug hover:text-[#2563eb] transition-colors cursor-pointer">
              {producto.titulo}
            </h3>
          </Link>
        </div>

        {/* 3. Precios y CTA */}
        <div className="mt-2">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base md:text-lg font-black text-[#dc2626]">
              ${Number(producto.precio_actual).toFixed(2)}
            </span>
            {producto.precio_anterior && (
              <span className="text-[10px] md:text-xs text-gray-400 line-through">
                ${Number(producto.precio_anterior).toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={() => agregarAlCarrito(producto)}
            className="w-full bg-[#2563eb] hover:bg-[#0f3faf] text-white text-xs md:text-sm font-bold py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <span className="text-base">🛒</span> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}