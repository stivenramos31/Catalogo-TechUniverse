"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";

export default function FormularioCotizacion() {
  const router = useRouter();
  const { carrito, subtotal } = useCart();
  const [formData, setFormData] = useState({ nombre: "", whatsapp: "", correo: "", zona: "", observaciones: "", metodoRespuesta: "whatsapp" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); localStorage.setItem("tech_universe_cliente", JSON.stringify(formData)); router.push("/revisar"); };

  if (carrito.length === 0) return <div className="text-center py-16"><Link href="/catalogo" className="text-[#2563eb]">Volver al catálogo</Link></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="bg-[#0f3faf] p-6 text-white"><h1 className="text-2xl font-black mb-1">Solicitar cotización</h1></div>
        <div className="p-6 flex flex-col md:flex-row gap-8">
          <form onSubmit={handleSubmit} className="flex-1 space-y-5">
            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Nombre completo" className="w-full border rounded-lg p-3" />
            <input type="tel" name="whatsapp" required value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp" className="w-full border rounded-lg p-3" />
            <textarea name="observaciones" value={formData.observaciones} onChange={handleChange} placeholder="Observaciones" className="w-full border rounded-lg p-3"></textarea>
            <button type="submit" className="w-full bg-[#2563eb] text-white font-bold py-3 rounded-xl">Revisar solicitud</button>
          </form>
          <div className="w-full md:w-64 bg-gray-50 rounded-xl p-5 border h-fit">
            <h3 className="font-bold mb-4 border-b pb-2">Resumen</h3>
            <span className="text-lg font-black text-[#dc2626] block mt-4">${subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}