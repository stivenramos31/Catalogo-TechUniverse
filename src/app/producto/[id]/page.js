"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase"; 
import Link from "next/link";
import { useCart } from "../../../context/CartContext"; 

export default function DetalleProducto({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id; 

  const { cart, agregarAlCarrito, eliminarDelCarrito } = useCart(); 
  
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [mostrarMenuCompartir, setMostrarMenuCompartir] = useState(false);

  useEffect(() => {
    const cargarProducto = async () => {
      let { data } = await supabase.from("productos").select("*").eq("slug", id).maybeSingle();
      
      if (!data) {
        const { data: dataPorId } = await supabase.from("productos").select("*").eq("id", id).maybeSingle();
        data = dataPorId;
      }
      
      if (data) setProducto(data);
      setCargando(false);
    };
    cargarProducto();
  }, [id]);

  // ⚡ LA CORRECCIÓN: Convertimos ambos IDs a texto para que coincidan siempre
  const productoEnCarrito = cart?.find(item => String(item.id) === String(producto?.id));
  const cantidadActual = productoEnCarrito ? productoEnCarrito.cantidad : 0;

  const urlActual = typeof window !== 'undefined' ? window.location.href : '';
  const mensajeCompartir = `¡Mira este increíble producto en TECH UNIVERSE! ${producto?.titulo}`;

  const copiarEnlace = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(urlActual)
        .then(() => {
          alert("¡Enlace copiado al portapapeles!");
          setMostrarMenuCompartir(false);
        })
        .catch(err => console.error("Error al copiar: ", err));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = urlActual;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        alert("¡Enlace copiado al portapapeles!");
      } catch (error) {
        alert("Tu navegador bloqueó el copiado automático. Por favor, copia la URL manualmente.");
      }
      document.body.removeChild(textArea);
      setMostrarMenuCompartir(false);
    }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center font-bold">Cargando producto...</div>;
  if (!producto) return <div className="min-h-screen flex items-center justify-center">Producto no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 md:p-10 rounded-2xl shadow-sm border">
        
        {/* Galería de Imágenes */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-xl overflow-hidden border p-4 flex items-center justify-center">
            <img 
              src={producto.imagenes?.[imagenActiva] || "https://via.placeholder.com/500?text=Sin+Foto"} 
              alt={producto.titulo} 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
          {producto.imagenes && producto.imagenes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {producto.imagenes.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setImagenActiva(index)} 
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 p-1 bg-white overflow-hidden transition-all ${imagenActiva === index ? 'border-[#2563eb] shadow-md scale-105' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <img src={img} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info del Producto */}
        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2 relative">
            <p className="text-sm text-[#2563eb] font-bold uppercase tracking-wider">{producto.categoria_id}</p>
            
            {/* BOTÓN Y MENÚ COMPARTIR */}
            <div className="relative">
              <button 
                onClick={() => setMostrarMenuCompartir(!mostrarMenuCompartir)} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2 transition-colors" 
                title="Compartir enlace"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              </button>
              
              {mostrarMenuCompartir && (
                <div className="absolute top-10 right-0 bg-white border border-gray-100 shadow-2xl rounded-xl p-2 z-50 flex flex-col min-w-[180px] animate-fade-in">
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeCompartir + ' ' + urlActual)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg text-sm font-bold text-green-600 transition-colors">📱 WhatsApp</a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlActual)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg text-sm font-bold text-blue-600 transition-colors">📘 Facebook</a>
                  <a href={`https://t.me/share/url?url=${encodeURIComponent(urlActual)}&text=${encodeURIComponent(mensajeCompartir)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-sky-50 rounded-lg text-sm font-bold text-sky-500 transition-colors">✈️ Telegram</a>
                  <a href={`mailto:?subject=${encodeURIComponent(producto.titulo)}&body=${encodeURIComponent(mensajeCompartir + '\n\n' + urlActual)}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-700 transition-colors">✉️ Correo</a>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={copiarEnlace} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-700 text-left transition-colors">🔗 Copiar Enlace</button>
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{producto.titulo}</h1>
          
          <div className="flex items-baseline gap-4 mb-6">
             <p className="text-4xl font-black text-[#e11d48]">${producto.precio_actual}</p>
             <p className="text-lg font-medium text-gray-400 line-through">${(producto.precio_actual * 1.17).toFixed(2)}</p>
          </div>

          <p className="text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed">{producto.descripcion}</p>
          
          {/* LÓGICA VISUAL DEL CARRITO MEJORADA */}
          {cantidadActual > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-2 border-[#2563eb] rounded-xl overflow-hidden bg-blue-50/50 shadow-sm">
                <button 
                  onClick={() => eliminarDelCarrito(producto.id)} 
                  className="px-8 py-4 text-[#2563eb] hover:bg-blue-100 font-black text-3xl transition-colors select-none"
                >
                  −
                </button>
                <div className="flex flex-col items-center px-4">
                  <span className="font-black text-xl text-gray-900">{cantidadActual}</span>
                  <span className="text-xs font-bold text-[#2563eb] uppercase tracking-wider">En Carrito</span>
                </div>
                <button 
                  onClick={() => agregarAlCarrito(producto)} 
                  className="px-8 py-4 text-[#2563eb] hover:bg-blue-100 font-black text-3xl transition-colors select-none"
                >
                  +
                </button>
              </div>
              <Link href="/carrito" className="text-center font-bold text-white bg-gray-900 hover:bg-black py-3 rounded-xl transition-colors mt-2 shadow-md">
                Ir a pagar ({cantidadActual} artículos) →
              </Link>
            </div>
          ) : (
            <button 
              onClick={() => agregarAlCarrito(producto)} 
              className="w-full bg-[#2563eb] hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-colors text-lg shadow-md flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Agregar al Carrito
            </button>
          )}

        </div>
      </div>
    </div>
  );
}