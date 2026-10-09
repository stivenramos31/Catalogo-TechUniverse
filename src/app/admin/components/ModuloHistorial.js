"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const DEPARTAMENTOS_SV = ["San Miguel", "San Salvador", "Santa Ana", "La Libertad", "Usulután", "Sonsonate", "La Unión", "La Paz", "Chalatenango", "Cuscatlán", "Ahuachapán", "Morazán", "San Vicente", "Cabañas"];

export default function ModuloHistorial({ ventas, recargarDatos }) {
  // ESTADO NUEVO: Lista dinámica para que la pantalla se actualice al instante
  const [listaVentas, setListaVentas] = useState([]);
  
  const [procesando, setProcesando] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  
  // Estados modales
  const [ventaAEditar, setVentaAEditar] = useState(null);
  const [formEdicion, setFormEdicion] = useState({ cliente_nombre: "", cliente_telefono: "", departamento: "San Miguel" });
  
  const [ventaAAuditar, setVentaAAuditar] = useState(null);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  
  const [ventaAAnular, setVentaAAnular] = useState(null);

  // Estados ticket
  const [ticketAbierto, setTicketAbierto] = useState(null);
  const [detallesTicket, setDetallesTicket] = useState([]);
  const ticketRef = useRef(null);

  // Sincronizar la base de datos con la pantalla
  useEffect(() => {
    if (ventas) {
      setListaVentas(ventas);
    }
  }, [ventas]);

  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion_tienda').select('logo_url').eq('id', 1).maybeSingle();
      if(data?.logo_url) setLogoUrl(data.logo_url);
    };
    cargarConfig();
  }, []);

  const obtenerFechaSegura = (venta) => venta.fecha_venta || venta.created_at || venta.fecha || null;

  const formatearFechaTicket = (fechaStr) => {
    if (!fechaStr) return "Fecha no registrada";
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return "Fecha desconocida";
    
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    let horas = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const seg = String(d.getSeconds()).padStart(2, '0');
    const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
    horas = horas % 12;
    horas = horas ? horas : 12;
    
    return `${dia}/${mes}/${anio}, ${horas}:${min}:${seg} ${ampm}`;
  };

  const calcularHorasPasadas = (venta) => {
    const fechaStr = obtenerFechaSegura(venta);
    if (!fechaStr) return 0; 
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return 0;
    return (new Date() - d) / (1000 * 60 * 60);
  };

  // --- LÓGICA DE EDICIÓN ---
  const abrirEdicion = (venta) => {
    setFormEdicion({
      cliente_nombre: venta.cliente_nombre || "",
      cliente_telefono: venta.cliente_telefono || "",
      departamento: venta.departamento || "San Miguel"
    });
    setVentaAEditar(venta);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!ventaAEditar) return;
    setProcesando(true);
    
    try {
      const idParaActualizar = parseInt(ventaAEditar.id, 10);
      
      const { data, error } = await supabase
        .from("ventas_operativas")
        .update({ 
          cliente_nombre: formEdicion.cliente_nombre.trim(), 
          cliente_telefono: formEdicion.cliente_telefono.trim(),
          departamento: formEdicion.departamento
        })
        .eq("id", idParaActualizar)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Supabase rechazó la actualización.");

      // ¡AQUÍ ESTÁ LA MAGIA! Le decimos a React que redibuje la pantalla con los datos nuevos
      setListaVentas(listaAnterior => listaAnterior.map(v => 
        v.id === idParaActualizar 
          ? { 
              ...v, 
              cliente_nombre: formEdicion.cliente_nombre.trim(), 
              cliente_telefono: formEdicion.cliente_telefono.trim(), 
              departamento: formEdicion.departamento 
            } 
          : v
      ));

      alert("✅ Datos actualizados correctamente.");
      setVentaAEditar(null);
      
      // Intentamos refrescar la base por detrás
      if (typeof recargarDatos === 'function') {
        recargarDatos();
      }
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  // --- LÓGICA DE AUDITORÍA ---
  const abrirAuditoria = (venta) => {
    setVentaAAuditar(venta);
    setTextoConfirmacion("");
  };

  const confirmarAuditoria = async () => {
    if (textoConfirmacion !== "CONFIRMAR") return;
    setProcesando(true);
    try {
      const idNumerico = Number(ventaAAuditar.id);
      const { error } = await supabase
        .from("ventas_operativas")
        .update({ estado: 'Auditada' })
        .eq("id", idNumerico);

      if (error) throw error;

      // Actualizamos la pantalla instantáneamente
      setListaVentas(lista => lista.map(v => v.id === idNumerico ? { ...v, estado: 'Auditada' } : v));

      alert("🔒 Venta auditada y bloqueada con éxito.");
      setVentaAAuditar(null);
      if (typeof recargarDatos === 'function') recargarDatos();
    } catch (error) {
      alert("Error al auditar: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  // --- LÓGICA DE ANULAR ---
  const confirmarAnular = async () => {
    setProcesando(true);
    try {
      const idNumerico = Number(ventaAAnular.id);
      const { error } = await supabase
        .from("ventas_operativas")
        .update({ estado: 'Anulada' })
        .eq("id", idNumerico);

      if (error) throw error;

      // Actualizamos la pantalla instantáneamente
      setListaVentas(lista => lista.map(v => v.id === idNumerico ? { ...v, estado: 'Anulada' } : v));

      alert("🗑️ Venta anulada.");
      setVentaAAnular(null);
      if (typeof recargarDatos === 'function') recargarDatos();
    } catch (error) {
      alert("Error al anular: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  // --- LÓGICA DEL TICKET ---
  const abrirTicket = async (venta) => {
    setProcesando(true);
    try {
      const { data: detalles, error: errorDetalles } = await supabase
        .from("detalles_venta_operativa")
        .select("cantidad, precio_negociado_unidad, producto_id")
        .eq("venta_operativa_id", venta.id);

      if (errorDetalles) throw errorDetalles;

      const { data: productos } = await supabase.from("productos").select("id, titulo");
      
      const detallesCompletos = detalles.map(d => ({
        ...d,
        titulo: productos?.find(p => p.id === d.producto_id)?.titulo || "Producto"
      }));

      setDetallesTicket(detallesCompletos);
      setTicketAbierto(venta);
    } catch (error) {
      alert("Error al cargar el ticket: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const calcularSubtotal = () => {
    return detallesTicket.reduce((sum, item) => sum + (item.cantidad * item.precio_negociado_unidad), 0);
  };

  const capturarCanvasSeguro = async () => {
    const element = ticketRef.current;
    const parent = element.parentElement;
    const oldOverflow = parent.style.overflow;
    const oldMaxHeight = parent.style.maxHeight;
    const oldHeight = parent.style.height;

    parent.style.overflow = "visible";
    parent.style.maxHeight = "none";
    parent.style.height = "auto";

    const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: "#ffffff", scrollY: -window.scrollY });

    parent.style.overflow = oldOverflow;
    parent.style.maxHeight = oldMaxHeight;
    parent.style.height = oldHeight;

    return canvas;
  };

  const descargarTicketImagen = async () => {
    if (!ticketRef.current) return;
    setProcesando(true);
    try {
      const canvas = await capturarCanvasSeguro();
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const link = document.createElement("a"); 
      link.href = imgData; link.download = `TKT-${String(ticketAbierto.id).padStart(6, '0')}.jpg`; link.click();
    } catch (error) { alert("Error al generar imagen."); } finally { setProcesando(false); }
  };

  const descargarTicketPDF80 = async () => {
    if (!ticketRef.current) return;
    setProcesando(true);
    try {
      const canvas = await capturarCanvasSeguro();
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdfTemporal = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 500] }); 
      const imgProps = pdfTemporal.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * 80) / imgProps.width;
      const pdfFinal = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, pdfHeight] });
      pdfFinal.addImage(imgData, "JPEG", 0, 0, 80, pdfHeight);
      pdfFinal.save(`TKT-${String(ticketAbierto.id).padStart(6, '0')}_80mm.pdf`);
    } catch (error) { alert("Error al generar PDF."); } finally { setProcesando(false); }
  };

  const descargarTicketPDF57 = async () => {
    if (!ticketRef.current) return;
    setProcesando(true);
    try {
      const canvas = await capturarCanvasSeguro();
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdfTemporal = new jsPDF({ orientation: "portrait", unit: "mm", format: [57, 500] }); 
      const imgProps = pdfTemporal.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * 57) / imgProps.width;
      const pdfFinal = new jsPDF({ orientation: "portrait", unit: "mm", format: [57, pdfHeight] });
      pdfFinal.addImage(imgData, "JPEG", 0, 0, 57, pdfHeight);
      pdfFinal.save(`TKT-${String(ticketAbierto.id).padStart(6, '0')}_MINI_57mm.pdf`);
    } catch (error) { alert("Error al generar PDF."); } finally { setProcesando(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full pb-20">
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl border border-blue-200 text-sm font-bold text-center flex items-center justify-center gap-2">
        <span>🔒</span> POR SEGURIDAD, LAS VENTAS SE AUTO-AUDITAN Y BLOQUEAN AL PASAR 72 HORAS.
      </div>

      <div className="space-y-4">
        {listaVentas.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-bold">No hay ventas registradas aún.</p>
          </div>
        ) : (
          listaVentas.sort((a, b) => new Date(obtenerFechaSegura(b)) - new Date(obtenerFechaSegura(a))).map((venta) => {
            
            const horasPasadas = calcularHorasPasadas(venta);
            const esAutoAuditada = horasPasadas >= 72;
            const esAuditadaManual = venta.estado === 'Auditada';
            const esAuditada = esAuditadaManual || esAutoAuditada;
            const esAnulada = venta.estado === 'Anulada';
            const sePuedeEditar = !esAuditada && !esAnulada;
            
            const ticketIdFormateado = `TKT-${String(venta.id).padStart(6, '0')}`;

            return (
              <div key={venta.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${esAuditada ? 'border-yellow-300 bg-yellow-50/30' : ''} ${esAnulada ? 'opacity-60 grayscale' : ''}`}>
                
                {/* Info Cliente */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xl">{esAuditada ? '🔒' : '👤'}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 leading-tight">
                      {venta.cliente_nombre || "Público General"}
                    </h4>
                    {venta.cliente_telefono && (
                      <p className="text-[11px] font-bold text-gray-500 mt-0.5">📞 {venta.cliente_telefono}</p>
                    )}
                    <p className="text-[10px] font-bold text-gray-400 mt-1">
                      <span className="text-gray-600 mr-2">{ticketIdFormateado}</span> | {new Date(obtenerFechaSegura(venta)).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-[#0f3faf] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
                        {venta.departamento ? `${venta.departamento} - ` : ''}{venta.tipo_entrega}
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded">
                        Ganancia: ${parseFloat(venta.ganancia_neta_limpia || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones e Importe */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                  <div className="text-right px-0 sm:px-4 sm:border-r border-gray-100 w-full sm:w-auto mb-2 sm:mb-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cobrado</p>
                    <p className="text-xl font-black text-gray-900">${parseFloat(venta.ingreso_total_cliente || 0).toFixed(2)}</p>
                  </div>
                  
                  {/* BOTONERA RESPONSIVA */}
                  <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto">
                    
                    <button onClick={() => abrirTicket(venta)} disabled={procesando} title="Ticket" className="bg-gray-900 text-white font-black px-3 py-2 sm:px-4 sm:py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50">
                      <span className="text-base sm:text-xs">📄</span><span className="hidden sm:inline text-xs">Ticket</span>
                    </button>
                    
                    {esAuditada ? (
                      <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-black text-xs border border-yellow-200">
                        <span className="text-base sm:text-xs">🔒</span><span className="hidden sm:inline ml-1">{esAuditadaManual ? "Auditada" : "Audit. (72h)"}</span>
                      </div>
                    ) : esAnulada ? (
                      <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-black text-xs border border-red-200">
                        <span className="text-base sm:text-xs">❌</span><span className="hidden sm:inline ml-1">Anulada</span>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => abrirEdicion(venta)} title="Editar" className="text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-black px-3 py-2 sm:px-3 sm:py-3 rounded-xl transition-colors flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-base sm:text-xs">✏️</span><span className="hidden sm:inline text-xs">Editar</span>
                        </button>
                        
                        <button onClick={() => setVentaAAnular(venta)} title="Anular Venta" className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-black px-3 py-2 sm:px-3 sm:py-3 rounded-xl transition-colors flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-base sm:text-xs">🗑️</span><span className="hidden sm:inline text-xs">Anular</span>
                        </button>

                        <button onClick={() => abrirAuditoria(venta)} title="Auditar" className="text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 font-black px-3 py-2 sm:px-3 sm:py-3 rounded-xl transition-colors flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-base sm:text-xs">🛡️</span><span className="hidden sm:inline text-xs">Auditar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- MODAL EDICIÓN --- */}
      {ventaAEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-black text-xl mb-4">✏️ Editar Venta</h3>
            <form onSubmit={guardarEdicion} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nombre del Cliente</label>
                <input type="text" value={formEdicion.cliente_nombre} onChange={(e) => setFormEdicion({...formEdicion, cliente_nombre: e.target.value})} className="w-full border-2 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-[#0f3faf]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                <input type="tel" value={formEdicion.cliente_telefono} onChange={(e) => setFormEdicion({...formEdicion, cliente_telefono: e.target.value})} className="w-full border-2 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-[#0f3faf]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Departamento</label>
                <select value={formEdicion.departamento} onChange={(e) => setFormEdicion({...formEdicion, departamento: e.target.value})} className="w-full border-2 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-[#0f3faf]">
                  {DEPARTAMENTOS_SV.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setVentaAEditar(null)} className="flex-1 bg-gray-100 text-gray-600 font-black py-3 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={procesando} className="flex-1 bg-[#0f3faf] text-white font-black py-3 rounded-xl disabled:opacity-50 shadow-md">
                  {procesando ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL AUDITORÍA --- */}
      {ventaAAuditar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border-t-8 border-yellow-400">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-4xl">🛡️</span></div>
              <h2 className="text-2xl font-black text-gray-900">Auditar Venta</h2>
              <p className="text-sm text-gray-600 font-bold leading-relaxed">
                Bloqueo definitivo para <span className="text-gray-900 font-black">{ventaAAuditar.cliente_nombre || "Público General"}</span>.
              </p>
              <div className="pt-4 text-left">
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
                  Escribe <span className="text-gray-900 font-black">CONFIRMAR</span>:
                </label>
                <input type="text" value={textoConfirmacion} onChange={(e) => setTextoConfirmacion(e.target.value)} placeholder="CONFIRMAR" className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-lg font-black tracking-widest outline-none focus:border-yellow-500 uppercase text-gray-900" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setVentaAAuditar(null)} className="flex-1 bg-gray-100 text-gray-600 font-black py-4 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button onClick={confirmarAuditoria} disabled={textoConfirmacion !== "CONFIRMAR" || procesando} className="flex-1 bg-yellow-500 text-white font-black py-4 rounded-xl hover:bg-yellow-600 transition-colors shadow-lg disabled:opacity-50">
                  {procesando ? "Bloqueando..." : "Bloquear Venta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ANULAR --- */}
      {ventaAAnular && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border-t-8 border-red-500">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-4xl">🗑️</span></div>
              <h2 className="text-2xl font-black text-gray-900">Anular Venta</h2>
              <p className="text-sm text-gray-600 font-bold leading-relaxed">
                Estás a punto de anular la venta de <span className="text-gray-900 font-black">{ventaAAnular.cliente_nombre || "Público General"}</span> por <span className="text-red-500 font-black">${ventaAAnular.ingreso_total_cliente}</span>.
              </p>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setVentaAAnular(null)} className="flex-1 bg-gray-100 text-gray-600 font-black py-4 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button onClick={confirmarAnular} disabled={procesando} className="flex-1 bg-red-500 text-white font-black py-4 rounded-xl hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50">
                  {procesando ? "Anulando..." : "Sí, Anular"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL TICKET --- */}
      {ticketAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md flex flex-col max-h-[98vh]">
            <div className="bg-gray-200 flex-1 overflow-auto rounded-t-3xl border-b-4 border-dashed border-gray-400 relative hide-scrollbar p-4 flex justify-center">
              <div ref={ticketRef} className="bg-white w-[250px] text-black pb-4 pt-6 px-4 font-mono shadow-sm mx-auto flex flex-col h-max" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "11px", lineHeight: "1.4" }}>
                
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold tracking-widest mb-1 leading-none">TECH UNIVERSE</h1>
                  <p className="font-bold">Tecnología y Herramientas</p>
                  <p>San Miguel, El Salvador</p>
                  <p>WhatsApp: +503 0000-0000</p>
                </div>

                <div className="mb-3 text-left space-y-0.5">
                  <p><span className="font-bold">Ticket ID:</span> TKT-{String(ticketAbierto.id).padStart(6, '0')}</p>
                  <p><span className="font-bold">Fecha:</span> {formatearFechaTicket(obtenerFechaSegura(ticketAbierto))}</p>
                  <p><span className="font-bold">Cliente:</span> {ticketAbierto.cliente_nombre?.toUpperCase() || "CONSUMIDOR FINAL"}</p>
                  <p><span className="font-bold">Destino:</span> {ticketAbierto.departamento?.toUpperCase()} {ticketAbierto.tipo_entrega !== "Normal" && `(${ticketAbierto.tipo_entrega?.toUpperCase()})`}</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-400 my-3"></div>

                <div className="flex justify-between font-bold border-b-[1.5px] border-black pb-1 mb-2">
                  <span className="w-8 text-center">Cant</span>
                  <span className="flex-1">Artículo</span>
                  <span className="text-right">Importe</span>
                </div>

                {detallesTicket.map((item, index) => (
                  <div key={index} className="flex justify-between items-start mb-1.5">
                    <span className="w-8 text-center">{item.cantidad}</span>
                    <span className="flex-1 pr-1 uppercase break-words leading-tight">{item.titulo}</span>
                    <span className="text-right">${(item.cantidad * item.precio_negociado_unidad).toFixed(2)}</span>
                  </div>
                ))}

                <div className="border-b-2 border-dashed border-gray-400 my-3"></div>

                <div className="flex flex-col items-end w-full space-y-1 mb-3">
                  <div className="flex justify-between w-[150px]">
                    <span className="font-bold">SUBTOTAL:</span>
                    <span>${calcularSubtotal().toFixed(2)}</span>
                  </div>
                  {parseFloat(ticketAbierto.descuento || 0) > 0 && (
                    <div className="flex justify-between w-[150px]">
                      <span className="font-bold">DESCUENTO:</span>
                      <span>-${parseFloat(ticketAbierto.descuento).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(ticketAbierto.envio_cobrado_cliente || 0) > 0 && (
                    <div className="flex justify-between w-[150px]">
                      <span className="font-bold">COSTO DE ENVÍO:</span>
                      <span className="font-bold">${parseFloat(ticketAbierto.envio_cobrado_cliente).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-b-[3px] border-black my-3"></div>

                <div className="flex justify-end items-center mb-6">
                  <span className="text-[14px] font-bold mr-3 tracking-wide">TOTAL A PAGAR:</span>
                  <span className="text-[15px] font-bold">${parseFloat(ticketAbierto.ingreso_total_cliente).toFixed(2)}</span>
                </div>

                <div className="text-center mt-2 space-y-2">
                  <p className="font-bold tracking-wide">¡GRACIAS POR SU COMPRA!</p>
                  <p className="mt-4 pt-2">Escanee para ver su comprobante:</p>
                  <div className="flex justify-center my-3">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=https://catalogo-tech-universe.vercel.app/comprobante/${ticketAbierto.id}`} alt="QR Comprobante" className="w-[110px] h-[110px]" crossOrigin="anonymous"/>
                  </div>
                  <p className="text-[9px] text-gray-500 pt-3 uppercase tracking-wider">ESTE DOCUMENTO ES PARA CONTROL INTERNO.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-b-3xl grid grid-cols-2 gap-2">
              <button onClick={descargarTicketImagen} disabled={procesando} className="bg-white text-gray-900 font-black text-xs py-3 rounded-xl hover:bg-gray-200">🖼️ Img</button>
              <button onClick={descargarTicketPDF80} disabled={procesando} className="bg-white text-gray-900 font-black text-xs py-3 rounded-xl hover:bg-gray-200">📄 PDF(80)</button>
              <button onClick={descargarTicketPDF57} disabled={procesando} className="bg-emerald-500 text-white font-black text-xs py-3 rounded-xl hover:bg-emerald-600 col-span-2 shadow-lg">🖨️ PDF Mini (57mm)</button>
              <button onClick={() => { setTicketAbierto(null); setDetallesTicket([]); }} className="col-span-2 bg-gray-700 text-white font-black text-xs py-3 rounded-xl hover:bg-gray-600 transition-colors mt-2">Cerrar Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}