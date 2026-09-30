"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useCart } from "../../../context/CartContext";

// Convierte enlaces de YouTube (watch, youtu.be, shorts) y Google Drive a formato reproductor (embed)
const obtenerUrlVideoEmbed = (url) => {
  if (!url) return null;
  const link = url.trim();

  // 1. Si es un enlace de Google Drive
  if (link.includes("drive.google.com")) {
    const matchDrive =
      link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchDrive && matchDrive[1]) {
      return {
        tipo: "drive",
        embedUrl: `https://drive.google.com/file/d/${matchDrive[1]}/preview`,
      };
    }
  }

  // 2. Si es un enlace de YouTube (normal, corto o Shorts)
  const regExpYT =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const matchYT = link.match(regExpYT);
  if (matchYT && matchYT[1]) {
    return {
      tipo: "youtube",
      embedUrl: `https://www.youtube.com/embed/${matchYT[1]}?rel=0`,
    };
  }

  return null;
};

export default function DetalleProducto() {
  const params = useParams();
  const rawId = params?.id ? decodeURIComponent(params.id) : "";

  const { cart, agregarAlCarrito, eliminarDelCarrito } = useCart();

  const [producto, setProducto] = useState(null);
  const [categoriaNombre, setCategoriaNombre] = useState("");
  const [imagenActiva, setImagenActiva] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!rawId) return;

    const cargarProducto = async () => {
      setCargando(true);
      try {
        let dataProd = null;

        // 1. Primero buscamos por SLUG (texto amigable en la URL)
        const { data: porSlug } = await supabase
          .from("productos")
          .select("*")
          .eq("slug", rawId)
          .maybeSingle();

        if (porSlug) {
          dataProd = porSlug;
        } else if (!isNaN(rawId)) {
          // 2. Solo si el parámetro es un número, buscamos por ID numérico
          const { data: porId } = await supabase
            .from("productos")
            .select("*")
            .eq("id", Number(rawId))
            .maybeSingle();
          dataProd = porId;
        }

        if (dataProd) {
          setProducto(dataProd);
          setImagenActiva(0);

          if (dataProd.categoria_id) {
            const { data: cat } = await supabase
              .from("categorias")
              .select("id, nombre, parent_id")
              .eq("id", dataProd.categoria_id)
              .maybeSingle();

            if (cat) {
              if (cat.parent_id) {
                const { data: padre } = await supabase
                  .from("categorias")
                  .select("nombre")
                  .eq("id", cat.parent_id)
                  .maybeSingle();
                setCategoriaNombre(
                  padre ? `${padre.nombre} › ${cat.nombre}` : cat.nombre
                );
              } else {
                setCategoriaNombre(cat.nombre);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar producto:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarProducto();
  }, [rawId]);

  if (cargando) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-bold text-gray-400">
        Cargando producto...
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <span className="text-6xl mb-4">🔍</span>
        <h1 className="text-2xl font-black text-gray-800 mb-2">
          Producto no encontrado
        </h1>
        <p className="text-gray-500 mb-6">
          El producto que buscas no existe o cambió de enlace.
        </p>
        <Link
          href="/catalogo"
          className="bg-[#0f3faf] text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors"
        >
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const itemEnCarrito = (cart || []).find(
    (item) => String(item.id) === String(producto.id)
  );
  const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

  const tieneDescuento =
    producto.precio_anterior &&
    parseFloat(producto.precio_anterior) > parseFloat(producto.precio_actual);
  const porcentajeDescuento = tieneDescuento
    ? Math.round(
        ((producto.precio_anterior - producto.precio_actual) /
          producto.precio_anterior) *
          100
      )
    : 0;

  const imagenes =
    producto.imagenes?.length > 0
      ? producto.imagenes
      : ["https://via.placeholder.com/600?text=Sin+Imagen"];

  const infoVideo = obtenerUrlVideoEmbed(producto.video_youtube);

  const compartirProducto = (red) => {
    const urlActual = typeof window !== "undefined" ? window.location.href : "";
    const texto = `Mira este producto en TECH UNIVERSE: ${producto.titulo}`;
    if (red === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(texto + " " + urlActual)}`,
        "_blank"
      );
    } else if (red === "copiar") {
      navigator.clipboard.writeText(urlActual);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-5 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-5 text-xs sm:text-sm font-bold text-gray-500 flex flex-wrap items-center gap-2">
          <Link href="/catalogo" className="hover:text-[#0f3faf] transition-colors">
            ← Volver al Catálogo
          </Link>
          {categoriaNombre && (
            <span className="text-gray-400">/ {categoriaNombre}</span>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-4 sm:p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Galería de Imágenes y Video */}
          <div>
            <div className="aspect-square max-h-[320px] sm:max-h-[440px] w-full mx-auto bg-white rounded-2xl border overflow-hidden flex items-center justify-center p-3 sm:p-4 mb-3 sm:mb-4 relative">
              {tieneDescuento && imagenActiva !== "video" && (
                <span className="absolute top-3 left-3 z-10 bg-[#e11d48] text-white text-xs font-black px-3 py-1 rounded-lg shadow-xs">
                  -{porcentajeDescuento}% OFF
                </span>
              )}

              {imagenActiva === "video" && infoVideo ? (
                <iframe
                  src={infoVideo.embedUrl}
                  title={`Video de ${producto.titulo}`}
                  className="w-full h-full rounded-xl border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={imagenes[imagenActiva] || imagenes[0]}
                  alt={producto.titulo}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Miniaturas de Fotos + Botón de Video con tamaño fijo en Android (w-16 h-16) y PC (sm:w-20 sm:h-20) */}
            {(imagenes.length > 1 || infoVideo) && (
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2">
                {imagenes.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImagenActiva(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 p-1 bg-white transition-all cursor-pointer ${
                      imagenActiva === idx
                        ? "border-[#0f3faf] shadow-xs"
                        : "border-gray-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}

                {infoVideo && (
                  <button
                    type="button"
                    onClick={() => setImagenActiva("video")}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      imagenActiva === "video"
                        ? "border-[#e11d48] bg-red-50 text-[#e11d48] shadow-xs"
                        : "border-gray-200 bg-gray-900 text-white opacity-85 hover:opacity-100"
                    }`}
                  >
                    <span className="text-lg sm:text-xl leading-none">▶️</span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                      Video
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Información del Producto */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {categoriaNombre && (
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                    {categoriaNombre}
                  </span>
                )}

                {infoVideo && (
                  <button
                    type="button"
                    onClick={() => setImagenActiva("video")}
                    className="text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>🎬</span> Ver video demostrativo
                  </button>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mt-3 mb-3 sm:mb-4">
                {producto.titulo}
              </h1>

              <div className="flex items-baseline gap-3 mb-5 sm:mb-6">
                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#e11d48]">
                  ${parseFloat(producto.precio_actual).toFixed(2)}
                </span>
                {tieneDescuento && (
                  <span className="text-base sm:text-lg font-bold text-gray-400 line-through">
                    ${parseFloat(producto.precio_anterior).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mb-5 sm:mb-6">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    producto.stock_disponible > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {producto.stock_disponible > 0
                    ? `Stock disponible: ${producto.stock_disponible}`
                    : "Agotado"}
                </span>
              </div>

              <div className="prose text-gray-600 text-sm md:text-base whitespace-pre-line mb-6 sm:mb-8 border-t pt-4">
                {producto.descripcion}
              </div>
            </div>

            {/* Controles de Compra y Compartir */}
            <div className="space-y-4 border-t pt-5 sm:pt-6">
              {cantidadEnCarrito > 0 ? (
                <div className="flex items-center justify-between bg-blue-50 border-2 border-[#0f3faf] rounded-2xl p-2">
                  <button
                    type="button"
                    onClick={() => eliminarDelCarrito(producto.id)}
                    className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl font-black text-2xl text-[#0f3faf] shadow-sm hover:bg-gray-100 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="font-black text-base sm:text-lg text-[#0f3faf]">
                    {cantidadEnCarrito} en tu carrito
                  </span>
                  <button
                    type="button"
                    onClick={() => agregarAlCarrito(producto)}
                    disabled={cantidadEnCarrito >= producto.stock_disponible}
                    className="w-11 h-11 sm:w-12 sm:h-12 bg-[#0f3faf] text-white rounded-xl font-black text-2xl shadow-sm hover:bg-blue-800 disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => agregarAlCarrito(producto)}
                  disabled={producto.stock_disponible <= 0}
                  className="w-full bg-[#0f3faf] hover:bg-blue-800 disabled:bg-gray-300 text-white font-black py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg shadow-lg shadow-blue-200 transition-colors cursor-pointer"
                >
                  {producto.stock_disponible > 0
                    ? "🛒 Agregar al Carrito"
                    : "Sin Stock"}
                </button>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => compartirProducto("whatsapp")}
                  className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  📱 Compartir por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => compartirProducto("copiar")}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  🔗 Copiar Enlace
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 🎬 SECCIÓN DEDICADA DE VIDEO DEMOSTRATIVO (YOUTUBE O GOOGLE DRIVE) */}
        {infoVideo && (
          <div className="mt-6 bg-white rounded-3xl shadow-sm border p-5 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-base sm:text-xl text-gray-900 flex items-center gap-2">
                <span>🎬</span> Video Demostrativo del Producto
              </h2>
              <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-[#0f3faf]">
                {infoVideo.tipo === "drive" ? "Google Drive" : "YouTube"}
              </span>
            </div>
            <div className="w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden bg-black shadow-md border">
              <iframe
                src={infoVideo.embedUrl}
                title={`Video demostrativo de ${producto.titulo}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}