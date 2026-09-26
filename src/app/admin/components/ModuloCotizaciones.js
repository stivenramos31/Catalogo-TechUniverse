"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const cargarCotizaciones = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("cotizaciones")
      .select(`
        *,
        detalles_cotizacion (
          id,
          cantidad,
          precio_unitario,
          producto_id,
          productos (
            titulo,
            imagenes
          )
        )
      `)
      .order("creado_en", { ascending: false });

    if (error) {
      // Fallback por si la columna de fecha se llama id o created_at
      const { data: fallbackData } = await supabase
        .from("cotizaciones")
        .select(`
          *,
          detalles_cotizacion (
            id,
            cantidad,
            precio_unitario,
            producto_id,
            productos (
              titulo,
              imagenes
            )
          )
        `)
        .order("id", { ascending: false });
      if (fallbackData) setCotizaciones(fallbackData);
    } else if (data) {
      setCotizaciones(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from("cotizaciones")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar estado: " + error.message);
    } else {
      cargarCotizaciones();
    }
  };

  const eliminarCotizacion = async (id, folio) => {
    if (window.confirm(`¿Seguro que deseas eliminar la Cotización #${folio}?`)) {
      await supabase.from("detalles_cotizacion").delete().eq("cotizacion_id", id);
      const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
      if (error) alert("Error al eliminar: " + error.message);
      else cargarCotizaciones();
    }
  };

  const responderWhatsApp = (cot) => {
    const numeroLimpio = (cot.telefono_whatsapp || "").replace(/\D/g, "");
    if (!numeroLimpio || numeroLimpio.length < 8) {
      return alert("Esta es una cotización Express sin teléfono registrado. Espera el mensaje del cliente en tu WhatsApp.");
    }

    const folioMostrar = cot.numero_folio || cot.id;
    const origenUrl = typeof window !== "undefined" ? window.location.origin : "";
    const enlacePublico = cot.token_publico ? `\n🔗 Comprobante oficial: ${origenUrl}/cotizacion/${cot.token_publico}` : "";

    const listaArticulos = (cot.detalles_cotizacion || [])
      .map(
        (d) =>
          `• ${d.cantidad}x ${d.productos?.titulo || "Producto"} ($${parseFloat(
            d.precio_unitario
          ).toFixed(2)} c/u)`
      )
      .join("\n");

    const subtotalNum = parseFloat(cot.subtotal || cot.total_estimado || 0);
    const descuentoNum = parseFloat(cot.descuento_aplicado || 0);
    const totalNum = parseFloat(cot.total_estimado || 0);

    let desglosePago = `\n*Total a pagar: $${totalNum.toFixed(2)}*`;
    if (cot.codigo_cupon && descuentoNum > 0) {
      desglosePago = `\nSubtotal: $${subtotalNum.toFixed(2)}\nCupón (${cot.codigo_cupon}): -$${descuentoNum.toFixed(2)}\n*Total Final: $${totalNum.toFixed(2)}*`;
    }

    const mensaje = `¡Hola *${cot.nombre_cliente}*! 👋 Te escribimos de *TECH UNIVERSE* respecto a tu *Cotización #${folioMostrar}*:\n\n${listaArticulos}\n${desglosePago}\n📍 Zona: ${cot.cliente_zona || "Por coordinar"}${enlacePublico}\n\n¿Confirmamos tu pedido para coordinar la entrega?`;

    window.open(`https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const cotizacionesFiltradas = cotizaciones.filter((c) =>
    filtroEstado === "Todos" ? true : (c.estado || "Pendiente") === filtroEstado
  );

  const coloresEstado = {
    Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
    "En Proceso": "bg-blue-100 text-blue-800 border-blue-300",
    Completada: "bg-green-100 text-green-800 border-green-300",
    Cancelada: "bg-red-100 text-red-700 border-red-300",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="font-black text-2xl text-gray-800">📄 Bandeja de Cotizaciones</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Folios consecutivos, enlaces blindados y detección de ubicación por IP pública.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Todos", "Pendiente", "En Proceso", "Completada", "Cancelada"].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors border ${
                filtroEstado === est
                  ? "bg-[#0f3faf] text-white border-[#0f3faf]"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="py-16 text-center text-gray-400 font-bold">
          Cargando solicitudes...
        </div>
      ) : cotizacionesFiltradas.length === 0 ? (
        <div className="py-16 text-center text-gray-400 font-bold border rounded-2xl bg-gray-50">
          No hay cotizaciones en esta categoría.
        </div>
      ) : (
        <div className="space-y-6">
          {cotizacionesFiltradas.map((cot) => {
            const tieneCupon = cot.codigo_cupon && parseFloat(cot.descuento_aplicado || 0) > 0;
            const subtotalMostrar = parseFloat(cot.subtotal || cot.total_estimado || 0);
            const descuentoMostrar = parseFloat(cot.descuento_aplicado || 0);
            const totalMostrar = parseFloat(cot.total_estimado || 0);
            const folioMostrar = cot.numero_folio || String(cot.id).slice(0, 4);

            return (
              <div
                key={cot.id}
                className="border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:border-blue-200 transition-colors"
              >
                {/* Cabecera del Pedido */}
                <div className="bg-gray-50 px-5 py-3.5 border-b flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="bg-[#0f3faf] text-white font-black text-sm px-3.5 py-1.5 rounded-xl shadow-xs whitespace-nowrap">
                      #{folioMostrar}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-gray-900 text-base">
                          {cot.nombre_cliente}
                        </h3>
                        {cot.token_publico && (
                          <a
                            href={`/cotizacion/${cot.token_publico}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] bg-blue-50 text-[#0f3faf] border border-blue-200 px-2.5 py-0.5 rounded-lg font-black hover:bg-blue-100"
                          >
                            🔗 Ver Comprobante Oficial
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">
                        📍 Entrega: <strong>{cot.cliente_zona || "Sin datos de envío"}</strong> • 📞 {cot.telefono_whatsapp}
                      </p>
                      {/* Etiqueta de Ubicación por IP Pública */}
                      <p className="text-[11px] text-purple-800 font-bold bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md inline-block mt-1.5">
                        🌐 IP: {cot.ip_publica || "No registrada"} • 📌 Desde: {cot.ubicacion_ip || "El Salvador"} ({cot.dispositivo || "Web"})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={cot.estado || "Pendiente"}
                      onChange={(e) => cambiarEstado(cot.id, e.target.value)}
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border outline-none cursor-pointer ${
                        coloresEstado[cot.estado || "Pendiente"]
                      }`}
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="En Proceso">🚚 En Proceso</option>
                      <option value="Completada">✅ Completada</option>
                      <option value="Cancelada">❌ Cancelada</option>
                    </select>

                    <button
                      onClick={() => responderWhatsApp(cot)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
                    >
                      📱 WhatsApp
                    </button>

                    <button
                      onClick={() => eliminarCotizacion(cot.id, folioMostrar)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black px-3 py-1.5 rounded-xl transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Lista de Artículos Solicitados */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 divide-y divide-gray-100">
                    {(cot.detalles_cotizacion || []).map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.productos?.imagenes?.[0] || "/favicon.ico"}
                            alt=""
                            className="w-11 h-11 rounded-lg border object-contain bg-white p-0.5 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                              {item.productos?.titulo || `Producto`}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              Cantidad: <strong className="text-gray-900">{item.cantidad}</strong> × $
                              {parseFloat(item.precio_unitario).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-gray-900 text-sm">
                          ${(item.cantidad * item.precio_unitario).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Resumen Financiero */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Subtotal:</span>
                      <span>${subtotalMostrar.toFixed(2)}</span>
                    </div>

                    {tieneCupon ? (
                      <div className="flex justify-between items-center text-xs font-black text-[#e11d48] bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100">
                        <span>🏷️ Cupón ({cot.codigo_cupon}):</span>
                        <span>-${descuentoMostrar.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs text-gray-400 font-medium">
                        <span>Descuento:</span>
                        <span>$0.00</span>
                      </div>
                    )}

                    <div className="border-t pt-2 flex justify-between items-baseline">
                      <span className="text-xs font-black text-gray-800 uppercase">
                        Total a Cobrar:
                      </span>
                      <span className="text-2xl font-black text-green-600">
                        ${totalMostrar.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}