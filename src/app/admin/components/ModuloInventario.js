"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloInventario({ productos, lotes, recargarDatos }) {
  const [formLote, setFormLote] = useState({ producto_id: "", costo_unitario: "", cantidad_inicial: "", proveedor_o_nota: "" });
  const [loteEnEdicion, setLoteEnEdicion] = useState(null);
  const [procesando, setProcesando] = useState(false);

  // --- FUNCIONES DE INVENTARIO ---
  const guardarLote = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      const datos = {
        producto_id: formLote.producto_id,
        costo_unitario: parseFloat(formLote.costo_unitario),
        cantidad_inicial: parseInt(formLote.cantidad_inicial),
        cantidad_disponible: parseInt(formLote.cantidad_inicial),
        proveedor_o_nota: formLote.proveedor_o_nota,
      };
      const { error } = await supabase.from("lotes_inventario").insert([datos]);
      if (error) throw error;
      alert("✅ Lote registrado.");
      setFormLote({ producto_id: "", costo_unitario: "", cantidad_inicial: "", proveedor_o_nota: "" });
      recargarDatos();
    } catch (error) { alert("Error: " + error.message); } finally { setProcesando(false); }
  };

  const guardarEdicionLote = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      const loteOriginal = lotes.find(l => l.id === loteEnEdicion.id);
      const diferencia = parseInt(loteEnEdicion.cantidad_inicial) - loteOriginal.cantidad_inicial;
      const nuevaDisponible = loteOriginal.cantidad_disponible + diferencia;

      if (nuevaDisponible < 0) throw new Error("Has vendido unidades, no puedes bajar tanto la cantidad.");

      const { error } = await supabase.from("lotes_inventario").update({
        costo_unitario: parseFloat(loteEnEdicion.costo_unitario), cantidad_inicial: parseInt(loteEnEdicion.cantidad_inicial),
        cantidad_disponible: nuevaDisponible, proveedor_o_nota: loteEnEdicion.proveedor_o_nota
      }).eq("id", loteEnEdicion.id);

      if (error) throw error;
      alert("✅ Lote actualizado con éxito.");
      setLoteEnEdicion(null);
      recargarDatos();
    } catch (error) { alert(error.message); } finally { setProcesando(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in w-full">
      {/* PANEL IZQUIERDO: FORMULARIO DE COMPRA */}
      <div className="lg:col-span-1 bg-blue-50/40 p-6 rounded-3xl border border-blue-100/60 h-fit w-full">
        <h3 className="font-black text-gray-800 mb-5 text-lg flex items-center gap-2"><span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">➕</span> Registrar Compra</h3>
        <form onSubmit={guardarLote} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Producto Adquirido *</label>
            <select required value={formLote.producto_id} onChange={(e) => setFormLote({...formLote, producto_id: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 bg-white truncate">
              <option value="">Selecciona...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Costo c/u ($) *</label>
              <input type="number" step="0.01" required value={formLote.costo_unitario} onChange={(e) => setFormLote({...formLote, costo_unitario: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 text-red-600 font-black" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Cantidad *</label>
              <input type="number" min="1" required value={formLote.cantidad_inicial} onChange={(e) => setFormLote({...formLote, cantidad_inicial: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 font-black" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Notas (Opcional)</label>
            <input type="text" value={formLote.proveedor_o_nota} onChange={(e) => setFormLote({...formLote, proveedor_o_nota: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600" placeholder="Ej: Compra local" />
          </div>
          <button type="submit" disabled={procesando} className="w-full bg-[#0f3faf] text-white font-black py-3 rounded-xl hover:bg-blue-800 shadow-md mt-2">
            {procesando ? "Guardando..." : "Registrar Inversión"}
          </button>
        </form>
      </div>

      {/* PANEL DERECHO: LISTA DE LOTES */}
      <div className="lg:col-span-2 w-full">
        <h3 className="font-black text-gray-800 mb-5 text-lg">📦 Lotes con Stock Físico</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {lotes.filter(l => l.cantidad_disponible > 0).map(lote => {
            const prod = productos.find(p => String(p.id) === String(lote.producto_id));
            return (
              <div key={lote.id} className="border border-gray-100 p-4 rounded-2xl shadow-sm bg-white relative group">
                <button onClick={() => setLoteEnEdicion(lote)} className="absolute top-2 right-2 bg-gray-100 hover:bg-blue-100 hover:text-[#0f3faf] text-gray-400 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✏️</button>
                <div className="inline-block bg-blue-50 text-[#0f3faf] text-xs font-black px-2.5 py-1 rounded-lg border border-blue-100 mb-2">Costo: ${parseFloat(lote.costo_unitario).toFixed(2)}</div>
                <p className="font-black text-gray-800 text-sm line-clamp-2 leading-tight pr-8">{prod?.titulo}</p>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Disponibles</p>
                    <p className="text-2xl font-black text-gray-900 leading-none">{lote.cantidad_disponible} <span className="text-xs font-medium text-gray-400">/ {lote.cantidad_inicial}</span></p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{new Date(lote.fecha_ingreso).toLocaleDateString()}</span>
                </div>
              </div>
            )
          })}
          {lotes.filter(l => l.cantidad_disponible > 0).length === 0 && (
            <div className="sm:col-span-2 p-12 text-center border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold">No hay inventario activo.</div>
          )}
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE LOTE */}
      {loteEnEdicion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-black text-xl text-gray-900 mb-1">✏️ Editar Compra</h3>
            <p className="text-xs font-bold text-red-500 mb-5">Ten cuidado, modificar esto afectará tus estadísticas.</p>
            <form onSubmit={guardarEdicionLote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Costo c/u ($)</label>
                  <input type="number" step="0.01" required value={loteEnEdicion.costo_unitario} onChange={(e) => setLoteEnEdicion({...loteEnEdicion, costo_unitario: e.target.value})} className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0f3faf] font-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cant. Original</label>
                  <input type="number" min="1" required value={loteEnEdicion.cantidad_inicial} onChange={(e) => setLoteEnEdicion({...loteEnEdicion, cantidad_inicial: e.target.value})} className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0f3faf] font-black" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Notas</label>
                <input type="text" value={loteEnEdicion.proveedor_o_nota || ""} onChange={(e) => setLoteEnEdicion({...loteEnEdicion, proveedor_o_nota: e.target.value})} className="w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0f3faf]" />
              </div>
              <div className="flex gap-2 mt-6">
                <button type="button" onClick={() => setLoteEnEdicion(null)} className="flex-1 bg-gray-100 text-gray-600 font-black py-3 rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={procesando} className="flex-1 bg-[#0f3faf] text-white font-black py-3 rounded-xl hover:bg-blue-800 shadow-md">{procesando ? "Guardando..." : "Guardar Cambios"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}