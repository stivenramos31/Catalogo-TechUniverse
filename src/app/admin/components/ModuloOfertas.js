"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloOfertas({ productos }) {
  const [ofertas, setOfertas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const estadoInicial = {
    producto_id: "",
    precio_promocion: "",
    stock_promocion: 1,
    fecha_inicio: "",
    fecha_fin: "",
  };
  const [nuevaOferta, setNuevaOferta] = useState(estadoInicial);

  useEffect(() => {
    cargarOfertas();
  }, []);

  // Bloquear recarga accidental al deslizar hacia abajo en Android mientras el modal está abierto
  useEffect(() => {
    if (!mostrarModal) return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prevHtml = htmlEl.style.overscrollBehaviorY;
    const prevBody = bodyEl.style.overscrollBehaviorY;

    htmlEl.style.overscrollBehaviorY = "none";
    bodyEl.style.overscrollBehaviorY = "none";

    return () => {
      htmlEl.style.overscrollBehaviorY = prevHtml;
      bodyEl.style.overscrollBehaviorY = prevBody;
    };
  }, [mostrarModal]);

  const cargarOfertas = async () => {
    const { data, error } = await supabase
      .from("ofertas_flash")
      .select("*")
      .order("id", { ascending: false });

    if (data) setOfertas(data);
    if (error) console.error("Error al cargar ofertas:", error);
  };

  const formatearFechaParaInput = (fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
    return fecha.toISOString().slice(0, 16);
  };

  const abrirModal = (oferta = null) => {
    if (oferta) {
      setOfertaEditando(oferta);
      setNuevaOferta({
        producto_id: oferta.producto_id,
        precio_promocion: oferta.precio_promocion ?? oferta.precio_promocional ?? "",
        stock_promocion: oferta.stock_promocion || 1,
        fecha_inicio: formatearFechaParaInput(oferta.fecha_inicio),
        fecha_fin: formatearFechaParaInput(oferta.fecha_fin),
      });
    } else {
      setOfertaEditando(null);
      setNuevaOferta({ ...estadoInicial, producto_id: productos[0]?.id || "" });
    }
    setMostrarModal(true);
  };

  const guardarOferta = async (e) => {
    e.preventDefault();
    setProcesando(true);

    try {
      const precioNum = parseFloat(nuevaOferta.precio_promocion);
      const datos = {
        producto_id: Number(nuevaOferta.producto_id),
        precio_promocion: precioNum,
        stock_promocion: parseInt(nuevaOferta.stock_promocion) || 1,
        fecha_inicio: new Date(nuevaOferta.fecha_inicio).toISOString(),
        fecha_fin: new Date(nuevaOferta.fecha_fin).toISOString(),
        activo: true,
      };

      if (ofertaEditando) {
        const { error } = await supabase
          .from("ofertas_flash")
          .update(datos)
          .eq("id", ofertaEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ofertas_flash").insert([datos]);
        if (error) throw error;
      }

      setMostrarModal(false);
      cargarOfertas();
    } catch (error) {
      alert("Error al guardar la oferta: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminarOferta = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar esta oferta flash?")) {
      const { error } = await supabase.from("ofertas_flash").delete().eq("id", id);
      if (error) alert("Error: " + error.message);
      else cargarOfertas();
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <h2 className="font-black text-xl sm:text-2xl text-gray-800">
            ⚡ Ofertas Flash
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm font-medium mt-0.5">
            Programa descuentos temporales por unidad o por cantidad para tus productos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => abrirModal()}
          className="w-full sm:w-auto bg-[#16a34a] hover:bg-green-700 text-white font-black px-5 py-3 rounded-xl transition-colors shadow-sm text-sm cursor-pointer text-center"
        >
          + Nueva Oferta
        </button>
      </div>

      {/* 📱 VISTA EN TARJETAS PARA ANDROID / MÓVIL (Sin recortes ni scroll horizontal) */}
      <div className="md:hidden space-y-3">
        {ofertas.length === 0 && (
          <p className="text-center p-8 text-gray-400 font-bold text-sm border rounded-xl">
            No hay ofertas programadas.
          </p>
        )}

        {ofertas.map((oferta) => {
          const productoVinculado = productos.find(
            (p) => String(p.id) === String(oferta.producto_id)
          );
          const precioPromo = parseFloat(
            oferta.precio_promocion ?? oferta.precio_promocional ?? 0
          );
          const precioNormal = parseFloat(productoVinculado?.precio_actual || 0);
          const finPasado = oferta.fecha_fin && new Date(oferta.fecha_fin) < new Date();

          return (
            <div
              key={oferta.id}
              className="border border-gray-200 rounded-2xl p-3.5 bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <img
                  src={productoVinculado?.imagenes?.[0] || "/favicon.ico"}
                  alt={productoVinculado?.titulo || "Producto"}
                  className="w-18 h-18 object-contain bg-white p-1 rounded-xl border border-gray-200 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        finPasado
                          ? "bg-gray-100 text-gray-500"
                          : "bg-red-100 text-[#dc2626]"
                      }`}
                    >
                      {finPasado ? "Finalizada" : "⚡ Activa"}
                    </span>
                    <span className="bg-blue-50 text-[#0f3faf] border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                      Mín. {oferta.stock_promocion} {oferta.stock_promocion > 1 ? "uds." : "ud."}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-sm line-clamp-2 leading-snug">
                    {productoVinculado?.titulo || "Producto no encontrado"}
                  </h3>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-red-600 font-black text-base">
                      ${precioPromo.toFixed(2)} c/u
                    </span>
                    {precioNormal > 0 && (
                      <span className="text-gray-400 line-through text-xs font-bold">
                        ${precioNormal.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-2.5 text-[11px] text-gray-600 space-y-1 border border-gray-100">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Inicio:</span>
                  <span className="font-semibold text-gray-800">
                    {oferta.fecha_inicio
                      ? new Date(oferta.fecha_inicio).toLocaleString()
                      : "Inmediato"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-500">Fin:</span>
                  <span className="font-semibold text-gray-800">
                    {oferta.fecha_fin
                      ? new Date(oferta.fecha_fin).toLocaleString()
                      : "Sin límite"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => abrirModal(oferta)}
                  className="bg-blue-100 text-blue-700 py-2 rounded-xl text-xs font-black hover:bg-blue-200 transition-colors cursor-pointer"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => eliminarOferta(oferta.id)}
                  className="bg-red-50 text-red-600 py-2 rounded-xl text-xs font-black hover:bg-red-100 transition-colors cursor-pointer"
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 💻 VISTA EN TABLA PARA PC */}
      <div className="hidden md:block overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="p-4 font-black text-gray-600">Producto</th>
              <th className="p-4 font-black text-gray-600">Precio Promoción</th>
              <th className="p-4 font-black text-gray-600">Cant. Mínima / Stock</th>
              <th className="p-4 font-black text-gray-600">Inicio</th>
              <th className="p-4 font-black text-gray-600">Fin</th>
              <th className="p-4 font-black text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ofertas.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-8 text-gray-400 font-bold">
                  No hay ofertas programadas.
                </td>
              </tr>
            )}
            {ofertas.map((oferta) => {
              const productoVinculado = productos.find(
                (p) => String(p.id) === String(oferta.producto_id)
              );
              const precioPromo = parseFloat(
                oferta.precio_promocion ?? oferta.precio_promocional ?? 0
              );

              return (
                <tr
                  key={oferta.id}
                  className="border-b hover:bg-blue-50/50 transition-colors"
                >
                  <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                    {productoVinculado?.imagenes?.[0] && (
                      <img
                        src={productoVinculado.imagenes[0]}
                        alt=""
                        className="w-12 h-12 rounded-lg border object-contain bg-white p-0.5 flex-shrink-0"
                      />
                    )}
                    <span className="line-clamp-2 max-w-[240px]">
                      {productoVinculado?.titulo || "Producto no encontrado"}
                    </span>
                  </td>
                  <td className="p-4 font-black text-red-600 text-lg">
                    ${precioPromo.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 font-black px-3 py-1 rounded-full border">
                      {oferta.stock_promocion}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 font-medium text-xs">
                    {oferta.fecha_inicio
                      ? new Date(oferta.fecha_inicio).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-4 text-gray-600 font-medium text-xs">
                    {oferta.fecha_fin
                      ? new Date(oferta.fecha_fin).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => abrirModal(oferta)}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-black hover:bg-blue-200 cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarOferta(oferta.id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100 cursor-pointer"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Flotante */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overscroll-none">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto overscroll-contain rounded-3xl shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-gray-50 border-b px-5 sm:px-8 py-4 flex justify-between items-center z-10">
              <h2 className="font-black text-lg sm:text-2xl text-gray-800">
                {ofertaEditando ? "✏️ Editar Oferta Flash" : "⚡ Programar Oferta Flash"}
              </h2>
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-red-600 bg-white rounded-full p-2 border transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarOferta} className="p-5 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                  Seleccionar Producto *
                </label>
                <select
                  value={nuevaOferta.producto_id}
                  onChange={(e) =>
                    setNuevaOferta({ ...nuevaOferta, producto_id: e.target.value })
                  }
                  className="w-full border-2 rounded-xl px-3.5 py-3 bg-white font-bold text-sm outline-none focus:border-[#0f3faf]"
                  required
                >
                  <option value="" disabled>
                    Elige un producto del inventario...
                  </option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo} (${parseFloat(p.precio_actual || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                    Precio de Locura ($ c/u) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevaOferta.precio_promocion}
                    onChange={(e) =>
                      setNuevaOferta({
                        ...nuevaOferta,
                        precio_promocion: e.target.value,
                      })
                    }
                    className="w-full border-2 rounded-xl px-4 py-3 bg-white font-black text-lg text-red-600 outline-none focus:border-[#0f3faf]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                    Cantidad mínima para oferta *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevaOferta.stock_promocion}
                    onChange={(e) =>
                      setNuevaOferta({
                        ...nuevaOferta,
                        stock_promocion: e.target.value,
                      })
                    }
                    className="w-full border-2 rounded-xl px-4 py-3 bg-white font-black text-lg outline-none focus:border-[#0f3faf]"
                    required
                  />
                  <p className="text-[11px] text-gray-500 font-medium mt-1">
                    Ej: Pon <strong>1</strong> para descuento directo o <strong>2</strong> para promo llevando 2+.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                    Fecha y Hora de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={nuevaOferta.fecha_inicio}
                    onChange={(e) =>
                      setNuevaOferta({
                        ...nuevaOferta,
                        fecha_inicio: e.target.value,
                      })
                    }
                    className="w-full border-2 rounded-xl px-3.5 py-3 bg-white font-bold text-sm outline-none focus:border-[#0f3faf]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                    Fecha y Hora de Fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={nuevaOferta.fecha_fin}
                    onChange={(e) =>
                      setNuevaOferta({ ...nuevaOferta, fecha_fin: e.target.value })
                    }
                    className="w-full border-2 rounded-xl px-3.5 py-3 bg-white font-bold text-sm outline-none focus:border-[#0f3faf]"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-black py-3.5 rounded-xl hover:bg-gray-200 text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="flex-[2] bg-[#0f3faf] text-white font-black py-3.5 rounded-xl hover:bg-blue-800 shadow-lg shadow-blue-200 text-sm cursor-pointer"
                >
                  {procesando ? "Guardando..." : "Guardar Oferta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}