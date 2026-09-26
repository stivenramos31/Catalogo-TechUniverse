"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Footer() {
  const pathname = usePathname();

  const [config, setConfig] = useState({
    whatsapp_ventas: "50370000000",
    telefono_visible: "+503 7600-0000",
    correo_contacto: "contacto@techuniverse.com",
    direccion_tienda: "San Miguel, El Salvador",
    horario_atencion: "Lun - Sáb: 8:00 AM - 6:00 PM",
  });

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const cargarConfiguracion = async () => {
      const { data: conf } = await supabase
        .from("configuracion_tienda")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (conf) {
        setConfig({
          whatsapp_ventas: conf.whatsapp_ventas || "50370000000",
          telefono_visible: conf.telefono_visible || "+503 7600-0000",
          correo_contacto: conf.correo_contacto || "contacto@techuniverse.com",
          direccion_tienda: conf.direccion_tienda || "San Miguel, El Salvador",
          horario_atencion: conf.horario_atencion || "Lun - Sáb: 8:00 AM - 6:00 PM",
        });
      }
    };

    cargarConfiguracion();
  }, [pathname]);

  // Ocultar automáticamente en el panel /admin
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const numeroWhatsAppLimpio = config.whatsapp_ventas.replace(/\D/g, "");
  const enlaceWhatsAppDirecto = `https://wa.me/${numeroWhatsAppLimpio}?text=${encodeURIComponent(
    "¡Hola TECH UNIVERSE! 👋 Vi su catálogo online y tengo una consulta."
  )}`;

  return (
    <footer className="bg-[#081d54] text-white mt-auto border-t-2 border-[#0f3faf]">
      {/* 1. FRANJA DE CONFIANZA COMPACTA (En 1 sola fila tanto en Android como en PC) */}
      <div className="bg-[#0f3faf] border-b border-blue-800 py-3 px-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-blue-900/45 border border-blue-700/50 rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
            <span className="text-lg sm:text-2xl leading-none">🛡️</span>
            <div>
              <p className="font-black text-[11px] sm:text-sm text-white leading-tight">
                Compra Segura
              </p>
              <p className="text-[9px] sm:text-xs text-blue-200 leading-tight mt-0.5">
                Sin pedir tarjetas
              </p>
            </div>
          </div>

          <div className="bg-blue-900/45 border border-blue-700/50 rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
            <span className="text-lg sm:text-2xl leading-none">🚚</span>
            <div>
              <p className="font-black text-[11px] sm:text-sm text-white leading-tight">
                Envíos a Todo el País
              </p>
              <p className="text-[9px] sm:text-xs text-blue-200 leading-tight mt-0.5">
                14 Departamentos 🇸🇻
              </p>
            </div>
          </div>

          <div className="bg-blue-900/45 border border-blue-700/50 rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
            <span className="text-lg sm:text-2xl leading-none">📲</span>
            <div>
              <p className="font-black text-[11px] sm:text-sm text-white leading-tight">
                Trato Directo
              </p>
              <p className="text-[9px] sm:text-xs text-blue-200 leading-tight mt-0.5">
                Vía WhatsApp oficial
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CUERPO COMPACTO DEL FOOTER */}
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Bloque Izquierdo: Marca + Botón WhatsApp (4 columnas en PC) */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col justify-between items-start sm:items-center lg:items-start gap-3 pb-4 lg:pb-0 border-b lg:border-b-0 border-blue-900/80">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-black text-lg sm:text-xl tracking-wide text-white">
              <span>💻🛠️</span>
              <span>TECH UNIVERSE</span>
            </Link>
            <p className="text-xs text-blue-200 mt-1 max-w-xs leading-relaxed">
              Herramientas, diagnóstico electrónico, redes y accesorios con envíos a todo El Salvador.
            </p>
          </div>

          <a
            href={enlaceWhatsAppDirecto}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-green-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 flex-shrink-0"
          >
            <span>💬</span> Atención por WhatsApp
          </a>
        </div>

        {/* Bloque Central: 2 Columnas Lado a Lado en Android (Navegación + Contacto) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4 text-xs">
          {/* Columna A: Accesos */}
          <div>
            <h3 className="font-black text-[11px] uppercase tracking-wider text-blue-300 mb-2">
              Tienda
            </h3>
            <ul className="space-y-1.5 font-bold text-blue-100">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  › Inicio
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="hover:text-white transition-colors">
                  › Catálogo
                </Link>
              </li>
              <li>
                <Link href="/ofertas" className="hover:text-white transition-colors text-amber-300">
                  🔥 Ofertas Flash
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="hover:text-white transition-colors">
                  🛒 Mi Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna B: Contacto Oficial */}
          <div>
            <h3 className="font-black text-[11px] uppercase tracking-wider text-blue-300 mb-2">
              Contacto
            </h3>
            <ul className="space-y-1.5 text-blue-100">
              <li className="flex items-start gap-1.5">
                <span>📍</span>
                <span className="font-bold leading-tight">{config.direccion_tienda}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>📞</span>
                <a
                  href={enlaceWhatsAppDirecto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-green-400 hover:underline"
                >
                  {config.telefono_visible}
                </a>
              </li>
              <li className="flex items-start gap-1.5 text-[11px] text-blue-200">
                <span>🕒</span>
                <span className="leading-tight">{config.horario_atencion}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bloque Derecho: Mapa de Cobertura El Salvador (4 columnas en PC) */}
        <div className="lg:col-span-4 bg-blue-950/70 border border-blue-800/80 p-2.5 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-black text-white flex items-center gap-1.5">
              <span>🇸🇻</span> Cobertura Nacional: El Salvador
            </span>
            <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
              Envíos Activos
            </span>
          </div>
          <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-blue-800 relative bg-blue-900">
            <iframe
              title="Mapa Cobertura El Salvador - Tech Universe"
              src="https://www.google.com/maps?q=El+Salvador&z=8&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

      </div>

      {/* 3. BARRA INFERIOR ULTRA COMPACTA */}
      <div className="bg-[#051338] py-2.5 px-4 text-center text-[10px] sm:text-xs text-blue-300 border-t border-blue-900/50">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <p className="mx-auto sm:mx-0">
            © {new Date().getFullYear()} <strong>TECH UNIVERSE</strong> • El Salvador.
          </p>
          <p className="mx-auto sm:mx-0 text-blue-400 font-semibold">
            Precios en USD ($) • Cotización Oficial Segura
          </p>
        </div>
      </div>
    </footer>
  );
}