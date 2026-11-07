"use client";
import { useState, useRef, useMemo, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";

// (Omitiendo la constante DEPARTAMENTOS y DISTRITOS para no hacer infinito el código. 
// Mantén tus listas completas de DEPARTAMENTOS y DISTRITOS_POR_DEPARTAMENTO justo aquí arriba).
const DEPARTAMENTOS = ["Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán", "La Libertad", "La Paz", "La Unión", "Morazán", "San Miguel", "San Salvador", "San Vicente", "Santa Ana", "Sonsonate", "Usulután"];

// Reemplaza esto con tu lista real de 262
const DISTRITOS_POR_DEPARTAMENTO = {
  "Usulután": ["Usulután", "San Dionisio", "Alegría"] 
}; 

const ESTADO_INICIAL = {
  nombre: "", telefono: "", departamento: "", distrito: "", direccion: "",
  referencia: "", gps: "", paquete: "", fechaEntrega: "",
  horaEntrega: "", metodoEnvio: "Forza", instrucciones: ""
};

export default function ModuloGuias({ productos = [], lotes = [] }) {
  const fechaHoy = new Date().toISOString().split('T')[0];

  // --- ESTADOS PRINCIPALES ---
  const [pestañaGuias, setPestañaGuias] = useState("nueva"); // 'nueva' o 'historial'
  const [datosEnvio, setDatosEnvio] = useState(ESTADO_INICIAL);
  const [fechaEmision, setFechaEmision] = useState(fechaHoy);
  const [guardando, setGuardando] = useState(false);
  const [folioTemporal, setFolioTemporal] = useState("---");
  
  // --- ESTADOS HISTORIAL ---
  const [historialGuias, setHistorialGuias] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null); // Para ver ticket viejo
  const [textoConfirmacion, setTextoConfirmacion] = useState("");

  // --- ESTADOS BUSCADORES ---
  const [busquedaDistrito, setBusquedaDistrito] = useState("");
  const [desplegarDistritos, setDesplegarDistritos] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [desplegarProductos, setDesplegarProductos] = useState(false);

  const etiquetaRef = useRef(null);

  // --- LÓGICA DE INVENTARIO ---
  const stockPorProducto = useMemo(() => {
    return lotes.reduce((acc, lote) => {
      acc[lote.producto_id] = (acc[lote.producto_id] || 0) + lote.cantidad_disponible;
      return acc;
    }, {});
  }, [lotes]);

  const productosConStock = useMemo(() => {
    return productos.filter(p => (stockPorProducto[p.id] || 0) > 0);
  }, [productos, stockPorProducto]);

  const productosFiltrados = useMemo(() => {
    if (!busquedaProducto) return productosConStock;
    return productosConStock.filter(p => p.titulo.toLowerCase().includes(busquedaProducto.toLowerCase()));
  }, [productosConStock, busquedaProducto]);

  // Cargar Historial y estimar próximo folio
  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setCargandoHistorial(true);
    const { data, error } = await supabase
      .from('guias_envio')
      .select('*')
      .order('id', { ascending: false });
      
    if (!error && data) {
      setHistorialGuias(data);
      // El próximo folio visual es el id mayor + 1
      if(data.length > 0) {
        setFolioTemporal(String(data[0].folio + 1));
      } else {
        setFolioTemporal("1");
      }
    }
    setCargandoHistorial(false);
  };

  // --- MANEJO DE FORMULARIO ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosEnvio(prev => {
      const nuevosDatos = { ...prev, [name]: value };
      if (name === "departamento") { nuevosDatos.distrito = ""; setBusquedaDistrito(""); setDesplegarDistritos(false); }
      if (name === "metodoEnvio" && value !== "Personal") nuevosDatos.horaEntrega = "";
      return nuevosDatos;
    });
  };

  const distritosDisponibles = useMemo(() => {
    if (!datosEnvio.departamento) return [];
    const lista = DISTRITOS_POR_DEPARTAMENTO[datosEnvio.departamento] || [];
    if (!busquedaDistrito) return lista;
    return lista.filter(d => d.toLowerCase().includes(busquedaDistrito.toLowerCase()));
  }, [datosEnvio.departamento, busquedaDistrito]);

  // --- CAMBIAR ESTADO DE GUÍA (BLOQUEAR/ANULAR/ENVIADA) ---
  const actualizarEstadoGuia = async (id, nuevoEstado) => {
    if (nuevoEstado === 'anulada') {
      if (textoConfirmacion !== "ANULAR") return alert("Debes escribir ANULAR para confirmar.");
    }

    try {
      const { error } = await supabase.from('guias_envio').update({ estado: nuevoEstado }).eq('id', id);
      if (error) throw error;
      setTextoConfirmacion("");
      cargarHistorial();
      alert(`Guía actualizada a ${nuevoEstado}`);
    } catch (e) {
      alert("Error actualizando: " + e.message);
    }
  };

  // --- GUARDADO Y EXPORTACIÓN TÉRMICA (IMG COMPRIMIDA) ---
  const generarYDescargarTicket = async (e) => {
    e.preventDefault();
    if (!datosEnvio.nombre || !datosEnvio.direccion || !datosEnvio.departamento || !datosEnvio.distrito) {
      return alert("Completa los datos obligatorios.");
    }
    
    setGuardando(true);
    let guiaActual = null;

    try {
      // 1. Guardar en Base de Datos
      const { data, error } = await supabase.from('guias_envio').insert([{
        fecha_emision: fechaEmision,
        nombre_cliente: datosEnvio.nombre,
        telefono: datosEnvio.telefono,
        departamento: datosEnvio.departamento,
        distrito: datosEnvio.distrito,
        direccion: datosEnvio.direccion,
        referencia: datosEnvio.referencia || null,
        coordenadas_gps: datosEnvio.gps || null,
        paquete: datosEnvio.paquete || null,
        instrucciones: datosEnvio.instrucciones || null,
        metodo_envio: datosEnvio.metodoEnvio,
        fecha_entrega: datosEnvio.fechaEntrega || null,
        hora_entrega: datosEnvio.horaEntrega ? `${datosEnvio.horaEntrega}:00` : null,
        estado: 'pendiente'
      }]).select().single();
      
      if (error) throw error;
      guiaActual = data;
      
      // Actualizamos historial visualmente
      setFolioTemporal(String(guiaActual.folio + 1));
      cargarHistorial();

    } catch (error) {
      alert("Error guardando guía: " + error.message);
      setGuardando(false);
      return;
    }

    // 2. Exportación a Imagen Térmica Comprimida (Blanco y Negro, Alta Definición pero poco peso)
    setTimeout(async () => {
      if (!etiquetaRef.current) { setGuardando(false); return; }
      
      // Forzamos tamaño exacto temporalmente para captura
      const originalTransform = etiquetaRef.current.style.transform;
      etiquetaRef.current.style.transform = 'none';
      
      // scale: 2 (Baja escala = menor peso, ideal para ticketera de 80mm o térmica pequeña)
      const canvas = await html2canvas(etiquetaRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      etiquetaRef.current.style.transform = originalTransform;

      // JPEG a calidad 0.70 es MUY comprimido, pesa < 100kb
      const image = canvas.toDataURL("image/jpeg", 0.70); 
      
      const link = document.createElement("a");
      link.href = image;
      link.download = `TICKET_TERMICO_F${guiaActual.folio}_${datosEnvio.nombre.replace(/\s+/g, '_')}.jpg`;
      link.click();
      
      setGuardando(false);
      alert("✅ Guía guardada en el historial y descargada para impresión.");
    }, 500);
  };


  // --- COMPONENTE DE LA ETIQUETA VISUAL (TAMAÑO DE TEXTO AUMENTADO) ---
  const TicketRender = ({ datos, folioVisible }) => (
    <div className="w-full flex justify-center overflow-hidden bg-gray-200 p-2 rounded">
      <div 
        ref={etiquetaRef} 
        className="bg-white flex flex-col relative shrink-0 shadow-sm origin-top" 
        style={{ 
          width: "72mm", // Ancho típico de ticketera térmica 80mm
          minHeight: "110mm", 
          fontFamily: "Arial, sans-serif", 
          color: "#000",
          transform: typeof window !== 'undefined' && window.innerWidth < 450 ? 'scale(0.85)' : 'scale(1)', 
          transformOrigin: "top center"
        }}
      >
        {/* Cabecera Remitente */}
        <div className="flex border-b-[3px] border-black">
          <div className="w-1/3 border-r-[3px] border-black p-3 flex items-center justify-center bg-black text-white">
              <h1 className="text-2xl font-black uppercase text-center leading-none tracking-tighter">{datos.metodo_envio || datos.metodoEnvio}</h1>
          </div>
          <div className="w-2/3 p-3 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase mb-1 tracking-wider">Remitente:</p>
              <h2 className="text-base font-black leading-none mb-1">TECH UNIVERSE</h2>
              <p className="text-[10px] font-bold">Tel: +503 7600-0000</p>
          </div>
        </div>

        {/* Cuerpo Destinatario */}
        <div className="flex-1 p-3 border-b-[3px] border-black flex flex-col justify-center">
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-1">Entregar a:</p>
          <h2 className="text-2xl font-black uppercase mb-3 leading-tight">{datos.nombre_cliente || datos.nombre || "CLIENTE"}</h2>
          
          <div className="border-[2px] border-black p-2 mb-3 bg-gray-50">
              <p className="text-xl font-black uppercase text-center tracking-wide">{datos.departamento || "DEPARTAMENTO"}</p>
              <p className="text-sm font-bold uppercase text-center border-t-2 border-black mt-2 pt-2">{datos.distrito || "DISTRITO"}</p>
          </div>
          
          <p className="text-sm font-bold leading-snug line-clamp-4">{datos.direccion || "Dirección pendiente..."}</p>
          {(datos.referencia) && <p className="text-xs italic mt-2 text-gray-800 font-bold"><strong>Ref:</strong> {datos.referencia}</p>}
          {(datos.coordenadas_gps || datos.gps) && <p className="text-[11px] mt-2 border-t-2 border-dashed pt-1 font-bold tracking-widest"><strong>GPS:</strong> ENLACE ADJUNTO</p>}
        </div>

        {/* Info Extra: Teléfono y Fecha */}
        <div className="p-3 border-b-[3px] border-black flex justify-between">
            <div className="w-1/2 pr-2 border-r-2 border-black">
              <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Teléfono:</p>
              <p className="text-lg font-black">{datos.telefono || "0000-0000"}</p>
            </div>
            <div className="w-1/2 pl-2 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Fecha:</p>
              <p className="text-sm font-black leading-tight">
                {datos.fechaEntrega || datos.fecha_entrega ? new Date(datos.fechaEntrega || datos.fecha_entrega).toLocaleDateString('es-SV') : 'A coordinar'} 
                <br/>
                {datos.horaEntrega || datos.hora_entrega ? ` ${datos.horaEntrega || datos.hora_entrega}` : ''}
              </p>
            </div>
        </div>

        {/* Paquete e Instrucciones */}
        <div className="p-3 border-b-[3px] border-black">
            <p className="text-xs uppercase leading-tight font-bold mb-1"><span className="text-gray-600">CONTENIDO:</span> {datos.paquete || "ACCESORIOS"}</p>
            {(datos.instrucciones) && <p className="text-[11px] uppercase mt-1 text-red-700 font-black leading-tight tracking-wide">NOTAS: {datos.instrucciones}</p>}
        </div>

        {/* Pie de Etiqueta */}
        <div className="p-3 flex items-center justify-between bg-gray-50">
            <div className="flex flex-col items-center">
              <QRCodeCanvas value={`TU-${datos.telefono?.replace('-','')}-F${folioVisible}`} size={55} level="M" />
              <p className="text-[9px] mt-1 font-black font-mono">F-{folioVisible}</p>
            </div>
            <div className="text-right flex flex-col justify-end h-full pb-1">
              <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">Emi: {datos.fechaEmision || datos.fecha_emision}</p>
              <p className="text-[11px] font-black tracking-widest uppercase">NO INCLUYE FACTURA</p>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* MENÚ SUPERIOR */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <span>🏷️</span> Gestión de Envíos
          </h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPestañaGuias("nueva")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pestañaGuias === "nueva" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Crear Nueva</button>
          <button onClick={() => setPestañaGuias("historial")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pestañaGuias === "historial" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Ver Historial</button>
        </div>
      </div>

      {pestañaGuias === "nueva" ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <form onSubmit={generarYDescargarTicket} className="flex-1 space-y-4">
            
            {/* COMPONENTES DEL FORMULARIO DE INGRESO (Misma lógica anterior) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between">
                <h4 className="text-xs font-black text-blue-800 uppercase mb-3">1. Datos</h4>
                <span className="text-xs font-bold text-gray-500">Folio Actual: #{folioTemporal}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="nombre" required value={datosEnvio.nombre} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre *" />
                <input type="text" name="telefono" required value={datosEnvio.telefono} onChange={(e) => setDatosEnvio(p => ({...p, telefono: e.target.value.replace(/\D/g, '').slice(0,8)}))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Teléfono *" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-xs font-black text-blue-800 uppercase mb-3">2. Destino</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select name="departamento" required value={datosEnvio.departamento} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Depto *</option>{DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {datosEnvio.departamento ? (
                  <div className="relative">
                    <div onClick={() => setDesplegarDistritos(!desplegarDistritos)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white cursor-pointer">{datosEnvio.distrito || "Distrito *"}</div>
                    {desplegarDistritos && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border shadow-xl z-20"><div className="p-1 bg-gray-50"><input type="text" placeholder="Buscar..." value={busquedaDistrito} onChange={(e) => setBusquedaDistrito(e.target.value)} className="w-full px-2 py-1 text-xs border rounded" autoFocus /></div><ul className="max-h-48 overflow-y-auto">{distritosDisponibles.map(dist => <li key={dist} onClick={() => { setDatosEnvio(p => ({...p, distrito: dist})); setDesplegarDistritos(false); setBusquedaDistrito(""); }} className="px-3 py-2 text-sm hover:bg-blue-100 cursor-pointer">{dist}</li>)}</ul></div>
                    )}
                  </div>
                ) : <select disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100"><option>Distrito *</option></select>}
              </div>
              <textarea name="direccion" required value={datosEnvio.direccion} onChange={handleChange} rows="2" className="w-full border rounded-lg px-3 py-2 text-sm mb-4" placeholder="Dirección Exacta *" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="referencia" value={datosEnvio.referencia} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Referencia" />
                <input type="text" name="gps" value={datosEnvio.gps} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm bg-blue-50" placeholder="Link Google Maps (GPS)" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-xs font-black text-blue-800 uppercase mb-3">3. Paquete</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select name="metodoEnvio" required value={datosEnvio.metodoEnvio} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm font-bold bg-white"><option value="Forza">📦 Forza</option><option value="Express">🚚 Express SV</option><option value="Personal">🤝 Personal</option></select>
                <input type="text" name="paquete" value={datosEnvio.paquete} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Contenido..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input type="date" name="fechaEntrega" value={datosEnvio.fechaEntrega} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input type="time" name="horaEntrega" disabled={datosEnvio.metodoEnvio !== "Personal"} value={datosEnvio.horaEntrega} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <input type="text" name="instrucciones" value={datosEnvio.instrucciones} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 text-sm bg-yellow-50" placeholder="Instrucciones extra..." />
            </div>

            <button type="submit" disabled={guardando} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {guardando ? "Generando..." : "🖨️ Crear y Bajar Imagen Térmica"}
            </button>
          </form>

          {/* VISTA PREVIA (Tiempo Real) */}
          <div className="w-full lg:w-[350px]">
             <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Pre-visualización Térmica</h4>
             <TicketRender datos={datosEnvio} folioVisible={folioTemporal} />
          </div>
        </div>
      ) : (
        /* ============================
           PESTAÑA HISTORIAL
        ============================ */
        <div className="space-y-4">
          {cargandoHistorial ? <p>Cargando guías...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 border">
                <thead className="bg-gray-100 text-xs uppercase font-black text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Folio</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Destino</th>
                    <th className="px-4 py-3">Logística</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historialGuias.map(guia => (
                    <tr key={guia.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold">F-{guia.folio}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{guia.nombre_cliente} <br/><span className="text-xs text-gray-400 font-normal">{guia.telefono}</span></td>
                      <td className="px-4 py-3">{guia.distrito}, {guia.departamento}</td>
                      <td className="px-4 py-3"><span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold">{guia.metodo_envio}</span></td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${guia.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : guia.estado === 'enviada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {guia.estado.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => setGuiaSeleccionada(guia)} className="text-blue-600 hover:underline text-xs font-bold">Ver / Acción</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal de Acción e Historial */}
          {guiaSeleccionada && (
            <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl flex flex-col md:flex-row w-full max-w-3xl overflow-hidden shadow-2xl">
                {/* Render de Ticket Viejo */}
                <div className="w-full md:w-1/2 p-6 bg-gray-100 flex flex-col items-center justify-center border-r">
                   <TicketRender datos={guiaSeleccionada} folioVisible={guiaSeleccionada.folio} />
                </div>
                {/* Opciones */}
                <div className="w-full md:w-1/2 p-6 flex flex-col justify-center space-y-4">
                   <h3 className="font-black text-xl mb-4">Acciones (F-{guiaSeleccionada.folio})</h3>
                   
                   <div className="flex gap-2">
                     <button onClick={() => actualizarEstadoGuia(guiaSeleccionada.id, 'enviada')} disabled={guiaSeleccionada.estado === 'enviada'} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">Marcar Enviada</button>
                     <button onClick={() => actualizarEstadoGuia(guiaSeleccionada.id, 'pendiente')} disabled={guiaSeleccionada.estado === 'pendiente'} className="flex-1 bg-yellow-500 text-white font-bold py-2 rounded-lg disabled:opacity-50">Revertir Pendiente</button>
                   </div>
                   
                   <div className="border-t border-red-200 pt-4 mt-4">
                     <p className="text-xs font-bold text-red-600 mb-2">Zona de Peligro</p>
                     <input type="text" placeholder="Escribe ANULAR" value={textoConfirmacion} onChange={(e) => setTextoConfirmacion(e.target.value)} className="w-full border-2 border-red-200 rounded-lg px-3 py-2 text-sm mb-2 focus:border-red-500 outline-none" />
                     <button onClick={() => actualizarEstadoGuia(guiaSeleccionada.id, 'anulada')} disabled={guiaSeleccionada.estado === 'anulada'} className="w-full bg-red-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">BLOQUEAR / ANULAR GUÍA</button>
                   </div>
                   <button onClick={() => setGuiaSeleccionada(null)} className="w-full text-gray-500 mt-4 text-sm hover:underline">Cerrar</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}