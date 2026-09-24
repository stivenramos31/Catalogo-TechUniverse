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
      .from('comentarios_producto')
      .select('*')
      .order('creado_en', { ascending: false });
      
    if (data) setComentarios(data);
    if (error) console.error("Error al cargar comentarios:", error);
    setCargando(false);
  };

  const cambiarEstadoAprobacion = async (id, estadoActual) => {
    setProcesando(true);
    try {
      const nuevoEstado = !estadoActual;
      const { error } = await supabase
        .from('comentarios_producto')
        .update({ aprobado: nuevoEstado })
        .eq('id', id);
        
      if (error) throw error;
      
      // Actualizamos la vista local al instante
      setComentarios(comentarios.map(c => c.id === id ? { ...c, aprobado: nuevoEstado } : c));
    } catch (error) {
      alert("Error al cambiar el estado: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminarComentario = async (id) => {
    if(window.confirm("¿Estás completamente seguro de eliminar este comentario de forma permanente?")) {
      const { error } = await supabase.from('comentarios_producto').delete().eq('id', id);
      if (error) alert("Error al eliminar: " + error.message);
      else cargarComentarios();
    }
  };

  const renderEstrellas = (calificacion) => {
    return "⭐".repeat(calificacion) + "☆".repeat(5 - calificacion);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-black text-2xl text-gray-800">⭐ Moderación de Comentarios</h2>
          <p className="text-gray-500 text-sm">Aprueba o elimina las reseñas de tus clientes antes de que sean públicas.</p>
        </div>
        <button onClick={cargarComentarios} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition-colors shadow-sm flex gap-2 items-center">
          🔄 Actualizar
        </button>
      </div>
      
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="p-4 font-black text-gray-600">Fecha</th>
              <th className="p-4 font-black text-gray-600">Producto</th>
              <th className="p-4 font-black text-gray-600">Cliente / Reseña</th>
              <th className="p-4 font-black text-gray-600 text-center">Calificación</th>
              <th className="p-4 font-black text-gray-600 text-center">Estado</th>
              <th className="p-4 font-black text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan="6" className="text-center p-8 text-gray-400 font-bold">Cargando comentarios...</td></tr>}
            {!cargando && comentarios.length === 0 && <tr><td colSpan="6" className="text-center p-8 text-gray-400 font-bold">No hay comentarios para moderar.</td></tr>}
            
            {comentarios.map(comentario => {
              const productoVinculado = productos.find(p => p.id === comentario.producto_id);
              
              return (
                <tr key={comentario.id} className={`border-b hover:bg-blue-50/50 transition-colors ${!comentario.aprobado ? 'bg-orange-50/30' : ''}`}>
                  <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                    {new Date(comentario.creado_en).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold text-gray-800 max-w-[150px] truncate">
                    {productoVinculado?.titulo || "Producto eliminado"}
                  </td>
                  <td className="p-4 max-w-[300px]">
                    <p className="font-black text-gray-800">{comentario.nombre_cliente}</p>
                    <p className="text-gray-600 line-clamp-2 mt-1">{comentario.comentario}</p>
                  </td>
                  <td className="p-4 text-center text-lg tracking-widest text-yellow-500">
                    {renderEstrellas(comentario.calificacion)}
                  </td>
                  <td className="p-4 text-center">
                    {comentario.aprobado ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-black border border-green-200">Aprobado</span>
                    ) : (
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-black border border-orange-200">Oculto</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button 
                      onClick={() => cambiarEstadoAprobacion(comentario.id, comentario.aprobado)} 
                      disabled={procesando}
                      className={`px-4 py-2 rounded-lg text-xs font-black shadow-sm transition-colors ${comentario.aprobado ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {comentario.aprobado ? 'Ocultar' : 'Aprobar'}
                    </button>
                    <button 
                      onClick={() => eliminarComentario(comentario.id)} 
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100 transition-colors"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}