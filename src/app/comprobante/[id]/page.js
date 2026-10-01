"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ComprobantePublico() {
  const params = useParams();
  const idVenta = params.id;
  
  const [venta, setVenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (idVenta) {
      cargarComprobante();
    }
  }, [idVenta]);

  const cargarComprobante = async () => {
    try {
      // Consultamos la venta y traemos sus detalles (con el nombre del producto)
      const { data, error: errorVenta } = await supabase
        .from('ventas_operativas')
        .select(`
          *,
          detalles_venta_operativa (
            cantidad,
            precio_negociado_unidad,
            productos ( titulo )
          )
        `)
        .eq('id', idVenta)
        .single();

      if (errorVenta) throw errorVenta;
      if (!data) throw new Error("Comprobante no encontrado");

      setVenta(data);
    } catch (err) {
      setError("No pudimos encontrar este comprobante. Verifica que el enlace sea correcto.");
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-[#0f3faf] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Buscando ticket...</p>
      </div>
    );
  }

  if (error || !venta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border-t-4 border-red-500">
          <span className="text-5xl block mb-4">🔍</span>
          <h1 className="text-xl font-black text-gray-900 mb-2">Comprobante no válido</h1>
          <p className="text-sm text-gray-500 font-medium mb-6">{error}</p>
          <a href="/catalogo" className="bg-[#0f3faf] text-white font-black py-3 px-6 rounded-xl block w-full hover:bg-blue-800 transition-colors shadow-md">
            Ir a la tienda
          </a>
        </div>
      </div>
    );
  }

  // Cálculos para reconstruir el subtotal visual
  const subtotalProductos = venta.detalles_venta_operativa.reduce((sum, item) => sum + (item.cantidad * item.precio_negociado_unidad), 0);
  const envioCobrado = parseFloat(venta.envio_cobrado_cliente || 0);
  const descuento = parseFloat(venta.descuento || 0);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans text-gray-900 flex justify-center items-start sm:items-center">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 relative">
        
        {/* Cabecera del Recibo */}
        <div className="bg-gradient-to-br from-[#0f3faf] to-blue-900 p-8 text-center text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 blur-2xl rounded-full -mr-10 -mt-10"></div>
          <h1 className="text-2xl font-black tracking-tight mb-1">TECH UNIVERSE</h1>
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Comprobante Digital</p>
          
          <div className="mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
            <p className="text-[10px] text-blue-200 uppercase font-bold mb-0.5">Total Pagado</p>
            <p className="text-4xl font-black">${parseFloat(venta.ingreso_total_cliente).toFixed(2)}</p>
          </div>
        </div>

        {/* Detalles Generales */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-dashed border-gray-200">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha de Emisión</p>
              <p className="text-sm font-black text-gray-800">{new Date(venta.fecha_venta).toLocaleDateString()} - {new Date(venta.fecha_venta).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nº Ticket</p>
              <p className="text-sm font-black text-gray-800">TKT-{venta.id.toString().padStart(6, '0')}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
            <p className="text-base font-black text-gray-900">{venta.cliente_nombre || "Público General"}</p>
            <div className="flex gap-2 mt-2">
              <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold">{venta.departamento}</span>
              <span className="bg-blue-50 text-[#0f3faf] text-[10px] px-2 py-1 rounded-md font-bold">{venta.tipo_entrega}</span>
            </div>
          </div>

          {/* Lista de Artículos */}
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Detalle de Compra</p>
            <div className="space-y-3">
              {venta.detalles_venta_operativa.map((item, index) => (
                <div key={index} className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 flex-1">
                    <span className="bg-gray-100 text-gray-600 text-xs font-black px-2 py-1 rounded-lg h-fit">{item.cantidad}</span>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{item.productos?.titulo || "Producto"}</p>
                  </div>
                  <p className="text-sm font-black text-gray-900 shrink-0">${(item.cantidad * item.precio_negociado_unidad).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Desgloses */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold text-gray-500">Subtotal Artículos</span>
              <span className="font-black text-gray-800">${subtotalProductos.toFixed(2)}</span>
            </div>
            
            {descuento > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-bold text-orange-500">Descuento Aplicado</span>
                <span className="font-black text-orange-600">-${descuento.toFixed(2)}</span>
              </div>
            )}
            
            {envioCobrado > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-500">Costo de Envío / Agencia</span>
                <span className="font-black text-gray-800">${envioCobrado.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer del Recibo */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-200">
          <p className="text-xs font-bold text-gray-500 mb-4">¡Gracias por confiar en Tech Universe!</p>
          <a href="/catalogo" className="bg-gray-900 text-white font-black py-3 px-6 rounded-xl block w-full hover:bg-black transition-colors shadow-md text-sm">
            🛒 Volver al Catálogo
          </a>
        </div>
      </div>
    </div>
  );
}