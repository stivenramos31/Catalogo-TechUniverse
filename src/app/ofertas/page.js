"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useCart } from "../../context/CartContext";

function RelojCuentaRegresiva({ fechaFin }) {
  const [tiempoRestante, setTiempoRestante] = useState("");

  useEffect(() => {
    if (!fechaFin) return;

    const calcularTiempo = () => {
      const ahora = new Date().getTime();
      const fin = new Date(fechaFin).getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        setTiempoRestante("¡Finalizada!");
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((diferencia / 1000 / 60) % 60);
      const segundos = Math.floor((diferencia / 1000) % 60);

      const h = String(horas).padStart(2, "0");
      const m = String(minutos).padStart(2, "0");
      const s = String(segundos).padStart(2, "0");

      setTiempoRestante(dias > 0 ? `${dias}d • ${h}:${m}:${s}` : `${h}:${m}:${s}`);
    };

    calcularTiempo();
    const intervalo = setInterval(calcularTiempo, 1000);
    return () => clearInterval(intervalo);
  }, [fechaFin]);

  if (!fechaFin || !tiempoRestante) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mb-2 flex items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden">
      <span className="text-[10px] sm:text-xs font-black text-amber-800">
        ⏳ <span className="hidden sm:inline">Termina en:</span>
      </span>
      <span className="font-mono bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] sm:text-xs font-black tracking-wider leading-none">
        {tiempoRestante}
      </span>
    </div>
  );
}

export default function OfertasPage() {
  const { cart, agregarAlCarrito, eliminarDelCarrito } = useCart();

  const [ofertasEspeciales, setOfertasEspeciales] = useState([]);
  const [productosConDescuento, setProductosConDescuento] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarOfertas = async () => {
      setCargando(true);
      try {
        const [{ data: prods }, { data: ofFlash }, { data: cats }] = await Promise.all([
          supabase.from("productos").select("*").eq("activo", true).order("id", { ascending: false }),
          supabase.from("ofertas_flash").select("*").order("id", { ascending: false }),
          supabase.from("categorias").select("*"),
        ]);

        if (cats) setCategorias(cats);

        const listaProductos = prods || [];
        const ahora = new Date();

        // 1. Cruzar ofertas_flash vigentes con su respectivo producto
        const vigentes = (ofFlash || [])
          .filter((of) => {
            if (of.activo === false) return false;
            if (of.fecha_fin && new Date(of.fecha_fin) < ahora) return false;
            return true;
          })
          .map((of) => {
            const prod = listaProductos.find((p) => String(p.id) === String(of.producto_id));
            if (!prod) return null;
            const precioPromo = parseFloat(
              of.precio_promocion ?? of.precio_promocional ?? prod.precio_actual
            );
            const cantidadMinima = Math.max(parseInt(of.stock_promocion) || 1, 1);
            return {
              ...of,
              producto: prod,
              precioPromo,
              cantidadMinima,
            };
          })
          .filter(Boolean);

        setOfertasEspeciales(vigentes);

        // 2. Productos que tienen descuento general en el catálogo
        const idsEnFlash = new Set(vigentes.map((v) => String(v.producto.id)));
        const rebajados = listaProductos.filter(
          (p) =>
            !idsEnFlash.has(String(p.id)) &&
            parseFloat(p.precio_anterior || 0) > parseFloat(p.precio_actual || 0)
        );

        setProductosConDescuento(rebajados);
      } catch (err) {
        console.error("Error al cargar página de ofertas:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarOfertas();
  }, []);

  const obtenerNombreCategoria = (catId) => {
    const cat = categorias.find((c) => Number(c.id) === Number(catId));
    if (!cat) return "Oferta";
    if (cat.parent_id) {
      const padre = categorias.find((p) => Number(p.id) === Number(cat.parent_id));
      return padre ? `${padre.nombre} › ${cat.nombre}` : cat.nombre;
    }
    return cat.nombre;
  };

  const agregarPackPromocion = (prod, cantidadRequerida, cantidadActual) => {
    const faltantes = Math.max(cantidadRequerida - cantidadActual, 1);
    for (let i = 0; i < faltantes; i++) {
      agregarAlCarrito(prod);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Banner Superior Compacto en Android y Amplio en PC */}
        <div className="bg-gradient-to-r from-[#dc2626] via-[#e11d48] to-[#0f3faf] rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-gray-900 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1.5 sm:mb-2.5 shadow-2xs">
              ⚡ Tiempo Limitado
            </span>
            <h1 className="text-lg sm:text-3xl font-black leading-snug">
              🔥 Ofertas Flash y Descuentos
            </h1>
            <p className="text-red-100 text-xs sm:text-sm mt-1 font-medium">
              Precios especiales por unidad o por cantidad. ¡El descuento se aplica solo en tu carrito!
            </p>
          </div>
        </div>

        {cargando ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-4 h-72 animate-pulse border border-gray-100"
              />
            ))}
          </div>
        ) : (
          <>
            {/* SECCIÓN 1: OFERTAS FLASH PROGRAMADAS EN EL ADMIN */}
            <section className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg sm:text-2xl">⚡</span>
                  <h2 className="text-base sm:text-2xl font-black text-gray-900">
                    Ofertas Flash Activas
                  </h2>
                </div>
                <span className="bg-red-100 text-[#dc2626] text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-full">
                  {ofertasEspeciales.length}{" "}
                  {ofertasEspeciales.length === 1 ? "activa" : "activas"}
                </span>
              </div>

              {ofertasEspeciales.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-xs">
                  <p className="text-gray-500 font-bold text-xs sm:text-sm">
                    En este momento no hay Ofertas Flash programadas, pero revisa abajo nuestros productos con descuento directo.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
                  {ofertasEspeciales.map((oferta) => {
                    const prod = oferta.producto;
                    const precioNormal = parseFloat(prod.precio_actual || 0);
                    const precioPromo = oferta.precioPromo;
                    const cantidadMin = oferta.cantidadMinima;
                    const porcentajeAhorro =
                      precioNormal > precioPromo
                        ? Math.round(((precioNormal - precioPromo) / precioNormal) * 100)
                        : 0;

                    const enlaceProducto = `/producto/${prod.slug || prod.id}`;
                    const itemEnCarrito = cart?.find((item) => String(item.id) === String(prod.id));
                    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
                    const stockMax = parseInt(prod.stock_disponible ?? 1);
                    const agotado = stockMax <= 0;
                    const limiteAlcanzado = cantidadEnCarrito >= stockMax;
                    const promoActivaEnCarrito = cantidadEnCarrito >= cantidadMin;

                    return (
                      <div
                        key={oferta.id}
                        className="bg-white rounded-2xl border-2 border-red-200 shadow-xs hover:shadow-md transition-all p-2.5 sm:p-4 flex flex-col justify-between relative group"
                      >
                        {/* Etiquetas superiores compactas sin chocarse en Android */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          {porcentajeAhorro > 0 ? (
                            <span className="bg-[#dc2626] text-white text-[9px] sm:text-xs font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                              ⚡ -{porcentajeAhorro}%
                            </span>
                          ) : (
                            <span />
                          )}

                          {cantidadMin > 1 && (
                            <span className="bg-[#0f3faf] text-white text-[9px] sm:text-xs font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                              Lleva {cantidadMin}+
                            </span>
                          )}
                        </div>

                        <div>
                          <Link
                            href={enlaceProducto}
                            className="block w-full aspect-square bg-white rounded-xl overflow-hidden mb-2 p-1.5 flex items-center justify-center"
                          >
                            <img
                              src={prod.imagenes?.[0] || "/favicon.ico"}
                              alt={prod.titulo}
                              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>

                          {/* Reloj de una sola línea */}
                          <RelojCuentaRegresiva fechaFin={oferta.fecha_fin} />

                          <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-wider truncate">
                            {obtenerNombreCategoria(prod.categoria_id)}
                          </p>

                          <Link href={enlaceProducto}>
                            <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mt-0.5 hover:text-[#0f3faf] transition-colors min-h-[2rem]">
                              {prod.titulo}
                            </h3>
                          </Link>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="mb-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[#dc2626] font-black text-base sm:text-xl">
                                ${precioPromo.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-red-600">c/u</span>
                              <span className="text-gray-400 line-through text-[11px] font-bold ml-1">
                                ${precioNormal.toFixed(2)}
                              </span>
                            </div>

                            {cantidadMin > 1 ? (
                              <p
                                className={`text-[10px] sm:text-[11px] font-black mt-0.5 leading-tight ${
                                  promoActivaEnCarrito ? "text-green-600" : "text-[#0f3faf]"
                                }`}
                              >
                                {promoActivaEnCarrito
                                  ? `✓ ¡$${precioPromo.toFixed(2)} c/u activado!`
                                  : `🔥 Lleva ${cantidadMin}+ a $${precioPromo.toFixed(2)} c/u`}
                              </p>
                            ) : (
                              <p className="text-[10px] sm:text-[11px] font-black text-green-600 mt-0.5">
                                🔥 Oferta desde 1 unidad
                              </p>
                            )}
                          </div>

                          {agotado ? (
                            <button
                              type="button"
                              disabled
                              className="w-full bg-gray-200 text-gray-500 font-black py-2 rounded-xl text-xs cursor-not-allowed"
                            >
                              Agotado
                            </button>
                          ) : cantidadEnCarrito > 0 ? (
                            <div className="space-y-1.5">
                              <div className="w-full bg-[#eef4ff] border border-[#0f3faf] rounded-xl py-1 px-2 flex items-center justify-between shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => eliminarDelCarrito(prod.id)}
                                  className="w-7 h-7 flex items-center justify-center text-[#0f3faf] hover:bg-blue-100 rounded-lg font-black text-base transition-colors cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="font-black text-[#0f3faf] text-xs sm:text-sm select-none">
                                  {cantidadEnCarrito}
                                </span>
                                <button
                                  type="button"
                                  disabled={limiteAlcanzado}
                                  onClick={() => agregarAlCarrito(prod)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-base transition-colors ${
                                    limiteAlcanzado
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "text-[#0f3faf] hover:bg-blue-100 cursor-pointer"
                                  }`}
                                >
                                  +
                                </button>
                              </div>

                              {!promoActivaEnCarrito && stockMax >= cantidadMin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    agregarPackPromocion(prod, cantidadMin, cantidadEnCarrito)
                                  }
                                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer"
                                >
                                  ⚡ Subir a {cantidadMin} (${precioPromo.toFixed(2)} c/u)
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              {cantidadMin > 1 && stockMax >= cantidadMin ? (
                                <button
                                  type="button"
                                  onClick={() => agregarPackPromocion(prod, cantidadMin, 0)}
                                  className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-black py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                                >
                                  <span>⚡</span> Llevar {cantidadMin}x (${(precioPromo * cantidadMin).toFixed(2)})
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => agregarAlCarrito(prod)}
                                  className="w-full bg-[#0f3faf] hover:bg-blue-800 text-white font-black py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                                >
                                  <span>🛒</span> Agregar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECCIÓN 2: OTROS PRODUCTOS REBAJADOS EN EL CATÁLOGO */}
            {productosConDescuento.length > 0 && (
              <section className="space-y-3 sm:space-y-4 pt-2">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg sm:text-2xl">🏷️</span>
                    <h2 className="text-base sm:text-2xl font-black text-gray-900">
                      Más Productos Rebajados
                    </h2>
                  </div>
                  <span className="bg-blue-50 text-[#0f3faf] text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-full">
                    {productosConDescuento.length} disponibles
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
                  {productosConDescuento.map((prod) => {
                    const precioActual = parseFloat(prod.precio_actual || 0);
                    const precioAnterior = parseFloat(prod.precio_anterior || 0);
                    const porcentajeDescuento = Math.round(
                      ((precioAnterior - precioActual) / precioAnterior) * 100
                    );
                    const enlaceProducto = `/producto/${prod.slug || prod.id}`;

                    const itemEnCarrito = cart?.find((item) => String(item.id) === String(prod.id));
                    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
                    const stockMax = parseInt(prod.stock_disponible ?? 1);
                    const agotado = stockMax <= 0;
                    const limiteAlcanzado = cantidadEnCarrito >= stockMax;

                    return (
                      <div
                        key={prod.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all p-2.5 sm:p-4 flex flex-col justify-between relative group"
                      >
                        <div className="mb-1">
                          <span className="inline-block bg-[#e11d48] text-white text-[9px] sm:text-xs font-black px-2 py-0.5 rounded-full shadow-2xs">
                            -{porcentajeDescuento}%
                          </span>
                        </div>

                        <div>
                          <Link
                            href={enlaceProducto}
                            className="block w-full aspect-square bg-white rounded-xl overflow-hidden mb-2 p-1.5 flex items-center justify-center"
                          >
                            <img
                              src={prod.imagenes?.[0] || "/favicon.ico"}
                              alt={prod.titulo}
                              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>

                          <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-wider truncate">
                            {obtenerNombreCategoria(prod.categoria_id)}
                          </p>

                          <Link href={enlaceProducto}>
                            <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mt-0.5 hover:text-[#0f3faf] transition-colors min-h-[2rem]">
                              {prod.titulo}
                            </h3>
                          </Link>
                        </div>

                        <div className="mt-2 pt-2">
                          <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-[#e11d48] font-black text-base sm:text-lg">
                              ${precioActual.toFixed(2)}
                            </span>
                            <span className="text-gray-400 line-through text-[11px] font-bold">
                              ${precioAnterior.toFixed(2)}
                            </span>
                          </div>

                          {agotado ? (
                            <button
                              type="button"
                              disabled
                              className="w-full bg-gray-200 text-gray-500 font-black py-2 rounded-xl text-xs cursor-not-allowed"
                            >
                              Agotado
                            </button>
                          ) : cantidadEnCarrito > 0 ? (
                            <div className="w-full bg-[#eef4ff] border border-[#0f3faf] rounded-xl py-1 px-2 flex items-center justify-between shadow-2xs">
                              <button
                                type="button"
                                onClick={() => eliminarDelCarrito(prod.id)}
                                className="w-7 h-7 flex items-center justify-center text-[#0f3faf] hover:bg-blue-100 rounded-lg font-black text-base transition-colors cursor-pointer"
                              >
                                −
                              </button>
                              <span className="font-black text-[#0f3faf] text-xs sm:text-sm select-none">
                                {cantidadEnCarrito}
                              </span>
                              <button
                                type="button"
                                disabled={limiteAlcanzado}
                                onClick={() => agregarAlCarrito(prod)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-base transition-colors ${
                                  limiteAlcanzado
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-[#0f3faf] hover:bg-blue-100 cursor-pointer"
                                }`}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => agregarAlCarrito(prod)}
                              className="w-full bg-[#0f3faf] hover:bg-blue-800 text-white font-black py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <span>🛒</span> Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}