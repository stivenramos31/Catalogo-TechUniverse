"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

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

const estadoInicial = { 
  titulo: "", descripcion: "", precio_actual: "", precio_anterior: "", 
  categoria_id: "", stock_disponible: 1, video_youtube: "", slug: "", activo: true 
};

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState({ avatar_url: "", nombre: "" });
  const fotoPerfilRef = useRef(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Estados de la Ventana Flotante (Modal) y Protección de datos
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formModificado, setFormModificado] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  
  const [nuevoProducto, setNuevoProducto] = useState(estadoInicial);
  const [imagenesArchivos, setImagenesArchivos] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const inicializarPanel = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          setPerfil({
            avatar_url: session.user.user_metadata?.avatar_url || "",
            nombre: session.user.user_metadata?.full_name || "Administrador"
          });
          await cargarDatosGrupales();
        }
      } finally {
        setVerificando(false);
      }
    };
    inicializarPanel();
  }, []);

  const cargarDatosGrupales = async () => {
    const { data: prods } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prods) setProductos(prods);

    const { data: cats } = await supabase.from("categorias").select("*").order("nombre", { ascending: true });
    if (cats) setCategorias(cats);
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Error: Correo o contraseña incorrectos.");
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  // --- LÓGICA DE PROTECCIÓN DE NAVEGACIÓN Y MODAL ---
  useEffect(() => {
    // Evita que el usuario cierre la pestaña por accidente si hay cambios
    const handleBeforeUnload = (e) => {
      if (formModificado) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Intercepta el botón "Atrás" del navegador
    const handlePopState = (e) => {
      if (mostrarModal) {
        if (formModificado) {
          const confirmar = window.confirm("¿Seguro que deseas salir? Tienes cambios sin guardar.");
          if (confirmar) {
            setMostrarModal(false);
            setFormModificado(false);
          } else {
            // Si cancela, volvemos a empujar el estado para mantener el modal abierto
            window.history.pushState({ modalAbierto: true }, "");
          }
        } else {
          setMostrarModal(false);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
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
    setFormModificado(false);
    setMostrarModal(true);
    
    // Engañamos al navegador creando un historial falso para que el botón "Atrás" funcione en el modal
    window.history.pushState({ modalAbierto: true }, "");
  };

  const intentarCerrarModal = () => {
    if (formModificado) {
      if (window.confirm("¿Estás seguro de salir? Perderás toda la información no guardada.")) {
        setMostrarModal(false);
        setFormModificado(false);
        window.history.back(); // Limpiamos el historial falso
      }
    } else {
      setMostrarModal(false);
      window.history.back();
    }
  };

  // Función para capturar cambios y activar la alerta de guardado
  const manejarCambioInput = (campo, valor) => {
    setNuevoProducto({ ...nuevoProducto, [campo]: valor });
    setFormModificado(true);
  };

  // --- LÓGICA DE FOTOS (Reducida por brevedad, igual a la anterior) ---
  const cambiarFotoPerfil = async (e) => {
    // ... [Misma lógica de foto de perfil que ya tenías]
  };

  const manejarSeleccionArchivos = (e) => {
    const archivos = Array.from(e.target.files);
    if (imagenesExistentes.length + archivos.length > 5) {
      alert("⚠️ Máximo 5 fotos en total.");
      e.target.value = "";
      return;
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
    setImagenesExistentes(imagenesExistentes.filter((_, i) => i !== index));
    setFormModificado(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (imagenesArchivos.length === 0 && imagenesExistentes.length === 0) return alert("Selecciona al menos una imagen.");
    
    setProcesando(true);
    try {
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
      const slugGenerado = nuevoProducto.slug || nuevoProducto.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

      const datosGuardar = {
        titulo: nuevoProducto.titulo,
        descripcion: nuevoProducto.descripcion,
        precio_actual: parseFloat(nuevoProducto.precio_actual),
        precio_anterior: nuevoProducto.precio_anterior ? parseFloat(nuevoProducto.precio_anterior) : null,
        categoria_id: parseInt(nuevoProducto.categoria_id),
        stock_disponible: parseInt(nuevoProducto.stock_disponible),
        video_youtube: nuevoProducto.video_youtube,
        slug: slugGenerado,
        activo: nuevoProducto.activo,
        imagenes: fotosFinales
      };

      if (productoEditando) {
        const { error } = await supabase.from('productos').update(datosGuardar).eq('id', productoEditando.id);
        if (error) throw error;
        alert("¡Producto actualizado exitosamente!");
      } else {
        const { error } = await supabase.from('productos').insert([datosGuardar]);
        if (error) throw error;
        alert("¡Producto publicado con éxito!");
      }

      setMostrarModal(false);
      setFormModificado(false);
      window.history.back(); // Salimos del estado falso
      cargarDatosGrupales();
    } catch (error) {
      alert("Error al procesar: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  const eliminarProducto = async (id, titulo) => {
    if(window.confirm(`¿Estás completamente seguro de eliminar "${titulo}"?`)) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) alert("Error al eliminar: " + error.message);
      else cargarDatosGrupales();
    }
  };

  if (verificando) return <div className="min-h-screen flex items-center justify-center">Cargando panel...</div>;
  if (!session) return ( /* Renderizado de Login (igual que antes) */
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <form onSubmit={iniciarSesion} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border">
          <h1 className="text-2xl font-black text-center mb-6">🔐 Acceso Restringido</h1>
          <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border mb-4 rounded-xl px-4 py-3" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border mb-4 rounded-xl px-4 py-3" required />
          <button type="submit" className="w-full bg-[#0f3faf] text-white font-bold py-3 rounded-xl">Iniciar Sesión</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black">Panel de Administración</h1>
            <p className="text-gray-500 text-sm">Gestiona tu catálogo en vivo</p>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => supabase.auth.signOut()} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold">Salir</button>
          </div>
        </div>
        
        {/* TABLA PRINCIPAL A PANTALLA COMPLETA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-xl">📦 Inventario Actual</h2>
            <button onClick={() => abrirModal()} className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-6 py-2 rounded-xl transition-colors">
              + Nuevo Producto
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Foto</th>
                  <th className="p-3">Título</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(prod => (
                  <tr key={prod.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <img src={prod.imagenes?.[0] || "https://via.placeholder.com/150"} alt={prod.titulo} className="w-12 h-12 object-cover rounded-md border" />
                    </td>
                    <td className="p-3 font-bold max-w-[200px] truncate">{prod.titulo}</td>
                    <td className="p-3 text-green-600 font-bold">${prod.precio_actual}</td>
                    <td className="p-3 font-bold text-gray-700">{prod.stock_disponible}</td>
                    <td className="p-3 text-gray-500">{categorias.find(c => c.id === prod.categoria_id)?.nombre || "Sin Categoría"}</td>
                    <td className="p-3">
                      {prod.activo ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Activo</span> : <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">Oculto</span>}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => abrirModal(prod)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-100">Editar</button>
                      <button onClick={() => eliminarProducto(prod.id, prod.titulo)} className="bg-red-50 text-red-600 px-3 py-1 rounded-md text-xs font-bold hover:bg-red-100">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VENTANA FLOTANTE (MODAL) */}
        {mostrarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col">
              
              {/* Cabecera del Modal */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10 rounded-t-3xl">
                <h2 className="font-black text-2xl text-gray-800">
                  {productoEditando ? "✏️ Editar Producto" : "➕ Nuevo Producto"}
                </h2>
                <button onClick={intentarCerrarModal} className="text-gray-400 hover:text-red-600 transition-colors p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={guardarProducto} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Título del Producto *</label>
                    <input type="text" value={nuevoProducto.titulo} onChange={e => manejarCambioInput('titulo', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Descripción *</label>
                    <textarea value={nuevoProducto.descripcion} onChange={e => manejarCambioInput('descripcion', e.target.value)} className="w-full border rounded-xl px-4 py-3 h-32 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Precio Actual ($) *</label>
                    <input type="number" step="0.01" value={nuevoProducto.precio_actual} onChange={e => manejarCambioInput('precio_actual', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white" required />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Precio Anterior ($) - Opcional</label>
                    <input type="number" step="0.01" value={nuevoProducto.precio_anterior} onChange={e => manejarCambioInput('precio_anterior', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Categoría *</label>
                    <select value={nuevoProducto.categoria_id} onChange={e => manejarCambioInput('categoria_id', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white" required>
                      <option value="" disabled>Selecciona...</option>
                      {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Stock Disponible *</label>
                    <input type="number" value={nuevoProducto.stock_disponible} onChange={e => manejarCambioInput('stock_disponible', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white" required />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">URL Amigable (Slug) - Opcional</label>
                    <input type="text" placeholder="Se generará sola si está vacío" value={nuevoProducto.slug} onChange={e => manejarCambioInput('slug', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Video YouTube - Opcional</label>
                    <input type="text" placeholder="https://youtu.be/..." value={nuevoProducto.video_youtube} onChange={e => manejarCambioInput('video_youtube', e.target.value)} className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white" />
                  </div>
                </div>

                {/* Zona de Imágenes */}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Imágenes (Se comprimen automáticamente a .webp)</label>
                  <input type="file" accept="image/*" multiple onChange={manejarSeleccionArchivos} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  
                  {imagenesExistentes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-gray-500 mb-2">Fotos actuales (Ordena o elimina):</p>
                      <div className="flex flex-wrap gap-3">
                        {imagenesExistentes.map((img, index) => (
                          <div key={index} className="relative group w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                            <img src={img} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => moverImagenExistente(index, "izq")} className="text-white text-lg">◀</button>
                              <button type="button" onClick={() => eliminarImagenExistente(index)} className="text-red-500 font-black text-lg">X</button>
                              <button type="button" onClick={() => moverImagenExistente(index, "der")} className="text-white text-lg">▶</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 cursor-pointer py-2">
                  <input type="checkbox" checked={nuevoProducto.activo} onChange={e => manejarCambioInput('activo', e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-bold text-gray-800">Producto Activo / Visible para los clientes</span>
                </label>

                {/* Pie del Modal con botones */}
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6 flex gap-3">
                  <button type="button" onClick={intentarCerrarModal} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={procesando} className="flex-[2] bg-[#16a34a] text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
                    {procesando ? "Procesando y Subiendo..." : "Guardar Producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}