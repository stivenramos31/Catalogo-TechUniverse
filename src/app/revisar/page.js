"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";

export default function RevisarCotizacion() {
  const router = useRouter();
  const { carrito, subtotal, vaciarCarrito } = useCart();
  const [cliente, setCliente] = useState(null);
  const [codigoCotizacion, setCodigoCotizacion] = useState("");

  useEffect(() => {
    const datosGuardados = localStorage.getItem("tech_universe_cliente");
    if (datosGuardados) {
      setCliente(JSON.parse(datosGuardados));
      setCodigoCotizacion(`COT-${Math.floor(1000 + Math.random() * 9000)}`);
    } else {
      router.push("/cotizacion");
    }
  }, [router]);

  if (!cliente || carrito.length === 0) return <div className="text-center py-20">Preparando...</div>;

  const procesarSolicitud = async () => {
    try {
      const idCotizacion = codigoCotizacion;
      
      // 1. Guardar en Supabase (Opcional, pero recomendado para tener historial)
      await supabase.from("cotizaciones").insert([{ 
        nombre_cliente: cliente.nombre, 
        telefono_whatsapp: cliente.whatsapp, 
        total_estimado: subtotal, 
        estado: "NUEVA" 
      }]);

      // 2. Construir el mensaje de texto para WhatsApp
      let mensaje = `👋 Hola Tech Universe, soy ${cliente.nombre}.\nQuiero solicitar la cotización: *${idCotizacion}*\n\n*🛒 Detalle de mi pedido:*\n`;
      
      carrito.forEach(item => {
        mensaje += `- ${item.cantidad}x ${item.titulo} ($${(item.precio_actual * item.cantidad).toFixed(2)})\n`;
      });
      
      if (cliente.observaciones) {
        mensaje += `\n*📝 Observaciones:* ${cliente.observaciones}\n`;
      }
      
      mensaje += `\n*💰 Total Estimado:* $${subtotal.toFixed(2)}`;

      // 3. Reemplaza este número por el WhatsApp real de la tienda (Incluye el código de país sin el +)
      const numeroTienda = "50378400822"; 
      
      const urlWa = `https://wa.me/${numeroTienda}?text=${encodeURIComponent(mensaje)}`;

      // 4. Abrir WhatsApp en una nueva pestaña y limpiar carrito
      window.open(urlWa, '_blank');
      vaciarCarrito();
      localStorage.removeItem("tech_universe_cliente");
      
      // 5. Redirigir a confirmación
      router.push(`/confirmacion?codigo=${idCotizacion}`);
    } catch (error) {
      console.error("Error al procesar solicitud:", error);
      alert("Hubo un error al procesar tu solicitud. Intenta de nuevo.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-black mb-6">Revisar solicitud</h1>
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <p className="font-bold text-lg">{cliente.nombre}</p>
        <p className="text-gray-600 mb-4">{cliente.whatsapp}</p>
        
        <div className="text-left bg-gray-50 p-4 rounded-lg mb-4 text-sm max-h-48 overflow-y-auto">
          {carrito.map(item => (
            <div key={item.id} className="flex justify-between border-b pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
              <span>{item.cantidad}x {item.titulo}</span>
              <span className="font-bold">${(item.precio_actual * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <p className="text-2xl font-black text-[#dc2626] mt-4">Total: ${subtotal.toFixed(2)}</p>
      </div>
      <button 
        onClick={procesarSolicitud} 
        className="w-full bg-[#16a34a] hover:bg-green-700 transition-colors text-white text-lg font-bold py-4 rounded-xl shadow-lg"
      >
        📱 Enviar solicitud por WhatsApp
      </button>
    </div>
  );
}