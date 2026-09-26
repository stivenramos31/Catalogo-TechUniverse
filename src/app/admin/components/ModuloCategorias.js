"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloCategorias({ categorias, productos, recargarDatos }) {
  const [mostrarModalCat, setMostrarModalCat] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", parent_id: "" });
  const [procesando, setProcesando] = useState(false);

  // Filtrar solo las categorías principales (las que no tienen parent_id)
  const categoriasPrincipales = categorias.filter((c) => !c.parent_id);

  // Obtener las subcategorías que pertenecen a una categoría principal
  const obtenerSubcategorias = (parentId) =>
    categorias.filter((c) => Number(c.parent_id) === Number(parentId));

  const abrirModalCat = (cat = null, parentIdPreseleccionado = "") => {
    if (cat) {
      setCategoriaEditando(cat);
      setNuevaCategoria({
        nombre: cat.nombre || "",
        parent_id: cat.parent_id ? String(cat.parent_id) : "",
      });
    } else {
      setCategoriaEditando(null);
      setNuevaCategoria({
        nombre: "",
        parent_id: parentIdPreseleccionado ? String(parentIdPreseleccionado) : "",
      });
    }
    setMostrarModalCat(true);
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.nombre.trim()) return;

    setProcesando(true);
    try {
      const datosGuardar = {
        nombre: nuevaCategoria.nombre.trim(),
        parent_id: nuevaCategoria.parent_id ? Number(nuevaCategoria.parent_id) : null,
      };

      if (categoriaEditando) {
        const { error } = await supabase
          .from("categorias")
          .update(datosGuardar)
          .eq("id", categoriaEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categorias").insert([datosGuardar]);
        if (error) throw error;
      }

      setMostrarModalCat(false);
      recargarDatos();
    } catch (error) {
      alert("Error al guardar: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminarCategoria = async (id, nombre) => {
    const productosAfectados = productos.filter((p) => p.categoria_id === id);
    if (productosAfectados.length > 0) {
      return alert(
        `No puedes eliminar "${nombre}" porque hay ${productosAfectados.length} producto(s) usándola.`
      );
    }

    const subcategoriasHijas = obtenerSubcategorias(id);
    if (subcategoriasHijas.length > 0) {
      return alert(
        `No puedes eliminar "${nombre}" porque tiene ${subcategoriasHijas.length} subcategoría(s) dentro. Elimina o mueve primero sus subcategorías.`
      );
    }

    if (window.confirm(`¿Eliminar la categoría "${nombre}"?`)) {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) alert("Error: " + error.message);
      else recargarDatos();
    }
  };

  // Ordenar visualmente: cada categoría principal seguida de sus subcategorías
  const categoriasOrdenadas = [];
  categoriasPrincipales.forEach((principal) => {
    categoriasOrdenadas.push({ ...principal, esSubcategoria: false });
    const hijas = obtenerSubcategorias(principal.id);
    hijas.forEach((hija) => {
      categoriasOrdenadas.push({
        ...hija,
        esSubcategoria: true,
        nombrePadre: principal.nombre,
      });
    });
  });

  categorias.forEach((cat) => {
    if (!categoriasOrdenadas.some((c) => c.id === cat.id)) {
      categoriasOrdenadas.push({ ...cat, esSubcategoria: Boolean(cat.parent_id) });
    }
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="font-black text-2xl text-gray-800">Gestión de Categorías y Subcategorías</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Organiza tus productos en categorías principales o crea subcategorías específicas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => abrirModalCat()}
          className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm shadow-xs cursor-pointer"
        >
          + Nueva Categoría
        </button>
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="p-4 font-black text-gray-600 w-16 text-center">ID</th>
              <th className="p-4 font-black text-gray-600">Nombre / Jerarquía</th>
              <th className="p-4 font-black text-gray-600">Tipo</th>
              <th className="p-4 font-black text-gray-600">Productos Vinculados</th>
              <th className="p-4 font-black text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categoriasOrdenadas.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-8 text-gray-400 font-bold">
                  No hay categorías registradas.
                </td>
              </tr>
            )}

            {categoriasOrdenadas.map((cat) => {
              const cantProductos = productos.filter((p) => p.categoria_id === cat.id).length;

              return (
                <tr
                  key={cat.id}
                  className={`border-b transition-colors ${
                    cat.esSubcategoria
                      ? "bg-gray-50/70 hover:bg-blue-50/40"
                      : "bg-white hover:bg-blue-50/50"
                  }`}
                >
                  <td className="p-4 text-center font-black text-gray-400">{cat.id}</td>

                  <td className="p-4">
                    {cat.esSubcategoria ? (
                      <div className="pl-6 flex items-center gap-2">
                        <span className="text-blue-500 font-black text-base">↳</span>
                        <div>
                          <span className="font-bold text-gray-800 text-sm block">
                            {cat.nombre}
                          </span>
                          <span className="text-[11px] text-gray-400 font-semibold">
                            Dentro de: {cat.nombrePadre || "Categoría Principal"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="font-black text-gray-900 text-base">{cat.nombre}</span>
                    )}
                  </td>

                  <td className="p-4">
                    {cat.esSubcategoria ? (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 font-black text-[11px] px-2.5 py-1 rounded-full">
                        Subcategoría
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-[#0f3faf] border border-blue-200 font-black text-[11px] px-2.5 py-1 rounded-full">
                        Principal
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-xs">
                      {cantProductos} {cantProductos === 1 ? "producto" : "productos"}
                    </span>
                  </td>

                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    {!cat.esSubcategoria && (
                      <button
                        type="button"
                        onClick={() => abrirModalCat(null, cat.id)}
                        className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-xs font-black hover:bg-green-100 transition-colors cursor-pointer"
                        title={`Crear subcategoría dentro de ${cat.nombre}`}
                      >
                        + Subcategoría
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => abrirModalCat(cat)}
                      className="bg-blue-100 text-blue-700 px-3.5 py-2 rounded-lg text-xs font-black hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarCategoria(cat.id, cat.nombre)}
                      className="bg-red-50 text-red-600 px-3.5 py-2 rounded-lg text-xs font-black hover:bg-red-100 transition-colors cursor-pointer"
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

      {mostrarModalCat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-gray-50 border-b px-6 py-5 flex justify-between items-center">
              <h2 className="font-black text-xl text-gray-800">
                {categoriaEditando
                  ? "Editar Categoría"
                  : nuevaCategoria.parent_id
                  ? "Nueva Subcategoría"
                  : "Nueva Categoría"}
              </h2>
              <button
                type="button"
                onClick={() => setMostrarModalCat(false)}
                className="text-gray-400 hover:text-gray-700 font-black text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarCategoria} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">
                  Tipo / Ubicación de la Categoría
                </label>
                <select
                  value={nuevaCategoria.parent_id}
                  onChange={(e) =>
                    setNuevaCategoria({ ...nuevaCategoria, parent_id: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] font-bold text-sm text-gray-800 outline-none"
                >
                  <option value="">📁 Es una Categoría Principal (Independiente)</option>
                  {categoriasPrincipales
                    .filter((c) => !categoriaEditando || c.id !== categoriaEditando.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        ↳ Subcategoría dentro de: {c.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 uppercase mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder={
                    nuevaCategoria.parent_id
                      ? "Ej: Soldadura, Redes, Cables..."
                      : "Ej: Herramientas, Electrónica..."
                  }
                  value={nuevaCategoria.nombre}
                  onChange={(e) =>
                    setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 focus:border-[#0f3faf] rounded-xl px-4 py-3 bg-white font-black text-base text-center outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalCat(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="flex-[2] bg-[#16a34a] text-white font-black py-3 rounded-xl hover:bg-green-700 cursor-pointer"
                >
                  {procesando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}