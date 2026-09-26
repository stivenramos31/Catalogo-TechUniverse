"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";

const DEPARTAMENTOS_SV = {
  "San Miguel": ["San Miguel Centro", "San Miguel Norte (Ciudad Barrios/Sesori)", "San Miguel Oeste (Chinameca/Lolotique/Nueva Guadalupe)"],
  "San Salvador": ["San Salvador Centro", "San Salvador Norte", "San Salvador Oeste", "San Salvador Este (Soyapango/Ilopango)", "San Salvador Sur"],
  "La Libertad": ["Santa Tecla / La Libertad Sur", "La Libertad Este (Antiguo Cuscatlán/Nuevo Cuscatlán)", "La Libertad Centro (Ciudad Arce/San Juan Opico)", "La Libertad Norte", "La Libertad Costa", "La Libertad Oeste"],
  "Santa Ana": ["Santa Ana Centro", "Santa Ana Norte (Metapán)", "Santa Ana Este (Coatepeque)", "Santa Ana Oeste (Chalchuapa)"],
  "Usulután": ["Usulután Este (Usulután/Santa Elena)", "Usulután Norte (Santiago de María/Jucuapa)", "Usulután Oeste (Jiquilisco)"],
  "La Unión": ["La Unión Sur (La Unión/Conchagua)", "La Unión Norte (Santa Rosa de Lima/Anamorós)"],
  "Morazán": ["Morazán Sur (San Francisco Gotera)", "Morazán Norte (Jocoaitique/Perquín)"],
  "Sonsonate": ["Sonsonate Centro", "Sonsonate Este (Izalco/Armenia)", "Sonsonate Norte (Juayúa)", "Sonsonate Oeste (Acajutla)"],
  "La Paz": ["La Paz Centro (Zacatecoluca)", "La Paz Oeste (Olocuilta)", "La Paz Este"],
  "Cuscatlán": ["Cuscatlán Sur (Cojutepeque)", "Cuscatlán Norte (Suchitoto)"],
  "Ahuachapán": ["Ahuachapán Centro", "Ahuachapán Norte (Atiquizaya)", "Ahuachapán Sur"],
  "Chalatenango": ["Chalatenango Centro", "Chalatenango Norte", "Chalatenango Sur"],
  "San Vicente": ["San Vicente Sur", "San Vicente Norte"],
  "Cabañas": ["Cabañas Este (Sensuntepeque)", "Cabañas Oeste (Ilobasco)"],
};

export default function CarritoPage() {
  const { cart, eliminarDelCarrito, agregarAlCarrito, vaciarCarrito, total, cantidadTotal } = useCart();
  const [procesando, setProcesando] = useState(false);

  // Por defecto en FALSE: no pide información personal a menos que el cliente elija "Sí"
  const [deseaIngresarDatos, setDeseaIngresarDatos] = useState(false);

  const [reciboActivo, setReciboActivo] = useState(null);
  const [historialCliente, setHistorialCliente] = useState([]);
  const [whatsappTienda, setWhatsappTienda] = useState("50370000000");
  const [infoIp, setInfoIp] = useState({ ip: "", resumen: "", dispositivo: "" });

  // Estados del cupón
  const [codigoInput, setCodigoInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [mensajeCupon, setMensajeCupon] = useState({ texto: "", tipo: "" });

  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    departamento: "San Miguel",
    distrito: "San Miguel Centro",
    direccion: "",
    observaciones: "",
  });

  // Formateador automático de 8 dígitos con guion en el centro (0000-0000)
  const formatearOchoDigitos = (valor = "") => {
    let nums = String(valor).replace(/\D/g, "");
    if (nums.startsWith("503") && nums.length > 8) nums = nums.slice(3);
    nums = nums.slice(0, 8);
    return nums.length > 4 ? `${nums.slice(0, 4)}-${nums.slice(4)}` : nums;
  };

  useEffect(() => {
    try {
      const guardadas = localStorage.getItem("tech_universe_mis_cotizaciones");
      if (guardadas) setHistorialCliente(JSON.parse(guardadas));

      const datosPrevios = localStorage.getItem("tech_universe_datos_cliente");
      if (datosPrevios) setCliente((prev) => ({ ...prev, ...JSON.parse(datosPrevios) }));
    } catch (e) {
      console.error(e);
    }

    // Obtener número de WhatsApp configurado en el panel Admin
    supabase
      .from("configuracion_tienda")
      .select("whatsapp_ventas")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.whatsapp_ventas) {
          setWhatsappTienda(data.whatsapp_ventas.replace(/\D/g, ""));
        }
      });

    // Detectar IP pública, ciudad y dispositivo
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const tipoDisp = /Android/i.test(ua)
      ? "Android"
      : /iPhone|iPad/i.test(ua)
      ? "iPhone/iOS"
      : "PC / Laptop";

    fetch("/api/ubicacion-ip")
      .then((r) => r.json())
      .then((d) => {
        setInfoIp({
          ip: d.ip || "No detectada",
          resumen: d.resumen || "El Salvador",
          dispositivo: tipoDisp,
        });
      })
      .catch(() => {
        setInfoIp({ ip: "No detectada", resumen: "Desconocida", dispositivo: tipoDisp });
      });
  }, []);

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
      p_subtotal: subtotalActual,
    });
    if (error || !data?.valido) {
      setCuponAplicado(null);
      setMensajeCupon({ texto: data?.mensaje || "El cupón ya no aplica.", tipo: "error" });
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
        p_subtotal: total,
      });
      if (error) throw error;
      if (!data.valido) {
        setCuponAplicado(null);
        setMensajeCupon({ texto: data.mensaje, tipo: "error" });
      } else {
        setCuponAplicado(data);
        setMensajeCupon({ texto: data.mensaje, tipo: "exito" });
      }
    } catch {
      setMensajeCupon({ texto: "Error al validar el cupón.", tipo: "error" });
    } finally {
      setValidandoCupon(false);
    }
  };

  const descuentoCalculado = cuponAplicado ? parseFloat(cuponAplicado.descuento) : 0;
  const totalFinal = Math.max(total - descuentoCalculado, 0);

  const generarCotizacionOficial = async (e, abrirWhatsAppAlFinal = true) => {
    if (e) e.preventDefault();
    if (!cart || cart.length === 0) return alert("Tu carrito está vacío.");

    if (deseaIngresarDatos) {
      const ochoDigitos = formatearOchoDigitos(cliente.telefono).replace(/\D/g, "");
      if (!cliente.nombre.trim()) return alert("Por favor escribe tu nombre.");
      if (ochoDigitos.length !== 8) return alert("Ingresa los 8 dígitos de tu número de WhatsApp.");
      if (!cliente.direccion.trim()) return alert("Por favor indica la ubicación de tu hogar o referencia.");
    }

    setProcesando(true);
    try {
      const itemsSeguros = cart.map((item) => ({
        producto_id: String(item.id),
        cantidad: item.cantidad,
      }));

      const telefonoFormateado = deseaIngresarDatos
        ? `+503 ${formatearOchoDigitos(cliente.telefono)}`
        : "Sin datos (Express)";

      const { data, error } = await supabase.rpc("crear_cotizacion_segura", {
        p_nombre: deseaIngresarDatos ? cliente.nombre : "Cliente Express",
        p_telefono: telefonoFormateado,
        p_departamento: deseaIngresarDatos ? cliente.departamento : "",
        p_distrito: deseaIngresarDatos ? cliente.distrito : "",
        p_direccion: deseaIngresarDatos ? cliente.direccion : "",
        p_observaciones: cliente.observaciones || "",
        p_codigo_cupon: cuponAplicado ? cuponAplicado.codigo : null,
        p_ip_publica: infoIp.ip,
        p_ubicacion_ip: infoIp.resumen,
        p_dispositivo: infoIp.dispositivo,
        p_items: itemsSeguros,
      });

      if (error) throw error;

      const origenUrl = typeof window !== "undefined" ? window.location.origin : "";
      const enlacePermanente = `${origenUrl}/cotizacion/${data.token_publico}`;

      const nuevoRecibo = {
        id: data.cotizacion_id,
        numero_folio: data.numero_folio,
        token_publico: data.token_publico,
        enlace: enlacePermanente,
        fecha: new Date().toLocaleString(),
        conDatos: deseaIngresarDatos,
        cliente: deseaIngresarDatos
          ? { ...cliente, telefono: telefonoFormateado }
          : { nombre: "Cliente Express (Sin datos)", telefono: "Vía WhatsApp", departamento: "", distrito: "", direccion: "" },
        items: cart.map((i) => ({
          id: i.id,
          titulo: i.titulo,
          cantidad: i.cantidad,
          precio_unitario: parseFloat(i.precio_actual),
        })),
        subtotal: parseFloat(data.subtotal),
        descuento: parseFloat(data.descuento),
        codigo_cupon: cuponAplicado ? cuponAplicado.codigo : null,
        total_final: parseFloat(data.total_final),
      };

      const nuevoHistorial = [nuevoRecibo, ...historialCliente].slice(0, 20);
      setHistorialCliente(nuevoHistorial);
      localStorage.setItem("tech_universe_mis_cotizaciones", JSON.stringify(nuevoHistorial));
      if (deseaIngresarDatos) {
        localStorage.setItem("tech_universe_datos_cliente", JSON.stringify(cliente));
      }

      if (abrirWhatsAppAlFinal) {
        const lineasProd = nuevoRecibo.items
          .map((i) => `• *${i.cantidad}x* ${i.titulo} ($${i.precio_unitario.toFixed(2)} c/u)`)
          .join("\n");

        const bloqueEntrega = deseaIngresarDatos
          ? `\n\n📍 *Datos de Entrega:*\n👤 Nombre: ${cliente.nombre}\n📞 Tel: ${telefonoFormateado}\n🗺️ Zona: ${cliente.departamento}, ${cliente.distrito}\n🏠 Ubicación: ${cliente.direccion}`
          : "";

        const bloqueDescuento =
          nuevoRecibo.descuento > 0
            ? `\nSubtotal: $${nuevoRecibo.subtotal.toFixed(2)}\n🏷️ Cupón (${nuevoRecibo.codigo_cupon}): -$${nuevoRecibo.descuento.toFixed(2)}`
            : "";

        const textoWhatsApp = `¡Hola *TECH UNIVERSE*! 👋 Te envío mi *Cotización Oficial #${nuevoRecibo.numero_folio}*:\n\n${lineasProd}${bloqueDescuento}\n💰 *TOTAL A PAGAR: $${nuevoRecibo.total_final.toFixed(2)}*${bloqueEntrega}\n\n🔗 *Ver comprobante oficial aquí:*\n${enlacePermanente}`;

        window.open(`https://wa.me/${whatsappTienda}?text=${encodeURIComponent(textoWhatsApp)}`, "_blank");
      }

      vaciarCarrito();
      setCuponAplicado(null);
      setReciboActivo(nuevoRecibo);
      window.scrollTo(0, 0);
    } catch (err) {
      alert("No se pudo generar la cotización: " + err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (reciboActivo) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-4">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl border overflow-hidden">
          <div className="bg-[#0f3faf] text-white p-6 text-center">
            <span className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              ✓ Cotización Oficial Emitida
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-3">
              Cotización #{reciboActivo.numero_folio}
            </h1>
            <p className="text-xs text-blue-200 mt-1">{reciboActivo.fecha}</p>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl">
              <p className="text-[11px] font-black text-[#0f3faf] uppercase mb-1">
                🔗 Tu Enlace Privado para revisar esta cotización cuando quieras:
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={reciboActivo.enlace}
                  className="flex-1 bg-white border rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(reciboActivo.enlace);
                    } else {
                      const tempInput = document.createElement("textarea");
                      tempInput.value = reciboActivo.enlace;
                      document.body.appendChild(tempInput);
                      tempInput.select();
                      document.execCommand("copy");
                      document.body.removeChild(tempInput);
                    }
                    alert("¡Enlace de tu cotización copiado!");
                  }}
                  className="bg-[#0f3faf] text-white text-xs font-black px-3 py-1.5 rounded-lg"
                >
                  Copiar
                </button>
              </div>
            </div>

            {reciboActivo.conDatos && (
              <div className="bg-gray-50 p-3.5 rounded-2xl border text-xs space-y-1">
                <p><strong>Cliente:</strong> {reciboActivo.cliente.nombre}</p>
                <p><strong>WhatsApp:</strong> {reciboActivo.cliente.telefono}</p>
                <p><strong>Ubicación:</strong> {reciboActivo.cliente.departamento}, {reciboActivo.cliente.distrito} — {reciboActivo.cliente.direccion}</p>
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href={`/cotizacion/${reciboActivo.token_publico}`}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black py-3 rounded-xl text-xs text-center transition-colors"
              >
                📄 Abrir Enlace Oficial
              </Link>
              <button
                onClick={() => setReciboActivo(null)}
                className="bg-[#0f3faf] hover:bg-blue-800 text-white font-black py-3 rounded-xl text-xs transition-colors"
              >
                ← Volver a la Tienda
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
              <p className="text-gray-500 text-sm mb-6">Explora nuestro catálogo y arma tu cotización en segundos.</p>
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
                        <button type="button" onClick={() => setCuponAplicado(null)} className="text-xs font-black text-red-500 hover:text-red-700 px-2">✕ Quitar</button>
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

              {/* Panel de Envío de Cotización (Por defecto SIN pedir datos) */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-gray-100 h-fit sticky top-24 space-y-4">
                <div>
                  <h2 className="font-black text-lg text-gray-900">Finalizar Cotización</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Obtén tu comprobante oficial numerado al instante.
                  </p>
                </div>

                {/* Pregunta amigable de privacidad */}
                <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-2.5">
                  <p className="text-xs font-black text-gray-800">
                    🤔 ¿Deseas ingresar tu información de entrega ahora?
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeseaIngresarDatos(false)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border-2 transition-all ${
                        !deseaIngresarDatos
                          ? "bg-[#0f3faf] text-white border-[#0f3faf] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      🔒 No, sin mis datos
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeseaIngresarDatos(true)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border-2 transition-all ${
                        deseaIngresarDatos
                          ? "bg-[#0f3faf] text-white border-[#0f3faf] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      🚚 Sí, agregar datos
                    </button>
                  </div>

                  {!deseaIngresarDatos && (
                    <p className="text-[11px] text-blue-800 font-medium leading-snug">
                      ✨ <strong>Tu privacidad primero:</strong> No necesitas dejar tus datos en la web. Te generaremos tu enlace de cotización y coordinaremos por WhatsApp.
                    </p>
                  )}
                </div>

                {/* Formulario que se abre SOLO si el cliente presiona "Sí, agregar datos" */}
                {deseaIngresarDatos && (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    <div>
                      <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">
                        Tu Nombre *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Carlos Hernández"
                        value={cliente.nombre}
                        onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-3.5 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-bold text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">
                        Tu Teléfono / WhatsApp (8 dígitos) *
                      </label>
                      <div className="flex items-center border-2 border-gray-200 rounded-xl bg-gray-50 overflow-hidden focus-within:bg-white focus-within:border-[#0f3faf]">
                        <span className="bg-gray-200 text-gray-800 font-black px-3 py-2.5 text-sm border-r border-gray-300 select-none">
                          +503
                        </span>
                        <input
                          type="tel"
                          maxLength={9}
                          placeholder="7000-0000"
                          value={formatearOchoDigitos(cliente.telefono)}
                          onChange={(e) =>
                            setCliente({ ...cliente, telefono: formatearOchoDigitos(e.target.value) })
                          }
                          className="w-full px-3 py-2.5 font-black text-sm outline-none bg-transparent tracking-wider"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">
                          Departamento *
                        </label>
                        <select
                          value={cliente.departamento}
                          onChange={(e) => {
                            const nuevoDep = e.target.value;
                            setCliente({
                              ...cliente,
                              departamento: nuevoDep,
                              distrito: DEPARTAMENTOS_SV[nuevoDep]?.[0] || "",
                            });
                          }}
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-bold text-xs"
                        >
                          {Object.keys(DEPARTAMENTOS_SV).map((dep) => (
                            <option key={dep} value={dep}>
                              {dep}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">
                          Distrito / Municipio *
                        </label>
                        <select
                          value={cliente.distrito}
                          onChange={(e) => setCliente({ ...cliente, distrito: e.target.value })}
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-bold text-xs"
                        >
                          {(DEPARTAMENTOS_SV[cliente.departamento] || []).map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-gray-700 uppercase mb-1">
                        Ubicación del hogar / Punto de Referencia *
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Ej: Col. Ciudad Pacífica, Polígono B #14, frente a parque..."
                        value={cliente.direccion}
                        onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-xl px-3.5 py-2 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Botones para generar la Cotización #0001 */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={(e) => generarCotizacionOficial(e, true)}
                    className="w-full bg-[#25D366] hover:bg-green-600 text-white font-black py-3.5 px-4 rounded-xl transition-all text-sm sm:text-base shadow-lg shadow-green-100 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>📲</span>
                    {procesando ? "Generando Cotización..." : "Enviar Cotización a WhatsApp"}
                  </button>

                  <button
                    type="button"
                    disabled={procesando}
                    onClick={(e) => generarCotizacionOficial(e, false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-black py-2.5 px-4 rounded-xl transition-colors text-xs"
                  >
                    🔗 Solo obtener enlace de mi cotización
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historial local del dispositivo */}
        {historialCliente.length > 0 && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-black text-base sm:text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span>📋</span> Mis Cotizaciones Guardadas
            </h2>
            <div className="divide-y">
              {historialCliente.map((cot, index) => (
                <div key={index} className="py-3 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="bg-blue-50 text-[#0f3faf] font-black text-xs px-2.5 py-1 rounded-lg border border-blue-200 mr-2">
                      Cotización #{cot.numero_folio || String(cot.id).slice(0, 4)}
                    </span>
                    <span className="text-xs font-bold text-gray-700">{cot.fecha}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {cot.items.length} prod. • Total:{" "}
                      <strong className="text-green-600">${cot.total_final.toFixed(2)}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {cot.token_publico && (
                      <Link
                        href={`/cotizacion/${cot.token_publico}`}
                        className="bg-[#0f3faf] text-white font-black text-xs px-3.5 py-2 rounded-xl"
                      >
                        🔗 Abrir Enlace
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setReciboActivo(cot);
                        window.scrollTo(0, 0);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs px-3.5 py-2 rounded-xl border"
                    >
                      Ver Recibo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}