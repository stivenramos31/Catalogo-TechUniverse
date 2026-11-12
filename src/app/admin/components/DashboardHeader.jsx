"use client";
import React from "react";

/**
 * DashboardHeader - FASE 1 (Hero Banner Ejecutivo)
 * Recibe propiedades calculadas para mostrar la Utilidad Neta, Ventas Brutas,
 * y comparativas contra periodos anteriores.
 * 
 * Props esperadas:
 * - tituloPeriodo (string): Ej. "Año 2026 (Enero - Diciembre)"
 * - gananciaNeta (number): Total de ganancia neta.
 * - gananciaAnterior (number): Ganancia neta del periodo anterior para comparar.
 * - ventasBrutas (number): Total de ingresos brutos.
 * - ventasAnterior (number): Ventas brutas del periodo anterior.
 * - metaPeriodo (number): Meta en dólares para el periodo actual.
 * - margenGanancia (string/number): Porcentaje de margen calculado.
 */
export default function DashboardHeader({
  tituloPeriodo = "Periodo Actual",
  gananciaNeta = 0,
  gananciaAnterior = 0,
  ventasBrutas = 0,
  ventasAnterior = 0,
  metaPeriodo = 0,
  margenGanancia = "0.0",
  onGenerarReporte = () => {}
}) {
  // Función para calcular la variación porcentual segura
  const calcularVariacion = (actual, anterior) => {
    if (!anterior || anterior === 0) return { porcentaje: 0, positivo: true };
    const diff = actual - anterior;
    const porcentaje = (diff / anterior) * 100;
    return {
      porcentaje: porcentaje.toFixed(1),
      positivo: porcentaje >= 0
    };
  };

  const variacionGanancia = calcularVariacion(gananciaNeta, gananciaAnterior);
  const variacionVentas = calcularVariacion(ventasBrutas, ventasAnterior);
  
  // Cálculo de progreso de meta
  const porcentajeMeta = metaPeriodo > 0 ? Math.min((gananciaNeta / metaPeriodo) * 100, 100).toFixed(0) : 0;

  return (
    <div className="bg-gradient-to-br from-[#0f3faf] to-[#0a256e] rounded-[2rem] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        
        {/* Bloque Izquierdo: Utilidad y Meta */}
        <div className="flex-1 w-full">
          <p className="text-blue-200 font-bold uppercase tracking-widest text-xs mb-2">Utilidad Neta ({tituloPeriodo})</p>
          
          <div className="flex items-end gap-4 mb-4">
            <h3 className="text-5xl sm:text-7xl font-black tracking-tighter">${gananciaNeta.toFixed(2)}</h3>
            
            {/* Insignia Comparativa Ganancia */}
            {gananciaAnterior > 0 && (
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold mb-2 ${
                variacionGanancia.positivo ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <span>{variacionGanancia.positivo ? '▲' : '▼'}</span>
                <span>{Math.abs(variacionGanancia.porcentaje)}%</span>
              </div>
            )}
          </div>

          {/* Barra de Progreso Minimalista */}
          {metaPeriodo > 0 && (
            <div className="w-full max-w-md">
              <div className="flex justify-between text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1.5">
                <span>Cumplimiento de Meta</span>
                <span>{porcentajeMeta}% de ${metaPeriodo.toLocaleString('es-SV', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${porcentajeMeta >= 100 ? 'bg-emerald-400' : 'bg-blue-400'}`}
                  style={{ width: `${porcentajeMeta}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Bloque Derecho: Ventas, Margen y Botón Reporte */}
        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl flex items-center justify-between gap-6">
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1">Ventas Brutas</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-black">${ventasBrutas.toFixed(2)}</p>
                {/* Insignia Comparativa Ventas */}
                {ventasAnterior > 0 && (
                  <span className={`text-[10px] font-bold ${variacionVentas.positivo ? 'text-emerald-300' : 'text-red-300'}`}>
                    {variacionVentas.positivo ? '▲+' : '▼-'}{Math.abs(variacionVentas.porcentaje)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right border-l border-white/20 pl-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1">Margen</p>
              <p className="text-xl font-black text-emerald-300">{margenGanancia}%</p>
            </div>
            
          </div>
          
          <button 
            onClick={onGenerarReporte} 
            className="bg-white text-[#0f3faf] hover:bg-gray-100 font-black py-3 px-6 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 w-full"
          >
            📄 Generar Reporte de este Periodo
          </button>
        </div>
        
      </div>
    </div>
  );
}