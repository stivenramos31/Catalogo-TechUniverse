"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";

export default function CarritoPage() {
  const { cart, eliminarDelCarrito, agregarAlCarrito, vaciarCarrito, total, cantidadTotal } = useCart();
  const [procesando, setProcesando] = useState(false);
  
  // Guarda el recibo recién generado o seleccionado del historial
  const [reciboActivo, setReciboActivo] = useState(null);
  const [historialCliente, setHistorialCliente] = useState([]);

  // Estados para el cupón seguro
  const [codigoInput, setCodigoInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [mensajeCupon, setMensajeCupon] = useState({ texto: "", tipo: "" });

  const [cliente, setCliente] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    zona: "",
    observaciones: ""
  });

  // Cargar historial de cotizaciones del cliente y sus datos de contacto previos
  useEffect(() => {
    try {
      const guardadas = localStorage.getItem("tech_universe_mis_cotizaciones");
      if (guardadas) setHistorialCliente(JSON.parse(guardadas));

      const datosPrevios = localStorage.getItem("tech_universe_datos_cliente");
      if (datosPrevios) setCliente(JSON.parse(datosPrevios));
    } catch (e) {
      console.error("Error leyendo historial local:", e);
    }
  }, []);

  // Revalidar cupón si cambia el subtotal
  useEffect(() => {
    if (cuponAplicado && total > 0) {
      revalidarCuponEnServidor(cuponAplicado.codigo, total);
    } else if (total === 0) {
      setCuponAplicado(null);
      setMensajeCupon({ texto: "", tipo: "" });
    }
  }, [total]);

  const revalidarCuponEnServidor = async (codigo, subtotalActual) => {
    const { data, error } = await supabase.rpc("validar_cupon_seguro", {
      p_codigo: codigo,
      p_subtotal: subtotalActual
    });

    if (error || !data?.valido) {
      setCuponAplicado(null);
      setMensajeCupon({
        texto: data?.mensaje || "El cupón dejó de cumplir las condiciones.",
        tipo: "error"
      });
    } else {
      setCuponAplicado(data);
    }
  };

  const aplicarCupon = async () => {
    if (!codigoInput.trim()) return;
    setValidandoCupon(true);
    setMensajeCupon({ texto: "", tipo: "" });

    try {
      const { data, error } = await supabase.rpc("validar_cupon_seguro", {
        p_codigo: codigoInput.trim().toUpperCase(),
        p_subtotal: total
      });

      if (error) throw error;

      if (!data.valido) {
        setCuponAplicado(null);
        setMensajeCupon({ texto: data.mensaje, tipo: "error" });
      } else {
        setCuponAplicado(data);
        setMensajeCupon({ texto: data.mensaje, tipo: "exito" });
      }
    } catch (err) {
      setMensajeCupon({ texto: "Error al verificar el cupón.", tipo: "error" });
    } finally {
      setValidandoCupon(false);
    }
  };

  const quitarCupon = () => {
    setCuponAplicado(null);
    setCodigoInput("");
    setMensajeCupon({ texto: "", tipo: "" });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!cart || cart.length === 0) return alert("Tu carrito está vacío.");
    setProcesando(true);

    try {
      const itemsSeguros = cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad
      }));

      const { data, error } = await supabase.rpc("crear_cotizacion_segura", {
        p_nombre: cliente.nombre,
        p_correo: cliente.correo,
        p_telefono: cliente.telefono,
        p_zona: cliente.zona,
        p_observaciones: cliente.observaciones,
        p_codigo_cupon: cuponAplicado ? cuponAplicado.codigo : null,
        p_items: itemsSeguros
      });

      if (error) throw error;

      // Construimos el comprobante que le quedará guardado al cliente
      const nuevoRecibo = {
        id: data.cotizacion_id,
        fecha: new Date().toLocaleString(),
        cliente: { ...cliente },
        items: cart.map(i => ({
          id: i.id,
          titulo: i.titulo,
          cantidad: i.cantidad,
          precio_unitario: parseFloat(i.precio_actual),
          imagen: i.imagenes?.[0] || ""
        })),
        subtotal: parseFloat(data.subtotal),
        descuento: parseFloat(data.descuento),
        codigo_cupon: cuponAplicado ? cuponAplicado.codigo : null,
        total_final: parseFloat(data.total_final)
      };

      const nuevoHistorial = [nuevoRecibo, ...historialCliente].slice(0, 15);
      setHistorialCliente(nuevoHistorial);
      localStorage.setItem("tech_universe_mis_cotizaciones", JSON.stringify(nuevoHistorial));
      localStorage.setItem("tech_universe_datos_cliente", JSON.stringify(cliente));

      vaciarCarrito();
      setCuponAplicado(null);
      setReciboActivo(nuevoRecibo);
      window.scrollTo(0, 0);
    } catch (error) {
      alert("No se pudo procesar la cotización: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const descuentoCalculado = cuponAplicado ? parseFloat(cuponAplicado.descuento) : 0;
  const totalFinal = Math.max(total - descuentoCalculado, 0);

  // VISTA DEL COMPROBANTE / TICKET GUARDADO DEL CLIENTE
  if (reciboActivo) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-4">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl border overflow-hidden">
          <div className="bg-[#0f3faf] text-white p-6 text-center">
            <span className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              ✓ Cotización Guardada
            </span>
            <h1 className="text-2xl font-black mt-3">Comprobante #{reciboActivo.id}</h1>
            <p className="text-xs text-blue-200 mt-1">{reciboActivo.fecha}</p>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="bg-gray-50 p-3.5 rounded-2xl border text-xs space-y-1">
              <p><strong className="text-gray-700">Cliente:</strong> {reciboActivo.cliente.nombre}</p>
              <p><strong className="text-gray-700">WhatsApp:</strong> {reciboActivo.cliente.telefono}</p>
              <p><strong className="text-gray-700">Zona de entrega:</strong> {reciboActivo.cliente.zona}</p>
            </div>

            <div className="divide-y border-t border-b py-2">
              {reciboActivo.items.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center text-xs sm:text-sm gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-[#0f3faf] mr-1.5">{item.cantidad}x</span>
                    <span className="font-bold text-gray-800">{item.titulo}</span>
                  </div>
                  <span className="font-black text-gray-900">
                    ${(item.cantidad * item.precio_unitario).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-500 font-bold">
                <span>Subtotal:</span>
                <span>${reciboActivo.subtotal.toFixed(2)}</span>
              </div>
              {reciboActivo.descuento > 0 && (
                <div className="flex justify-between text-[#e11d48] font-black">
                  <span>Descuento ({reciboActivo.codigo_cupon}):</span>
                  <span>-${reciboActivo.descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t">
                <span className="font-black text-gray-900 uppercase">Total Final:</span>
                <span className="text-2xl font-black text-green-600">
                  ${reciboActivo.total_final.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-center text-gray-400 bg-blue-50/50 p-2.5 rounded-xl">
              💡 Esta cotización ha quedado guardada automáticamente en tu dispositivo. También puedes tomar captura de pantalla o imprimirla.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black py-3 rounded-xl text-xs transition-colors"
              >
                🖨️ Imprimir / PDF
              </button>
              <button
                onClick={() => setReciboActivo(null)}
                className="bg-[#0f3faf] hover:bg-blue-800 text-white font-black py-3 rounded-xl text-xs transition-colors"
              >
                ← Volver al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-3xl font-black text-gray-900">Tu Carrito</h1>
            {cart && cart.length > 0 && (
              <span className="text-xs font-bold bg-blue-50 text-[#0f3faf] px-3 py-1 rounded-full border border-blue-200">
                {cantidadTotal} {cantidadTotal === 1 ? "artículo" : "artículos"}
              </span>
            )}
          </div>

          {(!cart || cart.length === 0) ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <span className="text-5xl block mb-3">🛒</span>
              <h2 className="text-xl font-black text-gray-800 mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-500 text-sm mb-6">Parece que aún no has agregado nada. ¡Descubre nuestros productos!</p>
              <Link href="/catalogo" className="bg-[#0f3faf] text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-800 transition-colors inline-block text-sm">
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista Compacta Tipo Ticket */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div key={item.id} className="p-2.5 sm:p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white rounded-lg overflow-hidden border p-1 flex-shrink-0 flex items-center justify-center">
                        <img src={item.imagenes?.[0] || "/favicon.ico"} alt={item.titulo} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-snug">{item.titulo}</h3>
                        <p className="text-[#0f3faf] font-black text-xs sm:text-sm mt-0.5">
                          ${parseFloat(item.precio_actual).toFixed(2)} <span className="text-[10px] text-gray-400 font-medium">c/u</span>
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-4 flex-shrink-0">
                        <p className="font-black text-gray-900 text-sm sm:text-base sm:order-2 sm:min-w-[70px] text-right">
                          ${(item.precio_actual * item.cantidad).toFixed(2)}
                        </p>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50 h-7 sm:h-9 sm:order-1">
                          <button onClick={() => eliminarDelCarrito(item.id)} className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-700 hover:bg-gray-200 font-black text-sm">−</button>
                          <span className="w-6 sm:w-8 text-center font-black text-xs sm:text-sm text-gray-900">{item.cantidad}</span>
                          <button onClick={() => agregarAlCarrito(item)} className="w-7 sm:w-8 h-full flex items-center justify-center text-gray-700 hover:bg-gray-200 font-black text-sm">+</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Módulo de Cupón */}
                  <div className="p-3 sm:p-4 bg-blue-50/40">
                    {!cuponAplicado ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Código de cupón (Ej: PROMO10)"
                          value={codigoInput}
                          onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold uppercase outline-none focus:border-[#0f3faf] bg-white"
                        />
                        <button
                          type="button"
                          onClick={aplicarCupon}
                          disabled={validandoCupon || !codigoInput.trim()}
                          className="bg-[#0f3faf] hover:bg-blue-800 disabled:bg-gray-300 text-white font-black px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors"
                        >
                          {validandoCupon ? "Validando..." : "Aplicar"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-black text-xs sm:text-sm">🏷️ Cupón {cuponAplicado.codigo}</span>
                          <span className="text-[11px] bg-green-600 text-white font-bold px-2 py-0.5 rounded-full">
                            {cuponAplicado.tipo === "porcentaje" ? `-${cuponAplicado.valor}%` : `-$${cuponAplicado.valor}`}
                          </span>
                        </div>
                        <button type="button" onClick={quitarCupon} className="text-xs font-black text-red-500 hover:text-red-700 px-2">✕ Quitar</button>
                      </div>
                    )}
                    {mensajeCupon.texto && (
                      <p className={`text-[11px] font-bold mt-1.5 ${mensajeCupon.tipo === "error" ? "text-red-600" : "text-green-700"}`}>
                        {mensajeCupon.texto}
                      </p>
                    )}
                  </div>

                  {/* Totales */}
                  <div className="bg-gray-50 px-4 py-3 space-y-1.5 border-t-2 border-gray-200">
                    {cuponAplicado && (
                      <>
                        <div className="flex justify-between items-center text-xs text-gray-500 font-bold">
                          <span>Subtotal ({cantidadTotal} prod.):</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-[#e11d48] font-black">
                          <span>Descuento ({cuponAplicado.codigo}):</span>
                          <span>-${descuentoCalculado.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wide">
                        Total Estimado ({cantidadTotal} prod.):
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-green-600">${totalFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario de Checkout */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 h-fit sticky top-24">
                <h2 className="font-black text-lg text-gray-900 mb-4 border-b pb-3">Completar Solicitud</h2>
                <form onSubmit={manejarEnvio} className="space-y-3">
                  <p className="text-[11px] font-black text-[#0f3faf] uppercase tracking-wider">Tus Datos de Contacto</p>
                  <input type="text" placeholder="Nombre completo *" required value={cliente.nombre} onChange={e => setCliente({...cliente, nombre: e.target.value})} className="w-full border rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-sm" />
                  <input type="tel" placeholder="WhatsApp (Ej: +503 7777 7777) *" required value={cliente.telefono} onChange={e => setCliente({...cliente, telefono: e.target.value})} className="w-full border rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-sm" />
                  <input type="email" placeholder="Correo Electrónico (Opcional)" value={cliente.correo} onChange={e => setCliente({...cliente, correo: e.target.value})} className="w-full border rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-sm" />
                  <input type="text" placeholder="Ciudad / Zona de envío *" required value={cliente.zona} onChange={e => setCliente({...cliente, zona: e.target.value})} className="w-full border rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-sm" />
                  <textarea placeholder="Comentarios adicionales (Opcional)" rows="2" value={cliente.observaciones} onChange={e => setCliente({...cliente, observaciones: e.target.value})} className="w-full border rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-sm" />
                  <button type="submit" disabled={procesando} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-xl transition-colors text-base shadow-lg shadow-green-200 mt-2">
                    {procesando ? "Verificando y guardando..." : "Solicitar Cotización"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* 📋 HISTORIAL DE COTIZACIONES GUARDADAS EN EL DISPOSITIVO DEL CLIENTE */}
        {historialCliente.length > 0 && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-black text-base sm:text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span>📋</span> Mis Cotizaciones Enviadas (Guardadas en este dispositivo)
            </h2>
            <div className="divide-y">
              {historialCliente.map((cot) => (
                <div key={cot.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="bg-blue-50 text-[#0f3faf] font-black text-xs px-2.5 py-1 rounded-lg border border-blue-200 mr-2">
                      Folio #{cot.id}
                    </span>
                    <span className="text-xs font-bold text-gray-700">{cot.fecha}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {cot.items.length} {cot.items.length === 1 ? "producto" : "productos"} • Total:{" "}
                      <strong className="text-green-600">${cot.total_final.toFixed(2)}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => { setReciboActivo(cot); window.scrollTo(0, 0); }}
                    className="bg-gray-100 hover:bg-blue-50 hover:text-[#0f3faf] text-gray-700 font-black text-xs px-4 py-2 rounded-xl border transition-colors"
                  >
                    Ver Comprobante →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}