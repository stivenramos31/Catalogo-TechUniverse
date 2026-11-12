"use client";
import React from "react";

export default function DashboardBreakdown({
  productosRentables = [],
  productosMasVendidos = [],
  datosCanales = []
}) {
  
  // Componente interno para reutilizar el diseño de la tabla
  const TablaProductos = ({ titulo, icono, subtitulo, datos, resaltarPor }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <span>{icono}</span> {titulo}
          </h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subtitulo}</span>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="border-b-2 border-gray-100 uppercase text-[9px] font-black text-gray-400">
            <tr>
              <th className="py-2 px-1">Producto</th>
              <th className="py-2 px-1 text-center">Unds.</th>
              <th className="py-2 px-1 text-right">Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((prod, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 font-black text-[10px]">{idx + 1}.</span>
                    <div className="w-8 h-8 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {prod.imagen ? (
                        <img src={prod.imagen} alt={prod.nombre} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="text-gray-300 text-[10px]">📦</span>
                      )}
                    </div>
                    <span className="font-bold text-gray-800 text-xs truncate max-w-[100px]" title={prod.nombre}>
                      {prod.nombre}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-1 text-center font-medium">
                  <span className={`${resaltarPor === 'unidades' ? 'bg-blue-100 text-[#0f3faf] font-black' : 'bg-gray-100 text-gray-600'} px-1.5 py-0.5 rounded text-[11px]`}>
                    {prod.unidades}
                  </span>
                </td>
                <td className={`py-3 px-1 text-right font-black text-xs ${resaltarPor === 'ganancia' ? 'text-emerald-600' : 'text-gray-600'}`}>
                  ${prod.ganancia.toFixed(2)}
                </td>
              </tr>
            ))}
            {datos.length === 0 && (
              <tr>
                <td colSpan="3" className="py-6 text-center text-gray-400 font-medium text-xs">
                  Sin datos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 animate-fade-in">
      
      {/* Columna 1: Top Rentables */}
      <TablaProductos 
        titulo="Top Rentables" 
        icono="🏆" 
        subtitulo="Mayor Utilidad Neta" 
        datos={productosRentables} 
        resaltarPor="ganancia"
      />

      {/* Columna 2: Más Vendidos */}
      <TablaProductos 
        titulo="Más Vendidos" 
        icono="🔥" 
        subtitulo="Mayor Demanda (Unds.)" 
        datos={productosMasVendidos} 
        resaltarPor="unidades"
      />

      {/* Columna 3: Gráfico Desglose Canales */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col h-full">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-1">
          <span>🎯</span> Canales de Venta
        </h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
          Distribución de pedidos enviados.
        </p>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Dona CSS Agrandada */}
          <div className="relative w-44 h-44 shrink-0 mt-2">
             <div 
               className="w-full h-full rounded-full shadow-inner" 
               style={{
                 background: `conic-gradient(
                   #0f3faf 0% ${datosCanales[0]?.porcentaje || 0}%,
                   #E63946 ${datosCanales[0]?.porcentaje || 0}% ${(datosCanales[0]?.porcentaje || 0) + (datosCanales[1]?.porcentaje || 0)}%,
                   #10b981 ${(datosCanales[0]?.porcentaje || 0) + (datosCanales[1]?.porcentaje || 0)}% 100%
                 )`
               }}
             ></div>
             <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-sm">
               <span className="text-3xl">📦</span>
             </div>
          </div>

          {/* Leyenda Más Legible */}
          <div className="flex flex-col gap-3 w-full px-2 mt-2">
            {datosCanales.map((canal, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 w-full bg-gray-50/50 p-2 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-md ${canal.color} shadow-sm`}></div>
                  <span className="text-sm font-bold text-gray-700">{canal.canal}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{canal.porcentaje}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}