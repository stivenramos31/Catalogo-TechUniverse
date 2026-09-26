"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function ModuloVisitas() {
  const [visitas, setVisitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const cargarVisitas = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("visitas_tienda")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(150);

    if (!error && data) {
      setVisitas(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarVisitas();
  }, []);

  const limpiarHistorialVisitas = async () => {
    if (window.confirm("¿Seguro que deseas borrar todo el historial de visitas registradas?")) {
      const { error } = await supabase.from("visitas_tienda").delete().neq("id", 0);
      if (error) alert("Error al limpiar: " + error.message);
      else cargarVisitas();
    }
  };

  const visitasFiltradas = visitas.filter((v) => {
    const texto = `${v.ip_publica} ${v.ciudad} ${v.departamento_region} ${v.pais} ${v.dispositivo} ${v.pagina_visitada}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // Resumen rápido de estadísticas
  const ipsUnicas = new Set(visitas.map((v) => v.ip_publica)).size;
  const visitasMovil = visitas.filter((v) =>
    (v.dispositivo || "").toLowerCase().includes("android") ||
    (v.dispositivo || "").toLowerCase().includes("iphone")
  ).length;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border animate-fade-in space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-black text-xl sm:text-2xl text-gray-800">
            🌐 Monitor de Visitas y Ubicación por IP
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Registro automático de personas que entran a ver tu catálogo online.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={cargarVisitas}
            className="bg-[#0f3faf] hover:bg-blue-800 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            🔄 Actualizar
          </button>
          {visitas.length > 0 && (
            <button
              onClick={limpiarHistorialVisitas}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              🗑️ Limpiar Historial
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl">
          <p className="text-xs font-black text-blue-800 uppercase">Visitas Recientes</p>
          <p className="text-2xl font-black text-[#0f3faf] mt-1">{visitas.length}</p>
        </div>
        <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl">
          <p className="text-xs font-black text-purple-800 uppercase">Personas / IPs Únicas</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{ipsUnicas}</p>
        </div>
        <div className="bg-green-50/70 border border-green-200 p-4 rounded-2xl">
          <p className="text-xs font-black text-green-800 uppercase">Desde Celular (Android / iOS)</p>
          <p className="text-2xl font-black text-green-700 mt-1">{visitasMovil}</p>
        </div>
      </div>

      {/* Buscador */}
      <div>
        <input
          type="text"
          placeholder="🔍 Buscar por ciudad, IP, dispositivo o página vista..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#0f3faf]"
        />
      </div>

      {cargando ? (
        <div className="py-16 text-center text-gray-400 font-bold">
          Cargando registro de visitantes...
        </div>
      ) : visitasFiltradas.length === 0 ? (
        <div className="py-16 text-center text-gray-400 font-bold border rounded-2xl bg-gray-50">
          Aún no hay visitas registradas con ese criterio.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="p-3.5 font-black text-gray-600">Fecha y Hora</th>
                <th className="p-3.5 font-black text-gray-600">Ubicación Detectada</th>
                <th className="p-3.5 font-black text-gray-600">IP Pública / Red</th>
                <th className="p-3.5 font-black text-gray-600">Dispositivo</th>
                <th className="p-3.5 font-black text-gray-600">Página Vista</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visitasFiltradas.map((v) => (
                <tr key={v.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-3.5 font-bold text-gray-700 whitespace-nowrap">
                    {new Date(v.fecha).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className="font-black text-gray-900 block">
                      📍 {v.ciudad || "Desconocida"}
                      {v.departamento_region ? `, ${v.departamento_region}` : ""}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">
                      {v.pais || "El Salvador"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md inline-block">
                      {v.ip_publica || "Oculta"}
                    </span>
                    {v.proveedor_internet && (
                      <span className="block text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[180px]">
                        {v.proveedor_internet}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-bold text-gray-700">
                    {v.dispositivo?.includes("Android") && "📱 "}
                    {v.dispositivo?.includes("iPhone") && "🍏 "}
                    {v.dispositivo?.includes("PC") && "💻 "}
                    {v.dispositivo || "Navegador Web"}
                  </td>
                  <td className="p-3.5">
                    <span className="bg-gray-100 text-[#0f3faf] font-black px-2.5 py-1 rounded-lg text-xs">
                      {v.pagina_visitada || "/catalogo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}