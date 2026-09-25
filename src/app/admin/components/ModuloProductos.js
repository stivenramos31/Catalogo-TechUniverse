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
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nuevoNombre = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const newFile = new File([blob], nuevoNombre, { type: "image/webp" });
              resolve(newFile);
            } else {
              reject(new Error("Falló la conversión a WebP"));
            }
          },
          "image/webp",
          0.82
        );
      };
    };
  });
};

const extraerNombreArchivo = (url) => {
  if (!url) return null;
  try {
    const urlSinParams = url.split("?")[0];
    if (urlSinParams.includes("/productos/")) {
      return decodeURIComponent(urlSinParams.split("/productos/")[1]);
    }
    return decodeURIComponent(urlSinParams.split("/").pop());
  } catch (e) {
    return null;
  }
};

const estadoInicial = {
  titulo: "",
  descripcion: "",
  precio_actual: "",
  precio_anterior: "",
  categoria_id: "",
  stock_disponible: 1,
  video_youtube: "",
  slug: "",
  activo: true,
};

export default function ModuloProductos({ productos, categorias, recargarDatos }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formModificado, setFormModificado] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  const [nuevoProducto, setNuevoProducto] = useState(estadoInicial);
  // Lista de objetos { file, previewUrl } para previsualizar antes de subir
  const [imagenesNuevas, setImagenesNuevas] = useState([]);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [imagenesParaBorrar, setImagenesParaBorrar] = useState([]);

  // Estados de la animación de carga real
  const [procesando, setProcesando] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);
  const [estadoSubidaTexto, setEstadoSubidaTexto] = useState("");
  const [miniaturaSubiendoActual, setMiniaturaSubiendoActual] = useState(null);

  // Limpiar memoria de URLs temporales
  const limpiarPreviews = (lista) => {
    lista.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  };

  useEffect(() => {
    const handlePopState = () => {
      if (mostrarModal && !procesando) {
        if (formModificado) {
          if (window.confirm("¿Seguro que deseas salir? Tienes cambios sin guardar.")) {
            limpiarPreviews(imagenesNuevas);
            setImagenesNuevas([]);
            setMostrarModal(false);
            setFormModificado(false);
            setImagenesParaBorrar([]);
          } else {
            window.history.pushState({ modalAbierto: true }, "");
          }
        } else {
          limpiarPreviews(imagenesNuevas);
          setImagenesNuevas([]);
          setMostrarModal(false);
          setImagenesParaBorrar([]);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mostrarModal, formModificado, procesando, imagenesNuevas]);

  const abrirModal = (prod = null) => {
    limpiarPreviews(imagenesNuevas);
    if (prod) {
      setProductoEditando(prod);
      setNuevoProducto({
        titulo: prod.titulo,
        descripcion: prod.descripcion,
        precio_actual: prod.precio_actual,
        precio_anterior: prod.precio_anterior || "",
        categoria_id: prod.categoria_id,
        stock_disponible: prod.stock_disponible || 1,
        video_youtube: prod.video_youtube || "",
        slug: prod.slug || "",
        activo: prod.activo,
      });
      setImagenesExistentes(prod.imagenes || []);
    } else {
      setProductoEditando(null);
      setNuevoProducto({ ...estadoInicial, categoria_id: categorias[0]?.id || "" });
      setImagenesExistentes([]);
    }
    setImagenesNuevas([]);
    setImagenesParaBorrar([]);
    setProgresoSubida(0);
    setEstadoSubidaTexto("");
    setFormModificado(false);
    setMostrarModal(true);
    window.history.pushState({ modalAbierto: true }, "");
  };

  const intentarCerrarModal = () => {
    if (procesando) return;
    if (formModificado) {
      if (window.confirm("¿Estás seguro de salir? Perderás toda la información no guardada.")) {
        limpiarPreviews(imagenesNuevas);
        setImagenesNuevas([]);
        setMostrarModal(false);
        setFormModificado(false);
        setImagenesParaBorrar([]);
        window.history.back();
      }
    } else {
      limpiarPreviews(imagenesNuevas);
      setImagenesNuevas([]);
      setMostrarModal(false);
      setImagenesParaBorrar([]);
      window.history.back();
    }
  };

  const manejarCambioInput = (campo, valor) => {
    setNuevoProducto({ ...nuevoProducto, [campo]: valor });
    setFormModificado(true);
  };

  // Agrega fotos con previsualización instantánea sin borrar las seleccionadas antes
  const manejarSeleccionArchivos = (e) => {
    const archivosSeleccionados = Array.from(e.target.files || []);
    if (archivosSeleccionados.length === 0) return;

    const totalActual = imagenesExistentes.length + imagenesNuevas.length;
    if (totalActual + archivosSeleccionados.length > 5) {
      alert(`⚠️ Máximo 5 fotos en total. Actualmente ya tienes ${totalActual} foto(s) lista(s).`);
      e.target.value = "";
      return;
    }

    const nuevasConPreview = archivosSeleccionados.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      nombreOriginal: file.name,
      tamanoKB: Math.round(file.size / 1024),
    }));

    setImagenesNuevas((prev) => [...prev, ...nuevasConPreview]);
    setFormModificado(true);
    e.target.value = ""; // Permite volver a abrir el selector para agregar más
  };

  // Descartar una foto nueva de la previsualización antes de subirla
  const eliminarImagenNueva = (index) => {
    const imagenQuitada = imagenesNuevas[index];
    if (imagenQuitada?.previewUrl) {
      URL.revokeObjectURL(imagenQuitada.previewUrl);
    }
    setImagenesNuevas((prev) => prev.filter((_, i) => i !== index));
    setFormModificado(true);
  };

  // Reordenar fotos nuevas antes de subirlas
  const moverImagenNueva = (index, direccion) => {
    const copia = [...imagenesNuevas];
    if (direccion === "izq" && index > 0) {
      [copia[index - 1], copia[index]] = [copia[index], copia[index - 1]];
    } else if (direccion === "der" && index < copia.length - 1) {
      [copia[index + 1], copia[index]] = [copia[index], copia[index + 1]];
    }
    setImagenesNuevas(copia);
    setFormModificado(true);
  };

  const moverImagenExistente = (index, direccion) => {
    const nuevasImagenes = [...imagenesExistentes];
    if (direccion === "izq" && index > 0) {
      [nuevasImagenes[index - 1], nuevasImagenes[index]] = [nuevasImagenes[index], nuevasImagenes[index - 1]];
    } else if (direccion === "der" && index < nuevasImagenes.length - 1) {
      [nuevasImagenes[index + 1], nuevasImagenes[index]] = [nuevasImagenes[index], nuevasImagenes[index + 1]];
    }
    setImagenesExistentes(nuevasImagenes);
    setFormModificado(true);
  };

  const eliminarImagenExistente = (index) => {
    const urlEliminada = imagenesExistentes[index];
    const nombreArchivo = extraerNombreArchivo(urlEliminada);
    setImagenesParaBorrar((prev) => [...prev, nombreArchivo || urlEliminada]);
    setImagenesExistentes(imagenesExistentes.filter((_, i) => i !== index));
    setFormModificado(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (imagenesNuevas.length === 0 && imagenesExistentes.length === 0) {
      return alert("Debes dejar al menos 1 imagen en el producto.");
    }

    setProcesando(true);
    setProgresoSubida(5);

    try {
      const totalFotosNuevas = imagenesNuevas.length;
      // Calculamos pasos totales para que la barra avance de forma 100% real
      const totalPasos = (imagenesParaBorrar.length > 0 ? 1 : 0) + totalFotosNuevas * 2 + 1;
      let pasoActual = 0;

      const avanzarProgreso = (texto, preview = null) => {
        pasoActual += 1;
        const porcentaje = Math.min(Math.round((pasoActual / totalPasos) * 95), 95);
        setProgresoSubida(porcentaje);
        setEstadoSubidaTexto(texto);
        setMiniaturaSubiendoActual(preview);
      };

      // 1. Destruir físicamente del Storage las imágenes antiguas marcadas con "✕"
      if (imagenesParaBorrar.length > 0) {
        avanzarProgreso(`Eliminando ${imagenesParaBorrar.length} foto(s) antigua(s) del servidor...`);
        const { error: errorStorage } = await supabase.storage
          .from("productos")
          .remove(imagenesParaBorrar);
        if (errorStorage) console.error("Aviso al limpiar Storage:", errorStorage.message);
      }

      // 2. Convertir a .webp y subir cada imagen nueva mostrando el progreso real
      let urlsNuevas = [];
      for (let i = 0; i < totalFotosNuevas; i++) {
        const item = imagenesNuevas[i];
        const numFoto = i + 1;

        avanzarProgreso(
          `Optimizando imagen ${numFoto} de ${totalFotosNuevas} a formato .webp...`,
          item.previewUrl
        );
        const archivoWebP = await convertirAWebP(item.file);

        avanzarProgreso(
          `Subiendo imagen ${numFoto} de ${totalFotosNuevas} al servidor...`,
          item.previewUrl
        );
        const fileName = `${Date.now()}-${ i }-${archivoWebP.name.replace(/\s+/g, "")}`;
        const { error } = await supabase.storage.from("productos").upload(fileName, archivoWebP);
        if (error) throw error;

        const { data } = supabase.storage.from("productos").getPublicUrl(fileName);
        urlsNuevas.push(data.publicUrl);
      }

      // 3. Guardar datos en la tabla productos
      avanzarProgreso("Guardando información del producto en la base de datos...", null);

      const fotosFinales = [...imagenesExistentes, ...urlsNuevas];
      const slugGenerado =
        nuevoProducto.slug ||
        nuevoProducto.titulo
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");

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
        imagenes: fotosFinales,
      };

      if (productoEditando) {
        const { error } = await supabase.from("productos").update(datosGuardar).eq("id", productoEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("productos").insert([datosGuardar]);
        if (error) throw error;
      }

      setProgresoSubida(100);
      setEstadoSubidaTexto("¡Completado con éxito!");

      // Breve pausa de 400ms para que el usuario vea el 100% antes de cerrar el modal
      await new Promise((res) => setTimeout(res, 400));

      limpiarPreviews(imagenesNuevas);
      setImagenesNuevas([]);
      setImagenesParaBorrar([]);
      setMostrarModal(false);
      setFormModificado(false);
      window.history.back();
      recargarDatos();
    } catch (error) {
      alert("Error al procesar: " + error.message);
    } finally {
      setProcesando(false);
      setProgresoSubida(0);
      setEstadoSubidaTexto("");
      setMiniaturaSubiendoActual(null);
    }
  };

  const eliminarProducto = async (id, titulo, imagenes = []) => {
    if (window.confirm(`¿Estás completamente seguro de eliminar "${titulo}" y borrar todas sus imágenes del servidor?`)) {
      const archivosDelProducto = (imagenes || []).map(extraerNombreArchivo).filter(Boolean);

      if (archivosDelProducto.length > 0) {
        await supabase.storage.from("productos").remove(archivosDelProducto);
      }

      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) alert("Error al eliminar: " + error.message);
      else recargarDatos();
    }
  };

  const totalFotosActuales = imagenesExistentes.length + imagenesNuevas.length;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="font-black text-xl sm:text-2xl text-gray-800">Inventario de Productos</h2>
        <button
          onClick={() => abrirModal()}
          className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-colors shadow-sm text-sm sm:text-base whitespace-nowrap"
        >
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
            {productos.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-8 text-gray-400 font-bold">
                  No hay productos registrados.
                </td>
              </tr>
            )}
            {productos.map((prod) => (
              <tr key={prod.id} className="border-b hover:bg-blue-50/50 transition-colors">
                <td className="p-4">
                  <img
                    src={prod.imagenes?.[0] || "/favicon.ico"}
                    alt={prod.titulo}
                    className="w-14 h-14 object-contain bg-white p-1 rounded-lg border shadow-xs"
                  />
                </td>
                <td className="p-4 font-bold text-gray-800 max-w-[200px] truncate">{prod.titulo}</td>
                <td className="p-4 text-green-600 font-black text-lg">${prod.precio_actual}</td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-black border">
                    {prod.stock_disponible}
                  </span>
                </td>
                <td className="p-4 text-gray-500 font-medium">
                  {categorias.find((c) => c.id === prod.categoria_id)?.nombre || "Sin Categoría"}
                </td>
                <td className="p-4">
                  {prod.activo ? (
                    <span className="text-green-700 flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span> Visible
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span> Oculto
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                    <button
                      onClick={() => abrirModal(prod)}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-black hover:bg-blue-200 transition-colors text-center"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarProducto(prod.id, prod.titulo, prod.imagenes)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100 transition-colors text-center"
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col relative">
            
{/* 🚀 PANTALLA DE ANIMACIÓN DE SUBIDA REAL */}
            {procesando && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-t-8 border-[#0f3faf] space-y-5">
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-[#0f3faf] border-t-transparent animate-spin"></div>
                    {miniaturaSubiendoActual ? (
                      <img
                        src={miniaturaSubiendoActual}
                        alt="Subiendo"
                        className="w-16 h-16 rounded-full object-cover shadow-md"
                      />
                    ) : (
                      <span className="text-3xl">☁️</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-xl text-gray-900">
                      Subiendo y Optimizando...
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-[#0f3faf] mt-1 min-h-[20px]">
                      {estadoSubidaTexto}
                    </p>
                  </div>

                  {/* Barra de Progreso Real */}
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-[#0f3faf] to-green-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progresoSubida}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-black text-gray-500">
                    <span>Conversión WebP activa</span>
                    <span className="text-base text-gray-900">{progresoSubida}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="sticky top-0 bg-white border-b px-6 sm:px-8 py-4 sm:py-5 flex justify-between items-center z-10 rounded-t-3xl">
              <h2 className="font-black text-xl sm:text-2xl text-gray-800">
                {productoEditando ? "✏️ Editar Producto" : "➕ Nuevo Producto"}
              </h2>
              <button
                type="button"
                onClick={intentarCerrarModal}
                disabled={procesando}
                className="text-gray-400 hover:text-red-600 transition-colors p-2 bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarProducto} className="p-5 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Título del Producto *
                  </label>
                  <input
                    type="text"
                    value={nuevoProducto.titulo}
                    onChange={(e) => manejarCambioInput("titulo", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-base sm:text-lg"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Descripción *
                  </label>
                  <textarea
                    value={nuevoProducto.descripcion}
                    onChange={(e) => manejarCambioInput("descripcion", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 h-28 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Precio Actual ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoProducto.precio_actual}
                    onChange={(e) => manejarCambioInput("precio_actual", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-black text-xl text-green-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Precio Anterior ($) - Oferta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoProducto.precio_anterior}
                    onChange={(e) => manejarCambioInput("precio_anterior", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-black text-xl text-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoría *</label>
                  <select
                    value={nuevoProducto.categoria_id}
                    onChange={(e) => manejarCambioInput("categoria_id", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-bold"
                    required
                  >
                    <option value="" disabled>
                      Selecciona...
                    </option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Stock Disponible *
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.stock_disponible}
                    onChange={(e) => manejarCambioInput("stock_disponible", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    URL Amigable (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: kit-herramientas"
                    value={nuevoProducto.slug}
                    onChange={(e) => manejarCambioInput("slug", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Video YouTube (Opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={nuevoProducto.video_youtube}
                    onChange={(e) => manejarCambioInput("video_youtube", e.target.value)}
                    className="w-full border-2 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:border-[#0f3faf] outline-none font-medium text-blue-600"
                  />
                </div>
              </div>

              {/* 📸 GALERÍA CON PREVISUALIZACIÓN Y DESCARTE PREVIO */}
              <div className="bg-blue-50/70 p-4 sm:p-6 rounded-2xl border-2 border-blue-100 space-y-5">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <label className="block text-sm font-black text-blue-950">
                      📸 Galería de Imágenes ({totalFotosActuales}/5)
                    </label>
                    <p className="text-xs text-blue-700 font-medium">
                      Previsualiza y descarta las fotos que no quieras antes de subirlas.
                    </p>
                  </div>

                  {totalFotosActuales < 5 && (
                    <label className="bg-[#0f3faf] hover:bg-blue-800 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors inline-flex items-center gap-2">
                      <span>➕ Seleccionar Imágenes</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={manejarSeleccionArchivos}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* 1. Fotos actuales ya guardadas en el servidor */}
                {imagenesExistentes.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">
                      ☁️ Fotos actuales en el servidor ({imagenesExistentes.length}):
                    </p>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {imagenesExistentes.map((img, index) => (
                        <div
                          key={index}
                          className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl border-2 border-gray-200 shadow-xs overflow-hidden bg-white flex flex-col justify-between"
                        >
                          {/* Botón ✕ siempre accesible en móvil y PC */}
                          <button
                            type="button"
                            onClick={() => eliminarImagenExistente(index)}
                            title="Quitar imagen"
                            className="absolute top-1.5 right-1.5 z-10 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-md"
                          >
                            ✕
                          </button>

                          {index === 0 && (
                            <span className="absolute top-1.5 left-1.5 z-10 bg-[#0f3faf] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs">
                              PORTADA
                            </span>
                          )}

                          <div className="flex-1 p-1.5 flex items-center justify-center overflow-hidden">
                            <img src={img} alt="" className="max-w-full max-h-full object-contain" />
                          </div>

                          <div className="bg-gray-100 border-t flex justify-between items-center px-2 py-1">
                            <button
                              type="button"
                              onClick={() => moverImagenExistente(index, "izq")}
                              disabled={index === 0}
                              className="text-gray-700 disabled:opacity-25 font-black text-xs px-1"
                            >
                              ◀
                            </button>
                            <span className="text-[10px] font-bold text-gray-400">#{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => moverImagenExistente(index, "der")}
                              disabled={index === imagenesExistentes.length - 1}
                              className="text-gray-700 disabled:opacity-25 font-black text-xs px-1"
                            >
                              ▶
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Previsualización de FOTOS NUEVAS antes de subir */}
                {imagenesNuevas.length > 0 && (
                  <div className="bg-green-50/70 p-4 rounded-xl border-2 border-green-200">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-black text-green-900 uppercase tracking-wider">
                        ✨ Nuevas fotos por subir ({imagenesNuevas.length}) — Elimina con "✕" las que no quieras:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          limpiarPreviews(imagenesNuevas);
                          setImagenesNuevas([]);
                        }}
                        className="text-[11px] font-black text-red-600 hover:underline"
                      >
                        Descartar todas
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {imagenesNuevas.map((item, index) => {
                        const esPortadaGlobal = imagenesExistentes.length === 0 && index === 0;
                        return (
                          <div
                            key={index}
                            className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-2xl border-2 border-green-500 shadow-sm overflow-hidden bg-white flex flex-col justify-between"
                          >
                            {/* Botón ✕ para descartar antes de subir */}
                            <button
                              type="button"
                              onClick={() => eliminarImagenNueva(index)}
                              title="No subir esta imagen"
                              className="absolute top-1.5 right-1.5 z-10 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shadow-md"
                            >
                              ✕
                            </button>

                            <span
                              className={`absolute top-1.5 left-1.5 z-10 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs ${
                                esPortadaGlobal ? "bg-[#0f3faf]" : "bg-green-600"
                              }`}
                            >
                              {esPortadaGlobal ? "PORTADA" : "NUEVA"}
                            </span>

                            <div className="flex-1 p-1.5 flex items-center justify-center overflow-hidden">
                              <img
                                src={item.previewUrl}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>

                            <div className="bg-green-100/80 border-t border-green-200 flex justify-between items-center px-2 py-1">
                              <button
                                type="button"
                                onClick={() => moverImagenNueva(index, "izq")}
                                disabled={index === 0}
                                className="text-green-900 disabled:opacity-25 font-black text-xs px-1"
                              >
                                ◀
                              </button>
                              <span className="text-[9px] font-bold text-green-800 truncate">
                                {item.tamanoKB}KB
                              </span>
                              <button
                                type="button"
                                onClick={() => moverImagenNueva(index, "der")}
                                disabled={index === imagenesNuevas.length - 1}
                                className="text-green-900 disabled:opacity-25 font-black text-xs px-1"
                              >
                                ▶
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {imagenesParaBorrar.length > 0 && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
                    🗑️ {imagenesParaBorrar.length} foto(s) antigua(s) marcada(s) para eliminarse físicamente del Storage al guardar.
                  </p>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer py-3.5 bg-gray-50 px-4 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={nuevoProducto.activo}
                  onChange={(e) => manejarCambioInput("activo", e.target.checked)}
                  className="w-5 h-5 rounded text-[#0f3faf] focus:ring-[#0f3faf]"
                />
                <span className="text-sm sm:text-base font-black text-gray-800">
                  Producto Activo y Visible para los clientes
                </span>
              </label>

              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t flex gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={intentarCerrarModal}
                  disabled={procesando}
                  className="w-1/3 bg-gray-100 text-gray-700 font-black py-3.5 rounded-xl hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="w-2/3 bg-[#0f3faf] text-white font-black py-3.5 rounded-xl hover:bg-blue-800 transition-colors text-sm sm:text-base shadow-xl shadow-blue-200 flex justify-center items-center gap-2"
                >
                  {productoEditando ? "Guardar Cambios" : "Publicar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}