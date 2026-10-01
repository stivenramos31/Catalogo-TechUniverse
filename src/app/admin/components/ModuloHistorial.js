"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloHistorial({ ventas, onVerTicket, recargarDatos }) {
  const [procesando, setProcesando] = useState(false);

  // Función para revertir la venta y devolver el stock
  const anularVenta = async (venta) => {
    if (!window.confirm(`⚠️ ADVERTENCIA\n\n¿Estás seguro que deseas ANULAR la venta a ${venta.cliente_nombre || "Público General"} por $${venta.ingreso_total_cliente}?\n\nLos productos vendidos regresarán automáticamente a tu inventario físico y las estadísticas se ajustarán.`)) return;

    setProcesando(true);
    try {
      // 1. Recorrer cada producto que se vendió en ese ticket para devolverlo al lote original
      for (let detalle of venta.detalles_venta_operativa) {
        // Obtenemos el lote original
        const { data: loteOriginal } = await supabase.from('lotes_inventario').select('cantidad_disponible').eq('id', detalle.lote_id).single();
        
        if (loteOriginal) {
          // Le sumamos la cantidad que el cliente había comprado
          await supabase.from('lotes_inventario').update({ 
            cantidad_disponible: loteOriginal.cantidad_disponible + detalle.cantidad 
          }).eq('id', detalle.lote_id);
        }
      }

      // 2. Eliminar la venta de la base de datos (Esto eliminará los detalles automáticamente gracias a "CASCADE" en SQL)
      const { error } = await supabase.from('ventas_operativas').delete().eq('id', venta.id);
      
      if (error) throw error;

      alert("✅ Venta anulada exitosamente. El inventario ha sido restaurado.");
      recargarDatos(); // Refrescamos el panel para que los números cuadren
      
    } catch (error) {
      alert("Error al anular la venta: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in w-full">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
        <p className="text-xs font-bold text-blue-800 text-center uppercase tracking-wider">
          🔒 Por seguridad y auditoría, las ventas solo pueden anularse dentro de las primeras 24 horas.
        </p>
      </div>

      {ventas.map(v => {
        // Verificar si han pasado menos de 24 horas (86400000 milisegundos)
        const fechaVenta = new Date(v.fecha_venta);
        const ahora = new Date();
        const esReciente = (ahora - fechaVenta) < 86400000; 

        return (
          <div key={v.id} className="border border-gray-200 p-5 rounded-3xl shadow-sm bg-white flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
            
            <div className="w-full md:w-auto flex-1">
              <p className="font-black text-gray-900 text-lg">👤 {v.cliente_nombre || "Público General"}</p>
              <p className="text-xs text-gray-500 font-bold mb-2">{fechaVenta.toLocaleString()}</p>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${v.tipo_entrega === 'Express' ? 'bg-[#0f3faf]' : 'bg-gray-800'}`}>{v.tipo_entrega}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${v.ganancia_neta_limpia >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>Ganancia: ${parseFloat(v.ganancia_neta_limpia).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
              <div className="text-center bg-gray-50 px-4 py-2 rounded-xl border flex-1 md:flex-none">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Cobrado</p>
                <p className="font-black text-gray-800 text-lg">${parseFloat(v.ingreso_total_cliente).toFixed(2)}</p>
              </div>
              
              <button onClick={() => onVerTicket(v)} className="bg-gray-900 hover:bg-black text-white font-black px-4 py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none">
                🧾 Ticket
              </button>

              {/* LÓGICA DE AUDITORÍA (24 HORAS) */}
              {esReciente ? (
                <button 
                  onClick={() => anularVenta(v)} 
                  disabled={procesando}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none"
                  title="Anular venta y restaurar stock"
                >
                  {procesando ? "..." : "🗑️ Anular"}
                </button>
              ) : (
                <div className="bg-gray-50 border border-gray-100 text-gray-400 px-4 py-3 rounded-xl flex items-center justify-center gap-2 flex-1 md:flex-none cursor-not-allowed" title="Han pasado más de 24 horas. Venta bloqueada.">
                  🔒 Auditada
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {ventas.length === 0 && (
        <div className="p-10 text-center font-bold text-gray-400 border-2 border-dashed rounded-3xl bg-white">
          No hay ventas registradas.
        </div>
      )}
    </div>
  );
}