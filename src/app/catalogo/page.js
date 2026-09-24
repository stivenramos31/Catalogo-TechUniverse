"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

const normalizar = (texto) => {
  if (!texto) return "";
  return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState("");
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]); // Guarda los IDs numéricos
  
  // Paginación: 12 productos = 2x6 en Android | 4x3 en PC
  const [paginaActual, setPaginaActual] = useState(1);
  const PRODUCTOS_POR_PAGINA = 12;

  const { cart, agregarAlCarrito, eliminarDelCarrito } = useCart();

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      const { data: cats } = await supabase.from("categorias").select("*").order("nombre");
      if (cats) setCategorias(cats);

      const { data: prods } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("creado_en", { ascending: false });
      if (prods) setProductos(prods);
      
      setCargando(false);
    };
    cargarDatos();
  }, []);

  // Reiniciar a la página 1 cuando se filtra o se busca
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, categoriasSeleccionadas]);

  const manejarFiltroCategoria = (idCategoria) => {
    if (categoriasSeleccionadas.includes(idCategoria)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter(id => id !== idCategoria));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, idCategoria]);
    }
  };

  // Motor de filtrado inteligente conectado por Foreign Key (categoria_id)
  const productosFiltrados = productos.filter(prod => {
    const busquedaNorm = normalizar(busqueda);
    const tituloNorm = normalizar(prod.titulo);
    const descNorm = normalizar(prod.descripcion);
    
    const coincideBusqueda = busquedaNorm === "" || tituloNorm.includes(busquedaNorm) || descNorm.includes(busquedaNorm);
    const coincideCategoria = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(prod.categoria_id);
                              
    return coincideBusqueda && coincideCategoria;
  });

  // Cálculos de paginación (2x6 = 12 por página)
  const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const productosPaginados = productosFiltrados.slice(indiceInicio, indiceInicio + PRODUCTOS_POR_PAGINA);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Barra Lateral: Filtros Dinámicos */}
        <aside className="w-full md:w-60 flex-shrink-0">
          <div className="bg-white p-4 rounded-2xl shadow-sm border mb-4">
            <h3 className="font-black text-base mb-3 border-b pb-2">Búsqueda</h3>
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0f3faf] transition-colors"
            />
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <h3 className="font-black text-base mb-3 border-b pb-2">Categorías</h3>
            <div className="flex flex-wrap md:flex-col gap-2.5">
              {categorias.map(cat => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group bg-gray-50 md:bg-transparent px-3 py-1.5 md:p-0 rounded-lg border md:border-0">
                  <input 
                    type="checkbox" 
                    checked={categoriasSeleccionadas.includes(cat.id)}
                    onChange={() => manejarFiltroCategoria(cat.id)}
                    className="w-4 h-4 rounded text-[#0f3faf] border-gray-300 focus:ring-[#0f3faf] cursor-pointer"
                  />
                  <span className="text-gray-700 text-sm font-medium group-hover:text-[#0f3faf] transition-colors">{cat.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid Principal de Productos */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl md:text-2xl font-black text-gray-900">Catálogo</h1>
            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold border shadow-sm text-gray-600">
              {productosFiltrados.length} productos
            </span>
          </div>

          {cargando ? (
            <div className="flex justify-center py-20 font-bold text-gray-400">Cargando catálogo...</div>
          ) : productosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border">
              <p className="text-gray-500 font-bold">No se encontraron productos con estos filtros.</p>
            </div>
          ) : (
            <>
              {/* 📱 ANDROID: grid-cols-2 (2 ancho x 6 largo) | 💻 PC: lg:grid-cols-4 (4 ancho x 3 largo) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {productosPaginados.map(prod => {
                  const itemEnCarrito = cart?.find(item => String(item.id) === String(prod.id));
                  const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
                  
                  // Cálculo real de descuento basado en tu base de datos
                  const tieneDescuento = prod.precio_anterior && parseFloat(prod.precio_anterior) > parseFloat(prod.precio_actual);
                  const porcentajeDescuento = tieneDescuento 
                    ? Math.round(((prod.precio_anterior - prod.precio_actual) / prod.precio_anterior) * 100)
                    : 0;

                  const nombreCategoria = categorias.find(c => c.id === prod.categoria_id)?.nombre;

                  return (
                    <Link 
                      href={`/producto/${prod.slug || prod.id}`} 
                      key={prod.id} 
                      className="bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col relative"
                    >
                      {/* Badge de Descuento Real */}
                      {tieneDescuento && (
                        <div className="absolute top-2 left-2 bg-[#e11d48] text-white text-[10px] font-black px-2 py-0.5 rounded-md z-10 shadow-sm">
                          -{porcentajeDescuento}%
                        </div>
                      )}

                      {/* Imagen Compacta */}
                      <div className="aspect-square bg-white overflow-hidden relative border-b p-2.5 flex items-center justify-center">
                        <img 
                          src={prod.imagenes?.[0] || "https://via.placeholder.com/300?text=Sin+Foto"} 
                          alt={prod.titulo} 
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                      
                      {/* Cuerpo de Tarjeta Reducido */}
                      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
                        <div>
                          {nombreCategoria && (
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5 truncate">
                              {nombreCategoria}
                            </span>
                          )}

                          <h2 className="font-bold text-gray-800 text-xs sm:text-sm line-clamp-2 mb-2 group-hover:text-[#0f3faf] transition-colors leading-snug">
                            {prod.titulo}
                          </h2>
                        </div>
                        
                        <div>
                          {/* Precios Reales */}
                          <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-[#e11d48]">
                              ${parseFloat(prod.precio_actual).toFixed(2)}
                            </span>
                            {tieneDescuento && (
                              <span className="text-[11px] font-medium text-gray-400 line-through">
                                ${parseFloat(prod.precio_anterior).toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Control Dinámico de Carrito (+ / -) */}
                          <div onClick={(e) => e.preventDefault()}>
                            {cantidadEnCarrito > 0 ? (
                              <div className="flex items-center justify-between bg-blue-50 border border-[#0f3faf] rounded-lg overflow-hidden h-8 sm:h-9">
                                <button 
                                  onClick={() => eliminarDelCarrito(prod.id)}
                                  className="w-8 sm:w-9 h-full flex items-center justify-center font-black text-[#0f3faf] hover:bg-blue-100 transition-colors text-base"
                                >
                                  −
                                </button>
                                <span className="font-black text-xs sm:text-sm text-[#0f3faf]">
                                  {cantidadEnCarrito}
                                </span>
                                <button 
                                  onClick={() => agregarAlCarrito(prod)}
                                  disabled={cantidadEnCarrito >= prod.stock_disponible}
                                  className="w-8 sm:w-9 h-full flex items-center justify-center font-black text-[#0f3faf] hover:bg-blue-100 disabled:opacity-40 transition-colors text-base"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => agregarAlCarrito(prod)}
                                disabled={prod.stock_disponible <= 0}
                                className="w-full h-8 sm:h-9 bg-[#0f3faf] hover:bg-blue-800 disabled:bg-gray-300 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                              >
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                {prod.stock_disponible > 0 ? "Agregar" : "Agotado"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Controles de Paginación (Mantiene exactamente 6 filas máximo por página) */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button 
                    onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                    disabled={paginaActual === 1}
                    className="px-4 py-2 rounded-xl border bg-white font-bold text-xs disabled:opacity-40 hover:bg-gray-100"
                  >
                    ◀ Anterior
                  </button>
                  <span className="text-xs font-black text-gray-600 px-3">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button 
                    onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo(0, 0); }}
                    disabled={paginaActual === totalPaginas}
                    className="px-4 py-2 rounded-xl border bg-white font-bold text-xs disabled:opacity-40 hover:bg-gray-100"
                  >
                    Siguiente ▶
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}