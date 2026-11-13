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

    // 1. CARGA INICIAL DE DATOS
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

    // 2. ⚡ CONEXIÓN EN TIEMPO REAL CON EL MÓDULO PERFIL ⚡
    const canalConfig = supabase
      .channel('cambios-config-footer')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'configuracion_tienda', filter: 'id=eq.1' },
        (payload) => {
          const confNueva = payload.new;
          setConfig({
            whatsapp_ventas: confNueva.whatsapp_ventas || "50370000000",
            telefono_visible: confNueva.telefono_visible || "+503 7600-0000",
            correo_contacto: confNueva.correo_contacto || "contacto@techuniverse.com",
            direccion_tienda: confNueva.direccion_tienda || "San Miguel, El Salvador",
            horario_atencion: confNueva.horario_atencion || "Lun - Sáb: 8:00 AM - 6:00 PM",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalConfig);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const numeroWhatsAppLimpio = config.whatsapp_ventas.replace(/\D/g, "");
  // CORRECCIÓN: Faltaba el '/' y el '$' en la variable
  const enlaceWhatsAppDirecto = `https://wa.me/${numeroWhatsAppLimpio}?text=${encodeURIComponent(
    "¡Hola TECH UNIVERSE! 👋 Vi su catálogo online y tengo una consulta."
  )}`;

  return (
    <footer className="bg-[#081d54] text-white mt-auto border-t-2 border-[#0f3faf]">
      {/* 1. FRANJA DE CONFIANZA COMPACTA */}
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
        
        {/* Bloque Izquierdo: Marca + Botón WhatsApp */}
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

        {/* Bloque Central: Navegación + Contacto */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4 text-xs">
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

        {/* Bloque Derecho: Mapa de San Miguel, El Salvador */}
        <div className="lg:col-span-4 bg-blue-950/70 border border-blue-800/80 p-2.5 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-black text-white flex items-center gap-1.5">
              <span>🇸🇻</span> Cobertura: San Miguel y El Salvador
            </span>
            <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
              Envíos Activos
            </span>
          </div>
          <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden border border-blue-800 relative bg-blue-900">
            <iframe
              title="Ubicación TECH UNIVERSE San Miguel"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62078.83158384085!2d-88.21028926881367!3d13.478597411831261!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f7b2a70bc830dab%3A0x76ac9c406eec5592!2sSan%20Miguel!5e0!3m2!1ses-419!2ssv!4v1794511333946!5m2!1ses-419!2ssv"
              className="w-full h-full border-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>

      </div>

      {/* 3. BARRA INFERIOR DE COPYRIGHT */}
      <div className="bg-[#05133b] border-t border-blue-900/60 py-3 px-4 sm:px-6 text-[11px] text-blue-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            © {new Date().getFullYear()} <strong className="text-white">TECH UNIVERSE</strong> • El Salvador.
          </p>
          <p className="text-blue-200/80">
            Precios en USD ($) • Cotización Oficial Segura
          </p>
        </div>
      </div>
    </footer>
  );
}