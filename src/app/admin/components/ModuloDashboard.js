"use client";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { supabase } from "../../../lib/supabase";

export default function ModuloDashboard({ ventas, lotes, perfil }) {
  const [generando, setGenerando] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const reporteRef = useRef(null);
  
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion_tienda').select('logo_url').eq('id', 1).maybeSingle();
      if(data?.logo_url) setLogoUrl(data.logo_url);
    };
    cargarConfig();
  }, []);

  // --- CÁLCULOS FINANCIEROS COMPLETOS ---
  const ingresoBrutoTotal = ventas.reduce((acc, v) => acc + parseFloat(v.ingreso_total_cliente || 0), 0);
  const costoMercanciaVendida = ventas.reduce((acc, v) => acc + parseFloat(v.costo_total_productos || 0), 0);
  const gastosLogistica = ventas.reduce((acc, v) => acc + parseFloat(v.costo_envio_transporte || 0), 0);
  const comisionesMetodosPago = ventas.reduce((acc, v) => acc + parseFloat(v.comision_metodo_pago || 0), 0);
  const totalDescuentos = ventas.reduce((acc, v) => acc + parseFloat(v.descuento || 0), 0);
  const gananciaNetaTotal = ventas.reduce((acc, v) => acc + parseFloat(v.ganancia_neta_limpia || 0), 0);
  const margenGanancia = ingresoBrutoTotal > 0 ? ((gananciaNetaTotal / ingresoBrutoTotal) * 100).toFixed(1) : 0;
  const inversionTotalHistorica = lotes.reduce((acc, l) => acc + (parseFloat(l.costo_unitario) * parseInt(l.cantidad_inicial)), 0);
  const valorInventarioActual = lotes.reduce((acc, l) => acc + (parseFloat(l.costo_unitario) * parseInt(l.cantidad_disponible)), 0);

  // --- EXPORTACIÓN DEL REPORTE ---
  const exportarPDF = async () => {
    if (!reporteRef.current) return;
    setGenerando(true);
    const canvas = await html2canvas(reporteRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    pdf.addImage(imgData, "JPEG", 0, 0, 215.9, 279.4);
    pdf.save(`Reporte_Financiero_TechUniverse_${new Date().toISOString().split('T')[0]}.pdf`);
    setGenerando(false);
  };

  const exportarImagen = async () => {
    if (!reporteRef.current) return;
    setGenerando(true);
    const canvas = await html2canvas(reporteRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const link = document.createElement("a"); link.href = imgData; 
    link.download = `Reporte_Financiero_TechUniverse_${new Date().toISOString().split('T')[0]}.jpg`; 
    link.click();
    setGenerando(false);
  };

  const fechaActual = new Date();

  return (
    <div className="space-y-6 animate-fade-in w-full relative">
      {/* TARJETA PRINCIPAL Y BOTÓN DE REPORTE */}
      <div className={`relative overflow-hidden rounded-[2rem] p-8 sm:p-10 text-white shadow-xl ${gananciaNetaTotal >= 0 ? "bg-gradient-to-br from-[#0f3faf] to-blue-900 shadow-blue-500/20 border border-blue-800" : "bg-gradient-to-br from-red-500 to-rose-800 shadow-red-500/20"}`}>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">💰 Tu Ganancia Limpia (Lo que te queda libre)</p>
            <h3 className="text-5xl sm:text-7xl font-black tracking-tighter">${gananciaNetaTotal.toFixed(2)}</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100 mb-1">Porcentaje de Ganancia</p>
              <p className="text-2xl font-black">{margenGanancia}%</p>
            </div>
            <button onClick={() => setMostrarReporte(true)} className="bg-white text-[#0f3faf] hover:bg-gray-100 font-black py-3 px-6 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
              📄 Generar Reporte Contable
            </button>
          </div>
        </div>
      </div>

      {/* MÉTRICAS RÁPIDAS (Resumen) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm"><p className="text-sm font-black text-gray-800">Total Cobrado</p><p className="text-2xl font-black text-green-600">${ingresoBrutoTotal.toFixed(2)}</p></div>
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm"><p className="text-sm font-black text-gray-800">Valor Inventario</p><p className="text-2xl font-black text-[#0f3faf]">${valorInventarioActual.toFixed(2)}</p></div>
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm"><p className="text-sm font-black text-gray-800">Costo Vendido</p><p className="text-2xl font-black text-orange-500">-${costoMercanciaVendida.toFixed(2)}</p></div>
        <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-sm"><p className="text-sm font-black text-gray-800">Gastos y Envíos</p><p className="text-2xl font-black text-red-500">-${(gastosLogistica + comisionesMetodosPago).toFixed(2)}</p></div>
      </div>

      {/* --- MODAL DEL REPORTE CONTABLE (DISEÑO FLUIDO PARA MÓVIL) --- */}
      {mostrarReporte && (
        <div className="fixed inset-0 bg-black/80 z-[90] flex p-2 sm:p-6 justify-center items-center animate-fade-in">
          
          <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[95vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            
            {/* PANEL DE BOTONES (Fijo arriba en móvil, a la derecha en PC) */}
            <div className="p-5 md:p-8 w-full md:w-1/3 bg-gray-50 border-b md:border-b-0 md:border-l border-gray-200 shrink-0 z-10 order-1 md:order-2 overflow-y-auto">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Reporte Auditado</h3>
              <p className="text-xs md:text-sm text-gray-500 mb-6">El documento ya incluye las firmas y la validación de tiempo. Selecciona el formato.</p>
              
              <div className="space-y-3">
                <button onClick={exportarImagen} disabled={generando} className="w-full bg-[#0f3faf] text-white font-black py-3 sm:py-4 rounded-xl shadow-md hover:bg-blue-800 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 text-sm sm:text-base">
                  <span className="text-lg">🖼️</span> {generando ? "Procesando..." : "Descargar Imagen"}
                </button>
                <button onClick={exportarPDF} disabled={generando} className="w-full bg-gray-900 text-white font-black py-3 sm:py-4 rounded-xl shadow-md hover:bg-black flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 text-sm sm:text-base">
                  <span className="text-lg">📄</span> {generando ? "Procesando..." : "Descargar PDF (A4)"}
                </button>
              </div>

              <button onClick={() => setMostrarReporte(false)} className="mt-4 sm:mt-6 w-full text-center text-red-500 font-black hover:text-red-700 py-3 rounded-xl bg-red-50 border border-red-100">
                ❌ Cerrar vista previa
              </button>
            </div>

            {/* VISTA PREVIA DEL REPORTE (Scroll independiente, Abajo en móvil, Izquierda en PC) */}
            <div className="bg-gray-200 p-4 sm:p-8 w-full md:w-2/3 flex-1 overflow-auto order-2 md:order-1 relative">
              
              {/* Contenedor exacto de Tamaño Carta (816px x 1056px) */}
              <div ref={reporteRef} className="bg-white p-8 sm:p-12 shadow-md shrink-0 text-gray-900 mx-auto" style={{ width: '816px', minHeight: '1056px' }}>
                
                {/* CABECERA AUDITADA CON LOGO Y FECHA */}
                <div className="border-b-4 border-[#0f3faf] pb-6 mb-8 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo TechUniverse" className="w-20 h-20 rounded-2xl object-cover shrink-0" crossOrigin="anonymous" />
                    ) : (
                        <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-[10px] text-center shrink-0">
                          ESPACIO<br/>LOGO
                        </div>
                    )}
                    <div>
                      <h1 className="text-4xl font-black tracking-tighter text-[#0f3faf] mb-1">TECH UNIVERSE</h1>
                      <p className="text-sm font-bold text-gray-500 tracking-widest uppercase">Reporte Financiero y Operativo</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Generado por</p>
                    <p className="text-sm font-black text-gray-800 mb-2">{perfil?.nombre_completo || "Administrador"}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Fecha y Hora de Emisión</p>
                    <p className="text-sm font-black text-gray-800">{fechaActual.toLocaleDateString()} - {fechaActual.toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Resumen Ejecutivo */}
                <div className="mb-10">
                  <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-4 bg-gray-100 p-2 rounded">1. Resumen Ejecutivo</h2>
                  <div className="flex justify-between items-center px-4">
                    <div>
                      <p className="text-sm font-bold text-gray-500">Ingresos Totales (Brutos)</p>
                      <p className="text-2xl font-black text-gray-900">${ingresoBrutoTotal.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0f3faf]">Utilidad Neta (Libre)</p>
                      <p className="text-3xl font-black text-[#0f3faf]">${gananciaNetaTotal.toFixed(2)}</p>
                    </div>
                    <div className="text-right bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                      <p className="text-xs font-bold text-blue-800 uppercase">Margen</p>
                      <p className="text-xl font-black text-blue-600">{margenGanancia}%</p>
                    </div>
                  </div>
                </div>

                {/* Estado de Resultados (P&L) */}
                <div className="mb-10">
                  <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-4 bg-gray-100 p-2 rounded">2. Estado de Resultados (P&L)</h2>
                  
                  <div className="space-y-3 px-4 text-sm">
                    {/* Ingresos */}
                    <div className="flex justify-between font-bold text-gray-800 border-b border-black pb-1">
                      <span>(+) INGRESOS OPERATIVOS (Ventas)</span>
                      <span>${ingresoBrutoTotal.toFixed(2)}</span>
                    </div>
                    
                    {/* Costos Directos */}
                    <div className="flex justify-between text-gray-600 pt-2">
                      <span>(-) Costo de la Mercancía Vendida (Inversión recuperada)</span>
                      <span>${costoMercanciaVendida.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-gray-800 border-b border-black pb-1 mt-2">
                      <span>(=) UTILIDAD BRUTA</span>
                      <span>${(ingresoBrutoTotal - costoMercanciaVendida).toFixed(2)}</span>
                    </div>

                    {/* Gastos y Deducciones */}
                    <div className="flex justify-between text-gray-600 pt-2">
                      <span>(-) Gastos de Logística (Pasajes y Agencias Fijas)</span>
                      <span>${gastosLogistica.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>(-) Comisiones por Manejo de Efectivo / Agencias</span>
                      <span>${comisionesMetodosPago.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>(-) Descuentos Otorgados a Clientes</span>
                      <span>${totalDescuentos.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between font-black text-xl text-[#0f3faf] border-t-2 border-[#0f3faf] pt-2 mt-4">
                      <span>(=) UTILIDAD NETA DEL EJERCICIO</span>
                      <span>${gananciaNetaTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Balance de Inventario */}
                <div className="mb-12">
                  <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-4 bg-gray-100 p-2 rounded">3. Estado y Valoración de Inventario</h2>
                  <div className="grid grid-cols-2 gap-8 px-4">
                    <div className="border-l-4 border-gray-300 pl-4">
                      <p className="text-xs font-bold text-gray-500 uppercase">Inversión Histórica Total</p>
                      <p className="text-2xl font-black text-gray-800">${inversionTotalHistorica.toFixed(2)}</p>
                    </div>
                    <div className="border-l-4 border-[#0f3faf] pl-4">
                      <p className="text-xs font-bold text-gray-500 uppercase">Valor de Inventario Físico (Activos)</p>
                      <p className="text-2xl font-black text-[#0f3faf]">${valorInventarioActual.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* FIRMAS DE AUDITORÍA */}
                <div className="mt-20 flex justify-between items-end border-t border-gray-200 pt-10 px-8">
                  <div className="text-center w-64">
                    <div className="border-b border-gray-800 mb-2 h-10 flex items-end justify-center">
                      <span className="text-sm font-serif italic text-gray-800">{perfil?.nombre_completo || "Administrador"}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800">{perfil?.nombre_completo || "Administrador"}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Responsable de Caja y Finanzas</p>
                  </div>
                  <div className="text-center w-64">
                    <div className="border-b border-gray-800 mb-2 h-10 flex items-end justify-center">
                      <span className="font-black text-[#0f3faf] text-xl opacity-80" style={{ fontFamily: 'Georgia, serif' }}>Tech Universe</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800">Firma Autorizada</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Auditoría Interna</p>
                  </div>
                </div>

                {/* Footer Reporte */}
                <div className="text-center mt-12 pt-8 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase">Confidencial y de Uso Interno.</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}