"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloCategorias({ categorias, productos, recargarDatos }) {
  const [mostrarModalCat, setMostrarModalCat] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "" });
  const [procesando, setProcesando] = useState(false);

  const abrirModalCat = (cat = null) => {
    if (cat) {
      setCategoriaEditando(cat);
      setNuevaCategoria({ nombre: cat.nombre });
    } else {
      setCategoriaEditando(null);
      setNuevaCategoria({ nombre: "" });
    }
    setMostrarModalCat(true);
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      if (categoriaEditando) {
        const { error } = await supabase.from('categorias').update({ nombre: nuevaCategoria.nombre }).eq('id', categoriaEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categorias').insert([{ nombre: nuevaCategoria.nombre }]);
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
    const productosAfectados = productos.filter(p => p.categoria_id === id);
    if (productosAfectados.length > 0) {
      return alert(`No puedes eliminar "${nombre}" porque hay ${productosAfectados.length} producto(s) usándola.`);
    }
    if(window.confirm(`¿Eliminar la categoría "${nombre}"?`)) {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (error) alert("Error: " + error.message);
      else recargarDatos();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-800">Gestión de Categorías</h2>
        <button onClick={() => abrirModalCat()} className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          + Nueva Categoría
        </button>
      </div>
      
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="p-4 font-black text-gray-600 w-16 text-center">ID</th>
              <th className="p-4 font-black text-gray-600">Nombre de la Categoría</th>
              <th className="p-4 font-black text-gray-600">Productos Vinculados</th>
              <th className="p-4 font-black text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-gray-400 font-bold">No hay categorías.</td></tr>}
            {categorias.map(cat => (
              <tr key={cat.id} className="border-b hover:bg-blue-50/50 transition-colors">
                <td className="p-4 text-center font-black text-gray-400">{cat.id}</td>
                <td className="p-4 font-black text-gray-800 text-base">{cat.nombre}</td>
                <td className="p-4"><span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">{productos.filter(p => p.categoria_id === cat.id).length} productos</span></td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => abrirModalCat(cat)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-black hover:bg-blue-200">Editar</button>
                  <button onClick={() => eliminarCategoria(cat.id, cat.nombre)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModalCat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col">
            <div className="bg-gray-50 border-b px-6 py-5 flex justify-between items-center rounded-t-3xl">
              <h2 className="font-black text-xl text-gray-800">{categoriaEditando ? "Editar Categoría" : "Nueva Categoría"}</h2>
            </div>
            <form onSubmit={guardarCategoria} className="p-6 space-y-6">
              <input type="text" value={nuevaCategoria.nombre} onChange={e => setNuevaCategoria({ nombre: e.target.value })} className="w-full border-2 rounded-xl px-4 py-3 bg-white font-black text-lg text-center uppercase" required />
              <div className="flex gap-3">
                <button type="button" onClick={() => setMostrarModalCat(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={procesando} className="flex-[2] bg-[#16a34a] text-white font-black py-3 rounded-xl hover:bg-green-700">{procesando ? "..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}