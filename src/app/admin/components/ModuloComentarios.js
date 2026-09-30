"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloComentarios({ productos }) {
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarComentarios();
  }, []);

  const cargarComentarios = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("comentarios_producto")
      .select("*")
      .order("creado_en", { ascending: false });

    if (data) setComentarios(data);
    if (error) console.error("Error al cargar comentarios:", error);
    setCargando(false);
  };

  const cambiarEstadoAprobacion = async (id, estadoActual) => {
    setProcesando(true);
    try {
      const nuevoEstado = !estadoActual;
      const { error } = await supabase
        .from("comentarios_producto")
        .update({ aprobado: nuevoEstado })
        .eq("id", id);

      if (error) throw error;

      setComentarios(
        comentarios.map((c) =>
          c.id === id ? { ...c, aprobado: nuevoEstado } : c
        )
      );
    } catch (error) {
      alert("Error al cambiar el estado: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminarComentario = async (id) => {
    if (
      window.confirm(
        "¿Estás completamente seguro de eliminar este comentario de forma permanente?"
      )
    ) {
      const { error } = await supabase
        .from("comentarios_producto")
        .delete()
        .eq("id", id);
      if (error) alert("Error al eliminar: " + error.message);
      else cargarComentarios();
    }
  };

  const renderEstrellas = (calificacion) => {
    const num = Math.min(Math.max(parseInt(calificacion) || 5, 1), 5);
    return "⭐".repeat(num) + "☆".repeat(5 - num);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <h2 className="font-black text-xl sm:text-2xl text-gray-800">
            ⭐ Moderación de Comentarios
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm font-medium mt-0.5">
            Aprueba o elimina las reseñas de tus clientes antes de que sean públicas.
          </p>
        </div>
        <button
          type="button"
          onClick={cargarComentarios}
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow-2xs flex gap-2 items-center justify-center cursor-pointer"
        >
          🔄 Actualizar
        </button>
      </div>

      {cargando ? (
        <div className="py-16 text-center text-gray-400 font-bold">
          Cargando comentarios...
        </div>
      ) : comentarios.length === 0 ? (
        <div className="py-16 text-center text-gray-400 font-bold border rounded-2xl bg-gray-50">
          No hay comentarios para moderar.
        </div>
      ) : (
        <>
          {/* 📱 VISTA EN TARJETAS PARA ANDROID / MÓVIL (Cero scroll horizontal) */}
          <div className="md:hidden space-y-3">
            {comentarios.map((comentario) => {
              const productoVinculado = productos.find(
                (p) => String(p.id) === String(comentario.producto_id)
              );

              return (
                <div
                  key={comentario.id}
                  className={`rounded-2xl border p-3.5 shadow-2xs space-y-2.5 transition-colors ${
                    !comentario.aprobado
                      ? "bg-orange-50/40 border-orange-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">
                        {comentario.nombre_cliente}
                      </p>
                      <p className="text-[11px] font-bold text-gray-400">
                        {comentario.creado_en
                          ? new Date(comentario.creado_en).toLocaleDateString()
                          : ""}
                      </p>
                    </div>

                    {comentario.aprobado ? (
                      <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-green-200 whitespace-nowrap">
                        ✓ Aprobado
                      </span>
                    ) : (
                      <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-orange-200 whitespace-nowrap">
                        ⏳ Oculto
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold text-[#0f3faf] truncate">
                      📦 {productoVinculado?.titulo || "Producto eliminado"}
                    </span>
                    <span className="text-xs tracking-tighter text-yellow-500 flex-shrink-0">
                      {renderEstrellas(comentario.calificacion)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-gray-100">
                    "{comentario.comentario}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        cambiarEstadoAprobacion(
                          comentario.id,
                          comentario.aprobado
                        )
                      }
                      disabled={procesando}
                      className={`py-2 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                        comentario.aprobado
                          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {comentario.aprobado ? "🙈 Ocultar" : "✅ Aprobar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarComentario(comentario.id)}
                      className="bg-red-50 text-red-600 py-2 rounded-xl text-xs font-black hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      🗑️ Borrar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 💻 VISTA EN TABLA PARA PC / MONITORES */}
          <div className="hidden md:block overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="p-4 font-black text-gray-600">Fecha</th>
                  <th className="p-4 font-black text-gray-600">Producto</th>
                  <th className="p-4 font-black text-gray-600">Cliente / Reseña</th>
                  <th className="p-4 font-black text-gray-600 text-center">
                    Calificación
                  </th>
                  <th className="p-4 font-black text-gray-600 text-center">
                    Estado
                  </th>
                  <th className="p-4 font-black text-gray-600 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {comentarios.map((comentario) => {
                  const productoVinculado = productos.find(
                    (p) => String(p.id) === String(comentario.producto_id)
                  );

                  return (
                    <tr
                      key={comentario.id}
                      className={`border-b hover:bg-blue-50/50 transition-colors ${
                        !comentario.aprobado ? "bg-orange-50/30" : ""
                      }`}
                    >
                      <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                        {new Date(comentario.creado_en).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-gray-800 max-w-[180px] truncate">
                        {productoVinculado?.titulo || "Producto eliminado"}
                      </td>
                      <td className="p-4 max-w-[320px]">
                        <p className="font-black text-gray-800">
                          {comentario.nombre_cliente}
                        </p>
                        <p className="text-gray-600 line-clamp-2 mt-1">
                          {comentario.comentario}
                        </p>
                      </td>
                      <td className="p-4 text-center text-base tracking-widest text-yellow-500 whitespace-nowrap">
                        {renderEstrellas(comentario.calificacion)}
                      </td>
                      <td className="p-4 text-center">
                        {comentario.aprobado ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-black border border-green-200">
                            Aprobado
                          </span>
                        ) : (
                          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-black border border-orange-200">
                            Oculto
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            cambiarEstadoAprobacion(
                              comentario.id,
                              comentario.aprobado
                            )
                          }
                          disabled={procesando}
                          className={`px-4 py-2 rounded-lg text-xs font-black shadow-2xs transition-colors cursor-pointer ${
                            comentario.aprobado
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {comentario.aprobado ? "Ocultar" : "Aprobar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarComentario(comentario.id)}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100 transition-colors cursor-pointer"
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
        </>
      )}
    </div>
  );
}