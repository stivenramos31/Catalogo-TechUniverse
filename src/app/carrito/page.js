"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";

export default function CarritoPage() {
  const { cart, eliminarDelCarrito, agregarAlCarrito, vaciarCarrito, total } = useCart();
  const [procesando, setProcesando] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  // Estado para los datos del cliente
  const [cliente, setCliente] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    zona: "",
    observaciones: ""
  });

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!cart || cart.length === 0) return alert("Tu carrito está vacío.");
    setProcesando(true);

    try {
      // 1. Insertar la Cotización Principal
      const { data: cotizacion, error: errorCotizacion } = await supabase
        .from('cotizaciones')
        .insert([{
          nombre_cliente: cliente.nombre,
          cliente_correo: cliente.correo,
          telefono_whatsapp: cliente.telefono,
          cliente_zona: cliente.zona,
          observaciones: cliente.observaciones,
          total_estimado: total,
          estado: 'Pendiente'
        }])
        .select()
        .single();

      if (errorCotizacion) throw errorCotizacion;

      // 2. Insertar los Detalles (Los productos que compró)
      const detalles = cart.map(item => ({
        cotizacion_id: cotizacion.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_actual
      }));

      const { error: errorDetalles } = await supabase
        .from('detalles_cotizacion')
        .insert(detalles);

      if (errorDetalles) throw errorDetalles;

      // 3. Éxito: Vaciar carrito y mostrar mensaje
      vaciarCarrito();
      setPedidoEnviado(true);
      window.scrollTo(0, 0);
      
    } catch (error) {
      alert("Hubo un error al enviar tu solicitud: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  if (pedidoEnviado) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border-t-8 border-green-500">
          <span className="text-7xl mb-6 block">✅</span>
          <h1 className="text-3xl font-black text-gray-900 mb-4">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Hemos recibido tu solicitud de cotización correctamente. Nuestro equipo revisará el stock y te contactará a través de WhatsApp o correo electrónico lo más pronto posible.
          </p>
          <Link href="/catalogo" className="bg-[#0f3faf] hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-xl transition-colors block w-full">
            Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">Tu Carrito de Compras</h1>

        {(!cart || cart.length === 0) ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <span className="text-6xl block mb-4">🛒</span>
            <h2 className="text-2xl font-black text-gray-800 mb-4">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-8">Parece que aún no has agregado nada. ¡Descubre nuestros productos!</p>
            <Link href="/catalogo" className="bg-[#0f3faf] text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-800 transition-colors inline-block">
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Lista de Productos en el Carrito */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden border flex-shrink-0">
                    <img src={item.imagenes?.[0] || "https://via.placeholder.com/150"} alt={item.titulo} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-gray-900 line-clamp-2">{item.titulo}</h3>
                    <p className="text-[#0f3faf] font-black mt-1">${item.precio_actual} <span className="text-xs text-gray-400 font-medium ml-1">c/u</span></p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <button onClick={() => eliminarDelCarrito(item.id)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 font-black text-xl transition-colors">−</button>
                      <span className="w-10 text-center font-black text-gray-900">{item.cantidad}</span>
                      <button onClick={() => agregarAlCarrito(item)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 font-black text-xl transition-colors">+</button>
                    </div>
                    <p className="font-black text-gray-900 min-w-[70px] text-right">${(item.precio_actual * item.cantidad).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario de Checkout */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 h-fit sticky top-24">
              <h2 className="font-black text-xl text-gray-900 mb-6 border-b pb-4">Resumen del Pedido</h2>
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600 font-bold">Total a pagar:</span>
                <span className="text-3xl font-black text-green-600">${total.toFixed(2)}</span>
              </div>

              <form onSubmit={manejarEnvio} className="space-y-4">
                <p className="text-xs font-black text-[#0f3faf] uppercase tracking-wider mb-2">Tus Datos de Contacto</p>
                
                <input type="text" placeholder="Nombre completo *" required
                  value={cliente.nombre} onChange={e => setCliente({...cliente, nombre: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none transition-colors font-medium text-sm" 
                />
                
                <input type="tel" placeholder="WhatsApp (Ej: +503 7777 7777) *" required
                  value={cliente.telefono} onChange={e => setCliente({...cliente, telefono: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none transition-colors font-medium text-sm" 
                />
                
                <input type="email" placeholder="Correo Electrónico"
                  value={cliente.correo} onChange={e => setCliente({...cliente, correo: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none transition-colors font-medium text-sm" 
                />
                
                <input type="text" placeholder="Ciudad / Zona de envío *" required
                  value={cliente.zona} onChange={e => setCliente({...cliente, zona: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none transition-colors font-medium text-sm" 
                />
                
                <textarea placeholder="Comentarios adicionales (Opcional)" rows="3"
                  value={cliente.observaciones} onChange={e => setCliente({...cliente, observaciones: e.target.value})}
                  className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none transition-colors font-medium text-sm" 
                />

                <button type="submit" disabled={procesando} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl transition-colors text-lg shadow-lg shadow-green-200 mt-4 flex justify-center items-center gap-2">
                  {procesando ? "Procesando..." : "Solicitar Cotización"}
                </button>
                <p className="text-[10px] text-gray-400 text-center leading-tight mt-2">
                  Al solicitar la cotización no se realiza ningún cobro. Nos pondremos en contacto contigo para coordinar el pago y la entrega.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}