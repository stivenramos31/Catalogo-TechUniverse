"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const estadoInicial = {
  codigo: "",
  tipo: "porcentaje",
  valor: "",
  monto_minimo: 0,
  limite_usos: "",
  fecha_expiracion: "",
  activo: true,
};

export default function ModuloCupones() {
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [formModificado, setFormModificado] = useState(false);
  const [cuponEditando, setCuponEditando] = useState(null);
  const [form, setForm] = useState(estadoInicial);

  const cargarCupones = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("cupones")
      .select("*")
      .order("creado_en", { ascending: false });

    if (!error && data) setCupones(data);
    setCargando(false);
  };

  useEffect(() => {
    cargarCupones();
  }, []);

  // Protección contra botón "Atrás" si hay cambios sin guardar en el modal
  useEffect(() => {
    const handlePopState = () => {
      if (mostrarModal) {
        if (formModificado) {
          if (window.confirm("¿Seguro que deseas salir? Tienes cambios sin guardar en el cupón.")) {
            setMostrarModal(false);
            setFormModificado(false);
          } else {
            window.history.pushState({ modalCupon: true }, "");
          }
        } else {
          setMostrarModal(false);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mostrarModal, formModificado]);

  const abrirModal = (cupon = null) => {
    if (cupon) {
      setCuponEditando(cupon);
      setForm({
        codigo: cupon.codigo,
        tipo: cupon.tipo,
        valor: cupon.valor,
        monto_minimo: cupon.monto_minimo || 0,
        limite_usos: cupon.limite_usos ?? "",
        fecha_expiracion: cupon.fecha_expiracion
          ? new Date(cupon.fecha_expiracion).toISOString().slice(0, 16)
          : "",
        activo: cupon.activo,
      });
    } else {
      setCuponEditando(null);
      setForm(estadoInicial);
    }
    setFormModificado(false);
    setMostrarModal(true);
    window.history.pushState({ modalCupon: true }, "");
  };

  const intentarCerrarModal = () => {
    if (formModificado) {
      if (window.confirm("¿Deseas descartar los cambios del cupón?")) {
        setMostrarModal(false);
        setFormModificado(false);
        window.history.back();
      }
    } else {
      setMostrarModal(false);
      window.history.back();
    }
  };

  const manejarCambio = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setFormModificado(true);
  };

  const guardarCupon = async (e) => {
    e.preventDefault();
    const codigoLimpio = form.codigo.trim().toUpperCase().replace(/\s+/g, "");
    if (!codigoLimpio) return alert("Ingresa un código válido.");
    if (form.tipo === "porcentaje" && parseFloat(form.valor) > 100) {
      return alert("El porcentaje de descuento no puede ser mayor a 100%.");
    }

    setProcesando(true);
    try {
      const datos = {
        codigo: codigoLimpio,
        tipo: form.tipo,
        valor: parseFloat(form.valor),
        monto_minimo: parseFloat(form.monto_minimo) || 0,
        limite_usos: form.limite_usos !== "" ? parseInt(form.limite_usos) : null,
        fecha_expiracion: form.fecha_expiracion
          ? new Date(form.fecha_expiracion).toISOString()
          : null,
        activo: form.activo,
      };

      if (cuponEditando) {
        const { error } = await supabase
          .from("cupones")
          .update(datos)
          .eq("id", cuponEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cupones").insert([datos]);
        if (error) throw error;
      }

      setFormModificado(false);
      setMostrarModal(false);
      window.history.back();
      cargarCupones();
    } catch (error) {
      alert("Error al guardar el cupón: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const alternarEstado = async (cupon) => {
    const { error } = await supabase
      .from("cupones")
      .update({ activo: !cupon.activo })
      .eq("id", cupon.id);

    if (error) alert("Error al cambiar estado: " + error.message);
    else cargarCupones();
  };

  const reiniciarUsos = async (cupon) => {
    if (window.confirm(`¿Deseas reiniciar el contador de usos de "${cupon.codigo}" a 0?`)) {
      const { error } = await supabase
        .from("cupones")
        .update({ usos_actuales: 0 })
        .eq("id", cupon.id);
      if (error) alert("Error al reiniciar usos: " + error.message);
      else cargarCupones();
    }
  };

  const eliminarCupon = async (id, codigo) => {
    if (window.confirm(`¿Seguro que deseas eliminar definitivamente el cupón "${codigo}"?`)) {
      const { error } = await supabase.from("cupones").delete().eq("id", id);
      if (error) alert("Error al eliminar: " + error.message);
      else cargarCupones();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="font-black text-2xl text-gray-800">💸 Cupones de Descuento</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Validación protegida en servidor (Zero-Trust). Los códigos están ocultos al público.
          </p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm"
        >
          + Nuevo Cupón
        </button>
      </div>

      {cargando ? (
        <div className="py-16 text-center text-gray-400 font-bold">Cargando cupones...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="p-4 font-black text-gray-600">Código</th>
                <th className="p-4 font-black text-gray-600">Descuento</th>
                <th className="p-4 font-black text-gray-600">Compra Mín.</th>
                <th className="p-4 font-black text-gray-600">Usos</th>
                <th className="p-4 font-black text-gray-600">Expiración</th>
                <th className="p-4 font-black text-gray-600">Estado</th>
                <th className="p-4 font-black text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cupones.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-400 font-bold">
                    No hay cupones registrados. Crea el primero con el botón "+ Nuevo Cupón".
                  </td>
                </tr>
              )}
              {cupones.map((c) => {
                const expirado = c.fecha_expiracion && new Date(c.fecha_expiracion) < new Date();
                const agotado = c.limite_usos !== null && c.usos_actuales >= c.limite_usos;

                return (
                  <tr key={c.id} className="border-b hover:bg-blue-50/40 transition-colors">
                    <td className="p-4">
                      <span className="font-black text-[#0f3faf] bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg tracking-wider">
                        {c.codigo}
                      </span>
                    </td>
                    <td className="p-4 font-black text-green-600 text-base">
                      {c.tipo === "porcentaje"
                        ? `${c.valor}% OFF`
                        : `-$${parseFloat(c.valor).toFixed(2)}`}
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                      ${parseFloat(c.monto_minimo || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-800">
                          {c.usos_actuales} / {c.limite_usos !== null ? c.limite_usos : "∞"}
                        </span>
                        {c.usos_actuales > 0 && (
                          <button
                            onClick={() => reiniciarUsos(c)}
                            title="Reiniciar contador a 0"
                            className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-gray-500">
                      {c.fecha_expiracion
                        ? new Date(c.fecha_expiracion).toLocaleDateString()
                        : "Sin límite"}
                    </td>
                    <td className="p-4">
                      {expirado ? (
                        <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full">
                          Expirado
                        </span>
                      ) : agotado ? (
                        <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-full">
                          Agotado
                        </span>
                      ) : (
                        <button
                          onClick={() => alternarEstado(c)}
                          className={`text-xs font-black px-3 py-1 rounded-full transition-colors ${
                            c.activo
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          {c.activo ? "● Activo" : "○ Pausado"}
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => abrirModal(c)}
                        className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-blue-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarCupon(c.id, c.codigo)}
                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-red-100"
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
      )}

      {/* Modal Crear / Editar Cupón */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-xl text-gray-800">
                {cuponEditando ? "✏️ Editar Cupón" : "➕ Crear Nuevo Cupón"}
              </h3>
              <button
                onClick={intentarCerrarModal}
                className="text-gray-400 hover:text-red-500 font-black text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarCupon} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: PROMO10 o VIP2026"
                  value={form.codigo}
                  onChange={(e) => manejarCambio("codigo", e.target.value.toUpperCase())}
                  className="w-full border-2 rounded-xl px-4 py-2.5 font-black uppercase text-[#0f3faf] tracking-wider outline-none focus:border-[#0f3faf]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                    Tipo de Descuento *
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => manejarCambio("tipo", e.target.value)}
                    className="w-full border-2 rounded-xl px-3 py-2.5 font-bold outline-none focus:border-[#0f3faf]"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Monto Fijo ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                    {form.tipo === "porcentaje" ? "Porcentaje (%) *" : "Descuento ($) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder={form.tipo === "porcentaje" ? "Ej: 10" : "Ej: 5.00"}
                    value={form.valor}
                    onChange={(e) => manejarCambio("valor", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-2.5 font-black text-green-700 outline-none focus:border-[#0f3faf]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                    Compra Mínima ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.monto_minimo}
                    onChange={(e) => manejarCambio("monto_minimo", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-2.5 font-bold outline-none focus:border-[#0f3faf]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                    Límite de Usos (Opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Vacío = Ilimitado"
                    value={form.limite_usos}
                    onChange={(e) => manejarCambio("limite_usos", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-2.5 font-bold outline-none focus:border-[#0f3faf]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Fecha de Expiración (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={form.fecha_expiracion}
                  onChange={(e) => manejarCambio("fecha_expiracion", e.target.value)}
                  className="w-full border-2 rounded-xl px-4 py-2.5 font-medium outline-none focus:border-[#0f3faf]"
                />
              </div>

              <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => manejarCambio("activo", e.target.checked)}
                  className="w-5 h-5 rounded text-[#0f3faf]"
                />
                <span className="text-sm font-black text-gray-800">Cupón activo para usarse</span>
              </label>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={intentarCerrarModal}
                  className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="w-2/3 bg-[#0f3faf] text-white font-black py-3 rounded-xl hover:bg-blue-800"
                >
                  {procesando ? "Guardando..." : "Guardar Cupón"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}