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
    fecha_fin: ""
  };
  const [nuevaOferta, setNuevaOferta] = useState(estadoInicial);

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    const { data, error } = await supabase.from('ofertas_flash').select('*').order('creado_en', { ascending: false });
    if (data) setOfertas(data);
    if (error) console.error("Error al cargar ofertas:", error);
  };

  // Ayudante para que el input datetime-local entienda las fechas de la base de datos
  const formatearFechaParaInput = (fechaISO) => {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    // Ajuste de zona horaria local para evitar saltos de día
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
    return fecha.toISOString().slice(0, 16);
  };

  const abrirModal = (oferta = null) => {
    if (oferta) {
      setOfertaEditando(oferta);
      setNuevaOferta({
        producto_id: oferta.producto_id,
        precio_promocion: oferta.precio_promocion,
        stock_promocion: oferta.stock_promocion,
        fecha_inicio: formatearFechaParaInput(oferta.fecha_inicio),
        fecha_fin: formatearFechaParaInput(oferta.fecha_fin)
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
      const datos = {
        producto_id: nuevaOferta.producto_id,
        precio_promocion: parseFloat(nuevaOferta.precio_promocion),
        stock_promocion: parseInt(nuevaOferta.stock_promocion),
        fecha_inicio: new Date(nuevaOferta.fecha_inicio).toISOString(),
        fecha_fin: new Date(nuevaOferta.fecha_fin).toISOString(),
        estado: 'PROGRAMADA' 
      };

      if (ofertaEditando) {
        const { error } = await supabase.from('ofertas_flash').update(datos).eq('id', ofertaEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ofertas_flash').insert([datos]);
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
    if(window.confirm("¿Estás seguro de eliminar esta oferta flash?")) {
      const { error } = await supabase.from('ofertas_flash').delete().eq('id', id);
      if (error) alert("Error: " + error.message);
      else cargarOfertas();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-black text-2xl text-gray-800">⚡ Ofertas Flash</h2>
          <p className="text-gray-500 text-sm">Programa descuentos temporales para tus productos</p>
        </div>
        <button onClick={() => abrirModal()} className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
          + Nueva Oferta
        </button>
      </div>
      
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="p-4 font-black text-gray-600">Producto</th>
              <th className="p-4 font-black text-gray-600">Precio Promoción</th>
              <th className="p-4 font-black text-gray-600">Stock Asignado</th>
              <th className="p-4 font-black text-gray-600">Inicio</th>
              <th className="p-4 font-black text-gray-600">Fin</th>
              <th className="p-4 font-black text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ofertas.length === 0 && <tr><td colSpan="6" className="text-center p-8 text-gray-400 font-bold">No hay ofertas programadas.</td></tr>}
            {ofertas.map(oferta => {
              const productoVinculado = productos.find(p => p.id === oferta.producto_id);
              return (
                <tr key={oferta.id} className="border-b hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-800 flex items-center gap-3">
                    {productoVinculado?.imagenes?.[0] && <img src={productoVinculado.imagenes[0]} className="w-10 h-10 rounded border object-cover" />}
                    <span className="truncate max-w-[200px]">{productoVinculado?.titulo || "Producto no encontrado"}</span>
                  </td>
                  <td className="p-4 font-black text-red-600 text-lg">${oferta.precio_promocion}</td>
                  <td className="p-4"><span className="bg-gray-100 font-black px-3 py-1 rounded-full border">{oferta.stock_promocion}</span></td>
                  <td className="p-4 text-gray-600 font-medium">{new Date(oferta.fecha_inicio).toLocaleString()}</td>
                  <td className="p-4 text-gray-600 font-medium">{new Date(oferta.fecha_fin).toLocaleString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => abrirModal(oferta)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-black hover:bg-blue-200">Editar</button>
                    <button onClick={() => eliminarOferta(oferta.id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100">Borrar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Flotante */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-gray-50 border-b px-8 py-5 flex justify-between items-center z-10">
              <h2 className="font-black text-2xl text-gray-800">{ofertaEditando ? "Editar Oferta Flash" : "Programar Oferta Flash"}</h2>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-red-600 bg-white rounded-full p-2 border transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={guardarOferta} className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar Producto *</label>
                <select value={nuevaOferta.producto_id} onChange={e => setNuevaOferta({ ...nuevaOferta, producto_id: e.target.value })} className="w-full border-2 rounded-xl px-4 py-3 bg-white font-bold outline-none focus:border-[#0f3faf]" required>
                  <option value="" disabled>Elige un producto del inventario...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Precio de Locura ($) *</label>
                  <input type="number" step="0.01" value={nuevaOferta.precio_promocion} onChange={e => setNuevaOferta({ ...nuevaOferta, precio_promocion: e.target.value })} className="w-full border-2 rounded-xl px-4 py-3 bg-white font-black text-red-600 outline-none focus:border-[#0f3faf]" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Stock para la oferta *</label>
                  <input type="number" value={nuevaOferta.stock_promocion} onChange={e => setNuevaOferta({ ...nuevaOferta, stock_promocion: e.target.value })} className="w-full border-2 rounded-xl px-4 py-3 bg-white font-bold outline-none focus:border-[#0f3faf]" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha y Hora de Inicio *</label>
                  <input type="datetime-local" value={nuevaOferta.fecha_inicio} onChange={e => setNuevaOferta({ ...nuevaOferta, fecha_inicio: e.target.value })} className="w-full border-2 rounded-xl px-4 py-3 bg-white font-medium outline-none focus:border-[#0f3faf]" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha y Hora de Fin *</label>
                  <input type="datetime-local" value={nuevaOferta.fecha_fin} onChange={e => setNuevaOferta({ ...nuevaOferta, fecha_fin: e.target.value })} className="w-full border-2 rounded-xl px-4 py-3 bg-white font-medium outline-none focus:border-[#0f3faf]" required />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={procesando} className="flex-[2] bg-[#0f3faf] text-white font-black py-4 rounded-xl hover:bg-blue-800 shadow-lg shadow-blue-200">{procesando ? "Guardando..." : "Programar Oferta"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}