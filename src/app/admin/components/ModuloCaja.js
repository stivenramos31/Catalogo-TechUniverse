"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const DEPARTAMENTOS_SV = ["San Miguel", "San Salvador", "Santa Ana", "La Libertad", "Usulután", "Sonsonate", "La Unión", "La Paz", "Chalatenango", "Cuscatlán", "Ahuachapán", "Morazán", "San Vicente", "Cabañas"];

export default function ModuloCaja({ productos, lotes, recargarDatos, onTicketGenerado }) {
  const [carrito, setCarrito] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(false);
  
  // --- ESTADOS PARA LA CONFIRMACIÓN Y EL TIMER DE 3 SEGUNDOS ---
  const [mostrarAnalisis, setMostrarAnalisis] = useState(false);
  const [iniciandoCuentaRegresiva, setIniciandoCuentaRegresiva] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(3);
  
  const [formVenta, setFormVenta] = useState({ 
    cliente_nombre: "", cliente_telefono: "", departamento: "San Miguel", tipo_entrega: "Normal", 
    envio_cobrado_cliente: "", descuento: "", costo_envio_transporte: "", comision_metodo_pago: "", notas_internas: "" 
  });
  
  const [productoPorConfirmar, setProductoPorConfirmar] = useState(null);
  const [datosIngreso, setDatosIngreso] = useState({ cantidad: 1, precio: 0 });
  const [toastMensaje, setToastMensaje] = useState("");

  // --- DETECTOR INTELIGENTE DE IMÁGENES ---
  const obtenerImagen = (prod) => {
    if (!prod) return null;
    if (prod.imagenes && Array.isArray(prod.imagenes) && prod.imagenes.length > 0) return prod.imagenes[0];
    if (typeof prod.imagenes === 'string' && prod.imagenes.startsWith('[')) {
      try { return JSON.parse(prod.imagenes)[0]; } catch(e){}
    }
    return prod.imagen_principal || prod.imagen_url || prod.imagen || null;
  };

  const stockPorProducto = lotes.reduce((acc, lote) => {
    acc[lote.producto_id] = (acc[lote.producto_id] || 0) + lote.cantidad_disponible;
    return acc;
  }, {});
  
  const productosConStock = productos.filter(p => stockPorProducto[p.id] > 0);

  // --- CÁLCULOS DE CARA AL CLIENTE ---
  const totalProductos = carrito.reduce((sum, item) => sum + (parseFloat(item.precio_unitario || 0) * parseInt(item.cantidad || 0)), 0);
  const envioCliente = parseFloat(formVenta.envio_cobrado_cliente || 0);
  const descuentoAplicado = parseFloat(formVenta.descuento || 0);
  const totalVentaCliente = (totalProductos - descuentoAplicado) + envioCliente; 

  // --- CÁLCULOS INTERNOS REALES (AGENCIAS) ---
  let costoAgenciaFijo = 0;
  let comisionAgencia = 0;
  
  if (formVenta.tipo_entrega === "Express") {
    costoAgenciaFijo = 3.85;
    comisionAgencia = totalVentaCliente * 0.025; // 2.5%
  } else if (formVenta.tipo_entrega === "Forza") {
    costoAgenciaFijo = 1.50;
    comisionAgencia = totalVentaCliente * 0.03; // 3.0%
  } else {
    // Normal / Retiro (Permitimos que el admin ponga un gasto manual si pagó un Uber, etc, sino es 0)
    costoAgenciaFijo = parseFloat(formVenta.costo_envio_transporte || 0);
    comisionAgencia = parseFloat(formVenta.comision_metodo_pago || 0);
  }

  // --- CÁLCULO DEL COSTO REAL DE INVENTARIO (PRE-VENTA) ---
  const calcularCostoMercancia = () => {
    let costoTotal = 0;
    for (let item of carrito) {
      const lotesDisponibles = lotes.filter(l => l.producto_id === item.producto_id && l.cantidad_disponible > 0).sort((a, b) => new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso));
      let cantidadFaltante = parseInt(item.cantidad);
      for (let lote of lotesDisponibles) {
        if (cantidadFaltante === 0) break;
        const cantidadATomar = Math.min(cantidadFaltante, lote.cantidad_disponible);
        costoTotal += (cantidadATomar * parseFloat(lote.costo_unitario));
        cantidadFaltante -= cantidadATomar;
      }
    }
    return costoTotal;
  };
  
  const costoRealInversion = calcularCostoMercancia();
  const gananciaNetaReal = totalVentaCliente - costoAgenciaFijo - comisionAgencia - costoRealInversion;

  const manejarCambioVenta = (campo, valor) => {
    const nuevoForm = { ...formVenta, [campo]: valor };
    // Si cambia de agencia, reseteamos los campos manuales para evitar confusiones
    if (campo === "tipo_entrega" && (valor === "Express" || valor === "Forza")) {
      nuevoForm.costo_envio_transporte = ""; 
      nuevoForm.comision_metodo_pago = "";
    }
    setFormVenta(nuevoForm);
  };

  const iniciarAgregar = () => {
    const selector = document.getElementById("selectorProd");
    if (!selector.value) return;
    const prodSeleccionado = productos.find(p => String(p.id) === String(selector.value));
    if (prodSeleccionado) {
      setDatosIngreso({ cantidad: 1, precio: prodSeleccionado.precio || 0 });
      setProductoPorConfirmar(prodSeleccionado);
    }
  };

  const confirmarAgregarAlCarrito = () => {
    const prod = productoPorConfirmar;
    const stockMaximo = stockPorProducto[prod.id] || 0;
    const itemEnCarrito = carrito.find(item => item.producto_id === prod.id);
    const cantidadYaEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    const cantidadAñadir = parseInt(datosIngreso.cantidad) || 1;

    if (cantidadYaEnCarrito + cantidadAñadir > stockMaximo) return alert(`⚠️ ¡Stock insuficiente!`);

    if (itemEnCarrito) {
      setCarrito(carrito.map(item => item.producto_id === prod.id ? { ...item, cantidad: item.cantidad + cantidadAñadir, precio_unitario: parseFloat(datosIngreso.precio) } : item));
    } else {
      setCarrito([...carrito, { 
          id_temporal: Date.now(), 
          producto_id: prod.id, 
          titulo: prod.titulo, 
          imagen: obtenerImagen(prod), 
          cantidad: cantidadAñadir, 
          precio_unitario: parseFloat(datosIngreso.precio) 
      }]);
    }
    setProductoPorConfirmar(null);
    setToastMensaje(`🛒 ¡Añadido: ${cantidadAñadir}x ${prod.titulo}!`);
    setTimeout(() => setToastMensaje(""), 2500);
    document.getElementById("selectorProd").value = "";
  };

  const actualizarItemCarrito = (id_temp, campo, valor) => {
    if(campo === 'cantidad'){
      const item = carrito.find(i => i.id_temporal === id_temp);
      if (parseInt(valor) > (stockPorProducto[item.producto_id] || 0)) return alert(`Error de stock físico.`);
    }
    setCarrito(carrito.map(item => item.id_temporal === id_temp ? { ...item, [campo]: valor } : item));
  };

  // --- LÓGICA DE LA CUENTA REGRESIVA (TIMER) ---
  useEffect(() => {
    let timer;
    if (iniciandoCuentaRegresiva && segundosRestantes > 0) {
      timer = setTimeout(() => setSegundosRestantes(prev => prev - 1), 1000);
    } else if (iniciandoCuentaRegresiva && segundosRestantes === 0) {
      registrarVentaFinal(); // Cuando llega a 0, dispara a la base de datos
    }
    return () => clearTimeout(timer);
  }, [iniciandoCuentaRegresiva, segundosRestantes]);

  const abrirAnalisisRentabilidad = (e) => {
    e.preventDefault();
    if (carrito.length === 0) return alert("El carrito está vacío.");
    
    // Validación lógica: Si usas agencia, DEBES poner cuánto le cobras al cliente de envío (aunque sea $0)
    if ((formVenta.tipo_entrega === "Express" || formVenta.tipo_entrega === "Forza") && formVenta.envio_cobrado_cliente === "") {
      return alert("⚠ OBLIGATORIO: Ingresa cuánto le vas a cobrar al cliente por el envío, o pon 0 si es gratis para él.");
    }

    setMostrarAnalisis(true); // Abrimos el modal de análisis real
  };

  const cancelarTimer = () => {
    setIniciandoCuentaRegresiva(false);
    setSegundosRestantes(3);
  };

  // --- REGISTRO REAL EN LA BASE DE DATOS ---
  const registrarVentaFinal = async () => {
    setProcesando(true);
    setIniciandoCuentaRegresiva(false);
    
    try {
      const lotesAActualizar = [];
      const detallesVenta = [];

      for (let item of carrito) {
        let cantidadFaltante = parseInt(item.cantidad);
        const lotesDisponibles = lotes.filter(l => l.producto_id === item.producto_id && l.cantidad_disponible > 0).sort((a, b) => new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso));
        
        for (let lote of lotesDisponibles) {
          if (cantidadFaltante === 0) break;
          const cantidadATomar = Math.min(cantidadFaltante, lote.cantidad_disponible);
          cantidadFaltante -= cantidadATomar;
          lotesAActualizar.push({ id: lote.id, nueva_cantidad: lote.cantidad_disponible - cantidadATomar });
          detallesVenta.push({ lote_id: lote.id, producto_id: item.producto_id, cantidad: cantidadATomar, costo_lote_unidad: lote.costo_unitario, precio_negociado_unidad: parseFloat(item.precio_unitario) });
        }
      }

      const { data: nuevaVenta, error: errorVenta } = await supabase.from("ventas_operativas").insert([{
          cliente_nombre: formVenta.cliente_nombre || "Público General", 
          cliente_telefono: formVenta.cliente_telefono,
          departamento: formVenta.departamento,
          tipo_entrega: formVenta.tipo_entrega, 
          ingreso_total_cliente: totalVentaCliente, 
          envio_cobrado_cliente: envioCliente, 
          descuento: descuentoAplicado,
          costo_envio_transporte: costoAgenciaFijo, 
          comision_metodo_pago: comisionAgencia, 
          costo_total_productos: costoRealInversion, 
          ganancia_neta_limpia: gananciaNetaReal, 
          notas_internas: formVenta.notas_internas
      }]).select().single();
      
      if (errorVenta) throw errorVenta;

      for (let detalle of detallesVenta) { detalle.venta_operativa_id = nuevaVenta.id; await supabase.from("detalles_venta_operativa").insert([detalle]); }
      for (let actualizacion of lotesAActualizar) { await supabase.from("lotes_inventario").update({ cantidad_disponible: actualizacion.nueva_cantidad }).eq("id", actualizacion.id); }

      const ticketGenerado = {
        id: nuevaVenta.id, fecha: new Date().toLocaleString(), cliente: formVenta.cliente_nombre || "Público General", telefono: formVenta.cliente_telefono,
        departamento: formVenta.departamento, tipo_entrega: formVenta.tipo_entrega, items: carrito,
        envio_cobrado: envioCliente, descuento: descuentoAplicado, total: totalVentaCliente, subtotal: totalProductos
      };

      // Reseteo exitoso
      setCarrito([]);
      setFormVenta({ cliente_nombre: "", cliente_telefono: "", departamento: "San Miguel", tipo_entrega: "Normal", envio_cobrado_cliente: "", descuento: "", costo_envio_transporte: "", comision_metodo_pago: "", notas_internas: "" });
      setMostrarAnalisis(false);
      setSegundosRestantes(3);
      
      setVentaExitosa(true);
      setTimeout(() => {
        setVentaExitosa(false);
        recargarDatos();
        onTicketGenerado(ticketGenerado);
      }, 2000);

    } catch (error) { 
      alert("Error en la Base de Datos: " + error.message); 
      setProcesando(false); 
    } 
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in w-full relative">
      
      {/* PANTALLA VERDE DE ÉXITO */}
      {ventaExitosa && (
        <div className="fixed inset-0 bg-emerald-600/95 z-[200] flex flex-col items-center justify-center text-white animate-fade-in">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 animate-bounce">
            <span className="text-emerald-600 text-6xl">✅</span>
          </div>
          <h2 className="text-4xl font-black mb-2">¡Venta Registrada!</h2>
          <p className="text-emerald-100 font-bold">Generando ticket de cobro...</p>
        </div>
      )}

      {toastMensaje && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#0f3faf] text-white px-8 py-3 rounded-2xl font-black text-sm shadow-2xl animate-bounce flex items-center gap-2 border border-blue-400">
          ✅ {toastMensaje}
        </div>
      )}

      {/* --- COLUMNA 1: BUSCADOR Y CARRITO --- */}
      <div className="bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-200 w-full overflow-hidden relative">
        <h3 className="font-black text-gray-800 mb-4 text-lg">🛍️ Buscar y Agregar</h3>
        <div className="mb-4 flex flex-col sm:flex-row gap-2 w-full">
          <select id="selectorProd" className="flex-1 min-w-0 w-full border-2 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white truncate font-bold text-gray-700">
            <option value="">Buscar producto para agregar...</option>
            {productosConStock.map(p => <option key={p.id} value={p.id}>{p.titulo} (Stock: {stockPorProducto[p.id]})</option>)}
          </select>
          <button onClick={iniciarAgregar} className="bg-emerald-600 text-white font-black px-6 py-2 rounded-xl hover:bg-emerald-700 shadow-md transition-transform active:scale-95">Agregar</button>
        </div>
        
        {/* LISTA DEL CARRITO CON IMÁGENES */}
        <div className="space-y-3 min-h-[200px]">
          {carrito.map((item, index) => (
            <div key={item.id_temporal} className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3 w-full hover:border-emerald-200 transition-colors">
              <span className="font-black text-gray-300 text-xs">{index + 1}.</span>
              
              {/* Imagen del Producto en el Carrito */}
              <div className="w-12 h-12 bg-gray-50 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden">
                {item.imagen ? (
                  <img src={item.imagen} alt={item.titulo} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-xl">📦</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-800 truncate w-full">{item.titulo}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="flex items-center border rounded-lg overflow-hidden w-20">
                    <span className="px-2 text-xs font-bold bg-gray-50 text-gray-500">Cant</span>
                    <input type="number" min="1" value={item.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => actualizarItemCarrito(item.id_temporal, 'cantidad', e.target.value)} className="w-full text-center text-xs font-black p-1 outline-none text-gray-700" />
                  </div>
                  <div className="flex items-center border rounded-lg overflow-hidden w-24 border-emerald-200">
                    <span className="px-2 text-xs font-bold bg-emerald-50 text-emerald-700">$</span>
                    <input type="number" step="0.01" value={item.precio_unitario} onFocus={(e) => e.target.select()} onChange={(e) => actualizarItemCarrito(item.id_temporal, 'precio_unitario', e.target.value)} className="w-full text-center text-xs font-black p-1 outline-none text-emerald-700" />
                  </div>
                </div>
              </div>
              <button onClick={() => setCarrito(carrito.filter(i => i.id_temporal !== item.id_temporal))} className="text-red-400 hover:text-red-600 p-2 font-black transition-colors text-lg">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* --- COLUMNA 2: DETALLES DE COBRO Y AGENCIAS --- */}
      <div className="bg-emerald-50/40 p-4 sm:p-6 rounded-3xl border border-emerald-100/60 h-fit w-full">
        <h3 className="font-black text-gray-800 mb-4 text-lg">💰 Detalles de Cobro</h3>
        
        <form onSubmit={abrirAnalisisRentabilidad} className="space-y-4">
          
          {/* INFORMACIÓN DEL CLIENTE (Mejorada) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-2xl border">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cliente</label>
              <input type="text" value={formVenta.cliente_nombre} onChange={(e) => manejarCambioVenta("cliente_nombre", e.target.value)} className="w-full border-2 rounded-lg px-2 py-1.5 text-xs bg-white font-bold text-gray-700 outline-none focus:border-emerald-500" placeholder="Nombre (Opcional)" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Teléfono</label>
              <input type="tel" value={formVenta.cliente_telefono} onChange={(e) => manejarCambioVenta("cliente_telefono", e.target.value)} className="w-full border-2 rounded-lg px-2 py-1.5 text-xs bg-white font-bold text-gray-700 outline-none focus:border-emerald-500" placeholder="7000-0000" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dpto.</label>
              <select value={formVenta.departamento} onChange={(e) => manejarCambioVenta("departamento", e.target.value)} className="w-full border-2 rounded-lg px-1 py-1.5 text-[11px] bg-white font-bold text-gray-700 outline-none focus:border-emerald-500">
                {DEPARTAMENTOS_SV.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
          </div>
          
          {/* SELECTOR DE AGENCIAS (3 Opciones) */}
          <div className="bg-white p-1.5 rounded-xl border-2 flex flex-wrap sm:flex-nowrap gap-1 w-full relative overflow-hidden shadow-sm">
            <label className={`flex-1 text-center py-2.5 text-[11px] font-black rounded-lg cursor-pointer truncate transition-colors ${formVenta.tipo_entrega === "Normal" ? "bg-gray-800 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              <input type="radio" name="tipo_entrega" value="Normal" checked={formVenta.tipo_entrega === "Normal"} onChange={(e) => manejarCambioVenta("tipo_entrega", e.target.value)} className="hidden" /> 
              🏬 Local / Retiro
            </label>
            <label className={`flex-1 text-center py-2.5 text-[11px] font-black rounded-lg cursor-pointer truncate transition-colors ${formVenta.tipo_entrega === "Express" ? "bg-[#0f3faf] text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              <input type="radio" name="tipo_entrega" value="Express" checked={formVenta.tipo_entrega === "Express"} onChange={(e) => manejarCambioVenta("tipo_entrega", e.target.value)} className="hidden" /> 
              🛵 Express SV
            </label>
            <label className={`flex-1 text-center py-2.5 text-[11px] font-black rounded-lg cursor-pointer truncate transition-colors ${formVenta.tipo_entrega === "Forza" ? "bg-[#E63946] text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              <input type="radio" name="tipo_entrega" value="Forza" checked={formVenta.tipo_entrega === "Forza"} onChange={(e) => manejarCambioVenta("tipo_entrega", e.target.value)} className="hidden" /> 
              📦 Forza
            </label>
          </div>

          {/* CAMPOS DE COBRO AL CLIENTE */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`border p-3 rounded-2xl transition-colors ${(formVenta.tipo_entrega === "Express" || formVenta.tipo_entrega === "Forza") ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
               <label className="block text-[10px] font-black text-gray-700 uppercase mb-1">
                 Envío Cobrado ($) {(formVenta.tipo_entrega === "Express" || formVenta.tipo_entrega === "Forza") && <span className="text-red-500">*</span>}
               </label>
               <input type="number" step="0.01" value={formVenta.envio_cobrado_cliente} onFocus={(e) => e.target.select()} onChange={(e) => manejarCambioVenta("envio_cobrado_cliente", e.target.value)} className="w-full bg-white border-2 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-blue-500 text-blue-700" placeholder="Ej: 3.00" />
            </div>
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl">
               <label className="block text-[10px] font-black text-orange-800 uppercase mb-1">Descuento ($)</label>
               <input type="number" step="0.01" value={formVenta.descuento} onFocus={(e) => e.target.select()} onChange={(e) => manejarCambioVenta("descuento", e.target.value)} className="w-full bg-white border-2 border-orange-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-orange-600 text-orange-600" placeholder="0.00" />
            </div>
          </div>

          {/* CAMPOS DE COMISIÓN INTERNA (Bloqueados si es agencia) */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-100/50 border rounded-2xl">
            <div>
              <label className="block text-[9px] font-bold text-gray-500 uppercase truncate mb-1">
                {formVenta.tipo_entrega === "Express" ? "Tarifa Express (Fija)" : formVenta.tipo_entrega === "Forza" ? "Tarifa Forza (Fija)" : "Gasto Transporte Local"}
              </label>
              <input 
                type="number" step="0.01" 
                value={formVenta.tipo_entrega !== "Normal" ? costoAgenciaFijo.toFixed(2) : formVenta.costo_envio_transporte} 
                onFocus={(e) => e.target.select()} 
                onChange={(e) => formVenta.tipo_entrega === "Normal" && manejarCambioVenta("costo_envio_transporte", e.target.value)} 
                disabled={formVenta.tipo_entrega !== "Normal"} 
                className={`w-full rounded-lg px-2 py-1.5 text-sm font-bold border ${formVenta.tipo_entrega !== "Normal" ? "bg-gray-200 text-gray-500 cursor-not-allowed border-transparent" : "bg-white text-red-600 border-gray-300 focus:border-red-400 outline-none"}`} 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-500 uppercase truncate mb-1">
                {formVenta.tipo_entrega === "Express" ? "Comisión Express (2.5%)" : formVenta.tipo_entrega === "Forza" ? "Comisión Forza (3.0%)" : "Comisión Extra / Pos"}
              </label>
              <input 
                type="number" step="0.01" 
                value={formVenta.tipo_entrega !== "Normal" ? comisionAgencia.toFixed(2) : formVenta.comision_metodo_pago} 
                onFocus={(e) => e.target.select()} 
                onChange={(e) => formVenta.tipo_entrega === "Normal" && manejarCambioVenta("comision_metodo_pago", e.target.value)} 
                disabled={formVenta.tipo_entrega !== "Normal"} 
                className={`w-full rounded-lg px-2 py-1.5 text-sm font-bold border ${formVenta.tipo_entrega !== "Normal" ? "bg-gray-200 text-gray-500 cursor-not-allowed border-transparent" : "bg-white text-red-600 border-gray-300 focus:border-red-400 outline-none"}`} 
                placeholder="0.00" 
              />
            </div>
          </div>

          <div className="bg-emerald-600 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <span className="font-bold text-sm uppercase tracking-wider relative z-10">Total a Cobrar</span>
            <span className="text-3xl font-black relative z-10">${totalVentaCliente.toFixed(2)}</span>
          </div>
          
          <button type="submit" disabled={carrito.length === 0} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl hover:bg-black transition-colors text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
            <span>📊</span> Analizar Rentabilidad y Emitir
          </button>
        </form>
      </div>

      {/* --- MODAL 1: CONFIRMAR INGRESO DE PRODUCTO AL CARRITO --- */}
      {productoPorConfirmar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center border-t-8 border-[#0f3faf]">
            <h3 className="font-black text-xl mb-1">Confirmar Ingreso</h3>
            <p className="text-sm font-bold text-gray-600 mb-1">{productoPorConfirmar.titulo}</p>
            <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
              <div className="text-left">
                <label className="block text-[11px] font-bold text-gray-500">CANTIDAD *</label>
                <input type="number" min="1" max={stockPorProducto[productoPorConfirmar.id]} value={datosIngreso.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => setDatosIngreso({...datosIngreso, cantidad: e.target.value})} className="w-full border-2 rounded-xl px-3 py-3 text-lg font-black text-center text-gray-800 outline-none focus:border-[#0f3faf]" />
              </div>
              <div className="text-left">
                <label className="block text-[11px] font-bold text-gray-500">PRECIO C/U ($) *</label>
                <input type="number" step="0.01" value={datosIngreso.precio} onFocus={(e) => e.target.select()} onChange={(e) => setDatosIngreso({...datosIngreso, precio: e.target.value})} className="w-full border-2 rounded-xl px-3 py-3 text-lg font-black text-emerald-600 text-center outline-none focus:border-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setProductoPorConfirmar(null)} className="flex-1 bg-gray-100 text-gray-600 font-black py-3.5 rounded-xl hover:bg-gray-200">Cancelar</button>
              <button onClick={confirmarAgregarAlCarrito} className="flex-1 bg-[#0f3faf] text-white font-black py-3.5 rounded-xl shadow-md active:scale-95">Añadir al Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ANÁLISIS DE RENTABILIDAD Y CONFIRMACIÓN FINAL (CON TIMER DE ABORTO) --- */}
      {mostrarAnalisis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            
            {/* Cabecera del Modal */}
            <div className="bg-gray-900 text-white p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <h2 className="text-2xl font-black relative z-10 mb-1">Análisis de Rentabilidad</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest relative z-10">Verificación Interna Confidencial</p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Resumen de Cliente vs Costos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-800 uppercase mb-1">El Cliente Paga</p>
                  <p className="text-3xl font-black text-emerald-600">${totalVentaCliente.toFixed(2)}</p>
                  <p className="text-[9px] text-emerald-600/70 font-bold mt-1 leading-tight">Incluye envío y decuentos aplicados.</p>
                </div>
                
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-[10px] font-black text-red-800 uppercase mb-1">Tus Costos y Ded.</p>
                  <p className="text-3xl font-black text-red-600">-${(costoRealInversion + costoAgenciaFijo + comisionAgencia).toFixed(2)}</p>
                  <p className="text-[9px] text-red-600/70 font-bold mt-1 leading-tight">Mercadería + Agencias + Comisiones.</p>
                </div>
              </div>

              {/* Desglose de Deducciones Fijas */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Inversión Mercadería (FIFO):</span>
                  <span className="font-black text-gray-800">-${costoRealInversion.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Agencia / Transporte ({formVenta.tipo_entrega}):</span>
                  <span className="font-black text-red-500">-${costoAgenciaFijo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Comisión Manejo Efectivo:</span>
                  <span className="font-black text-red-500">-${comisionAgencia.toFixed(2)}</span>
                </div>
              </div>

              {/* GANANCIA REAL FINAL */}
              <div className={`p-5 rounded-2xl flex justify-between items-center shadow-inner border-2 ${gananciaNetaReal > 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${gananciaNetaReal > 0 ? "text-blue-800" : "text-orange-800"}`}>Ganancia Neta Libre</p>
                  <p className={`text-[9px] font-bold leading-tight ${gananciaNetaReal > 0 ? "text-blue-600/80" : "text-orange-700/80"}`}>
                    Lo que queda para tu bolsillo.
                  </p>
                </div>
                <div className={`text-4xl font-black ${gananciaNetaReal > 0 ? "text-[#0f3faf]" : "text-orange-600"}`}>
                  ${gananciaNetaReal.toFixed(2)}
                </div>
              </div>

              {/* ZONA DE BOTONES Y TIMER DE SEGURIDAD */}
              <div className="pt-2">
                {!iniciandoCuentaRegresiva ? (
                  <div className="flex gap-3">
                    <button onClick={() => setMostrarAnalisis(false)} className="flex-1 text-gray-500 font-bold text-sm bg-gray-100 hover:bg-gray-200 py-4 rounded-xl transition-colors">
                      Volver a la Caja
                    </button>
                    <button onClick={() => setIniciandoCuentaRegresiva(true)} className={`flex-[2] text-white font-black text-sm py-4 rounded-xl shadow-lg transition-transform active:scale-95 ${gananciaNetaReal > 0 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"}`}>
                      {gananciaNetaReal > 0 ? "Sí, Proceder con la Venta" : "Confirmar a pesar del margen"}
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Barra de progreso de fondo */}
                    <div className="absolute inset-0 bg-red-100 rounded-xl overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all ease-linear" 
                        style={{ width: `${((3 - segundosRestantes) / 3) * 100}%`, transitionDuration: '1000ms' }}
                      ></div>
                    </div>
                    {/* Botón de Cancelar sobre la barra */}
                    <button onClick={cancelarTimer} className="relative z-10 w-full flex items-center justify-center gap-2 text-white font-black text-lg py-4 shadow-lg hover:brightness-110 transition-all">
                      <span className="text-2xl">🛑</span> CANCELAR EMISIÓN ({segundosRestantes}s)
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}