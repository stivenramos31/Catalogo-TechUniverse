"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image"; // IMPORTANTE: Agregamos next/image para rendimiento
import { useSearchParams } from "next/navigation";
import { useCart } from "../../context/CartContext";

// Recibimos los productos y categorías ya cargados desde el Servidor
function ContenidoCatalogoClient({ productosIniciales, categoriasIniciales }) {
  const searchParams = useSearchParams();
  const busquedaUrl = searchParams.get("q") || "";
  const categoriaUrl = searchParams.get("categoria") || "";

  const { cart, agregarAlCarrito, eliminarDelCarrito } = useCart();

  // Ya no usamos useEffect para cargar, usamos los props iniciales
  const [productos] = useState(productosIniciales || []);
  const [categorias] = useState(categoriasIniciales || []);

  const [busqueda, setBusqueda] = useState(busquedaUrl);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [ordenarPor, setOrdenarPor] = useState("recientes");
  const [drawerCategoriasAbierto, setDrawerCategoriasAbierto] = useState(false);

  useEffect(() => {
    setBusqueda(busquedaUrl);
  }, [busquedaUrl]);

  useEffect(() => {
    if (categorias.length > 0 && categoriaUrl) {
      const catEncontrada = categorias.find(
        (c) =>
          String(c.id) === String(categoriaUrl) ||
          c.nombre?.toLowerCase() === categoriaUrl.toLowerCase()
      );
      if (catEncontrada) {
        if (catEncontrada.parent_id) {
          setCategoriasSeleccionadas([Number(catEncontrada.parent_id), Number(catEncontrada.id)]);
        } else {
          setCategoriasSeleccionadas([Number(catEncontrada.id)]);
        }
      }
    }
  }, [categoriaUrl, categorias]);

  const categoriasPrincipales = categorias.filter((c) => !c.parent_id);
  const obtenerSubcategorias = (parentId) =>
    categorias.filter((c) => Number(c.parent_id) === Number(parentId));

  const alternarCategoriaPrincipal = (idPadre) => {
    const numIdPadre = Number(idPadre);
    const idsHijas = obtenerSubcategorias(numIdPadre).map((sub) => Number(sub.id));

    setCategoriasSeleccionadas((prev) => {
      const estaActiva = prev.includes(numIdPadre);
      if (estaActiva) {
        return prev.filter((id) => Number(id) !== numIdPadre && !idsHijas.includes(Number(id)));
      } else {
        return [...prev, numIdPadre];
      }
    });
  };

  const alternarSubcategoria = (idSub, idPadre) => {
    const numIdSub = Number(idSub);
    const numIdPadre = Number(idPadre);

    setCategoriasSeleccionadas((prev) => {
      if (prev.includes(numIdSub)) {
        return prev.filter((id) => Number(id) !== numIdSub);
      } else {
        const sinDuplicados = new Set([...prev, numIdPadre, numIdSub]);
        return Array.from(sinDuplicados);
      }
    });
  };

  const limpiarFiltros = () => {
    setCategoriasSeleccionadas([]);
    setBusqueda("");
    setOrdenarPor("recientes");
  };

  const obtenerIdsParaFiltrarProductos = () => {
    if (categoriasSeleccionadas.length === 0) return [];
    const idsFinales = new Set();
    categoriasPrincipales.forEach((padre) => {
      const idPadre = Number(padre.id);
      if (categoriasSeleccionadas.includes(idPadre)) {
        const hijas = obtenerSubcategorias(idPadre);
        const hijasSeleccionadas = hijas.filter((h) => categoriasSeleccionadas.includes(Number(h.id)));
        if (hijasSeleccionadas.length > 0) {
          hijasSeleccionadas.forEach((h) => idsFinales.add(Number(h.id)));
        } else {
          idsFinales.add(idPadre);
          hijas.forEach((h) => idsFinales.add(Number(h.id)));
        }
      }
    });
    return Array.from(idsFinales);
  };

  const idsActivos = obtenerIdsParaFiltrarProductos();

  const productosFiltrados = productos
    .filter((prod) => {
      const coincideTexto =
        prod.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        prod.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = idsActivos.length === 0 || idsActivos.includes(Number(prod.categoria_id));
      return coincideTexto && coincideCategoria;
    })
    .sort((a, b) => {
      const precioA = parseFloat(a.precio_actual || 0);
      const precioB = parseFloat(b.precio_actual || 0);
      if (ordenarPor === "menor_precio") return precioA - precioB;
      if (ordenarPor === "mayor_precio") return precioB - precioA;
      if (ordenarPor === "descuento") {
        const descA = parseFloat(a.precio_anterior || 0) > precioA ? (parseFloat(a.precio_anterior) - precioA) / parseFloat(a.precio_anterior) : 0;
        const descB = parseFloat(b.precio_anterior || 0) > precioB ? (parseFloat(b.precio_anterior) - precioB) / parseFloat(b.precio_anterior) : 0;
        return descB - descA;
      }
      return 0;
    });

  const obtenerNombreCategoria = (catId) => {
    const cat = categorias.find((c) => Number(c.id) === Number(catId));
    if (!cat) return "General";
    if (cat.parent_id) {
      const padre = categorias.find((p) => Number(p.id) === Number(cat.parent_id));
      return padre ? `${padre.nombre} › ${cat.nombre}` : cat.nombre;
    }
    return cat.nombre;
  };

  const contarProductosPorCategoria = (catId) => {
    const subIds = obtenerSubcategorias(catId).map((s) => Number(s.id));
    const todosIds = [Number(catId), ...subIds];
    return productos.filter((p) => todosIds.includes(Number(p.categoria_id))).length;
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      {/* 🚀 EL CAMBIO ESTÁ AQUÍ: De max-w-7xl a max-w-[1600px] w-full */}
      <div className="max-w-[1600px] w-full mx-auto">
        
        {/* 📱 BARRA COMPACTA EXCLUSIVA PARA ANDROID / MÓVIL */}
        <div className="lg:hidden sticky top-16 z-20 bg-[#f5f7fa]/95 backdrop-blur-md pt-1 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerCategoriasAbierto(true)}
              className="bg-[#0f3faf] text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <span>☰</span>
              <span>Categorías</span>
              {categoriasSeleccionadas.length > 0 && (
                <span className="bg-white text-[#0f3faf] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {categoriasSeleccionadas.length}
                </span>
              )}
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-gray-800 shadow-xs outline-none focus:border-[#0f3faf]"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-black"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setCategoriasSeleccionadas([])}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap border transition-all flex-shrink-0 ${
                categoriasSeleccionadas.length === 0
                  ? "bg-[#0f3faf] text-white border-[#0f3faf] shadow-xs"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Todas ({productos.length})
            </button>
            {categoriasPrincipales.map((cat) => {
              const activa = categoriasSeleccionadas.includes(Number(cat.id));
              const cantidad = contarProductosPorCategoria(cat.id);
              const tieneHijas = obtenerSubcategorias(cat.id).length > 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => alternarCategoriaPrincipal(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex-shrink-0 flex items-center gap-1.5 ${
                    activa
                      ? "bg-[#0f3faf] text-white border-[#0f3faf] shadow-xs"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  <span>{cat.nombre}</span>
                  <span className={`text-[10px] font-black ${activa ? "text-blue-200" : "text-gray-400"}`}>
                    ({cantidad})
                  </span>
                  {tieneHijas && (
                    <span className="text-[10px] opacity-80">{activa ? "▾" : "▸"}</span>
                  )}
                </button>
              );
            })}
          </div>

          {categoriasPrincipales.map((padre) => {
            const padreAbierto = categoriasSeleccionadas.includes(Number(padre.id));
            const subcats = obtenerSubcategorias(padre.id);
            if (!padreAbierto || subcats.length === 0) return null;

            return (
              <div
                key={`subbar-${padre.id}`}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 pl-2 border-l-2 border-[#0f3faf] bg-blue-50/60 rounded-r-xl"
              >
                <span className="text-[10px] font-black text-[#0f3faf] uppercase px-1.5 whitespace-nowrap">
                  {padre.nombre}:
                </span>
                {subcats.map((sub) => {
                  const subActiva = categoriasSeleccionadas.includes(Number(sub.id));
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => alternarSubcategoria(sub.id, padre.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all flex-shrink-0 ${
                        subActiva
                          ? "bg-[#0f3faf] text-white border-[#0f3faf]"
                          : "bg-white text-gray-700 border-blue-200"
                      }`}
                    >
                      ↳ {sub.nombre} ({contarProductosPorCategoria(sub.id)})
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 📱 DRAWER LATERAL DE CATEGORÍAS EN ANDROID */}
        {drawerCategoriasAbierto && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setDrawerCategoriasAbierto(false)}
            />
            <div className="relative z-10 w-76 max-w-[85vw] bg-white h-dvh flex flex-col shadow-2xl animate-fade-in">
              <div className="p-4 bg-[#0f3faf] text-white flex items-center justify-between">
                <h3 className="font-black text-base flex items-center gap-2">
                  <span>🏷️</span> Categorías y Filtros
                </h3>
                <button
                  type="button"
                  onClick={() => setDrawerCategoriasAbierto(false)}
                  className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-black text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-1.5">
                    Ordenar productos por
                  </label>
                  <select
                    value={ordenarPor}
                    onChange={(e) => setOrdenarPor(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-black text-gray-800 bg-gray-50 outline-none focus:border-[#0f3faf]"
                  >
                    <option value="recientes">✨ Más recientes</option>
                    <option value="menor_precio">💲 Precio: Menor a Mayor</option>
                    <option value="mayor_precio">💎 Precio: Mayor a Menor</option>
                    <option value="descuento">🔥 Mayor descuento</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-black text-gray-500 uppercase">
                    Categorías disponibles
                  </p>
                  {categoriasPrincipales.map((cat) => {
                    const marcada = categoriasSeleccionadas.includes(Number(cat.id));
                    const subcats = obtenerSubcategorias(cat.id);
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <label
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                            marcada
                              ? "bg-blue-50 border-[#0f3faf] text-[#0f3faf] font-black"
                              : "bg-gray-50 border-gray-200 text-gray-700 font-bold"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={marcada}
                              onChange={() => alternarCategoriaPrincipal(cat.id)}
                              className="w-4 h-4 accent-[#0f3faf] rounded"
                            />
                            <span className="text-sm truncate">{cat.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {subcats.length > 0 && (
                              <span className="text-xs text-gray-400 font-black">
                                {marcada ? "▾" : "▸"}
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white border text-gray-500 font-black">
                              {contarProductosPorCategoria(cat.id)}
                            </span>
                          </div>
                        </label>

                        {marcada && subcats.length > 0 && (
                          <div className="pl-4 space-y-1.5 border-l-2 border-[#0f3faf] ml-3 animate-fade-in">
                            {subcats.map((sub) => {
                              const subMarcada = categoriasSeleccionadas.includes(Number(sub.id));
                              return (
                                <label
                                  key={sub.id}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs ${
                                    subMarcada
                                      ? "bg-blue-50 border-[#0f3faf] text-[#0f3faf] font-black"
                                      : "bg-white border-gray-200 text-gray-600 font-bold"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <input
                                      type="checkbox"
                                      checked={subMarcada}
                                      onChange={() => alternarSubcategoria(sub.id, cat.id)}
                                      className="w-3.5 h-3.5 accent-[#0f3faf] rounded"
                                    />
                                    <span className="truncate">↳ {sub.nombre}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-black">
                                    {contarProductosPorCategoria(sub.id)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t bg-gray-50 flex gap-2">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="w-1/2 bg-white border border-gray-300 text-gray-700 font-black py-2.5 rounded-xl text-xs"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerCategoriasAbierto(false)}
                  className="w-1/2 bg-[#0f3faf] text-white font-black py-2.5 rounded-xl text-xs"
                >
                  Ver ({productosFiltrados.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESTRUCTURA PRINCIPAL: SIDEBAR FIJO EN PC + PRODUCTOS A LA DERECHA */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start mt-6 lg:mt-0">
          
          {/* 💻 COLUMNA IZQUIERDA DE CATEGORÍAS Y BÚSQUEDA (PC) */}
          <aside className="hidden lg:block w-72 flex-shrink-0 self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-5 pr-1">
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
              <h3 className="font-black text-gray-900 text-base mb-3 pb-2 border-b">
                Búsqueda
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-3.5 pr-8 py-2.5 text-sm outline-none focus:border-[#0f3faf]"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-black"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
              <div className="flex justify-between items-center mb-3 pb-2 border-b">
                <h3 className="font-black text-gray-900 text-base">Categorías</h3>
                {categoriasSeleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCategoriasSeleccionadas([])}
                    className="text-[11px] font-bold text-[#0f3faf] hover:underline cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
                {categoriasPrincipales.map((cat) => {
                  const padreMarcado = categoriasSeleccionadas.includes(Number(cat.id));
                  const subcats = obtenerSubcategorias(cat.id);

                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <label
                        className={`flex items-center justify-between gap-2 cursor-pointer text-sm select-none p-1.5 rounded-lg transition-colors ${
                          padreMarcado
                            ? "text-[#0f3faf] font-black bg-blue-50/60"
                            : "text-gray-700 hover:text-[#0f3faf] font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={padreMarcado}
                            onChange={() => alternarCategoriaPrincipal(cat.id)}
                            className="w-4 h-4 rounded accent-[#0f3faf] cursor-pointer flex-shrink-0"
                          />
                          <span className="truncate" title={cat.nombre}>
                            {cat.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {subcats.length > 0 && (
                            <span className="text-[11px] text-gray-400 font-black">
                              {padreMarcado ? "▾" : "▸"}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border">
                            {contarProductosPorCategoria(cat.id)}
                          </span>
                        </div>
                      </label>

                      {padreMarcado && subcats.length > 0 && (
                        <div className="pl-4 py-1 space-y-1.5 border-l-2 border-[#0f3faf] ml-3 animate-fade-in">
                          {subcats.map((sub) => {
                            const subMarcada = categoriasSeleccionadas.includes(Number(sub.id));
                            return (
                              <label
                                key={sub.id}
                                className={`flex items-center justify-between gap-2 cursor-pointer text-xs select-none px-2 py-1 rounded-md transition-colors ${
                                  subMarcada
                                    ? "text-[#0f3faf] font-black bg-blue-50"
                                    : "text-gray-600 hover:text-[#0f3faf] font-medium"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={subMarcada}
                                    onChange={() => alternarSubcategoria(sub.id, cat.id)}
                                    className="w-3.5 h-3.5 rounded accent-[#0f3faf] cursor-pointer flex-shrink-0"
                                  />
                                  <span className="truncate" title={sub.nombre}>
                                    ↳ {sub.nombre}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">
                                  {contarProductosPorCategoria(sub.id)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* 🛒 GRILLA DE PRODUCTOS */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Catálogo</h1>
                <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-3.5 py-1 rounded-full shadow-2xs">
                  {productosFiltrados.length}{" "}
                  {productosFiltrados.length === 1 ? "producto" : "productos"}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Ordenar:</span>
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#0f3faf] shadow-2xs cursor-pointer"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="menor_precio">Precio: Menor a Mayor</option>
                  <option value="mayor_precio">Precio: Mayor a Menor</option>
                  <option value="descuento">Mayor descuento</option>
                </select>
              </div>
            </div>

            {productosFiltrados.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
                <p className="text-gray-500 font-bold mb-3">
                  No se encontraron productos con esos filtros.
                </p>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="bg-[#0f3faf] text-white text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Ver todos los productos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                {productosFiltrados.map((prod) => {
                  const precioActual = parseFloat(prod.precio_actual || 0);
                  const precioAnterior = parseFloat(prod.precio_anterior || 0);
                  const tieneDescuento = precioAnterior > precioActual;
                  const porcentajeDescuento = tieneDescuento
                    ? Math.round(((precioAnterior - precioActual) / precioAnterior) * 100)
                    : 0;
                  const enlaceProducto = `/producto/${prod.slug || prod.id}`;

                  const itemEnCarrito = cart?.find((item) => item.id === prod.id);
                  const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
                  const stockMax = parseInt(prod.stock_disponible ?? 1);
                  const agotado = stockMax <= 0;
                  const limiteAlcanzado = cantidadEnCarrito >= stockMax;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between relative group"
                    >
                      {tieneDescuento && (
                        <span className="absolute top-3 left-3 z-10 bg-[#e11d48] text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                          -{porcentajeDescuento}%
                        </span>
                      )}

                      <div>
                        {/* 🚀 EL CAMBIO DE IMÁGENES: Padding (p-4) directo en la clase de la imagen para respetar márgenes internos */}
                        <Link
                          href={enlaceProducto}
                          className="block w-full aspect-square relative bg-white rounded-xl overflow-hidden mb-3 flex items-center justify-center"
                        >
                          <Image
                            src={prod.imagenes?.[0] || "/favicon.ico"}
                            alt={prod.titulo}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, (max-width: 1600px) 25vw, 20vw"
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </Link>

                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider truncate">
                          {obtenerNombreCategoria(prod.categoria_id)}
                        </p>

                        <Link href={enlaceProducto}>
                          <h2 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mt-0.5 hover:text-[#0f3faf] transition-colors min-h-[2.2rem]">
                            {prod.titulo}
                          </h2>
                        </Link>
                      </div>

                      <div className="mt-2 pt-2">
                        <div className="flex items-baseline gap-1.5 mb-2.5">
                          <span className="text-[#e11d48] font-black text-base sm:text-lg">
                            ${precioActual.toFixed(2)}
                          </span>
                          {tieneDescuento && (
                            <span className="text-gray-400 line-through text-[11px] font-bold">
                              ${precioAnterior.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {agotado ? (
                          <button
                            type="button"
                            disabled
                            className="w-full bg-gray-200 text-gray-500 font-black py-2 sm:py-2.5 rounded-xl text-xs cursor-not-allowed"
                          >
                            Agotado
                          </button>
                        ) : cantidadEnCarrito > 0 ? (
                          <div className="w-full bg-[#eef4ff] border border-[#0f3faf] rounded-xl py-1 sm:py-1.5 px-2 flex items-center justify-between shadow-2xs">
                            <button
                              type="button"
                              onClick={() => eliminarDelCarrito(prod.id)}
                              className="w-7 h-7 sm:w-8 sm:h-7 flex items-center justify-center text-[#0f3faf] hover:bg-blue-100 rounded-lg font-black text-base transition-colors cursor-pointer"
                              title="Restar 1"
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
                              className={`w-7 h-7 sm:w-8 sm:h-7 flex items-center justify-center rounded-lg font-black text-base transition-colors ${
                                limiteAlcanzado
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "text-[#0f3faf] hover:bg-blue-100 cursor-pointer"
                              }`}
                              title={limiteAlcanzado ? "Stock máximo alcanzado" : "Sumar 1"}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => agregarAlCarrito(prod)}
                            className="w-full bg-[#0f3faf] hover:bg-blue-800 text-white font-black py-2 sm:py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <span>🛒</span> Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CatalogoClient(props) {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-gray-400">Cargando filtros...</div>}>
      <ContenidoCatalogoClient {...props} />
    </Suspense>
  );
}