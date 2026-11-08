"use client";
import { useState, useRef, useMemo, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

const DEPARTAMENTOS = [
  "Ahuachapán", "Cabañas", "Chalatenango", "Cuscatlán",
  "La Libertad", "La Paz", "La Unión", "Morazán",
  "San Miguel", "San Salvador", "San Vicente", "Santa Ana",
  "Sonsonate", "Usulután"
];

const DISTRITOS_POR_DEPARTAMENTO = {
  "Ahuachapán": ["Ahuachapán", "Apaneca", "Atiquizaya", "Concepción de Ataco", "El Refugio", "Guaymango", "Jujutla", "San Francisco Menéndez", "San Lorenzo", "San Pedro Puxtla", "Tacuba", "Turín"],
  "Cabañas": ["Sensuntepeque", "Cinquera", "Dolores", "Guacotecti", "Ilobasco", "Jutiapa", "San Isidro", "Tejutepeque", "Victoria"],
  "Chalatenango": ["Chalatenango", "Agua Caliente", "Arcatao", "Azacualpa", "Cancasque", "Citalá", "Comalapa", "Concepción Quezaltepeque", "Dulce Nombre de María", "El Carrizal", "El Paraíso", "La Laguna", "La Palma", "La Reina", "Las Flores", "Las Vueltas", "Nombre de Jesús", "Nueva Concepción", "Nueva Trinidad", "Ojos de Agua", "Potonico", "San Antonio de la Cruz", "San Antonio Los Ranchos", "San Fernando", "San Francisco Lempa", "San Francisco Morazán", "San Ignacio", "San Isidro Labrador", "San Luis del Carmen", "San Miguel de Mercedes", "San Rafael", "Santa Rita", "Tejutla"],
  "Cuscatlán": ["Cojutepeque", "Candelaria", "El Carmen", "El Rosario", "Monte San Juan", "Oratorio de Concepción", "San Bartolomé Perulapía", "San Cristóbal", "San José Guayabal", "San Pedro Perulapán", "San Rafael Cedros", "San Ramón", "Santa Cruz Analquito", "Santa Cruz Michapa", "Suchitoto", "Tenancingo"],
  "La Libertad": ["Santa Tecla", "Antiguo Cuscatlán", "Chiltiupán", "Ciudad Arce", "Colón", "Comasagua", "Huizúcar", "Jayaque", "Jicalapa", "La Libertad", "Nuevo Cuscatlán", "Quezaltepeque", "Sacacoyo", "San José Villanueva", "San Juan Opico", "San Matías", "San Pablo Tacachico", "Talnique", "Tamanique", "Teotepeque", "Tepecoyo", "Zaragoza"],
  "La Paz": ["Zacatecoluca", "Cuyultitán", "El Rosario", "Jerusalén", "Mercedes La Ceiba", "Olocuilta", "Paraíso de Osorio", "San Antonio Masahuat", "San Emigdio", "San Francisco Chinameca", "San Juan Nonualco", "San Juan Talpa", "San Juan Tepezontes", "San Luis La Herradura", "San Luis Talpa", "San Miguel Tepezontes", "San Pedro Masahuat", "San Pedro Nonualco", "San Rafael Obrajuelo", "Santa María Ostuma", "Santiago Nonualco", "Tapalhuaca"],
  "La Unión": ["La Unión", "Anamorós", "Bolívar", "Concepción de Oriente", "Conchagua", "El Carmen", "El Sauce", "Intipucá", "Lislique", "Meanguera del Golfo", "Nueva Esparta", "Pasaquina", "Polorós", "San Alejo", "San José", "Santa Rosa de Lima", "Yayantique", "Yucuaiquín"],
  "Morazán": ["San Francisco Gotera", "Arambala", "Cacaopera", "Chilanga", "Corinto", "Delicias de Concepción", "El Divisadero", "El Rosario", "Gualococti", "Guatajiagua", "Joateca", "Jocoaitique", "Jocoro", "Lolotiquillo", "Meanguera", "Osicala", "Perquín", "San Carlos", "San Fernando", "San Isidro", "San Simón", "Sensembra", "Sociedad", "Torola", "Yamabal", "Yoloaiquín"],
  "San Miguel": ["San Miguel", "Carolina", "Chapeltique", "Chirilagua", "Ciudad Barrios", "Comacarán", "El Tránsito", "Lolotique", "Moncagua", "Nueva Guadalupe", "Nuevo Edén de San Juan", "Quelepa", "San Antonio del Mosco", "San Gerardo", "San Jorge", "San Luis de la Reina", "San Rafael Oriente", "Sesori", "Uluazapa", "San Antonio"],
  "San Salvador": ["San Salvador", "Aguilares", "Apopa", "Ayutuxtepeque", "Ciudad Delgado", "Cuscatancingo", "El Paisnal", "Guazapa", "Ilopango", "Mejicanos", "Nejapa", "Panchimalco", "Rosario de Mora", "San Marcos", "San Martín", "Santiago Texacuangos", "Santo Tomás", "Soyapango", "Tonacatepeque"],
  "San Vicente": ["San Vicente", "Apastepeque", "Guadalupe", "San Cayetano Istepeque", "San Esteban Catarina", "San Ildefonso", "San Lorenzo", "San Sebastián", "Santa Clara", "Santo Domingo", "Tecoluca", "Tepetitán", "Verapaz"],
  "Santa Ana": ["Santa Ana", "Candelaria de la Frontera", "Chalchuapa", "Coatepeque", "El Congo", "El Porvenir", "Masahuat", "Metapán", "San Antonio Pajonal", "San Sebastián Salitrillo", "Santa Rosa Guachipilín", "Santiago de la Frontera", "Texistepeque"],
  "Sonsonate": ["Sonsonate", "Acajutla", "Armenia", "Caluco", "Cuisnahuat", "Izalco", "Juayúa", "Nahuizalco", "Nahulingo", "Salcoatitán", "San Antonio del Monte", "San Julián", "Santa Catarina Masahuat", "Santa Isabel Ishuatán", "Santo Domingo de Guzmán", "Sonzacate"],
  "Usulután": ["Usulután", "Alegría", "Berlín", "California", "Concepción Batres", "El Triunfo", "Ereguayquín", "Estanzuelas", "Jiquilisco", "Jucuapa", "Jucuarán", "Mercedes Umaña", "Nueva Granada", "Ozatlán", "Puerto El Triunfo", "San Agustín", "San Buenaventura", "San Dionisio", "San Francisco Javier", "Santa Elena", "Santa María", "Santiago de María", "Tecapán"]
};

const ESTADO_INICIAL = {
  nombre: "", telefono: "", departamento: "", distrito: "", direccion: "",
  referencia: "", gps: "", paquete: "", fechaEntrega: "",
  horaEntrega: "", metodoEnvio: "Express", instrucciones: ""
};

export default function ModuloGuias({ productos = [], lotes = [] }) {
  const [fechaEmision, setFechaEmision] = useState("");
  const [datosEnvio, setDatosEnvio] = useState(ESTADO_INICIAL);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [folioTemporal, setFolioTemporal] = useState("---");
  
  // --- NUEVOS ESTADOS HISTORIAL ---
  const [pestañaGuias, setPestañaGuias] = useState("nueva"); 
  const [historialGuias, setHistorialGuias] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null); 
  const [textoConfirmacion, setTextoConfirmacion] = useState("");

  // Estado para el modo edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState(null);

  const [busquedaDistrito, setBusquedaDistrito] = useState("");
  const [desplegarDistritos, setDesplegarDistritos] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [desplegarProductos, setDesplegarProductos] = useState(false);

  const etiquetaRef = useRef(null);

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

  const obtenerImagen = (prod) => {
    if (!prod) return null;
    if (prod.imagenes && Array.isArray(prod.imagenes) && prod.imagenes.length > 0) return prod.imagenes[0];
    if (typeof prod.imagenes === 'string' && prod.imagenes.startsWith('[')) {
      try { return JSON.parse(prod.imagenes)[0]; } catch(e){}
    }
    return prod.imagen_principal || prod.imagen_url || prod.imagen || null;
  };

  useEffect(() => { 
    setFechaEmision(new Date().toISOString().split('T')[0]); 
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
      if(data.length > 0) {
        setFolioTemporal(String(data[0].folio + 1));
      } else {
        setFolioTemporal("1");
      }
    }
    setCargandoHistorial(false);
  };

  const handleTelefonoChange = (e, esEdicion = false) => {
    let valor = e.target.value.replace(/^\+?503\s*/, '').replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);
    if (valor.length > 4) valor = `${valor.slice(0, 4)}-${valor.slice(4)}`;
    
    if (esEdicion) {
      setDatosEdicion(prev => ({ ...prev, telefono: valor }));
    } else {
      setDatosEnvio(prev => ({ ...prev, telefono: valor }));
    }
  };

  const handleChange = (e, esEdicion = false) => {
    const { name, value } = e.target;
    
    if (esEdicion) {
      setDatosEdicion(prev => {
        const nuevosDatos = { ...prev, [name]: value };
        if (name === "departamento") nuevosDatos.distrito = "";
        if (name === "metodo_envio" && value !== "Personal") nuevosDatos.hora_entrega = null;
        return nuevosDatos;
      });
    } else {
      setDatosEnvio(prev => {
        const nuevosDatos = { ...prev, [name]: value };
        
        // Resetea distrito si cambias departamento
        if (name === "departamento") {
          nuevosDatos.distrito = "";
          setBusquedaDistrito("");
          setDesplegarDistritos(false);
        }
        
        // Limpia la hora si el método de envío deja de ser "Personal"
        if (name === "metodoEnvio" && value !== "Personal") {
          nuevosDatos.horaEntrega = "";
        }
        
        return nuevosDatos;
      });
    }
  };

  const distritosDisponibles = useMemo(() => {
    const depto = modoEdicion ? datosEdicion?.departamento : datosEnvio.departamento;
    if (!depto) return [];
    const lista = DISTRITOS_POR_DEPARTAMENTO[depto] || [];
    if (!busquedaDistrito) return lista;
    return lista.filter(d => d.toLowerCase().includes(busquedaDistrito.toLowerCase()));
  }, [datosEnvio.departamento, datosEdicion?.departamento, busquedaDistrito, modoEdicion]);

  const limpiarFormulario = () => {
    if (window.confirm("¿Seguro que deseas borrar todos los datos del formulario?")) {
      setDatosEnvio(ESTADO_INICIAL);
      setVistaPrevia(false);
    }
  };

  const mostrarVistaPrevia = (e) => {
    e.preventDefault();
    if (!datosEnvio.nombre || !datosEnvio.direccion || !datosEnvio.telefono || !datosEnvio.departamento || !datosEnvio.distrito) {
      return alert("Por favor, llena los campos obligatorios (*).");
    }
    setVistaPrevia(true);
    setTimeout(() => {
      if (window.innerWidth < 1024 && etiquetaRef.current) {
         etiquetaRef.current.parentElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // --- LÓGICA DE ACTUALIZACIÓN, ELIMINACIÓN Y EDICIÓN ---
  const actualizarEstadoGuia = async (id, nuevoEstado) => {
    if (nuevoEstado === 'anulada' && textoConfirmacion !== "ANULAR") {
      return alert("Debes escribir ANULAR para confirmar el bloqueo.");
    }
    try {
      const { error } = await supabase.from('guias_envio').update({ estado: nuevoEstado }).eq('id', id);
      if (error) throw error;
      setTextoConfirmacion("");
      cargarHistorial();
      
      // Actualizar el estado de la guía seleccionada para que el modal refleje el cambio
      setGuiaSeleccionada(prev => ({ ...prev, estado: nuevoEstado }));
      alert(`Guía actualizada a ${nuevoEstado}`);
    } catch (e) {
      alert("Error actualizando: " + e.message);
    }
  };

  const eliminarGuia = async (id) => {
    if (textoConfirmacion !== "ELIMINAR") {
      return alert("Debes escribir ELIMINAR para confirmar.");
    }
    if (!window.confirm("¿Estás completamente seguro de eliminar esta guía de forma permanente?")) return;

    try {
      const { error } = await supabase.from('guias_envio').delete().eq('id', id);
      if (error) throw error;
      setTextoConfirmacion("");
      cargarHistorial();
      setGuiaSeleccionada(null);
      alert("Guía eliminada correctamente.");
    } catch (e) {
      alert("Error eliminando: " + e.message);
    }
  };

  const guardarEdicion = async () => {
    try {
      const { error } = await supabase
        .from('guias_envio')
        .update({
          nombre_cliente: datosEdicion.nombre_cliente,
          telefono: datosEdicion.telefono,
          departamento: datosEdicion.departamento,
          distrito: datosEdicion.distrito,
          direccion: datosEdicion.direccion,
          referencia: datosEdicion.referencia,
          coordenadas_gps: datosEdicion.coordenadas_gps,
          paquete: datosEdicion.paquete,
          metodo_envio: datosEdicion.metodo_envio,
          instrucciones: datosEdicion.instrucciones,
          fecha_entrega: datosEdicion.fecha_entrega || null,
          hora_entrega: datosEdicion.hora_entrega || null
        })
        .eq('id', datosEdicion.id);
        
      if (error) throw error;
      
      alert("Guía actualizada correctamente.");
      setGuiaSeleccionada(datosEdicion);
      setModoEdicion(false);
      cargarHistorial();
    } catch (e) {
      alert("Error al guardar cambios: " + e.message);
    }
  };

  const iniciarEdicion = () => {
    setDatosEdicion({ ...guiaSeleccionada });
    setModoEdicion(true);
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setDatosEdicion(null);
  };


  const registrarEnBaseDeDatos = async () => {
    setGuardando(true);
    try {
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
      
      // Actualizar folios e historial
      setFolioTemporal(String(data.folio + 1));
      cargarHistorial();
      
      return data;
    } catch (error) {
      alert("Error guardando guía en base de datos: " + error.message);
      setGuardando(false);
      return null;
    } 
  };

  // --- GENERACIÓN DE IMAGEN/PDF SÚPER NÍTIDO Y DE LARGO DINÁMICO ---
  const generarArchivoLocal = async (folio, nombreCliente, tipo) => {
    if (!etiquetaRef.current) return;
    
    const originalTransform = etiquetaRef.current.style.transform;
    etiquetaRef.current.style.transform = 'none';
    
    // Solución al recorte de imagen: Forzamos la altura completa del elemento
    const canvas = await html2canvas(etiquetaRef.current, { 
      scale: 4, 
      useCORS: true, 
      backgroundColor: "#ffffff",
      windowWidth: etiquetaRef.current.scrollWidth,
      windowHeight: etiquetaRef.current.scrollHeight
    });
    
    etiquetaRef.current.style.transform = originalTransform;

    const imgData = canvas.toDataURL("image/png"); // PNG para no perder calidad

    if (tipo === 'imagen') {
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `TICKET_F${folio}_${nombreCliente.replace(/\s+/g, '_')}.png`;
      link.click();
    } else {
      const pdfWidth = 76; // Ancho de ticketera estándar (76-80mm)
      // Magia aquí: El largo se calcula proporcionalmente para NO aplastarlo
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width; 
      
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Guia_F${folio}_${nombreCliente.replace(/\s+/g, '_')}.pdf`);
    }
  };

  const exportarNuevaGuia = async (tipo) => {
    if (!etiquetaRef.current) return;
    const guiaActual = await registrarEnBaseDeDatos();
    if (!guiaActual) return; 

    setGuardando(true);
    setTimeout(async () => {
      await generarArchivoLocal(guiaActual.folio, guiaActual.nombre_cliente, tipo);
      setGuardando(false);
      alert(`✅ Guía guardada en la base de datos y ${tipo === 'imagen' ? 'ticket en formato Imagen' : 'ticket en formato PDF'} descargado exitosamente.`);
    }, 500);
  };

  // --- ETIQUETA RENDERIZADA CON LETRAS GRANDES (Reutilizable para previa y modal) ---
  const TicketRender = ({ datos, folioVisible }) => {
    const telefonoAMostrar = datos.telefono || "0000-0000";
    // Ajustamos la lectura según si viene de datosEnvio (nueva) o base de datos (historial/edición)
    const metodoEnvioVisual = datos.metodo_envio || datos.metodoEnvio;
    const nombreVisual = datos.nombre_cliente || datos.nombre || "CLIENTE";
    const direccionVisual = datos.direccion || "Dirección pendiente...";
    const fechaEmisionVisual = datos.fechaEmision || datos.fecha_emision || fechaEmision;
    
    let fechaProgramadaVisual = 'A coordinar';
    if (datos.fechaEntrega || datos.fecha_entrega) {
       fechaProgramadaVisual = new Date(datos.fechaEntrega || datos.fecha_entrega).toLocaleDateString('es-SV');
    }
    const horaProgramadaVisual = datos.horaEntrega || datos.hora_entrega ? ` ${datos.horaEntrega || datos.hora_entrega}` : '';

    return (
      <div className="w-full flex justify-center overflow-hidden bg-gray-200 p-2 rounded border-2 border-dashed border-gray-300">
        <div 
          ref={etiquetaRef} 
          className="bg-white flex flex-col relative shrink-0 shadow-sm origin-top" 
          style={{ 
            width: "72mm", // Ancho estándar térmica 80mm
            minHeight: "110mm", 
            fontFamily: "Arial, sans-serif", 
            color: "#000",
            transform: typeof window !== 'undefined' && window.innerWidth < 450 ? 'scale(0.85)' : 'scale(1)', 
            transformOrigin: "top center"
          }}
        >
          <div className="flex border-b-[3px] border-black">
            <div className="w-1/3 border-r-[3px] border-black p-3 flex items-center justify-center bg-black text-white">
                <h1 className="text-2xl font-black uppercase text-center leading-none tracking-tighter">{metodoEnvioVisual}</h1>
            </div>
            <div className="w-2/3 p-3 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase mb-1 tracking-wider">Remitente:</p>
                <h2 className="text-base font-black leading-none mb-1">TECH UNIVERSE</h2>
                <p className="text-[10px] font-bold">Tel: +503 7600-0000</p>
            </div>
          </div>

          <div className="p-3 border-b-[3px] border-black flex flex-col">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-1">Entregar a:</p>
            <h2 className="text-2xl font-black uppercase mb-3 leading-tight">{nombreVisual}</h2>
            
            <div className="border-[2px] border-black p-2 mb-3 bg-gray-50 shrink-0">
                <p className="text-xl font-black uppercase text-center tracking-wide">{datos.departamento || "DEPARTAMENTO"}</p>
                <p className="text-sm font-bold uppercase text-center border-t-2 border-black mt-2 pt-2">{datos.distrito || "DISTRITO"}</p>
            </div>
            
            {/* AQUÍ ESTÁ EL ARREGLO: La dirección ahora puede crecer todo lo necesario */}
            <p className="text-[13px] font-bold leading-snug whitespace-pre-wrap">{direccionVisual}</p>
            
            {(datos.referencia) && <p className="text-xs italic mt-2 text-gray-800 font-bold break-words"><strong>Ref:</strong> {datos.referencia}</p>}
            {(datos.coordenadas_gps || datos.gps) && <p className="text-[11px] mt-2 border-t-2 border-dashed pt-1 font-bold tracking-widest break-words"><strong>GPS:</strong> ENLACE ADJUNTO</p>}
          </div>

          <div className="p-3 border-b-[3px] border-black flex justify-between shrink-0">
              <div className="w-1/2 pr-2 border-r-2 border-black">
                <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Teléfono:</p>
                <p className="text-lg font-black">{telefonoAMostrar}</p>
              </div>
              <div className="w-1/2 pl-2 text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider mb-1">Fecha:</p>
                <p className="text-sm font-black leading-tight">
                  {fechaProgramadaVisual}
                  <br/>
                  {horaProgramadaVisual}
                </p>
              </div>
          </div>

          <div className="p-3 border-b-[3px] border-black shrink-0">
              <p className="text-xs uppercase leading-tight font-bold mb-1 break-words"><span className="text-gray-600">CONTENIDO:</span> {datos.paquete || "ACCESORIOS"}</p>
              {(datos.instrucciones) && <p className="text-[11px] uppercase mt-1 text-red-700 font-black leading-tight tracking-wide break-words">NOTAS: {datos.instrucciones}</p>}
          </div>

          <div className="p-3 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex flex-col items-center">
                <QRCodeCanvas value={`TU-${telefonoAMostrar.replace('-','')}-F${folioVisible}`} size={55} level="M" />
                <p className="text-[9px] mt-1 font-black font-mono">F-{folioVisible}</p>
              </div>
              <div className="text-right flex flex-col justify-end h-full pb-1">
                <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">Emi: {fechaEmisionVisual}</p>
                <p className="text-[11px] font-black tracking-widest uppercase">NO INCLUYE FACTURA</p>
              </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* MENÚ SUPERIOR DE PESTAÑAS */}
      <div className="mb-6 border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <span>🏷️</span> Gestión de Envíos
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {pestañaGuias === "nueva" ? "Los cambios se actualizan en vivo en la etiqueta inferior." : "Historial y administración de guías."}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPestañaGuias("nueva")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pestañaGuias === "nueva" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Crear Nueva</button>
          <button onClick={() => setPestañaGuias("historial")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pestañaGuias === "historial" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Ver Historial</button>
          
          {pestañaGuias === "nueva" && (
            <button onClick={limpiarFormulario} type="button" className="text-sm bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-100 border border-red-200 transition-colors cursor-pointer">
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {pestañaGuias === "nueva" ? (
        <div className="flex flex-col lg:flex-row gap-8">
          
          <form onSubmit={mostrarVistaPrevia} className="flex-1 space-y-5">
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <div className="flex justify-between items-center mb-3">
                 <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider">1. Datos del Cliente</h4>
                 <span className="text-xs font-bold text-gray-500">Folio: #{folioTemporal}</span>
               </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Nombre *</label>
                  <input type="text" name="nombre" required value={datosEnvio.nombre} onChange={handleChange} className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-blue-600 text-sm" placeholder="Ej. Juan Pérez" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Teléfono *</label>
                  <input type="text" name="telefono" required value={datosEnvio.telefono} onChange={handleTelefonoChange} className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-blue-600 text-sm font-mono" placeholder="0000-0000" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">2. Destino</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Departamento *</label>
                  <select name="departamento" required value={datosEnvio.departamento} onChange={handleChange} className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-blue-600 text-sm bg-white">
                    <option value="">Seleccione...</option>
                    {DEPARTAMENTOS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Distrito *</label>
                  {datosEnvio.departamento ? (
                    <div className="relative">
                      <div onClick={() => setDesplegarDistritos(!desplegarDistritos)} className="w-full border-2 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center">
                        <span className={datosEnvio.distrito ? "text-gray-900 font-medium" : "text-gray-400"}>{datosEnvio.distrito || "Seleccione..."}</span>
                        <span className="text-gray-400 text-xs">▼</span>
                      </div>
                      {desplegarDistritos && (
                        <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-blue-600 rounded-lg shadow-xl z-20 overflow-hidden">
                          <div className="p-1 bg-gray-50"><input type="text" placeholder="Buscar..." value={busquedaDistrito} onChange={(e) => setBusquedaDistrito(e.target.value)} className="w-full px-2 py-1.5 outline-none text-xs border rounded" autoFocus /></div>
                          <ul className="max-h-48 overflow-y-auto">
                            {distritosDisponibles.map(dist => <li key={dist} onClick={() => { setDatosEnvio(p => ({...p, distrito: dist})); setDesplegarDistritos(false); setBusquedaDistrito(""); }} className="px-3 py-2 text-sm hover:bg-blue-100 cursor-pointer">{dist}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : <select disabled className="w-full border-2 rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-400"><option>Elija depto</option></select>}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Dirección Exacta *</label>
                <textarea name="direccion" required value={datosEnvio.direccion} onChange={handleChange} rows="2" className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-blue-600 text-sm" placeholder="Colonia, Residencial, Calle, # Casa..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Referencia</label>
                  <input type="text" name="referencia" value={datosEnvio.referencia} onChange={handleChange} className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-blue-600 text-sm" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Enlace / Coordenadas GPS</label>
                  <input type="text" name="gps" value={datosEnvio.gps} onChange={handleChange} className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-blue-600 text-sm bg-blue-50" placeholder="Ej: https://maps.google.com/..." />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">3. Paquete y Entregas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Método *</label>
                  <select name="metodoEnvio" required value={datosEnvio.metodoEnvio} onChange={handleChange} className="w-full border-2 rounded-lg px-3 py-2 outline-none focus:border-blue-600 text-sm bg-white font-bold">
                    <option value="Express">🚚 Express SV</option><option value="Forza">📦 Forza</option><option value="Personal">🤝 Personal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Producto (Inventario Real)</label>
                  <div className="relative">
                    <div onClick={() => setDesplegarProductos(!desplegarProductos)} className="w-full border-2 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center">
                      <span className={datosEnvio.paquete ? "text-gray-900 font-medium truncate" : "text-gray-400"}>{datosEnvio.paquete || "Buscar producto..."}</span>
                      <span className="text-gray-400 text-xs">▼</span>
                    </div>
                    {desplegarProductos && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-blue-600 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="p-1 bg-gray-50 flex flex-col gap-2">
                          <input type="text" placeholder="🔍 Buscar..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} className="w-full px-2 py-1.5 outline-none text-xs border rounded" autoFocus />
                          <div className="flex gap-2">
                             <input type="text" placeholder="Escritura libre..." value={datosEnvio.paquete} onChange={(e) => setDatosEnvio(p => ({ ...p, paquete: e.target.value }))} className="w-full px-2 py-1.5 outline-none text-xs border rounded" />
                             <button type="button" onClick={() => setDesplegarProductos(false)} className="px-3 bg-blue-600 text-white rounded text-xs font-bold">Ok</button>
                          </div>
                        </div>
                        <ul className="max-h-56 overflow-y-auto">
                          {productosFiltrados.map(prod => (
                            <li key={prod.id} onClick={() => { setDatosEnvio(p => ({...p, paquete: prod.titulo})); setDesplegarProductos(false); setBusquedaProducto(""); }} className="p-2 border-b hover:bg-blue-50 cursor-pointer flex items-center gap-3">
                              <img src={obtenerImagen(prod) || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 object-cover rounded shadow-sm shrink-0" />
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold truncate">{prod.titulo}</p>
                                 <p className="text-[10px] text-gray-500 font-medium">Stock: <span className="text-emerald-600 font-bold">{stockPorProducto[prod.id]}</span></p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Fecha Programada (Opcional)</label>
                  <input type="date" name="fechaEntrega" value={datosEnvio.fechaEntrega} onChange={handleChange} className="w-full border-2 rounded-lg px-2 py-2 outline-none text-xs" />
                </div>
                
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${datosEnvio.metodoEnvio === 'Personal' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Hora (Solo Personal)
                  </label>
                  <input 
                    type="time" 
                    name="horaEntrega" 
                    value={datosEnvio.horaEntrega} 
                    onChange={handleChange} 
                    disabled={datosEnvio.metodoEnvio !== "Personal"}
                    className={`w-full border-2 rounded-lg px-2 py-2 outline-none text-xs transition-colors ${
                      datosEnvio.metodoEnvio === "Personal" 
                        ? "focus:border-blue-600 bg-white border-gray-300" 
                        : "bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200"
                    }`} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Instrucciones / Notas extra</label>
                <input type="text" name="instrucciones" value={datosEnvio.instrucciones} onChange={handleChange} className="w-full border-2 rounded-lg px-3 py-2 outline-none text-sm bg-yellow-50" placeholder="Ej. Dejar en portería..." />
              </div>
            </div>

            <button type="submit" className="w-full bg-[#0f3faf] text-white font-black text-lg py-4 rounded-xl shadow-xl cursor-pointer mt-4 active:scale-95">
              Generar Etiqueta Visual
            </button>
          </form>

          {vistaPrevia && (
            <div className="w-full lg:w-[380px] flex flex-col items-center">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Vista Previa Dinámica</h4>
              <TicketRender datos={datosEnvio} folioVisible={folioTemporal} />

              <div className="w-full mt-6 flex gap-2 z-10 relative">
                 <button onClick={() => exportarNuevaGuia('imagen')} disabled={guardando} className="flex-1 bg-blue-600 text-white font-black text-sm py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors active:scale-95">
                   {guardando ? "⏳ Procesando..." : "🖼️ Generar Ticket en Imagen"}
                 </button>
                 <button onClick={() => exportarNuevaGuia('pdf')} disabled={guardando} className="flex-1 bg-gray-900 text-white font-black text-sm py-4 rounded-xl shadow-lg hover:bg-black transition-colors active:scale-95">
                   {guardando ? "⏳ Procesando..." : "📄 Generar Ticket en PDF"}
                 </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================
           PESTAÑA HISTORIAL COMPLETO
        ============================ */
        <div className="space-y-4">
          {cargandoHistorial ? <p className="text-gray-500 font-bold p-4">Cargando guías...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 border rounded-xl overflow-hidden">
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
                      <td className="px-4 py-3 font-black text-gray-900">F-{guia.folio}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{guia.nombre_cliente} <br/><span className="text-xs text-gray-400 font-normal">{guia.telefono}</span></td>
                      <td className="px-4 py-3 font-medium">{guia.distrito}, {guia.departamento}</td>
                      <td className="px-4 py-3"><span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold">{guia.metodo_envio}</span></td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${guia.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : guia.estado === 'enviada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {guia.estado.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => setGuiaSeleccionada(guia)} className="text-blue-600 hover:text-blue-800 font-black px-3 py-1 bg-blue-50 rounded-lg">Gestión</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal de Gestión para Ticket Viejo (con Edición, Eliminación y Descargas) */}
          {guiaSeleccionada && (
            <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl flex flex-col md:flex-row w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl my-auto">
                <div className="w-full md:w-1/2 p-6 bg-gray-100 flex flex-col items-center justify-center border-r shrink-0">
                   <TicketRender datos={modoEdicion ? datosEdicion : guiaSeleccionada} folioVisible={guiaSeleccionada.folio} />
                </div>
                
                <div className="w-full md:w-1/2 p-6 flex flex-col justify-start space-y-4 overflow-y-auto shrink-0 relative">
                   <div className="flex justify-between items-center border-b pb-2">
                     <h3 className="font-black text-xl text-gray-900">Gestión de Folio F-{guiaSeleccionada.folio}</h3>
                     {!modoEdicion && (
                       <button onClick={iniciarEdicion} className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 font-bold">✏️ Editar Info</button>
                     )}
                   </div>
                   
                   {modoEdicion ? (
                     <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex flex-col gap-3">
                       <h4 className="text-xs font-black text-yellow-800 uppercase">Modo Edición</h4>
                       <input type="text" name="nombre_cliente" value={datosEdicion.nombre_cliente} onChange={(e) => handleChange(e, true)} placeholder="Nombre" className="w-full text-sm p-2 border rounded" />
                       <input type="text" name="telefono" value={datosEdicion.telefono} onChange={(e) => handleTelefonoChange(e, true)} placeholder="Teléfono" className="w-full text-sm p-2 border rounded font-mono" />
                       <select name="departamento" value={datosEdicion.departamento} onChange={(e) => handleChange(e, true)} className="w-full text-sm p-2 border rounded bg-white">
                          <option value="">Depto...</option>{DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                       <div className="relative">
                          <div onClick={() => setDesplegarDistritos(!desplegarDistritos)} className="w-full border rounded p-2 text-sm bg-white cursor-pointer">{datosEdicion.distrito || "Distrito..."}</div>
                          {desplegarDistritos && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border shadow-xl z-20"><div className="p-1"><input type="text" placeholder="Buscar..." value={busquedaDistrito} onChange={(e) => setBusquedaDistrito(e.target.value)} className="w-full px-2 py-1 text-xs border" /></div><ul className="max-h-32 overflow-y-auto">{distritosDisponibles.map(dist => <li key={dist} onClick={() => { setDatosEdicion(p => ({...p, distrito: dist})); setDesplegarDistritos(false); }} className="px-3 py-1 text-sm hover:bg-gray-100 cursor-pointer">{dist}</li>)}</ul></div>
                          )}
                       </div>
                       <textarea name="direccion" value={datosEdicion.direccion} onChange={(e) => handleChange(e, true)} placeholder="Dirección Exacta" className="w-full text-sm p-2 border rounded" rows="2" />
                       <input type="text" name="paquete" value={datosEdicion.paquete} onChange={(e) => handleChange(e, true)} placeholder="Contenido" className="w-full text-sm p-2 border rounded" />
                       
                       <div className="flex gap-2 mt-2">
                         <button onClick={guardarEdicion} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded">Guardar</button>
                         <button onClick={cancelarEdicion} className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 rounded">Cancelar</button>
                       </div>
                     </div>
                   ) : (
                     <>
                       {/* DESCARGAS */}
                       <div className="flex gap-2 mb-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                         <button onClick={() => generarArchivoLocal(guiaSeleccionada.folio, guiaSeleccionada.nombre_cliente, 'imagen')} className="flex-1 bg-white border shadow-sm text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-100 text-xs">
                           🖼️ Guardar Ticket (Imagen)
                         </button>
                         <button onClick={() => generarArchivoLocal(guiaSeleccionada.folio, guiaSeleccionada.nombre_cliente, 'pdf')} className="flex-1 bg-white border shadow-sm text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-100 text-xs">
                           📄 Guardar Ticket (PDF)
                         </button>
                       </div>

                       {/* ESTADOS */}
                       <div className="flex gap-2 mt-4">
                         <button onClick={() => actualizarEstadoGuia(guiaSeleccionada.id, 'enviada')} disabled={guiaSeleccionada.estado === 'enviada'} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors">Marcar Enviada</button>
                         <button onClick={() => actualizarEstadoGuia(guiaSeleccionada.id, 'pendiente')} disabled={guiaSeleccionada.estado === 'pendiente'} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors">A Pendiente</button>
                       </div>
                       
                       {/* ZONA PELIGROSA: ANULAR O ELIMINAR */}
                       <div className="border-t-2 border-red-100 pt-4 mt-6">
                         <p className="text-xs font-black text-red-600 uppercase mb-2">Zona de Peligro</p>
                         <input type="text" placeholder="Escribe ANULAR o ELIMINAR" value={textoConfirmacion} onChange={(e) => setTextoConfirmacion(e.target.value)} className="w-full border-2 border-red-200 rounded-xl px-3 py-3 text-sm mb-2 focus:border-red-600 outline-none font-bold" />
                         
                         <div className="flex gap-2">
                           <button onClick={() => actualizarEstadoGuia(guiaSeleccionada.id, 'anulada')} disabled={guiaSeleccionada.estado === 'anulada' || textoConfirmacion !== 'ANULAR'} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black py-2 rounded-xl disabled:opacity-50 transition-colors shadow-sm text-xs">ANULAR GUÍA</button>
                           <button onClick={() => eliminarGuia(guiaSeleccionada.id)} disabled={textoConfirmacion !== 'ELIMINAR'} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2 rounded-xl disabled:opacity-50 transition-colors shadow-sm text-xs">BORRAR PERMANENTE</button>
                         </div>
                       </div>
                     </>
                   )}

                   {!modoEdicion && (
                     <button onClick={() => setGuiaSeleccionada(null)} className="w-full text-gray-500 font-bold mt-4 py-2 hover:bg-gray-100 rounded-xl transition-colors">Cerrar Ventana</button>
                   )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}