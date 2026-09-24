"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el Modal de Lectura
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cotizacionActiva, setCotizacionActiva] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [procesandoEstado, setProcesandoEstado] = useState(false);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('creado_en', { ascending: false });
      
    if (data) setCotizaciones(data);
    if (error) console.error("Error al cargar cotizaciones:", error);
    setCargando(false);
  };

  const verCotizacion = async (cotizacion) => {
    setCotizacionActiva(cotizacion);
    setMostrarModal(true);
    
    // Si tienes la tabla detalles_cotizacion, los buscamos aquí
    const { data } = await supabase
      .from('detalles_cotizacion')
      .select('*, productos(titulo, imagenes)') // Hace un JOIN automático si configuraste bien la Foreign Key
      .eq('cotizacion_id', cotizacion.id);
      
    if (data) setDetalles(data);
    else setDetalles([]);
  };

  const actualizarEstado = async (nuevoEstado) => {
    setProcesandoEstado(true);
    try {
      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: nuevoEstado })
        .eq('id', cotizacionActiva.id);
        
      if (error) throw error;
      
      // Actualizamos el estado local para que se refleje de inmediato
      setCotizacionActiva({ ...cotizacionActiva, estado: nuevoEstado });
      setCotizaciones(cotizaciones.map(c => c.id === cotizacionActiva.id ? { ...c, estado: nuevoEstado } : c));
      
    } catch (error) {
      alert("Error al actualizar el estado: " + error.message);
    } finally {
      setProcesandoEstado(false);
    }
  };

  const colorEstado = (estado) => {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONTACTADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APROBADA': return 'bg-green-100 text-green-800 border-green-200';
      case 'RECHAZADA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-black text-2xl text-gray-800">📄 Bandeja de Cotizaciones</h2>
          <p className="text-gray-500 text-sm">Gestiona las solicitudes de tus clientes.</p>
        </div>
        <button onClick={cargarCotizaciones} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition-colors shadow-sm flex gap-2 items-center">
          🔄 Actualizar
        </button>
      </div>
      
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="p-4 font-black text-gray-600">ID</th>
              <th className="p-4 font-black text-gray-600">Cliente</th>
              <th className="p-4 font-black text-gray-600">Contacto</th>
              <th className="p-4 font-black text-gray-600">Fecha</th>
              <th className="p-4 font-black text-gray-600">Total Est.</th>
              <th className="p-4 font-black text-gray-600">Estado</th>
              <th className="p-4 font-black text-gray-600 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan="7" className="text-center p-8 text-gray-400 font-bold">Cargando solicitudes...</td></tr>}
            {!cargando && cotizaciones.length === 0 && <tr><td colSpan="7" className="text-center p-8 text-gray-400 font-bold">No hay cotizaciones registradas.</td></tr>}
            
            {cotizaciones.map(cot => (
              <tr key={cot.id} className="border-b hover:bg-blue-50/50 transition-colors">
                <td className="p-4 font-black text-gray-400">#{cot.id}</td>
                <td className="p-4 font-bold text-gray-800">{cot.nombre_cliente}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-gray-600 font-medium">{cot.telefono_whatsapp}</span>
                    <span className="text-xs text-gray-400">{cot.cliente_correo}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-500 font-medium">{new Date(cot.creado_en).toLocaleDateString()}</td>
                <td className="p-4 font-black text-[#0f3faf]">${cot.total_estimado || '0.00'}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${colorEstado(cot.estado)}`}>
                    {cot.estado || 'PENDIENTE'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => verCotizacion(cot)} className="bg-[#0f3faf] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-blue-800 shadow-sm transition-colors">
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Flotante de Detalles */}
      {mostrarModal && cotizacionActiva && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col">
            
            <div className="bg-gray-50 border-b px-8 py-5 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="font-black text-2xl text-gray-800">Cotización #{cotizacionActiva.id}</h2>
                <p className="text-gray-500 text-sm">{new Date(cotizacionActiva.creado_en).toLocaleString()}</p>
              </div>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-red-600 bg-white rounded-full p-2 border transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Info del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
                  <p className="font-black text-lg text-gray-800">{cotizacionActiva.nombre_cliente}</p>
                  <p className="text-gray-600">{cotizacionActiva.cliente_correo}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contacto / Zona</p>
                  <a href={`https://wa.me/${cotizacionActiva.telefono_whatsapp?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="font-black text-green-600 hover:underline flex items-center gap-2">
                    📱 {cotizacionActiva.telefono_whatsapp}
                  </a>
                  <p className="text-gray-600">{cotizacionActiva.cliente_zona || 'Zona no especificada'}</p>
                </div>
              </div>

              {cotizacionActiva.observaciones && (
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mensaje / Observaciones</p>
                  <p className="text-gray-700">{cotizacionActiva.observaciones}</p>
                </div>
              )}

              {/* Detalle de Productos (Si existe la relación) */}
              {detalles.length > 0 && (
                <div>
                  <h3 className="font-black text-lg mb-3">Productos Solicitados</h3>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-3">Producto</th>
                          <th className="p-3 text-center">Cant.</th>
                          <th className="p-3 text-right">Precio Unit.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map(det => (
                          <tr key={det.id} className="border-b last:border-0">
                            <td className="p-3 flex items-center gap-3 font-bold text-gray-800">
                              {det.productos?.imagenes?.[0] && <img src={det.productos.imagenes[0]} className="w-10 h-10 rounded object-cover border" />}
                              {det.productos?.titulo || 'Producto Eliminado'}
                            </td>
                            <td className="p-3 text-center font-black">{det.cantidad}</td>
                            <td className="p-3 text-right text-[#0f3faf] font-bold">${det.precio_unitario}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Botonera de Estados */}
              <div className="pt-6 border-t">
                <p className="text-sm font-bold text-gray-600 mb-3">Cambiar Estado de la Cotización:</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => actualizarEstado('Pendiente')} disabled={procesandoEstado || cotizacionActiva.estado === 'Pendiente'} className="px-4 py-2 rounded-lg font-bold text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50">
                    Marcar Pendiente
                  </button>
                  <button onClick={() => actualizarEstado('Contactado')} disabled={procesandoEstado || cotizacionActiva.estado === 'Contactado'} className="px-4 py-2 rounded-lg font-bold text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50">
                    Marcar Contactado
                  </button>
                  <button onClick={() => actualizarEstado('Aprobada')} disabled={procesandoEstado || cotizacionActiva.estado === 'Aprobada'} className="px-4 py-2 rounded-lg font-bold text-sm bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50">
                    Marcar Aprobada
                  </button>
                  <button onClick={() => actualizarEstado('Rechazada')} disabled={procesandoEstado || cotizacionActiva.estado === 'Rechazada'} className="px-4 py-2 rounded-lg font-bold text-sm bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50">
                    Marcar Rechazada
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}