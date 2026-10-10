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
  
  // --- ESTADOS DEL DASHBOARD ---
  const [escala, setEscala] = useState(1);
  const vistaPreviaRef = useRef(null);
  const [filtroTiempo, setFiltroTiempo] = useState('este_ano'); // 'este_mes', '3_meses', '6_meses', 'este_ano', 'todo'

  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion_tienda').select('logo_url').eq('id', 1).maybeSingle();
      if(data?.logo_url) setLogoUrl(data.logo_url);
    };
    cargarConfig();
  }, []);

  useEffect(() => {
    const ajustarEscala = () => {
      if (vistaPreviaRef.current) {
        const anchoDisponible = vistaPreviaRef.current.offsetWidth - 32; 
        setEscala(anchoDisponible < 816 ? anchoDisponible / 816 : 1);
      }
    };
    if (mostrarReporte) {
      ajustarEscala();
      window.addEventListener("resize", ajustarEscala);
    }
    return () => window.removeEventListener("resize", ajustarEscala);
  }, [mostrarReporte]);

  // --- LÓGICA DE FECHAS DINÁMICAS (NOMBRES DE MESES Y AÑOS) ---
  const obtenerTextoFiltro = (filtro) => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    
    const formatearMes = (fecha) => {
      const mes = fecha.toLocaleString('es-ES', { month: 'long' });
      return mes.charAt(0).toUpperCase() + mes.slice(1);
    };

    if (filtro === 'este_mes') {
      return `${formatearMes(hoy)} ${año}`;
    }
    if (filtro === '3_meses') {
      const inicio = new Date(año, hoy.getMonth() - 2, 1);
      const añoInicio = inicio.getFullYear() !== año ? ` ${inicio.getFullYear()}` : '';
      return `${formatearMes(inicio)}${añoInicio} a ${formatearMes(hoy)} ${año}`;
    }
    if (filtro === '6_meses') {
      const inicio = new Date(año, hoy.getMonth() - 5, 1);
      const añoInicio = inicio.getFullYear() !== año ? ` ${inicio.getFullYear()}` : '';
      return `${formatearMes(inicio)}${añoInicio} a ${formatearMes(hoy)} ${año}`;
    }
    if (filtro === 'este_ano') {
      return `Año ${año} (Enero - Diciembre)`;
    }
    return 'Histórico Completo';
  };

  const tituloDinamico = obtenerTextoFiltro(filtroTiempo);

  // --- LÓGICA DE FILTRADO DE FECHAS MATEMÁTICO ---
  const obtenerFechaSegura = (v) => new Date(v.fecha_venta || v.created_at || v.fecha || new Date());
  
  const obtenerRangoInicio = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    
    switch(filtroTiempo) {
      case 'este_mes': return new Date(año, mes, 1);
      case '3_meses': return new Date(año, mes - 2, 1);
      case '6_meses': return new Date(año, mes - 5, 1);
      case 'este_ano': return new Date(año, 0, 1);
      default: return new Date(2000, 0, 1); // 'todo'
    }
  };

  const fechaInicioFiltro = obtenerRangoInicio();

  const ventasFiltradas = ventas.filter(v => {
    if (v.estado === 'Anulada') return false;
    const fechaVenta = obtenerFechaSegura(v);
    return fechaVenta >= fechaInicioFiltro;
  });

  // --- CÁLCULOS FINANCIEROS (Basados en el filtro seleccionado) ---
  const ingresoBrutoTotal = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.ingreso_total_cliente || 0), 0);
  const costoMercanciaVendida = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.costo_total_productos || 0), 0);
  const gastosLogistica = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.costo_envio_transporte || 0), 0);
  const comisionesMetodosPago = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.comision_metodo_pago || 0), 0);
  const totalDescuentos = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.descuento || 0), 0);
  const gananciaNetaTotal = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.ganancia_neta_limpia || 0), 0);
  
  const margenGanancia = ingresoBrutoTotal > 0 ? ((gananciaNetaTotal / ingresoBrutoTotal) * 100).toFixed(1) : 0;
  
  const inversionTotalHistorica = lotes.reduce((acc, l) => acc + (parseFloat(l.costo_unitario) * parseInt(l.cantidad_inicial)), 0);
  const valorInventarioActual = lotes.reduce((acc, l) => acc + (parseFloat(l.costo_unitario) * parseInt(l.cantidad_disponible)), 0);

  // --- DATOS PARA LA GRÁFICA DE 12 MESES (Año Actual) ---
  const añoActual = new Date().getFullYear();
  const datosGrafica = Array(12).fill(0).map((_, i) => ({
    mes: new Date(añoActual, i, 1).toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
    ingresos: 0,
    ganancia: 0
  }));

  ventas.forEach(v => {
    if (v.estado === 'Anulada') return;
    const f = obtenerFechaSegura(v);
    if (f.getFullYear() === añoActual) {
      const mesIndex = f.getMonth();
      datosGrafica[mesIndex].ingresos += parseFloat(v.ingreso_total_cliente || 0);
      datosGrafica[mesIndex].ganancia += parseFloat(v.ganancia_neta_limpia || 0);
    }
  });

  const maxValorGrafica = Math.max(...datosGrafica.map(d => d.ingresos), 100);

  // --- EXPORTACIÓN ---
  const exportarPDF = () => {
    if (!reporteRef.current) return;
    setGenerando(true);
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(reporteRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
        pdf.addImage(imgData, "JPEG", 0, 0, 215.9, 279.4);
        pdf.save(`Reporte_TechUniverse_${filtroTiempo}.pdf`);
      } catch (error) { alert("Error: " + error.message); } finally { setGenerando(false); }
    }, 300);
  };

  const exportarImagen = () => {
    if (!reporteRef.current) return;
    setGenerando(true);
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(reporteRef.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const link = document.createElement("a"); link.href = imgData; 
        link.download = `Reporte_TechUniverse_${filtroTiempo}.jpg`; link.click();
      } catch (error) { alert("Error: " + error.message); } finally { setGenerando(false); }
    }, 300);
  };

  const escalaVisual = generando ? 1 : escala;
  const titulosBotones = {
    'este_mes': 'Este Mes', '3_meses': '3 Meses', '6_meses': '6 Meses', 'este_ano': 'Año Actual', 'todo': 'Histórico'
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10">
      {/* 2. TARJETA PRINCIPAL (Resumen del periodo filtrado) */}
      <div className="bg-gradient-to-br from-[#0f3faf] to-[#0a256e] rounded-[2rem] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-blue-200 font-bold uppercase tracking-widest text-xs mb-2">Utilidad Neta ({tituloDinamico})</p>
            <h3 className="text-5xl sm:text-7xl font-black tracking-tighter">${gananciaNetaTotal.toFixed(2)}</h3>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl flex items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1">Ventas Brutas</p>
                <p className="text-xl font-black">${ingresoBrutoTotal.toFixed(2)}</p>
              </div>
              <div className="text-right border-l border-white/20 pl-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1">Margen</p>
                <p className="text-xl font-black text-emerald-300">{margenGanancia}%</p>
              </div>
            </div>
            <button onClick={() => setMostrarReporte(true)} className="bg-white text-[#0f3faf] hover:bg-gray-100 font-black py-3 px-6 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 w-full">
              📄 Generar Reporte de este Periodo
            </button>
          </div>
        </div>
      </div>
      
      {/* 1. CONTROLES DE FILTRO DE TIEMPO */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-2 md:inline-flex">
        {Object.keys(titulosBotones).map(key => (
          <button 
            key={key} 
            onClick={() => setFiltroTiempo(key)}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${filtroTiempo === key ? 'bg-[#0f3faf] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {titulosBotones[key]}
          </button>
        ))}
      </div>

      {/* 3. MÉTRICAS OPERATIVAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-100 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-2"><span className="text-blue-500">📈</span></div>
          <p className="text-xs font-bold text-gray-500 uppercase">Costo Mercancía</p>
          <p className="text-xl font-black text-gray-800">-${costoMercanciaVendida.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-100 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-2"><span className="text-red-500">🚚</span></div>
          <p className="text-xs font-bold text-gray-500 uppercase">Gastos & Logística</p>
          <p className="text-xl font-black text-red-500">-${(gastosLogistica + comisionesMetodosPago).toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-100 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-2"><span className="text-orange-500">🏷️</span></div>
          <p className="text-xs font-bold text-gray-500 uppercase">Descuentos</p>
          <p className="text-xl font-black text-orange-500">-${totalDescuentos.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-100 p-4 sm:p-5 rounded-3xl shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2"><span className="text-emerald-500">📦</span></div>
          <p className="text-xs font-bold text-gray-500 uppercase">Valor Inventario Físico</p>
          <p className="text-xl font-black text-[#0f3faf]">${valorInventarioActual.toFixed(2)}</p>
        </div>
      </div>

      {/* 4. GRÁFICA DE TENDENCIA ANUAL (12 Meses) */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-black text-gray-900 mb-1">Tendencia del Año {añoActual}</h3>
        <p className="text-xs font-bold text-gray-500 mb-8">Comparativa visual de Ingresos (Azul) vs Ganancia Neta (Verde)</p>
        
        <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-100 w-full h-0 flex-1"></div>
            ))}
          </div>
          
          {datosGrafica.map((dato, i) => {
            return (
              <div key={i} className="flex-1 flex flex-col justify-end items-center h-full relative group">
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] sm:text-xs p-2 rounded-lg shadow-xl z-20 pointer-events-none whitespace-nowrap">
                  <p className="font-black mb-1">{dato.mes} {añoActual}</p>
                  <p className="text-blue-300">Venta: ${dato.ingresos.toFixed(0)}</p>
                  <p className="text-emerald-300">Gana: ${dato.ganancia.toFixed(0)}</p>
                </div>
                <div className="w-full flex justify-center items-end gap-0.5 sm:gap-1 z-10 h-full">
                  <div 
                    className="w-1/2 sm:w-6 bg-[#0f3faf] rounded-t-sm sm:rounded-t-md transition-all duration-500 hover:brightness-110" 
                    style={{ height: dato.ingresos > 0 ? Math.max(5, (dato.ingresos / maxValorGrafica) * 100) + '%' : '0%' }}
                  ></div>
                  <div 
                    className="w-1/2 sm:w-6 bg-emerald-400 rounded-t-sm sm:rounded-t-md transition-all duration-500 hover:brightness-110" 
                    style={{ height: dato.ganancia > 0 ? Math.max(5, (dato.ganancia / maxValorGrafica) * 100) + '%' : '0%' }}
                  ></div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-gray-400 mt-2">{dato.mes}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL DEL REPORTE CONTABLE --- */}
      {mostrarReporte && (
        <div className="fixed inset-0 bg-black/80 z-[90] flex p-2 sm:p-6 justify-center items-center animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[95vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            
            {/* PANEL DE BOTONES */}
            <div className="p-5 md:p-8 w-full md:w-1/3 bg-gray-50 border-b md:border-b-0 md:border-l border-gray-200 shrink-0 z-10 order-1 md:order-2 overflow-y-auto">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Reporte Auditado</h3>
              <p className="text-xs md:text-sm text-gray-500 mb-6">Mostrando cifras para el periodo: <span className="font-black text-[#0f3faf]">{tituloDinamico}</span></p>
              
              <div className="space-y-3">
                <button onClick={exportarImagen} disabled={generando} className="w-full bg-[#0f3faf] text-white font-black py-3 sm:py-4 rounded-xl shadow-md hover:bg-blue-800 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 text-sm sm:text-base">
                  <span className="text-lg">🖼️</span> {generando ? "Procesando..." : "Descargar Imagen"}
                </button>
                <button onClick={exportarPDF} disabled={generando} className="w-full bg-gray-900 text-white font-black py-3 sm:py-4 rounded-xl shadow-md hover:bg-black flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 text-sm sm:text-base">
                  <span className="text-lg">📄</span> {generando ? "Procesando..." : "Descargar PDF (Carta)"}
                </button>
              </div>

              <button onClick={() => setMostrarReporte(false)} disabled={generando} className="mt-4 sm:mt-6 w-full text-center text-red-500 font-black hover:text-red-700 py-3 rounded-xl bg-red-50 border border-red-100 disabled:opacity-50">
                ❌ Cerrar vista previa
              </button>
            </div>

            {/* VISTA PREVIA DEL REPORTE */}
            <div ref={vistaPreviaRef} className="bg-gray-200 py-4 sm:py-8 flex justify-center items-start w-full md:w-2/3 flex-1 overflow-auto order-2 md:order-1 relative">
              <div style={{ transform: `scale(${escalaVisual})`, transformOrigin: 'top center', width: `${816 * escalaVisual}px`, height: `${1056 * escalaVisual}px`, transition: 'transform 0.2s ease-in-out' }}>
                <div ref={reporteRef} className="bg-white p-8 sm:p-12 shadow-md shrink-0 text-gray-900 mx-auto" style={{ width: '816px', minHeight: '1056px' }}>
                  
                  <div className="border-b-4 border-[#0f3faf] pb-6 mb-8 flex justify-between items-start">
                    <div className="flex items-center gap-5">
                      {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-16 sm:h-20 w-auto max-w-[280px] object-contain shrink-0" crossOrigin="anonymous" />
                      ) : (
                          <div className="h-16 w-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 font-bold text-[10px]">LOGO</div>
                      )}
                      <div className="border-l-2 border-gray-100 pl-5">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#0f3faf] mb-1">TECH UNIVERSE</h1>
                        <p className="text-sm font-bold text-gray-500 tracking-widest uppercase">Reporte Financiero</p>
                        <p className="text-xs font-black text-[#0f3faf] mt-1">{tituloDinamico}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Generado por</p>
                      <p className="text-sm font-black text-gray-800 mb-2">{perfil?.nombre_completo || "Administrador"}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Fecha de Emisión</p>
                      <p className="text-sm font-black text-gray-800">{new Date().toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Resumen Ejecutivo */}
                  <div className="mb-10">
                    <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-4 bg-gray-100 p-2 rounded">1. Resumen Ejecutivo del Periodo</h2>
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
                      <div className="flex justify-between font-bold text-gray-800 border-b border-black pb-1">
                        <span>(+) INGRESOS OPERATIVOS (Ventas)</span>
                        <span>${ingresoBrutoTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 pt-2">
                        <span>(-) Costo de la Mercancía Vendida</span>
                        <span>${costoMercanciaVendida.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-800 border-b border-black pb-1 mt-2">
                        <span>(=) UTILIDAD BRUTA</span>
                        <span>${(ingresoBrutoTotal - costoMercanciaVendida).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 pt-2">
                        <span>(-) Gastos de Logística y Envíos</span>
                        <span>${gastosLogistica.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>(-) Comisiones Metodos de Pago</span>
                        <span>${comisionesMetodosPago.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>(-) Descuentos Otorgados</span>
                        <span>${totalDescuentos.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-xl text-[#0f3faf] border-t-2 border-[#0f3faf] pt-2 mt-4">
                        <span>(=) UTILIDAD NETA DEL EJERCICIO</span>
                        <span>${gananciaNetaTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inventario Global */}
                  <div className="mb-12">
                    <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-4 bg-gray-100 p-2 rounded">3. Estado de Inventario Global</h2>
                    <div className="grid grid-cols-2 gap-8 px-4">
                      <div className="border-l-4 border-gray-300 pl-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Inversión Histórica Total</p>
                        <p className="text-2xl font-black text-gray-800">${inversionTotalHistorica.toFixed(2)}</p>
                      </div>
                      <div className="border-l-4 border-[#0f3faf] pl-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">Valor de Inventario Activo (Bodega)</p>
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
                      <p className="text-xs font-bold text-gray-800">{perfil?.nombre_completo}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Responsable de Finanzas</p>
                    </div>
                    <div className="text-center w-64">
                      <div className="border-b border-gray-800 mb-2 h-10 flex items-end justify-center">
                        <span className="font-black text-[#0f3faf] text-xl opacity-80" style={{ fontFamily: 'Georgia, serif' }}>Tech Universe</span>
                      </div>
                      <p className="text-xs font-bold text-gray-800">Firma Autorizada</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Auditoría Interna</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}