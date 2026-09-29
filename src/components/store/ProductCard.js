"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function ProductCard({ producto }) {
  const { cart, agregarAlCarrito, eliminarDelCarrito } = useCart();

  if (!producto) return null;

  const precioActual = parseFloat(producto.precio_actual || 0);
  const precioAnterior = parseFloat(producto.precio_anterior || 0);
  const tieneDescuento = precioAnterior > precioActual;
  const porcentajeDescuento = tieneDescuento
    ? Math.round(((precioAnterior - precioActual) / precioAnterior) * 100)
    : 0;

  const enlaceProducto = `/producto/${producto.slug || producto.id}`;

  // Verificar si el producto ya está en el carrito para activar el selector (- 1 +)
  const itemEnCarrito = cart?.find((item) => item.id === producto.id);
  const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
  const stockMax = parseInt(producto.stock_disponible ?? 1);
  const agotado = stockMax <= 0;
  const limiteAlcanzado = cantidadEnCarrito >= stockMax;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all p-3 sm:p-4 flex flex-col justify-between relative group">
      {tieneDescuento && (
        <span className="absolute top-3 left-3 z-10 bg-[#dc2626] text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-md shadow-xs">
          -{porcentajeDescuento}%
        </span>
      )}

      <div>
        <Link
          href={enlaceProducto}
          className="block w-full aspect-square bg-[#f8fafc] rounded-xl overflow-hidden mb-3 p-2 flex items-center justify-center"
        >
          <img
            src={producto.imagenes?.[0] || "/favicon.ico"}
            alt={producto.titulo}
            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Valoración con estrellas */}
        <div className="flex items-center gap-1 text-[11px] mb-1">
          <span className="text-yellow-400 tracking-tighter">★★★★★</span>
          <span className="text-gray-400 font-semibold">
            ({producto.calificacion || "4.8"})
          </span>
        </div>

        <Link href={enlaceProducto}>
          <h3 className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 hover:text-[#0f3faf] transition-colors min-h-[2.2rem]">
            {producto.titulo}
          </h3>
        </Link>
      </div>

      <div className="mt-2 pt-2">
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span className="text-[#dc2626] font-black text-base sm:text-lg">
            ${precioActual.toFixed(2)}
          </span>
          {tieneDescuento && (
            <span className="text-gray-400 line-through text-[11px] font-bold">
              ${precioAnterior.toFixed(2)}
            </span>
          )}
        </div>

        {/* ➕➖ SE ACTIVA (- 1 +) CUANDO EL PRODUCTO YA ESTÁ EN EL CARRITO */}
        {agotado ? (
          <button
            type="button"
            disabled
            className="w-full bg-gray-200 text-gray-500 font-black py-2 sm:py-2.5 rounded-xl text-xs cursor-not-allowed"
          >
            Agotado
          </button>
        ) : cantidadEnCarrito > 0 ? (
          <div className="w-full bg-[#eef4ff] border border-[#0f3faf] rounded-xl py-1 sm:py-1.5 px-2 flex items-center justify-between shadow-2xs">
            <button
              type="button"
              onClick={() => eliminarDelCarrito(producto.id)}
              className="w-7 h-7 sm:w-8 sm:h-7 flex items-center justify-center text-[#0f3faf] hover:bg-blue-100 rounded-lg font-black text-base transition-colors cursor-pointer"
              title="Restar 1"
            >
              −
            </button>
            <span className="font-black text-[#0f3faf] text-xs sm:text-sm select-none">
              {cantidadEnCarrito}
            </span>
            <button
              type="button"
              disabled={limiteAlcanzado}
              onClick={() => agregarAlCarrito(producto)}
              className={`w-7 h-7 sm:w-8 sm:h-7 flex items-center justify-center rounded-lg font-black text-base transition-colors ${
                limiteAlcanzado
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#0f3faf] hover:bg-blue-100 cursor-pointer"
              }`}
              title={limiteAlcanzado ? "Stock máximo alcanzado" : "Sumar 1"}
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => agregarAlCarrito(producto)}
            className="w-full bg-[#2563eb] hover:bg-[#0f3faf] text-white font-black py-2 sm:py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>🛒</span> Agregar
          </button>
        )}
      </div>
    </div>
  );
}