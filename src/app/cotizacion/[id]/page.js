"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { useCart } from "../../../context/CartContext";

export default function VerCotizacionPublica() {
  const params = useParams();
  const router = useRouter();
  const token = params?.id ? decodeURIComponent(params.id) : "";

  const { vaciarCarrito, agregarAlCarrito } = useCart();
  const [cotizacion, setCotizacion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!token) return;
    const cargar = async () => {
      setCargando(true);
      const { data, error } = await supabase.rpc("obtener_cotizacion_publica", {
        p_token: token,
      });
      if (!error && data?.encontrado) {
        setCotizacion(data);
      }
      setCargando(false);
    };
    cargar();
  }, [token]);

  // Carga los productos al carrito para crear una cotización nueva sin alterar la actual
  const clonarAlCarritoParaModificar = () => {
    if (!cotizacion?.items) return;
    if (
      window.confirm(
        `Los productos de la Cotización #${cotizacion.numero_folio} se cargarán en tu carrito para que agregues o quites artículos y generes una nueva cotización. ¿Continuar?`
      )
    ) {
      vaciarCarrito();
      cotizacion.items.forEach((item) => {
        for (let i = 0; i < item.cantidad; i++) {
          agregarAlCarrito({
            id: item.producto_id,
            titulo: item.titulo,
            precio_actual: item.precio_unitario,
            imagenes: item.imagen ? [item.imagen] : [],
            stock_disponible: item.stock_disponible || 99,
          });
        }
      });
      router.push("/carrito");
    }
  };

  if (cargando) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center font-black text-gray-400">
        Verificando comprobante oficial...
      </div>
    );
  }

  if (!cotizacion) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <span className="text-5xl mb-3">🔒</span>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Comprobante privado o no encontrado</h1>
        <p className="text-sm text-gray-500 mb-6">
          Por seguridad, las cotizaciones solo pueden abrirse desde su enlace único oficial.
        </p>
        <Link href="/catalogo" className="bg-[#0f3faf] text-white font-bold px-6 py-3 rounded-xl">
          Ir al Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-3 sm:px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-[#0f3faf] text-white p-6 text-center relative">
          <span className="bg-white/20 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase">
            Estado: {cotizacion.estado || "Pendiente"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-3">
            Cotización #{cotizacion.numero_folio}
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Documento oficial verificado • Precios protegidos
          </p>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          <div className="bg-gray-50 p-4 rounded-2xl border text-xs sm:text-sm space-y-1">
            <p><strong>Cliente:</strong> {cotizacion.nombre_cliente}</p>
            {cotizacion.departamento && (
              <p>
                <strong>Ubicación de entrega:</strong> {cotizacion.departamento}, {cotizacion.distrito}{" "}
                {cotizacion.direccion_referencia ? `— ${cotizacion.direccion_referencia}` : ""}
              </p>
            )}
          </div>

          <div className="divide-y border-t border-b">
            {cotizacion.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imagen || "/favicon.ico"}
                    alt=""
                    className="w-12 h-12 rounded-lg border object-contain p-1 bg-white flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">{item.titulo}</p>
                    <p className="text-xs text-gray-500 font-bold">
                      {item.cantidad} x ${parseFloat(item.precio_unitario).toFixed(2)}
                    </p>
                  </div>
                </div>
                <span className="font-black text-gray-900 text-sm">
                  ${(item.cantidad * item.precio_unitario).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-500 font-bold">
              <span>Subtotal:</span>
              <span>${parseFloat(cotizacion.subtotal || cotizacion.total_estimado).toFixed(2)}</span>
            </div>
            {parseFloat(cotizacion.descuento_aplicado || 0) > 0 && (
              <div className="flex justify-between text-[#e11d48] font-black">
                <span>Cupón ({cotizacion.codigo_cupon}):</span>
                <span>-${parseFloat(cotizacion.descuento_aplicado).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t">
              <span className="font-black text-gray-900 uppercase">Total Oficial:</span>
              <span className="text-2xl font-black text-green-600">
                ${parseFloat(cotizacion.total_estimado).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 font-medium">
            🔒 <strong>Seguridad de precios:</strong> Esta cotización (#{cotizacion.numero_folio}) es un comprobante fijo y no puede alterarse. Si deseas agregar o quitar productos, usa el botón de abajo para generar una cotización nueva.
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={clonarAlCarritoParaModificar}
              className="flex-1 bg-[#0f3faf] hover:bg-blue-800 text-white font-black py-3 px-4 rounded-xl text-xs transition-colors"
            >
              🔄 Modificar pedido (Crear nueva cotización)
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black py-3 px-4 rounded-xl text-xs"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}