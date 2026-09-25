"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useCart } from "../../../context/CartContext";

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
          if (dataProd.categoria_id) {
            const { data: cat } = await supabase
              .from("categorias")
              .select("nombre")
              .eq("id", dataProd.categoria_id)
              .maybeSingle();
            if (cat) setCategoriaNombre(cat.nombre);
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
        <h1 className="text-2xl font-black text-gray-800 mb-2">Producto no encontrado</h1>
        <p className="text-gray-500 mb-6">El producto que buscas no existe o cambió de enlace.</p>
        <Link href="/catalogo" className="bg-[#0f3faf] text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors">
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const itemEnCarrito = (cart || []).find(item => String(item.id) === String(producto.id));
  const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

  const tieneDescuento = producto.precio_anterior && parseFloat(producto.precio_anterior) > parseFloat(producto.precio_actual);
  const porcentajeDescuento = tieneDescuento
    ? Math.round(((producto.precio_anterior - producto.precio_actual) / producto.precio_anterior) * 100)
    : 0;

  const imagenes = producto.imagenes?.length > 0 
    ? producto.imagenes 
    : ["https://via.placeholder.com/600?text=Sin+Imagen"];

  const compartirProducto = (red) => {
    const urlActual = typeof window !== "undefined" ? window.location.href : "";
    const texto = `Mira este producto: ${producto.titulo}`;
    if (red === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto + " " + urlActual)}`, "_blank");
    } else if (red === "copiar") {
      navigator.clipboard.writeText(urlActual);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-sm font-bold text-gray-500 flex items-center gap-2">
          <Link href="/catalogo" className="hover:text-[#0f3faf]">← Volver al Catálogo</Link>
          {categoriaNombre && <span>/ {categoriaNombre}</span>}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Galería de Imágenes */}
          <div>
            <div className="aspect-square bg-white rounded-2xl border overflow-hidden flex items-center justify-center p-4 mb-4 relative">
              {tieneDescuento && (
                <span className="absolute top-4 left-4 bg-[#e11d48] text-white text-xs font-black px-3 py-1 rounded-lg">
                  -{porcentajeDescuento}% OFF
                </span>
              )}
              <img
                src={imagenes[imagenActiva]}
                alt={producto.titulo}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {imagenes.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imagenes.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImagenActiva(idx)}
                    className={`w-20 h-20 rounded-xl border-2 overflow-hidden flex-shrink-0 p-1 ${
                      imagenActiva === idx ? "border-[#0f3faf]" : "border-gray-200 opacity-60"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del Producto */}
          <div className="flex flex-col justify-between">
            <div>
              {categoriaNombre && (
                <span className="text-xs font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                  {categoriaNombre}
                </span>
              )}

              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-3 mb-4">
                {producto.titulo}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl md:text-4xl font-black text-[#e11d48]">
                  ${parseFloat(producto.precio_actual).toFixed(2)}
                </span>
                {tieneDescuento && (
                  <span className="text-lg font-bold text-gray-400 line-through">
                    ${parseFloat(producto.precio_anterior).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                  producto.stock_disponible > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                }`}>
                  {producto.stock_disponible > 0 ? `Stock disponible: ${producto.stock_disponible}` : "Agotado"}
                </span>
              </div>

              <div className="prose text-gray-600 text-sm md:text-base whitespace-pre-line mb-8 border-t pt-4">
                {producto.descripcion}
              </div>
            </div>

            {/* Controles de Compra y Compartir */}
            <div className="space-y-4 border-t pt-6">
              {cantidadEnCarrito > 0 ? (
                <div className="flex items-center justify-between bg-blue-50 border-2 border-[#0f3faf] rounded-2xl p-2">
                  <button
                    onClick={() => eliminarDelCarrito(producto.id)}
                    className="w-12 h-12 bg-white rounded-xl font-black text-2xl text-[#0f3faf] shadow-sm hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="font-black text-lg text-[#0f3faf]">
                    {cantidadEnCarrito} en tu carrito
                  </span>
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    disabled={cantidadEnCarrito >= producto.stock_disponible}
                    className="w-12 h-12 bg-[#0f3faf] text-white rounded-xl font-black text-2xl shadow-sm hover:bg-blue-800 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => agregarAlCarrito(producto)}
                  disabled={producto.stock_disponible <= 0}
                  className="w-full bg-[#0f3faf] hover:bg-blue-800 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl text-lg shadow-lg shadow-blue-200 transition-colors"
                >
                  {producto.stock_disponible > 0 ? "🛒 Agregar al Carrito" : "Sin Stock"}
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => compartirProducto("whatsapp")}
                  className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  📱 Compartir por WhatsApp
                </button>
                <button
                  onClick={() => compartirProducto("copiar")}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  🔗 Copiar Enlace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}