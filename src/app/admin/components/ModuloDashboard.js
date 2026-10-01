"use client";

export default function ModuloDashboard({ ventas, lotes }) {
  const ingresoBrutoTotal = ventas.reduce((acc, v) => acc + parseFloat(v.ingreso_total_cliente || 0), 0);
  const valorInventarioActual = lotes.reduce((acc, l) => acc + (parseFloat(l.costo_unitario) * parseInt(l.cantidad_disponible)), 0);
  const costoMercanciaVendida = ventas.reduce((acc, v) => acc + parseFloat(v.costo_total_productos || 0), 0);
  const gastosLogisticaComisiones = ventas.reduce((acc, v) => acc + parseFloat(v.costo_envio_transporte || 0) + parseFloat(v.comision_metodo_pago || 0), 0);
  const gananciaNetaTotal = ventas.reduce((acc, v) => acc + parseFloat(v.ganancia_neta_limpia || 0), 0);
  const margenGanancia = ingresoBrutoTotal > 0 ? ((gananciaNetaTotal / ingresoBrutoTotal) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className={`relative overflow-hidden rounded-[2rem] p-8 sm:p-10 text-white shadow-xl ${gananciaNetaTotal >= 0 ? "bg-gradient-to-br from-[#0f3faf] to-blue-900 shadow-blue-500/20 border border-blue-800" : "bg-gradient-to-br from-red-500 to-rose-800 shadow-red-500/20"}`}>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">💰 Tu Ganancia Limpia (Lo que te queda libre)</p>
            <h3 className="text-5xl sm:text-7xl font-black tracking-tighter">${gananciaNetaTotal.toFixed(2)}</h3>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-1">Porcentaje de Ganancia</p>
            <p className="text-2xl font-black">{margenGanancia}%</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-3 text-xl">💵</div>
          <p className="text-sm font-black text-gray-800">Total Cobrado</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight mb-2">Todo el dinero que te han pagado los clientes</p>
          <p className="text-2xl font-black text-green-600">${ingresoBrutoTotal.toFixed(2)}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0f3faf] mb-3 text-xl">📦</div>
          <p className="text-sm font-black text-gray-800">Valor de tu Inventario</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight mb-2">Dinero invertido en los productos que tienes guardados</p>
          <p className="text-2xl font-black text-[#0f3faf]">${valorInventarioActual.toFixed(2)}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-3 text-xl">🛒</div>
          <p className="text-sm font-black text-gray-800">Costo de lo Vendido</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight mb-2">Lo que a ti te costaron los productos que ya entregaste</p>
          <p className="text-2xl font-black text-orange-500">-${costoMercanciaVendida.toFixed(2)}</p>
        </div>
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3 text-xl">🛵</div>
          <p className="text-sm font-black text-gray-800">Gastos y Envíos</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight mb-2">Dinero pagado en pasajes, Express SV y comisiones</p>
          <p className="text-2xl font-black text-red-500">-${gastosLogisticaComisiones.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}