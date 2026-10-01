"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

const DEPARTAMENTOS_SV = ["San Miguel", "San Salvador", "Santa Ana", "La Libertad", "Usulután", "Sonsonate", "La Unión", "La Paz", "Chalatenango", "Cuscatlán", "Ahuachapán", "Morazán", "San Vicente", "Cabañas"];

export default function ModuloCaja({ productos, lotes, recargarDatos, onTicketGenerado }) {
  const [carrito, setCarrito] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState(false);
  
  const [formVenta, setFormVenta] = useState({ 
    cliente_nombre: "", departamento: "San Miguel", tipo_entrega: "Normal", 
    envio_cobrado_cliente: "", descuento: "", costo_envio_transporte: "", comision_metodo_pago: "", notas_internas: "" 
  });
  
  const [productoPorConfirmar, setProductoPorConfirmar] = useState(null);
  const [datosIngreso, setDatosIngreso] = useState({ cantidad: 1, precio: 0 });
  const [toastMensaje, setToastMensaje] = useState("");

  const stockPorProducto = lotes.reduce((acc, lote) => {
    acc[lote.producto_id] = (acc[lote.producto_id] || 0) + lote.cantidad_disponible;
    return acc;
  }, {});
  const productosConStock = productos.filter(p => stockPorProducto[p.id] > 0);

  const totalProductos = carrito.reduce((sum, item) => sum + (parseFloat(item.precio_unitario || 0) * parseInt(item.cantidad || 0)), 0);
  const envioCliente = parseFloat(formVenta.envio_cobrado_cliente || 0);
  const descuentoAplicado = parseFloat(formVenta.descuento || 0);
  const totalVentaCliente = (totalProductos - descuentoAplicado) + envioCliente; 

  let costoAgenciaFijo = formVenta.tipo_entrega === "Express" ? 3.85 : parseFloat(formVenta.costo_envio_transporte || 0);
  let comisionAgencia = formVenta.tipo_entrega === "Express" ? (totalVentaCliente * 0.025) : parseFloat(formVenta.comision_metodo_pago || 0);

  const manejarCambioVenta = (campo, valor) => {
    const nuevoForm = { ...formVenta, [campo]: valor };
    if (campo === "tipo_entrega" && valor !== "Express") {
      nuevoForm.costo_envio_transporte = ""; nuevoForm.comision_metodo_pago = "";
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
      setCarrito([...carrito, { id_temporal: Date.now(), producto_id: prod.id, titulo: prod.titulo, cantidad: cantidadAñadir, precio_unitario: parseFloat(datosIngreso.precio) }]);
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

  const registrarVenta = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) return alert("El carrito está vacío.");
    
    if (formVenta.tipo_entrega === "Express" && (formVenta.envio_cobrado_cliente === "" || formVenta.envio_cobrado_cliente === null)) {
      return alert("⚠️️ OBLIGATORIO: Para envíos Express, debes ingresar cuánto le cobrarás al cliente por el envío.");
    }

    setProcesando(true);
    try {
      let costoTotalProductosVenta = 0;
      const lotesAActualizar = [];
      const detallesVenta = [];

      for (let item of carrito) {
        const cantidadRequerida = parseInt(item.cantidad);
        const lotesDisponibles = lotes.filter(l => l.producto_id === item.producto_id && l.cantidad_disponible > 0).sort((a, b) => new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso));
        let cantidadFaltante = cantidadRequerida;
        
        for (let lote of lotesDisponibles) {
          if (cantidadFaltante === 0) break;
          const cantidadATomar = Math.min(cantidadFaltante, lote.cantidad_disponible);
          costoTotalProductosVenta += (cantidadATomar * parseFloat(lote.costo_unitario));
          cantidadFaltante -= cantidadATomar;
          lotesAActualizar.push({ id: lote.id, nueva_cantidad: lote.cantidad_disponible - cantidadATomar });
          detallesVenta.push({ lote_id: lote.id, producto_id: item.producto_id, cantidad: cantidadATomar, costo_lote_unidad: lote.costo_unitario, precio_negociado_unidad: parseFloat(item.precio_unitario) });
        }
      }

      const gananciaNeta = totalVentaCliente - costoAgenciaFijo - comisionAgencia - costoTotalProductosVenta;

      const { data: nuevaVenta, error: errorVenta } = await supabase.from("ventas_operativas").insert([{
          cliente_nombre: formVenta.cliente_nombre || "Público General", departamento: formVenta.departamento,
          tipo_entrega: formVenta.tipo_entrega, ingreso_total_cliente: totalVentaCliente, 
          envio_cobrado_cliente: envioCliente, descuento: descuentoAplicado,
          costo_envio_transporte: costoAgenciaFijo, comision_metodo_pago: comisionAgencia, 
          costo_total_productos: costoTotalProductosVenta, ganancia_neta_limpia: gananciaNeta, notas_internas: formVenta.notas_internas
      }]).select().single();
      
      if (errorVenta) throw errorVenta;

      for (let detalle of detallesVenta) { detalle.venta_operativa_id = nuevaVenta.id; await supabase.from("detalles_venta_operativa").insert([detalle]); }
      for (let actualizacion of lotesAActualizar) { await supabase.from("lotes_inventario").update({ cantidad_disponible: actualizacion.nueva_cantidad }).eq("id", actualizacion.id); }

      const ticketGenerado = {
        id: nuevaVenta.id, fecha: new Date().toLocaleString(), cliente: formVenta.cliente_nombre || "Público General",
        departamento: formVenta.departamento, tipo_entrega: formVenta.tipo_entrega, items: carrito,
        envio_cobrado: envioCliente, descuento: descuentoAplicado, total: totalVentaCliente, subtotal: totalProductos
      };

      setCarrito([]);
      setFormVenta({ cliente_nombre: "", departamento: "San Miguel", tipo_entrega: "Normal", envio_cobrado_cliente: "", descuento: "", costo_envio_transporte: "", comision_metodo_pago: "", notas_internas: "" });
      
      setVentaExitosa(true);
      setTimeout(() => {
        setVentaExitosa(false);
        recargarDatos();
        onTicketGenerado(ticketGenerado);
      }, 2000);

    } catch (error) { alert("Error: " + error.message); setProcesando(false); } 
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in w-full relative">
      {ventaExitosa && (
        <div className="fixed inset-0 bg-emerald-600/95 z-[100] flex flex-col items-center justify-center text-white animate-fade-in">
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

      {/* CARRITO */}
      <div className="bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-200 w-full overflow-hidden relative">
        <h3 className="font-black text-gray-800 mb-4 text-lg">🛍️ Buscar y Agregar</h3>
        <div className="mb-4 flex flex-col sm:flex-row gap-2 w-full">
          <select id="selectorProd" className="flex-1 min-w-0 w-full border-2 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white truncate">
            <option value="">Buscar producto para agregar...</option>
            {productosConStock.map(p => <option key={p.id} value={p.id}>{p.titulo} (Stock: {stockPorProducto[p.id]})</option>)}
          </select>
          <button onClick={iniciarAgregar} className="bg-emerald-600 text-white font-black px-6 py-2 rounded-xl hover:bg-emerald-700 shadow-md">Agregar</button>
        </div>
        <div className="space-y-3 min-h-[200px]">
          {carrito.map((item, index) => (
            <div key={item.id_temporal} className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3 w-full">
              <span className="font-black text-gray-400 text-xs">{index + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-800 truncate w-full">{item.titulo}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="flex items-center border rounded-lg overflow-hidden w-20"><span className="px-2 text-xs font-bold bg-gray-50">Cant</span><input type="number" min="1" value={item.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => actualizarItemCarrito(item.id_temporal, 'cantidad', e.target.value)} className="w-full text-center text-xs font-black p-1 outline-none" /></div>
                  <div className="flex items-center border rounded-lg overflow-hidden w-24"><span className="px-2 text-xs font-bold bg-gray-50">$</span><input type="number" step="0.01" value={item.precio_unitario} onFocus={(e) => e.target.select()} onChange={(e) => actualizarItemCarrito(item.id_temporal, 'precio_unitario', e.target.value)} className="w-full text-center text-xs font-black p-1 outline-none text-emerald-600" /></div>
                </div>
              </div>
              <button onClick={() => setCarrito(carrito.filter(i => i.id_temporal !== item.id_temporal))} className="text-red-500 p-2 font-black">X</button>
            </div>
          ))}
        </div>
      </div>

      {/* COBRO */}
      <div className="bg-emerald-50/40 p-4 sm:p-6 rounded-3xl border border-emerald-100/60 h-fit w-full">
        <h3 className="font-black text-gray-800 mb-4 text-lg">💰 Detalles de Cobro</h3>
        <form onSubmit={registrarVenta} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Cliente</label><input type="text" value={formVenta.cliente_nombre} onChange={(e) => manejarCambioVenta("cliente_nombre", e.target.value)} className="w-full border-2 rounded-xl px-3 py-2 text-xs bg-white" placeholder="Opcional" /></div>
            <div><label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Departamento</label><select value={formVenta.departamento} onChange={(e) => manejarCambioVenta("departamento", e.target.value)} className="w-full border-2 rounded-xl px-2 py-2 text-xs bg-white">{DEPARTAMENTOS_SV.map(dep => <option key={dep} value={dep}>{dep}</option>)}</select></div>
          </div>
          
          <div className="bg-white p-1.5 rounded-xl border-2 flex gap-1 w-full">
            <label className={`flex-1 text-center py-2 text-xs font-black rounded-lg cursor-pointer truncate ${formVenta.tipo_entrega === "Normal" ? "bg-gray-800 text-white shadow-md" : "text-gray-500"}`}><input type="radio" name="tipo_entrega" value="Normal" checked={formVenta.tipo_entrega === "Normal"} onChange={(e) => manejarCambioVenta("tipo_entrega", e.target.value)} className="hidden" /> Retiro/Local</label>
            <label className={`flex-1 text-center py-2 text-xs font-black rounded-lg cursor-pointer truncate ${formVenta.tipo_entrega === "Express" ? "bg-[#0f3faf] text-white shadow-md" : "text-gray-500"}`}><input type="radio" name="tipo_entrega" value="Express" checked={formVenta.tipo_entrega === "Express"} onChange={(e) => manejarCambioVenta("tipo_entrega", e.target.value)} className="hidden" /> Express SV</label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl">
               <label className="block text-[10px] font-black text-blue-800 uppercase mb-1">Envío Cobrado ($) {formVenta.tipo_entrega === "Express" && "*"}</label>
               <input type="number" step="0.01" value={formVenta.envio_cobrado_cliente} onFocus={(e) => e.target.select()} onChange={(e) => manejarCambioVenta("envio_cobrado_cliente", e.target.value)} className="w-full bg-white border-2 border-blue-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-blue-600 text-[#0f3faf]" placeholder="0.00" />
            </div>
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl">
               <label className="block text-[10px] font-black text-orange-800 uppercase mb-1">Descuento ($)</label>
               <input type="number" step="0.01" value={formVenta.descuento} onFocus={(e) => e.target.select()} onChange={(e) => manejarCambioVenta("descuento", e.target.value)} className="w-full bg-white border-2 border-orange-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-orange-600 text-orange-600" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-white border rounded-2xl">
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase truncate">{formVenta.tipo_entrega === "Express" ? "Agencia Fijo (Interno)" : "Costo Transporte"}</label>
              <input type="number" step="0.01" value={formVenta.tipo_entrega === "Express" ? costoAgenciaFijo : formVenta.costo_envio_transporte} onFocus={(e) => e.target.select()} onChange={(e) => formVenta.tipo_entrega !== "Express" && manejarCambioVenta("costo_envio_transporte", e.target.value)} disabled={formVenta.tipo_entrega === "Express"} className="w-full bg-gray-50 rounded-lg px-2 py-1.5 text-sm font-bold text-red-600" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase truncate">{formVenta.tipo_entrega === "Express" ? "Comisión 2.5% (Interno)" : "Comisión Extra"}</label>
              <input type="number" step="0.01" value={formVenta.tipo_entrega === "Express" ? comisionAgencia.toFixed(2) : formVenta.comision_metodo_pago} onFocus={(e) => e.target.select()} onChange={(e) => formVenta.tipo_entrega !== "Express" && manejarCambioVenta("comision_metodo_pago", e.target.value)} disabled={formVenta.tipo_entrega === "Express"} className="w-full bg-gray-50 rounded-lg px-2 py-1.5 text-sm font-bold text-red-600" placeholder="0.00" />
            </div>
          </div>

          <div className="bg-emerald-600 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg">
            <span className="font-bold text-sm uppercase tracking-wider">Total a Cobrar</span>
            <span className="text-3xl font-black">${totalVentaCliente.toFixed(2)}</span>
          </div>
          
          <button type="submit" disabled={procesando || carrito.length === 0} className="w-full bg-gray-900 text-white font-black py-3.5 rounded-xl hover:bg-black transition-colors text-sm shadow-md disabled:opacity-50">
            {procesando ? "Procesando..." : "Cerrar Venta y Generar Ticket"}
          </button>
        </form>
      </div>

      {productoPorConfirmar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h3 className="font-black text-xl mb-1">Confirmar Ingreso</h3>
            <p className="text-sm font-bold text-gray-600 mb-1">{productoPorConfirmar.titulo}</p>
            <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
              <div className="text-left">
                <label className="block text-[11px] font-bold text-gray-500">CANTIDAD *</label>
                <input type="number" min="1" max={stockPorProducto[productoPorConfirmar.id]} value={datosIngreso.cantidad} onFocus={(e) => e.target.select()} onChange={(e) => setDatosIngreso({...datosIngreso, cantidad: e.target.value})} className="w-full border-2 rounded-xl px-3 py-3 text-lg font-black text-center" />
              </div>
              <div className="text-left">
                <label className="block text-[11px] font-bold text-gray-500">PRECIO C/U ($) *</label>
                <input type="number" step="0.01" value={datosIngreso.precio} onFocus={(e) => e.target.select()} onChange={(e) => setDatosIngreso({...datosIngreso, precio: e.target.value})} className="w-full border-2 rounded-xl px-3 py-3 text-lg font-black text-emerald-600 text-center" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setProductoPorConfirmar(null)} className="flex-1 bg-gray-100 text-gray-600 font-black py-3.5 rounded-xl">Cancelar</button>
              <button onClick={confirmarAgregarAlCarrito} className="flex-1 bg-[#0f3faf] text-white font-black py-3.5 rounded-xl">Añadir al Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}