"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";
import Fuse from "fuse.js";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart } = useCart();
  
  const [config, setConfig] = useState({ logo_url: "", whatsapp_ventas: "50370000000" });
  
  // Estados para Búsqueda en Tiempo Real
  const [productos, setProductos] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const buscadorRef = useRef(null);
  const buscadorMovilRef = useRef(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const cargarDatosHeader = async () => {
      // 1. Configuración de Tienda
      const { data: conf } = await supabase.from("configuracion_tienda").select("logo_url, whatsapp_ventas").eq("id", 1).maybeSingle();
      if (conf) setConfig({ logo_url: conf.logo_url || "", whatsapp_ventas: conf.whatsapp_ventas || "50370000000" });

      // 2. Mini-Catálogo para Búsqueda en Vivo (Rápido y ligero)
      const { data: prods } = await supabase.from("productos").select("id, slug, titulo, precio_actual, imagenes").eq("activo", true);
      if (prods) setProductos(prods);
    };

    cargarDatosHeader();

    // Actualización de Logo en vivo
    const canalConfigHeader = supabase.channel('cambios-config-header')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracion_tienda', filter: 'id=eq.1' }, (payload) => {
          const confNueva = payload.new;
          setConfig(prev => ({ ...prev, logo_url: confNueva.logo_url !== undefined ? confNueva.logo_url : prev.logo_url, whatsapp_ventas: confNueva.whatsapp_ventas || "50370000000" }));
      }).subscribe();

    return () => supabase.removeChannel(canalConfigHeader);
  }, [pathname]);

  // Cierra el cuadro de búsqueda si hacemos clic afuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target) && buscadorMovilRef.current && !buscadorMovilRef.current.contains(e.target)) {
        setMostrarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  // Limpia el buscador al cambiar de página
  useEffect(() => {
    setMostrarDropdown(false);
    setTerminoBusqueda("");
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  // Lógica Matemática de Fuse.js para el Header (Tiempo Real)
  const resultadosBuscador = useMemo(() => {
    if (!terminoBusqueda || terminoBusqueda.trim() === "") return [];
    
    const fuse = new Fuse(productos, {
      keys: ['titulo'],
      threshold: 0.15, // Estricto para no mostrar basura
      ignoreLocation: true
    });
    
    // Devolvemos solo los mejores 5 para no saturar la pantalla
    return fuse.search(terminoBusqueda).slice(0, 5).map(res => res.item); 
  }, [terminoBusqueda, productos]);

  const manejarEnvioBusqueda = (e) => {
    e.preventDefault();
    if (terminoBusqueda.trim() !== "") {
      router.push(`/catalogo?q=${encodeURIComponent(terminoBusqueda.trim())}`);
      setMostrarDropdown(false);
    }
  };

  const numeroWhatsAppLimpio = config.whatsapp_ventas.replace(/\D/g, "");
  const enlaceWhatsAppDirecto = `https://wa.me/${numeroWhatsAppLimpio}?text=${encodeURIComponent("¡Hola TECH UNIVERSE! 👋 Necesito ayuda con mi compra.")}`;
  const totalItemsCarrito = cart?.reduce((total, item) => total + item.cantidad, 0) || 0;

  // Componente Reutilizable: Cuadro de Resultados Desplegable
  const DropdownResultados = () => {
    if (!mostrarDropdown || terminoBusqueda.trim() === "") return null;
    
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden z-50 animate-fade-in text-gray-800">
        {resultadosBuscador.length === 0 ? (
          <div className="p-4 text-center text-sm font-bold text-gray-400">
            No encontramos "{terminoBusqueda}"
          </div>
        ) : (
          <div>
            {resultadosBuscador.map((prod) => (
              <Link 
                key={prod.id} 
                href={`/producto/${prod.slug || prod.id}`}
                className="flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-blue-50 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 p-1">
                   <img src={prod.imagenes?.[0] || "/favicon.ico"} alt={prod.titulo} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">{prod.titulo}</p>
                  <p className="text-[11px] font-bold text-emerald-600">${parseFloat(prod.precio_actual || 0).toFixed(2)}</p>
                </div>
              </Link>
            ))}
            <button 
              type="button"
              onClick={manejarEnvioBusqueda}
              className="w-full p-3 bg-gray-50 text-[#0f3faf] text-xs font-black hover:bg-gray-100 transition-colors flex justify-center items-center gap-1"
            >
              Ver todos los resultados <span>→</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="bg-[#0f3faf] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2 sm:gap-4">
          
          {/* LOGO Y NOMBRE */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              {config.logo_url ? (
                <>
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <Image 
                      src={config.logo_url} 
                      alt="Icono TECH UNIVERSE" 
                      fill 
                      className="object-contain" 
                      sizes="(max-width: 768px) 32px, 40px" 
                    />
                  </div>
                  <span className="font-black text-lg sm:text-xl tracking-tight text-white whitespace-nowrap">
                    TECH UNIVERSE
                  </span>
                </>
              ) : (
                <span className="font-black text-lg sm:text-xl tracking-tight flex items-center gap-1 whitespace-nowrap text-white">
                  <span>💻🛠️</span> TECH UNIVERSE
                </span>
              )}
            </Link>
          </div>

          {/* NAVEGACIÓN PC */}
          <nav className="hidden xl:flex space-x-6 shrink-0">
            <Link href="/" className="text-white hover:text-blue-200 font-bold transition-colors">Inicio</Link>
            <Link href="/catalogo" className="text-white hover:text-blue-200 font-bold transition-colors">Catálogo</Link>
            <Link href="/ofertas" className="text-amber-300 hover:text-amber-100 font-black transition-colors flex items-center gap-1">
              <span>🔥</span> Ofertas Flash
            </Link>
          </nav>

          {/* 🔍 BARRA DE BÚSQUEDA CENTRAL (PC) CON DROPDOWN */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 relative" ref={buscadorRef}>
            <form onSubmit={manejarEnvioBusqueda} className="w-full relative">
              <input
                type="text"
                value={terminoBusqueda}
                onChange={(e) => { setTerminoBusqueda(e.target.value); setMostrarDropdown(true); }}
                onFocus={() => setMostrarDropdown(true)}
                placeholder="Buscar productos en tiempo real..."
                className="w-full bg-white text-gray-900 rounded-full pl-5 pr-10 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-400/50 shadow-inner transition-all"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f3faf] transition-colors text-lg">
                🔍
              </button>
            </form>
            <DropdownResultados />
          </div>

          {/* ACCIONES DERECHA (WhatsApp y Carrito) - PC */}
          <div className="hidden md:flex items-center space-x-4 shrink-0">
            <a href={enlaceWhatsAppDirecto} target="_blank" rel="noopener noreferrer" className="text-sm font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              💬 Ayuda
            </a>
            <Link href="/carrito" className="relative p-2 hover:bg-blue-800 rounded-full transition-colors">
              <span className="text-2xl">🛒</span>
              {totalItemsCarrito > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0f3faf]">{totalItemsCarrito}</span>
              )}
            </Link>
          </div>

          {/* 📱 ACCIONES MÓVIL: BOTÓN AYUDA Y CARRITO (Sin hamburguesa) */}
          <div className="flex items-center md:hidden gap-3 shrink-0">
            <a 
              href={enlaceWhatsAppDirecto}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black bg-[#25D366] hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
            >
              <span className="text-sm">💬</span> Ayuda
            </a>
            
            <Link href="/carrito" className="relative p-1">
              <span className="text-2xl">🛒</span>
              {totalItemsCarrito > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItemsCarrito}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA MÓVIL CON DROPDOWN */}
      <div className="md:hidden px-4 pb-3 bg-[#0f3faf] relative" ref={buscadorMovilRef}>
        <form onSubmit={manejarEnvioBusqueda} className="relative w-full">
          <input
            type="text"
            value={terminoBusqueda}
            onChange={(e) => { setTerminoBusqueda(e.target.value); setMostrarDropdown(true); }}
            onFocus={() => setMostrarDropdown(true)}
            placeholder="Buscar productos..."
            className="w-full bg-white text-gray-900 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold outline-none shadow-inner focus:ring-2 focus:ring-blue-300"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#0f3faf] transition-colors text-lg">
            🔍
          </button>
        </form>
        <DropdownResultados />
      </div>
    </header>
  );
}