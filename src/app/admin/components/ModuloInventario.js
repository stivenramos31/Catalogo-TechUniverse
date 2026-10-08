"use client";
import { useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloInventario({ productos, lotes, recargarDatos }) {
  const [formLote, setFormLote] = useState({ producto_id: "", costo_unitario: "", cantidad: "", notas: "" });
  const [procesando, setProcesando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  
  // Referencia para el auto-scroll y focus del ingreso rápido
  const costoInputRef = useRef(null);

  // --- DETECTOR INTELIGENTE DE IMÁGENES ---
  const obtenerImagen = (prod) => {
    if (prod.imagenes && Array.isArray(prod.imagenes) && prod.imagenes.length > 0) return prod.imagenes[0];
    if (typeof prod.imagenes === 'string' && prod.imagenes.startsWith('[')) {
      try { return JSON.parse(prod.imagenes)[0]; } catch(e){}
    }
    return prod.imagen_principal || prod.imagen_url || prod.imagen || null;
  };

  // 1. AGRUPAR LOTES POR PRODUCTO (Para vista de Inventario)
  const inventarioAgrupado = productos.map(prod => {
    const lotesActivos = lotes
      .filter(l => l.producto_id === prod.id && l.cantidad_disponible > 0)
      .sort((a, b) => new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso));
    
    const stockTotal = lotesActivos.reduce((sum, l) => sum + l.cantidad_disponible, 0);
    
    return { ...prod, stockTotal, lotes: lotesActivos };
  }).filter(p => p.stockTotal > 0);

  // --- INGRESO RÁPIDO DESDE EL BOTÓN '+' ---
  const prepararIngresoRapido = (producto_id) => {
    setFormLote({ producto_id: String(producto_id), costo_unitario: "", cantidad: "", notas: "" });
    if (costoInputRef.current) {
      costoInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Pequeño retraso para asegurar que el scroll termine antes de enfocar
      setTimeout(() => costoInputRef.current.focus(), 300);
    }
  };

  // 2. MANEJO DEL FORMULARIO Y CONFIRMACIÓN
  const iniciarRegistro = (e) => {
    e.preventDefault();
    if (!formLote.producto_id || !formLote.costo_unitario || !formLote.cantidad) return alert("Llena los campos obligatorios");

    const prodSeleccionado = productos.find(p => String(p.id) === String(formLote.producto_id));
    const stockActual = inventarioAgrupado.find(p => String(p.id) === String(formLote.producto_id))?.stockTotal || 0;
    const cantidadNueva = parseInt(formLote.cantidad);

    setConfirmacion({
      producto: prodSeleccionado,
      costo_unitario: parseFloat(formLote.costo_unitario),
      cantidad_nueva: cantidadNueva,
      stock_actual: stockActual,
      stock_final: stockActual + cantidadNueva,
      notas: formLote.notas
    });
  };

  const confirmarGuardado = async () => {
    setProcesando(true);
    try {
      const { error } = await supabase.from("lotes_inventario").insert([{
        producto_id: confirmacion.producto.id,
        costo_unitario: confirmacion.costo_unitario,
        cantidad_inicial: confirmacion.cantidad_nueva,
        cantidad_disponible: confirmacion.cantidad_nueva,
        notas: confirmacion.notas || null
      }]);

      if (error) throw error;

      setFormLote({ producto_id: "", costo_unitario: "", cantidad: "", notas: "" });
      setConfirmacion(null);
      recargarDatos();
      alert("✅ Inversión y nuevo lote registrado correctamente.");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* COLUMNA IZQUIERDA: FORMULARIO DE INGRESO */}
      <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 h-fit lg:col-span-1">
        <h3 className="font-black text-[#0f3faf] mb-6 text-xl flex items-center gap-2">
          <span>➕</span> Registrar Compra
        </h3>
        <form onSubmit={iniciarRegistro} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1">Producto Adquirido *</label>
            <select 
              value={formLote.producto_id} 
              onChange={(e) => setFormLote({ ...formLote, producto_id: e.target.value })} 
              className="w-full border-2 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#0f3faf] bg-white text-gray-800 font-bold"
            >
              <option value="">Selecciona un producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.titulo}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-600 uppercase mb-1">Costo C/U ($) *</label>
              <input 
                ref={costoInputRef}
                type="number" step="0.01" min="0.01" 
                value={formLote.costo_unitario} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormLote({ ...formLote, costo_unitario: e.target.value })} 
                className="w-full border-2 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#0f3faf] text-center font-black text-[#0f3faf]" 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-600 uppercase mb-1">Cantidad *</label>
              <input 
                type="number" min="1" 
                value={formLote.cantidad} 
                onFocus={(e) => e.target.select()}
                onChange={(e) => setFormLote({ ...formLote, cantidad: e.target.value })} 
                className="w-full border-2 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#0f3faf] text-center font-black" 
                placeholder="0" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase mb-1">Notas (Opcional)</label>
            <input 
              type="text" 
              value={formLote.notas} 
              onChange={(e) => setFormLote({ ...formLote, notas: e.target.value })} 
              className="w-full border-2 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#0f3faf]" 
              placeholder="Ej: Proveedor local, envío express" 
            />
          </div>
          <button type="submit" className="w-full bg-[#0f3faf] text-white font-black py-4 rounded-xl hover:bg-blue-800 transition-colors shadow-lg active:scale-95 mt-2">
            Registrar Inversión
          </button>
        </form>
      </div>

      {/* COLUMNA DERECHA: LISTA DE INVENTARIO (FILAS) */}
      <div className="lg:col-span-2">
        <h3 className="font-black text-gray-800 mb-6 text-xl flex items-center gap-2 px-2">
          <span>📦</span> Inventario Actual (FIFO)
        </h3>
        
        <div className="space-y-4">
          {inventarioAgrupado.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 font-bold">No hay inventario disponible.</p>
            </div>
          ) : (
            inventarioAgrupado.map((prod) => {
              const imgUrl = obtenerImagen(prod);
              
              return (
              <div key={prod.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:border-blue-200 transition-colors">
                
                {/* CABECERA DE LA FILA DEL PRODUCTO */}
                <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4 bg-gray-50/50">
                  {/* Miniatura Dinámica y Segura */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl border p-1 shrink-0 flex items-center justify-center">
                    {imgUrl ? (
                      <img src={imgUrl} alt={prod.titulo} className="w-full h-full object-contain rounded-lg" loading="lazy" />
                    ) : (
                      <span className="text-xl sm:text-2xl text-gray-200">📦</span>
                    )}
                  </div>
                  
                  {/* Título */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm sm:text-base leading-tight truncate">{prod.titulo}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 uppercase truncate">ID: {prod.id}</p>
                  </div>

                  {/* Stock Total Grande */}
                  <div className="shrink-0 text-center px-2 sm:px-4 border-l border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Stock</p>
                    <p className="text-2xl sm:text-3xl font-black text-[#0f3faf] leading-none">{prod.stockTotal}</p>
                  </div>

                  {/* BOTÓN + INGRESO RÁPIDO */}
                  <button
                    onClick={() => prepararIngresoRapido(prod.id)}
                    className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#0f3faf] text-white rounded-full flex items-center justify-center font-black text-2xl hover:bg-blue-800 transition-transform shadow-md hover:scale-105 active:scale-95 ml-1"
                    title="Añadir nueva compra de este producto"
                  >
                    +
                  </button>
                </div>

                {/* DESGLOSE DE LOTES (Mini-tabla) */}
                <div className="bg-white px-4 pb-4 pt-2">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-2 ml-1">Lotes Activos (Se venden en este orden 👇)</p>
                  <div className="space-y-2">
                    {prod.lotes.map((lote, index) => (
                      <div key={lote.id} className="flex justify-between items-center text-xs bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-400">#{index + 1}</span>
                          <span className="font-bold text-gray-600">{new Date(lote.fecha_ingreso).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-orange-600">Costo: ${parseFloat(lote.costo_unitario).toFixed(2)}</span>
                          <span className="font-black text-gray-900 bg-gray-200 px-2 py-0.5 rounded text-[10px]">Quedan: {lote.cantidad_disponible}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )})
          )}
        </div>
      </div>

      {/* --- MODAL DE CONFIRMACIÓN DE INGRESO --- */}
      {confirmacion && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <span className="text-3xl">📦</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">Confirmar Ingreso</h2>
              <p className="text-sm text-gray-600 font-bold">{confirmacion.producto.titulo}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6 border border-gray-100">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Stock Actual</span>
                <span className="text-base font-black text-gray-800">{confirmacion.stock_actual} unid.</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Costo Unitario</span>
                <span className="text-base font-black text-orange-600">${confirmacion.costo_unitario.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Nuevas a Ingresar</span>
                <span className="text-lg font-black text-emerald-600">+{confirmacion.cantidad_nueva}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-black text-[#0f3faf] uppercase tracking-wider">Nuevo Total</span>
                <span className="text-2xl font-black text-[#0f3faf]">{confirmacion.stock_final}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmacion(null)} 
                disabled={procesando}
                className="flex-1 bg-gray-100 text-gray-600 font-black py-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarGuardado} 
                disabled={procesando}
                className="flex-1 bg-[#0f3faf] text-white font-black py-4 rounded-xl hover:bg-blue-800 shadow-lg active:scale-95 transition-all"
              >
                {procesando ? "Guardando..." : "Sí, Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}