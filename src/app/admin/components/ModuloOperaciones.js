"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import ModuloInventario from "./ModuloInventario";
import ModuloCaja from "./ModuloCaja";
import ModuloDashboard from "./ModuloDashboard";
import ModuloHistorial from "./ModuloHistorial";

export default function ModuloOperaciones({ productos }) {
  const [pestaña, setPestaña] = useState("ventas");
  const [lotes, setLotes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [ticketActual, setTicketActual] = useState(null);
  const ticketRef = useRef(null);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => { 
    // Detecta automáticamente si estás en Localhost o Vercel
    setBaseUrl(window.location.origin);
    cargarDatos(); 
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    const { data: dataLotes } = await supabase.from("lotes_inventario").select("*").order("fecha_ingreso", { ascending: false });
    if (dataLotes) setLotes(dataLotes);

    const { data: dataVentas } = await supabase.from("ventas_operativas").select(`*, detalles_venta_operativa (*)`).order("fecha_venta", { ascending: false });
    if (dataVentas) setVentas(dataVentas);
    setCargando(false);
  };

  const prepararTicket = (venta_o_ticketGenerado) => {
    if (venta_o_ticketGenerado.items) {
      setTicketActual(venta_o_ticketGenerado);
    } else {
      let totalProductosVenta = 0;
      const itemsAgrupados = {};
      
      venta_o_ticketGenerado.detalles_venta_operativa.forEach(d => {
        if(!itemsAgrupados[d.producto_id]) {
          const prod = productos.find(p=> p.id === d.producto_id);
          itemsAgrupados[d.producto_id] = { titulo: prod?.titulo || "Producto", cantidad: 0, precio_unitario: d.precio_negociado_unidad };
        }
        itemsAgrupados[d.producto_id].cantidad += d.cantidad;
        totalProductosVenta += (d.cantidad * d.precio_negociado_unidad);
      });
      
      setTicketActual({
        id: venta_o_ticketGenerado.id, 
        fecha: new Date(venta_o_ticketGenerado.fecha_venta).toLocaleString(), 
        cliente: venta_o_ticketGenerado.cliente_nombre || "Público General",
        departamento: venta_o_ticketGenerado.departamento, 
        tipo_entrega: venta_o_ticketGenerado.tipo_entrega, 
        items: Object.values(itemsAgrupados),
        envio_cobrado: parseFloat(venta_o_ticketGenerado.envio_cobrado_cliente || 0), 
        descuento: parseFloat(venta_o_ticketGenerado.descuento || 0),
        total: parseFloat(venta_o_ticketGenerado.ingreso_total_cliente || 0),
        subtotal: totalProductosVenta
      });
    }
  };

  // --- EXPORTACIÓN CALIDAD ALTA (Max ~1MB) ---
  const exportarTicketImagen = async () => {
    if (!ticketRef.current) return;
    const canvas = await html2canvas(ticketRef.current, { scale: 4 }); // Escala alta para nitidez
    const image = canvas.toDataURL("image/jpeg", 1.0); // Calidad Máxima JPEG
    const link = document.createElement("a"); link.href = image; link.download = `Ticket_${ticketActual.id}.jpg`; link.click();
  };

  const exportarTicketPDF = async () => {
    if (!ticketRef.current) return;
    const canvas = await html2canvas(ticketRef.current, { scale: 4 }); // Letras súper definidas
    const imgData = canvas.toDataURL("image/jpeg", 0.95); // Compresión ligera para peso ideal
    
    const pdfWidth = 80; 
    const imgProps = new jsPDF().getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfWidth, pdfHeight] });
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Ticket_TechUniverse_${ticketActual.id}.pdf`);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border animate-fade-in max-w-7xl mx-auto relative">
      <div className="mb-6">
        <h2 className="font-black text-2xl sm:text-3xl text-gray-900 tracking-tight">Caja, Finanzas y Operaciones</h2>
      </div>

      <div className="flex flex-wrap gap-2 bg-gray-100/80 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setPestaña("lotes")} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${pestaña === "lotes" ? "bg-white text-[#0f3faf] shadow-sm" : "text-gray-500"}`}>📦 Inventario</button>
        <button onClick={() => setPestaña("ventas")} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${pestaña === "ventas" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}>🛒 POS (Caja)</button>
        <button onClick={() => setPestaña("estadisticas")} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${pestaña === "estadisticas" ? "bg-white text-[#0f3faf] shadow-sm" : "text-gray-500"}`}>📈 Dashboard</button>
        <button onClick={() => setPestaña("historial")} className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${pestaña === "historial" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>🧾 Historial</button>
      </div>

      {cargando ? (
        <div className="py-20 text-center font-bold text-gray-400">Sincronizando operaciones...</div>
      ) : (
        <>
          {pestaña === "lotes" && <ModuloInventario productos={productos} lotes={lotes} recargarDatos={cargarDatos} />}
          {pestaña === "ventas" && <ModuloCaja productos={productos} lotes={lotes} recargarDatos={cargarDatos} onTicketGenerado={prepararTicket} />}
          {pestaña === "estadisticas" && <ModuloDashboard ventas={ventas} lotes={lotes} />}
          {pestaña === "historial" && <ModuloHistorial ventas={ventas} productos={productos} onVerTicket={prepararTicket} recargarDatos={cargarDatos} />}
        </>
      )}

      {/* --- MODAL DEL TICKET GENERADOR --- */}
      {ticketActual && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            <div className="bg-gray-200 p-8 flex justify-center items-start overflow-y-auto w-full md:w-1/2">
              
              {/* ÁREA DE IMPRESIÓN DEL TICKET (Diseño Ajustado) */}
              <div ref={ticketRef} className="bg-white shadow-sm p-6 pb-8 w-[80mm] min-w-[300px] shrink-0 mx-auto" style={{ fontFamily: "'Courier New', Courier, monospace", color: "#000" }}>
                
                {/* Cabecera */}
                <div className="text-center mb-5">
                  <h1 className="text-2xl font-black mb-1 leading-none tracking-tighter">TECH UNIVERSE</h1>
                  <p className="text-[11px] font-bold">Tecnología y Herramientas</p>
                  <p className="text-[11px]">San Miguel, El Salvador</p>
                  <p className="text-[11px]">WhatsApp: +503 0000-0000</p>
                </div>
                
                {/* Info Cliente */}
                <div className="text-[11px] mb-3 border-b-2 border-dashed border-gray-400 pb-3">
                  <p><strong>Ticket ID:</strong> TKT-{ticketActual.id.toString().padStart(6, '0')}</p>
                  <p><strong>Fecha:</strong> {ticketActual.fecha}</p>
                  <p><strong>Cliente:</strong> {ticketActual.cliente.toUpperCase()}</p>
                  <p><strong>Destino:</strong> {ticketActual.departamento.toUpperCase()} ({ticketActual.tipo_entrega.toUpperCase()})</p>
                </div>
                
                {/* Lista de Productos (Sin envíos mezclados) */}
                <div className="text-[12px] font-bold pb-2">
                  <div className="flex justify-between mb-2 border-b border-black pb-1">
                    <span className="w-8">Cant</span>
                    <span className="flex-1 text-left px-1">Artículo</span>
                    <span className="w-16 text-right">Importe</span>
                  </div>
                  {ticketActual.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-1.5 items-start font-normal">
                      <span className="w-8 text-center">{item.cantidad}</span>
                      <span className="flex-1 text-left px-1 leading-tight">{item.titulo.toUpperCase()}</span>
                      <span className="w-16 text-right">${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Sección de Cargos y Envíos Separada */}
                <div className="text-[12px] font-normal border-t border-dashed border-gray-400 pt-2 mb-3 space-y-1">
                  <div className="flex justify-between text-right">
                     <span className="flex-1 font-bold">SUBTOTAL:</span>
                     <span className="w-20">${ticketActual.subtotal?.toFixed(2) || (ticketActual.total - (ticketActual.envio_cobrado||0) + (ticketActual.descuento||0)).toFixed(2)}</span>
                  </div>
                  
                  {ticketActual.descuento > 0 && (
                    <div className="flex justify-between text-right">
                       <span className="flex-1 text-gray-600">DESCUENTO:</span>
                       <span className="w-20 text-gray-600">-${ticketActual.descuento.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {ticketActual.envio_cobrado > 0 && (
                    <div className="flex justify-between text-right mt-1">
                       <span className="flex-1 font-bold uppercase tracking-wider">COSTO DE ENVÍO:</span>
                       <span className="w-20 font-bold">${ticketActual.envio_cobrado.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                {/* Total Final */}
                <div className="text-right text-[16px] font-black pt-2 border-t-2 border-black">
                  <p>TOTAL A PAGAR: ${ticketActual.total.toFixed(2)}</p>
                </div>
                
                {/* QR y Despedida */}
                <div className="text-center text-[11px] mt-6">
                  <p className="mb-4 font-black">¡GRACIAS POR SU COMPRA!</p>
                  <p className="mb-2">Escanee para ver su comprobante:</p>
                  <div className="flex justify-center mb-2">
                    {/* El QR ahora usa baseUrl dinámico para que funcione en Localhost y Vercel */}
                    <QRCodeCanvas value={`${baseUrl}/comprobante/${ticketActual.id}`} size={120} level="H" />
                  </div>
                  <p className="mt-5 text-[9px] text-gray-500 font-bold uppercase">Este documento es para control interno.</p>
                </div>
              </div>

            </div>
            
            {/* Panel de Botones */}
            <div className="p-6 md:p-10 w-full md:w-1/2 flex flex-col justify-center bg-gray-50 border-l">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Tu Ticket está listo</h3>
              <p className="text-sm text-gray-500 mb-8">El PDF genera letras en Alta Resolución. El costo de envío ahora está separado visualmente del producto.</p>
              <div className="space-y-3">
                <button onClick={exportarTicketImagen} className="w-full bg-[#0f3faf] text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-800 flex items-center justify-center gap-3 transition-transform active:scale-95">
                  <span className="text-xl">🖼️</span> Descargar Imagen (WhatsApp)
                </button>
                <button onClick={exportarTicketPDF} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-black flex items-center justify-center gap-3 transition-transform active:scale-95">
                  <span className="text-xl">📄</span> Descargar PDF (Ticketera 80mm)
                </button>
              </div>
              <button onClick={() => setTicketActual(null)} className="mt-8 text-gray-400 font-bold hover:text-gray-800">
                Cerrar vista previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}