"use client";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { supabase } from "../../../lib/supabase";
import DashboardHeader from "./DashboardHeader";
import DashboardKPIs from "./DashboardKPIs";
import DashboardCharts from "./DashboardCharts";
import DashboardBreakdown from "./DashboardBreakdown";
import DashboardLogistica from "./DashboardLogistica";

export default function ModuloDashboard({ ventas, lotes, perfil, productos }) {
  const [generando, setGenerando] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const reporteRef = useRef(null);
  const [logoUrl, setLogoUrl] = useState("");

  // --- ESTADOS DEL DASHBOARD ---
  const [escala, setEscala] = useState(1);
  const vistaPreviaRef = useRef(null);
  const [filtroTiempo, setFiltroTiempo] = useState('este_ano');

  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion_tienda').select('logo_url').eq('id', 1).maybeSingle();
      if (data?.logo_url) setLogoUrl(data.logo_url);
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

    switch (filtroTiempo) {
      case 'este_mes': return new Date(año, mes, 1);
      case '3_meses': return new Date(año, mes - 2, 1);
      case '6_meses': return new Date(año, mes - 5, 1);
      case 'este_ano': return new Date(año, 0, 1);
      default: return new Date(2000, 0, 1);
    }
  };

  const fechaInicioFiltro = obtenerRangoInicio();

  const ventasFiltradas = ventas.filter(v => {
    if (v.estado === 'Anulada') return false;
    const fechaVenta = obtenerFechaSegura(v);
    return fechaVenta >= fechaInicioFiltro;
  });


  // --- CÁLCULOS FINANCIEROS (Basados en el filtro seleccionado) ---
  const ingresoCobrado = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.ingreso_total_cliente || 0), 0);
  const costoMercanciaVendida = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.costo_total_productos || 0), 0);
  const gastosLogistica = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.costo_envio_transporte || 0), 0);
  const comisionesMetodosPago = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.comision_metodo_pago || 0), 0);
  const totalDescuentos = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.descuento || 0), 0);
  const gananciaNetaTotal = ventasFiltradas.reduce((acc, v) => acc + parseFloat(v.ganancia_neta_limpia || 0), 0);

  // ARREGLO CONTABLE: Sumar el descuento para presentar las ventas brutas reales en el P&L
  const ingresoBrutoTotal = ingresoCobrado + totalDescuentos;

  const margenGanancia = ingresoBrutoTotal > 0 ? ((gananciaNetaTotal / ingresoBrutoTotal) * 100).toFixed(1) : 0;

  const inversionTotalHistorica = lotes.reduce((acc, l) => acc + (parseFloat(l.costo_unitario) * parseInt(l.cantidad_inicial)), 0);
  const valorInventarioActual = lotes.reduce((acc, l) => acc + (parseFloat(l.costo_unitario) * parseInt(l.cantidad_disponible)), 0);


  // --- LÓGICA PARA FASE 4: DESGLOSE DE PRODUCTOS Y CANALES ---
  const productosMap = {};
  ventasFiltradas.forEach(venta => {
    if (venta.detalles_venta_operativa) {
      venta.detalles_venta_operativa.forEach(detalle => {
        const prodId = detalle.producto_id;
        const productoReal = productos?.find(p => p.id === prodId);
        const nombreProd = productoReal?.titulo || `Producto #${prodId.substring(0, 6)}`;

        let imgProd = null;
        if (productoReal) {
          if (productoReal.imagenes && Array.isArray(productoReal.imagenes) && productoReal.imagenes.length > 0) imgProd = productoReal.imagenes[0];
          else if (typeof productoReal.imagenes === 'string' && productoReal.imagenes.startsWith('[')) {
            try { imgProd = JSON.parse(productoReal.imagenes)[0]; } catch (e) { }
          } else {
            imgProd = productoReal.imagen_principal || productoReal.imagen_url || productoReal.imagen || null;
          }
        }

        const ingresoBruto = detalle.cantidad * parseFloat(detalle.precio_negociado_unidad || 0);
        const costoInventario = detalle.cantidad * parseFloat(detalle.costo_lote_unidad || 0);
        const gananciaBruta = ingresoBruto - costoInventario;

        if (!productosMap[prodId]) {
          productosMap[prodId] = { nombre: nombreProd, imagen: imgProd, unidades: 0, ganancia: 0, ingreso: 0 };
        }
        productosMap[prodId].unidades += detalle.cantidad;
        productosMap[prodId].ganancia += gananciaBruta;
        productosMap[prodId].ingreso += ingresoBruto;
      });
    }
  });

  // 1. Top Productos por GANANCIA NETA
  const topProductos = Object.values(productosMap)
    .sort((a, b) => b.ganancia - a.ganancia)
    .slice(0, 5)
    .map(p => ({
      nombre: p.nombre,
      imagen: p.imagen,
      unidades: p.unidades,
      ganancia: p.ganancia,
      margen: p.ingreso > 0 ? `${((p.ganancia / p.ingreso) * 100).toFixed(1)}%` : "0%"
    }));

  // 2. Top Productos por MAYOR DEMANDA (Unidades)
  const masVendidos = Object.values(productosMap)
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 5)
    .map(p => ({
      nombre: p.nombre,
      imagen: p.imagen,
      unidades: p.unidades,
      ganancia: p.ganancia,
      margen: p.ingreso > 0 ? `${((p.ganancia / p.ingreso) * 100).toFixed(1)}%` : "0%"
    }));

  // 3. Calcular Desglose de Canales de Venta
  const canalesMap = {};
  let totalEnvios = 0;

  ventasFiltradas.forEach(v => {
    const canal = v.tipo_entrega || "Local / Retiro";
    canalesMap[canal] = (canalesMap[canal] || 0) + 1;
    totalEnvios++;
  });

  const coloresCanales = {
    "Express": "bg-[#0f3faf]", "Express SV": "bg-[#0f3faf]",
    "Forza": "bg-[#E63946]",
    "Local": "bg-emerald-500", "Local / Retiro": "bg-emerald-500", "Normal": "bg-emerald-500"
  };

  const datosCanalesReales = Object.keys(canalesMap).map(canal => ({
    canal: canal,
    porcentaje: totalEnvios > 0 ? Math.round((canalesMap[canal] / totalEnvios) * 100) : 0,
    color: coloresCanales[canal] || "bg-gray-500"
  })).sort((a, b) => b.porcentaje - a.porcentaje);

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
      const ingresoReal = parseFloat(v.ingreso_total_cliente || 0) + parseFloat(v.descuento || 0); // Ajuste contable 
      datosGrafica[mesIndex].ingresos += ingresoReal;
      datosGrafica[mesIndex].ganancia += parseFloat(v.ganancia_neta_limpia || 0);
    }
  });


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

      {/* 1. HERO BANNER (FASE 1) */}
      <DashboardHeader
        tituloPeriodo={tituloDinamico}
        gananciaNeta={gananciaNetaTotal}
        gananciaAnterior={0}
        ventasBrutas={ingresoBrutoTotal}
        ventasAnterior={0}
        metaPeriodo={2000}
        margenGanancia={margenGanancia}
        onGenerarReporte={() => setMostrarReporte(true)}
      />

      {/* CONTROLES DE FILTRO DE TIEMPO */}
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

      {/* 2. MÉTRICAS OPERATIVAS (FASE 2) */}
      <DashboardKPIs
        costoMercancia={costoMercanciaVendida}
        gastosLogistica={gastosLogistica}
        comisiones={comisionesMetodosPago}
        descuentos={totalDescuentos}
        valorInventario={valorInventarioActual}
        totalPedidos={ventasFiltradas.length}
        ventasBrutas={ingresoBrutoTotal}
      />

      {/* 3. GRÁFICA DE TENDENCIA ANUAL (FASE 3) */}
      <DashboardCharts
        datosGrafica={datosGrafica}
        añoActual={añoActual}
        metaMensual={500}
      />

      {/* 4. DESGLOSE EJECUTIVO (FASE 4) - CON 2 TABLAS */}
      <DashboardBreakdown 
        productosRentables={topProductos}
        productosMasVendidos={masVendidos}
        datosCanales={datosCanalesReales}
      />

      {/* 5. ANÁLISIS LOGÍSTICO (FASE 5) */}
      <DashboardLogistica ventasFiltradas={ventasFiltradas} />

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