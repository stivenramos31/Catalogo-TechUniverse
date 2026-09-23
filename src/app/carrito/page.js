"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function CarritoPage() {
  const { carrito, eliminarDelCarrito, actualizarCantidad, totalItems, subtotal } = useCart();

  if (carrito.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Tu carrito está vacío</h2>
        <Link href="/catalogo" className="bg-[#2563eb] text-white font-bold py-3.5 px-8 rounded-xl shadow-md mt-4">Explorar catálogo</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-black text-[#111827] mb-8">Mi carrito ({totalItems} productos)</h1>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full bg-white rounded-2xl border shadow-sm p-4 divide-y">
          {carrito.map((item) => (
            <div key={item.id} className="py-4 flex items-center gap-4">
              <img src={item.imagenes?.[0]} className="w-20 h-20 object-contain bg-gray-50 border rounded" />
              <div className="flex-1">
                <p className="font-bold">{item.titulo}</p>
                <p className="text-[#dc2626] font-bold">${Number(item.precio_actual).toFixed(2)}</p>
                <button onClick={() => eliminarDelCarrito(item.id)} className="text-sm text-red-500">Eliminar</button>
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg">
                <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} className="w-8 h-8 font-bold">-</button>
                <span className="w-8 text-center font-bold text-sm">{item.cantidad}</span>
                <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} className="w-8 h-8 font-bold">+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="w-full lg:w-96 bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Resumen de cotización</h2>
          <div className="flex justify-between items-end border-t pt-4">
            <span className="font-bold">Total estimado</span>
            <span className="text-2xl font-black text-[#dc2626]">${subtotal.toFixed(2)}</span>
          </div>
          <Link href="/cotizacion" className="w-full bg-[#2563eb] text-white font-bold py-3.5 rounded-xl flex justify-center mt-6">Continuar con la cotización</Link>
        </div>
      </div>
    </div>
  );
}