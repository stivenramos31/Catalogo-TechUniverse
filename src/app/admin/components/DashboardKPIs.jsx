"use client";
import React from "react";

/**
 * DashboardKPIs - FASE 2 (Tarjetas de Métricas Operativas)
 * Muestra el desglose de costos y nuevas métricas comerciales (Pedidos y Ticket Promedio).
 */
export default function DashboardKPIs({
  costoMercancia = 0,
  gastosLogistica = 0,
  comisiones = 0,
  descuentos = 0,
  valorInventario = 0,
  totalPedidos = 0,
  ventasBrutas = 0
}) {
  // Calculamos el Ticket Promedio (AOV - Average Order Value)
  const ticketPromedio = totalPedidos > 0 ? (ventasBrutas / totalPedidos) : 0;
  const totalEgresosOperativos = gastosLogistica + comisiones;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
      
      {/* 1. Métrica Comercial: Total de Pedidos */}
      <div className="bg-white border border-gray-100 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <div className="w-8 h-8 rounded-full bg-[#0f3faf]/10 flex items-center justify-center mb-2">
          <span className="text-[#0f3faf]">🛍️</span>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total Pedidos</p>
        <p className="text-xl font-black text-gray-900">{totalPedidos}</p>
      </div>

      {/* 2. Métrica Comercial: Ticket Promedio (AOV) */}
      <div className="bg-white border border-gray-100 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
          <span className="text-emerald-500">💵</span>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ticket Promedio</p>
        <p className="text-xl font-black text-emerald-600">${ticketPromedio.toFixed(2)}</p>
      </div>

      {/* 3. Egreso: Costo de Mercancía (Unificado con rojo suave para denotar salida de dinero) */}
      <div className="bg-white border border-red-50 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-2 relative z-10">
          <span className="text-red-500">📉</span>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide relative z-10">Costo Mercancía</p>
        <p className="text-xl font-black text-red-500 relative z-10">-${costoMercancia.toFixed(2)}</p>
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-red-50 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* 4. Egreso: Gastos & Logística */}
      <div className="bg-white border border-red-50 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-2 relative z-10">
          <span className="text-red-500">🚚</span>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide relative z-10">Logística & Com.</p>
        <p className="text-xl font-black text-red-500 relative z-10">-${totalEgresosOperativos.toFixed(2)}</p>
      </div>

      {/* 5. Egreso: Descuentos */}
      <div className="bg-white border border-orange-50 p-4 sm:p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-2 relative z-10">
          <span className="text-orange-500">🏷️</span>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide relative z-10">Descuentos</p>
        <p className="text-xl font-black text-orange-500 relative z-10">-${descuentos.toFixed(2)}</p>
      </div>

      {/* 6. Activo: Valor de Inventario */}
      <div className="bg-gray-900 border border-black p-4 sm:p-5 rounded-3xl shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-2 relative z-10">
          <span className="text-white">📦</span>
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide relative z-10">Valor Inventario</p>
        <p className="text-xl font-black text-white relative z-10">${valorInventario.toFixed(2)}</p>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl pointer-events-none -mt-4 -mr-4"></div>
      </div>

    </div>
  );
}