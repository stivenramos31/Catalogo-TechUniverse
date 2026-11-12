"use client";
import React, { useMemo } from "react";

/**
 * DashboardLogistica - FASE 5
 * Compara los márgenes reales de ganancia dependiendo del método de envío (Express, Forza, Local).
 */
export default function DashboardLogistica({ ventasFiltradas = [] }) {
  const metricas = useMemo(() => {
    const stats = {
      "Express": { nombre: "Express SV", envios: 0, ingreso: 0, ganancia: 0, color: "text-[#0f3faf]", bg: "bg-blue-50", border: "border-blue-200" },
      "Forza": { nombre: "Forza", envios: 0, ingreso: 0, ganancia: 0, color: "text-[#E63946]", bg: "bg-red-50", border: "border-red-200" },
      "Normal": { nombre: "Local / Retiro", envios: 0, ingreso: 0, ganancia: 0, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" }
    };

    ventasFiltradas.forEach(v => {
      const canal = v.tipo_entrega || "Normal";
      if (stats[canal]) {
        stats[canal].envios += 1;
        // Ajuste contable: El ingreso bruto incluye el descuento para medir el margen correctamente
        const ingresoBruto = parseFloat(v.ingreso_total_cliente || 0) + parseFloat(v.descuento || 0);
        stats[canal].ingreso += ingresoBruto;
        stats[canal].ganancia += parseFloat(v.ganancia_neta_limpia || 0);
      }
    });

    return Object.values(stats)
      .map(s => ({
        ...s,
        margen: s.ingreso > 0 ? (s.ganancia / s.ingreso) * 100 : 0
      }))
      .filter(s => s.envios > 0)
      .sort((a, b) => b.envios - a.envios);
  }, [ventasFiltradas]);

  if (metricas.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mt-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span>🚚</span> Impacto Logístico en Rentabilidad
          </h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Comparativa de Margen: Express vs Forza vs Local</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricas.map((m, i) => (
          <div key={i} className={`${m.bg} border ${m.border} rounded-2xl p-5 relative overflow-hidden transition-transform hover:scale-[1.02]`}>
            <p className={`text-sm font-black uppercase mb-4 ${m.color}`}>{m.nombre}</p>
            
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-600">Pedidos Enviados:</span>
                <span className="font-black text-gray-900">{m.envios}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-600">Ventas Brutas:</span>
                <span className="font-black text-gray-900">${m.ingreso.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-black/10 pb-2">
                <span className="font-bold text-gray-600">Utilidad Neta:</span>
                <span className="font-black text-gray-900">${m.ganancia.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="font-black text-gray-800 text-[10px] uppercase">Margen Real:</span>
                <span className={`text-3xl font-black leading-none ${m.color}`}>{m.margen.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}