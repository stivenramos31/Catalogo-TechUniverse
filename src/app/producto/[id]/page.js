"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const convertirAWebP = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const nuevoNombre = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const newFile = new File([blob], nuevoNombre, { type: "image/webp" });
            resolve(newFile);
          } else {
            reject(new Error("Falló la conversión"));
          }
        }, "image/webp", 0.8);
      };
    };
  });
};

// Extrae el nombre exacto del archivo desde la URL pública de Supabase
const extraerNombreArchivo = (url) => {
  if (!url) return null;
  try {
    // Limpia parámetros extra (?t=...) y extrae exactamente el nombre final del archivo .webp
    const urlSinParams = url.split('?')[0];
    if (urlSinParams.includes('/productos/')) {
      return decodeURIComponent(urlSinParams.split('/productos/')[1]);
    }
    return decodeURIComponent(urlSinParams.split('/').pop());
  } catch (e) {
    return null;
  }
};

const estadoInicial = { 
  titulo: "", descripcion: "", precio_actual: "", precio_anterior: "", 
  categoria_id: "", stock_disponible: 1, video_youtube: "", slug: "", activo: true 
};

export default function ModuloProductos({ productos, categorias, recargarDatos }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formModificado, setFormModificado] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  
  const [nuevoProducto, setNuevoProducto] = useState(estadoInicial);
  const [imagenesArchivos, setImagenesArchivos] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesParaBorrar, setImagenesParaBorrar] = useState([]);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (mostrarModal) {
        if (formModificado) {
          if (window.confirm("¿Seguro que deseas salir? Tienes cambios sin guardar.")) {
            setMostrarModal(false);
            setFormModificado(false);
            setImagenesParaBorrar([]);
          } else {
            window.history.pushState({ modalAbierto: true }, "");
          }
        } else {
          setMostrarModal(false);
          setImagenesParaBorrar([]);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mostrarModal, formModificado]);

  const abrirModal = (prod = null) => {
    if (prod) {
      setProductoEditando(prod);
      setNuevoProducto({ 
        titulo: prod.titulo, descripcion: prod.descripcion, 
        precio_actual: prod.precio_actual, precio_anterior: prod.precio_anterior || "", 
        categoria_id: prod.categoria_id, stock_disponible: prod.stock_disponible || 1, 
        video_youtube: prod.video_youtube || "", slug: prod.slug || "", 
        activo: prod.activo 
      });
      setImagenesExistentes(prod.imagenes || []);
    } else {
      setProductoEditando(null);
      setNuevoProducto({ ...estadoInicial, categoria_id: categorias[0]?.id || "" });
      setImagenesExistentes([]);
    }
    setImagenesArchivos([]);
    setImagenesParaBorrar([]);
    setFormModificado(false);
    setMostrarModal(true);
    window.history.pushState({ modalAbierto: true }, "");
  };

  const intentarCerrarModal = () => {
    if (formModificado) {
      if (window.confirm("¿Estás seguro de salir? Perderás toda la información no guardada.")) {
        setMostrarModal(false);
        setFormModificado(false);
        setImagenesParaBorrar([]);
        window.history.back();
      }
    } else {
      setMostrarModal(false);
      setImagenesParaBorrar([]);
      window.history.back();
    }
  };

  const manejarCambioInput = (campo, valor) => {
    setNuevoProducto({ ...nuevoProducto, [campo]: valor });
    setFormModificado(true);
  };

  const manejarSeleccionArchivos = (e) => {
    const archivos = Array.from(e.target.files);
    if (imagenesExistentes.length + archivos.length > 5) {
      alert("⚠️ Máximo 5 fotos en total.");
      e.target.value = ""; return;
    }
    setImagenesArchivos(archivos);
    setFormModificado(true);
  };

  const moverImagenExistente = (index, direccion) => {
    const nuevasImagenes = [...imagenesExistentes];
    if (direccion === "izq" && index > 0) [nuevasImagenes[index - 1], nuevasImagenes[index]] = [nuevasImagenes[index], nuevasImagenes[index - 1]];
    else if (direccion === "der" && index < nuevasImagenes.length - 1) [nuevasImagenes[index + 1], nuevasImagenes[index]] = [nuevasImagenes[index], nuevasImagenes[index + 1]];
    setImagenesExistentes(nuevasImagenes);
    setFormModificado(true);
  };

  const eliminarImagenExistente = (index) => {
    const urlEliminada = imagenesExistentes[index];
    const nombreArchivo = extraerNombreArchivo(urlEliminada);
    
    // Siempre agregamos el archivo a la cola de destrucción
    setImagenesParaBorrar(prev => [...prev, nombreArchivo || urlEliminada]);
    setImagenesExistentes(imagenesExistentes.filter((_, i) => i !== index));
    setFormModificado(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (imagenesArchivos.length === 0 && imagenesExistentes.length === 0) return alert("Selecciona al menos una imagen.");
    
    setProcesando(true);
    try {
      // 1. Destruir físicamente del Storage las imágenes marcadas con "X"
      if (imagenesParaBorrar.length > 0) {
        const { data: borrados, error: errorStorage } = await supabase.storage
          .from('productos')
          .remove(imagenesParaBorrar);
          
        if (errorStorage) {
          alert("Error de permisos en Storage: " + errorStorage.message);
        } else if (!borrados || borrados.length === 0) {
          console.warn("Supabase no encontró el archivo o faltan permisos RLS:", imagenesParaBorrar);
        } else {
          console.log("✅ Archivos destruidos físicamente del servidor:", borrados);
        }
      }

      // 2. Subir las imágenes nuevas en formato .webp
      let urlsNuevas = [];
      for (const archivo of imagenesArchivos) {
        const archivoWebP = await convertirAWebP(archivo);
        const fileName = `${Date.now()}-${archivoWebP.name.replace(/\s/g, "")}`;
        const { error } = await supabase.storage.from('productos').upload(fileName, archivoWebP);
        if (error) throw error;
        const { data } = supabase.storage.from('productos').getPublicUrl(fileName);
        urlsNuevas.push(data.publicUrl);
      }

      const fotosFinales = [...imagenesExistentes, ...urlsNuevas];
      const slugGenerado = nuevoProducto.slug || nuevoProducto.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, '-');

      const datosGuardar = {
        titulo: nuevoProducto.titulo, descripcion: nuevoProducto.descripcion,
        precio_actual: parseFloat(nuevoProducto.precio_actual),
        precio_anterior: nuevoProducto.precio_anterior ? parseFloat(nuevoProducto.precio_anterior) : null,
        categoria_id: parseInt(nuevoProducto.categoria_id),
        stock_disponible: parseInt(nuevoProducto.stock_disponible),
        video_youtube: nuevoProducto.video_youtube, slug: slugGenerado,
        activo: nuevoProducto.activo, imagenes: fotosFinales
      };

      if (productoEditando) {
        const { error } = await supabase.from('productos').update(datosGuardar).eq('id', productoEditando.id);
        if (error) throw error;
        alert("¡Producto actualizado y fotos antiguas eliminadas del servidor!");
      } else {
        const { error } = await supabase.from('productos').insert([datosGuardar]);
        if (error) throw error;
        alert("¡Producto publicado con éxito!");
      }

      setImagenesParaBorrar([]);
      setMostrarModal(false);
      setFormModificado(false);
      window.history.back();
      recargarDatos();
    } catch (error) {
      alert("Error al procesar: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminarProducto = async (id, titulo, imagenes = []) => {
    if(window.confirm(`¿Estás completamente seguro de eliminar "${titulo}" y borrar todas sus imágenes del servidor?`)) {
      const archivosDelProducto = (imagenes || []).map(extraerNombreArchivo).filter(Boolean);
      
      if (archivosDelProducto.length > 0) {
        await supabase.storage.from('productos').remove(archivosDelProducto);
      }

      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) alert("Error al eliminar: " + error.message);
      else recargarDatos();
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-black text-2xl text-gray-800">Inventario de Productos</h2>
        <button onClick={() => abrirModal()} className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-sm">
          + Nuevo Producto
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="p-4 font-black text-gray-600">Foto</th>
              <th className="p-4 font-black text-gray-600">Título</th>
              <th className="p-4 font-black text-gray-600">Precio</th>
              <th className="p-4 font-black text-gray-600">Stock</th>
              <th className="p-4 font-black text-gray-600">Categoría</th>
              <th className="p-4 font-black text-gray-600">Estado</th>
              <th className="p-4 font-black text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && <tr><td colSpan="7" className="text-center p-8 text-gray-400 font-bold">No hay productos.</td></tr>}
            {productos.map(prod => (
              <tr key={prod.id} className="border-b hover:bg-blue-50/50 transition-colors">
                <td className="p-4"><img src={prod.imagenes?.[0] || "https://via.placeholder.com/150"} className="w-14 h-14 object-cover rounded-lg border shadow-sm" /></td>
                <td className="p-4 font-bold text-gray-800 max-w-[200px] truncate">{prod.titulo}</td>
                <td className="p-4 text-green-600 font-black text-lg">${prod.precio_actual}</td>
                <td className="p-4"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-black border">{prod.stock_disponible}</span></td>
                <td className="p-4 text-gray-500 font-medium">{categorias.find(c => c.id === prod.categoria_id)?.nombre || "Sin Categoría"}</td>
                <td className="p-4">
                  {prod.activo ? <span className="text-green-700 flex items-center gap-1 font-bold"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Visible</span> : <span className="text-gray-500 flex items-center gap-1 font-bold"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> Oculto</span>}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => abrirModal(prod)} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-black hover:bg-blue-200 transition-colors">Editar</button>
                  <button onClick={() => eliminarProducto(prod.id, prod.titulo, prod.imagenes)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100 transition-colors">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b px-8 py-5 flex justify-between items-center z-10 rounded-t-3xl">
              <h2 className="font-black text-2xl text-gray-800">{productoEditando ? "✏️ Editar Producto" : "➕ Nuevo Producto"}</h2>
              <button onClick={intentarCerrarModal} className="text-gray-400 hover:text-red-600 transition-colors p-2 bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={guardarProducto} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Título del Producto *</label>
                  <input type="text" value={nuevoProducto.titulo} onChange={e => manejarCambioInput('titulo', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none transition-all font-medium text-lg" required />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Descripción *</label>
                  <textarea value={nuevoProducto.descripcion} onChange={e => manejarCambioInput('descripcion', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 h-32 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none transition-all font-medium" required />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Precio Actual ($) *</label>
                  <input type="number" step="0.01" value={nuevoProducto.precio_actual} onChange={e => manejarCambioInput('precio_actual', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-black text-xl text-green-700" required />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Precio Anterior ($) - Oferta</label>
                  <input type="number" step="0.01" value={nuevoProducto.precio_anterior} onChange={e => manejarCambioInput('precio_anterior', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-black text-xl text-red-500" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Categoría *</label>
                  <select value={nuevoProducto.categoria_id} onChange={e => manejarCambioInput('categoria_id', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-bold" required>
                    <option value="" disabled>Selecciona...</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Stock Disponible *</label>
                  <input type="number" value={nuevoProducto.stock_disponible} onChange={e => manejarCambioInput('stock_disponible', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-black" required />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL Amigable (Opcional)</label>
                  <input type="text" placeholder="Ej: kit-herramientas" value={nuevoProducto.slug} onChange={e => manejarCambioInput('slug', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Video YouTube (Opcional)</label>
                  <input type="url" placeholder="https://youtube.com/..." value={nuevoProducto.video_youtube} onChange={e => manejarCambioInput('video_youtube', e.target.value)} className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-blue-600" />
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100 mt-6">
                <label className="block text-sm font-black text-blue-900 mb-3">📸 Galería de Imágenes (Máx 5)</label>
                <input type="file" accept="image/*" multiple onChange={manejarSeleccionArchivos} className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                
                {imagenesExistentes.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-bold text-blue-800 mb-2">
                      Fotos actuales (Presiona "X" y luego "Guardar Cambios" para borrarlas definitivamente de Supabase):
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {imagenesExistentes.map((img, index) => (
                        <div key={index} className="relative group w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white">
                          <img src={img} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => moverImagenExistente(index, "izq")} className="text-white text-xl hover:scale-125 transition-transform">◀</button>
                            <button type="button" onClick={() => eliminarImagenExistente(index)} className="text-red-500 font-black text-2xl hover:scale-125 transition-transform" title="Eliminar imagen">X</button>
                            <button type="button" onClick={() => moverImagenExistente(index, "der")} className="text-white text-xl hover:scale-125 transition-transform">▶</button>
                          </div>
                          {index === 0 && <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[10px] font-black text-center py-1">PORTADA</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imagenesParaBorrar.length > 0 && (
                  <p className="text-xs font-bold text-red-600 mt-3">
                    🗑️ {imagenesParaBorrar.length} foto(s) marcada(s) para eliminarse del Storage al guardar.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-4 bg-gray-50 px-4 rounded-xl border border-gray-200">
                <input type="checkbox" checked={nuevoProducto.activo} onChange={e => manejarCambioInput('activo', e.target.checked)} className="w-6 h-6 rounded text-[#0f3faf] focus:ring-[#0f3faf]" />
                <span className="text-base font-black text-gray-800">Producto Activo y Visible para los clientes</span>
              </label>

              <div className="sticky bottom-0 bg-white pt-6 pb-2 border-t flex gap-4 mt-8">
                <button type="button" onClick={intentarCerrarModal} className="w-1/3 bg-gray-100 text-gray-700 font-black py-4 rounded-xl hover:bg-gray-200 transition-colors text-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={procesando} className="w-2/3 bg-[#0f3faf] text-white font-black py-4 rounded-xl hover:bg-blue-800 transition-colors text-lg shadow-xl shadow-blue-200 flex justify-center items-center gap-2">
                  {procesando ? "Guardando y limpiando servidor..." : (productoEditando ? "Guardar Cambios" : "Publicar Producto")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}