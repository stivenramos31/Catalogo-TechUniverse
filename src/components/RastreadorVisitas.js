"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function RastreadorVisitas() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const claveSesion = `visita_registrada_${pathname}`;
    if (sessionStorage.getItem(claveSesion)) return;

    // Candado inmediato para evitar que se duplique la fila al cargar
    sessionStorage.setItem(claveSesion, "true");

    const registrarEntrada = async () => {
      try {
        const ua = navigator.userAgent || "";
        const dispositivo = /Android/i.test(ua)
          ? "Celular Android"
          : /iPhone|iPad/i.test(ua)
          ? "iPhone / iOS"
          : "PC / Laptop";

        const res = await fetch("/api/ubicacion-ip");
        const geo = await res.json();

        await supabase.from("visitas_tienda").insert([
          {
            ip_publica: geo.ip || "No disponible",
            ciudad: geo.ciudad || "Desconocida",
            departamento_region: geo.region || "",
            pais: geo.pais || "El Salvador",
            proveedor_internet: geo.isp || "",
            dispositivo,
            pagina_visitada: pathname,
          },
        ]);
      } catch (e) {
        sessionStorage.removeItem(claveSesion);
      }
    };

    registrarEntrada();
  }, [pathname]);

  return null;
}