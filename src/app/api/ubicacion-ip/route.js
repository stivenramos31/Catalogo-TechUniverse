import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const rawIp = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "";
    const ipLimpia = rawIp.replace(/^::ffff:/, "");

    // Detectar si es una IP interna de red local (localhost / 192.168.x.x / 10.x.x.x)
    const esIpLocal =
      !ipLimpia ||
      ipLimpia === "::1" ||
      ipLimpia.startsWith("127.") ||
      ipLimpia.startsWith("192.168.") ||
      ipLimpia.startsWith("10.") ||
      ipLimpia.startsWith("172.");

    const vercelCity = request.headers.get("x-vercel-ip-city");
    const vercelRegion = request.headers.get("x-vercel-ip-country-region");
    const vercelCountry = request.headers.get("x-vercel-ip-country");

    // Si estamos en localhost, consulta sin la IP local para obtener la IP pública real de tu internet
    const urlConsulta = esIpLocal
      ? `https://ipwho.is/?lang=es`
      : `https://ipwho.is/${ipLimpia}?lang=es`;

    const res = await fetch(urlConsulta, { cache: "no-store" });
    const data = await res.json();

    const ipFinal = data?.ip || ipLimpia || "Desconocida";
    const ciudad = data?.city || (vercelCity ? decodeURIComponent(vercelCity) : "Desconocida");
    const region = data?.region || vercelRegion || "";
    const pais = data?.country || vercelCountry || "El Salvador";
    const isp = data?.connection?.isp || data?.connection?.org || "Red móvil/residencial";

    return NextResponse.json({
      ip: ipFinal,
      ciudad,
      region,
      pais,
      isp,
      resumen: `${ciudad}${region ? `, ${region}` : ""} (${pais})`,
    });
  } catch (error) {
    return NextResponse.json({
      ip: "No disponible",
      ciudad: "Desconocida",
      region: "",
      pais: "El Salvador",
      isp: "",
      resumen: "Ubicación no detectada",
    });
  }
}