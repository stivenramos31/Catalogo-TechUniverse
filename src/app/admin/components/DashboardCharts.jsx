"use client";
import React, { useState } from "react";

/**
 * DashboardCharts - FASE 3 (Gráfico de Tendencia Profesional)
 * Renderiza la gráfica anual comparando Ventas Brutas vs Utilidad Neta,
 * con etiquetas, tooltips y opciones de visualización ejecutiva.
 * 
 * Props esperadas:
 * - datosGrafica (Array): [{ mes: "ENE", ingresos: 1200, ganancia: 450 }, ...]
 * - añoActual (number): Ej. 2026
 * - metaMensual (number): Meta sugerida por mes para la línea punteada (opcional)
 */
export default function DashboardCharts({
  datosGrafica = [],
  añoActual = new Date().getFullYear(),
  metaMensual = 1000 // Puedes enviar esta meta desde el componente padre
}) {
  const [mostrarSoloActivos, setMostrarSoloActivos] = useState(false);
  const [mostrarMeta, setMostrarMeta] = useState(false);

  // Filtrar meses inactivos si la opción está activada
  const datosVisibles = mostrarSoloActivos 
    ? datosGrafica.filter(d => d.ingresos > 0 || d.ganancia > 0)
    : datosGrafica;

  // Calcular el valor máximo para la escala (dinámico + margen del 20%)
  const maxIngreso = Math.max(...datosVisibles.map(d => d.ingresos), 100);
  const maxEscala = maxIngreso * 1.2;

  // Generar etiquetas discretas para el eje Y (ej. $0, $500, $1000)
  const ejeY = [
    maxEscala,
    maxEscala * 0.75,
    maxEscala * 0.5,
    maxEscala * 0.25,
    0
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md border border-gray-100 p-6 sm:p-8 transition-shadow mb-6">
      
      {/* Cabecera del Gráfico con Controles Ejecutivos */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 border-b pb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <span>📈</span> Rendimiento Anual {añoActual}
          </h3>
          <div className="flex gap-4 mt-2 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded-full bg-[#0f3faf]"></span> Ventas Brutas
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Utilidad Neta
            </span>
          </div>
        </div>
        
        {/* Controles Toggles */}
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={mostrarMeta} 
              onChange={() => setMostrarMeta(!mostrarMeta)} 
              className="accent-[#0f3faf] w-3.5 h-3.5"
            />
            Meta Mensual (${metaMensual})
          </label>
          <div className="w-px h-4 bg-gray-300"></div>
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={mostrarSoloActivos} 
              onChange={() => setMostrarSoloActivos(!mostrarSoloActivos)} 
              className="accent-[#0f3faf] w-3.5 h-3.5"
            />
            Ocultar Inactivos
          </label>
        </div>
      </div>

      {/* Contenedor Principal del Gráfico */}
      <div className="h-72 sm:h-80 flex relative w-full pr-2">
        
        {/* Eje Y (Cantidades) */}
        <div className="flex flex-col justify-between items-end pr-4 w-12 sm:w-16 shrink-0 h-full pb-6 text-[9px] sm:text-[10px] font-bold text-gray-400">
          {ejeY.map((valor, i) => (
            <span key={i}>${valor >= 1000 ? (valor/1000).toFixed(1) + 'k' : valor.toFixed(0)}</span>
          ))}
        </div>

        {/* Área del Gráfico con Barras */}
        <div className="flex-1 relative flex items-end justify-around h-full pb-6 border-l border-b border-gray-200">
          
          {/* Líneas horizontales de guía */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 z-0">
            {ejeY.map((_, i) => (
              <div key={`line-${i}`} className="border-b border-dashed border-gray-100 w-full h-0 flex-1"></div>
            ))}
          </div>

          {/* Línea Punteada de Meta Mensual */}
          {mostrarMeta && (
            <div 
              className="absolute left-0 w-full border-b-2 border-dashed border-orange-400 z-10 opacity-70 pointer-events-none"
              style={{ bottom: `calc(1.5rem + ${Math.min((metaMensual / maxEscala) * 100, 100)}%)` }}
            >
              <span className="absolute -top-5 right-2 bg-orange-50 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded shadow-sm">
                META: ${metaMensual}
              </span>
            </div>
          )}

          {/* Barras por Mes */}
          {datosVisibles.map((dato, i) => {
            const hIngresos = dato.ingresos > 0 ? (dato.ingresos / maxEscala) * 100 : 0;
            const hGanancia = dato.ganancia > 0 ? (dato.ganancia / maxEscala) * 100 : 0;

            return (
              <div key={i} className="flex flex-col justify-end items-center h-full relative group z-20 w-full">
                
                {/* Tooltip Hover Avanzado */}
                <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 bg-gray-900 text-white text-[10px] sm:text-xs p-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap min-w-[120px] text-center border border-gray-700">
                  <p className="font-black text-gray-300 uppercase tracking-widest mb-2 border-b border-gray-700 pb-1">{dato.mes} {añoActual}</p>
                  <div className="flex justify-between items-center gap-4 mb-1">
                    <span className="text-blue-300 font-medium">Ventas:</span>
                    <span className="font-black">${dato.ingresos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-emerald-300 font-medium">Utilidad:</span>
                    <span className="font-black">${dato.ganancia.toFixed(2)}</span>
                  </div>
                  {dato.ingresos > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between items-center text-[10px]">
                      <span className="text-gray-400">Margen:</span>
                      <span className="text-emerald-400 font-black">{((dato.ganancia / dato.ingresos) * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Etiquetas Superiores Permanentes (Opcional, solo si hay datos) */}
                {dato.ingresos > 0 && (
                  <div className="absolute -top-8 flex flex-col items-center opacity-0 md:opacity-100 transition-opacity">
                     <span className="text-[9px] font-black text-[#0f3faf] bg-blue-50 px-1 rounded">${dato.ingresos.toFixed(0)}</span>
                  </div>
                )}

                {/* Barras de datos */}
                <div className="w-full max-w-[40px] flex justify-center items-end gap-0.5 sm:gap-1 z-10 h-full">
                  <div 
                    className="w-1/2 bg-gradient-to-t from-[#0a256e] to-[#0f3faf] rounded-t-md transition-all duration-700 hover:brightness-125" 
                    style={{ height: `${hIngresos}%` }}
                  ></div>
                  <div 
                    className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-700 hover:brightness-125" 
                    style={{ height: `${hGanancia}%` }}
                  ></div>
                </div>

                {/* Etiqueta del Mes Eje X */}
                <span className="absolute -bottom-6 text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-wider">{dato.mes}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}