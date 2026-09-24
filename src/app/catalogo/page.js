"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
// import { useCart } from "../../context/CartContext"; // Descomenta cuando uses el carrito

// ⚡ FUNCIÓN MÁGICA: Quita tildes, mayúsculas y espacios extra
const normalizar = (texto) => {
  if (!texto) return "";
  return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [busqueda, setBusqueda] = useState("");
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  
  // const { agregarAlCarrito } = useCart(); // Descomenta cuando uses el carrito

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      const { data: cats } = await supabase.from("categorias").select("*").order("nombre");
      if (cats) setCategorias(cats);

      const { data: prods } = await supabase.from("productos").select("*").eq("activo", true).order("id", { ascending: false });
      if (prods) setProductos(prods);
      
      setCargando(false);
    };
    cargarDatos();
  }, []);

  const manejarFiltroCategoria = (nombreCategoria) => {
    if (categoriasSeleccionadas.includes(nombreCategoria)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter(c => c !== nombreCategoria));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, nombreCategoria]);
    }
  };

  // Motor de filtrado inteligente
  const productosFiltrados = productos.filter(prod => {
    const busquedaNorm = normalizar(busqueda);
    const tituloNorm = normalizar(prod.titulo);
    const descNorm = normalizar(prod.descripcion);
    
    // Busca en título Y en descripción
    const coincideBusqueda = busquedaNorm === "" || tituloNorm.includes(busquedaNorm) || descNorm.includes(busquedaNorm);
    
    // Filtro de categoría a prueba de fallos
    const catProdNorm = normalizar(prod.categoria_id);
    const coincideCategoria = categoriasSeleccionadas.length === 0 || 
                              categoriasSeleccionadas.some(catSel => normalizar(catSel) === catProdNorm);
                              
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Barra Lateral: Filtros Dinámicos */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
            <h3 className="font-black text-lg mb-4 border-b pb-2">Búsqueda</h3>
            <input 
              type="text" 
              placeholder="Buscar (ej. destornillador)..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#0f3faf] transition-colors"
            />
            <p className="text-[10px] text-gray-400 mt-2 leading-tight">
              *Asegúrate de escribir sinónimos (ej. "destornillador") en la descripción de tu producto para que el buscador lo encuentre.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="font-black text-lg mb-4 border-b pb-2">Categorías</h3>
            <div className="space-y-3">
              {categorias.map(cat => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={categoriasSeleccionadas.includes(cat.nombre)}
                    onChange={() => manejarFiltroCategoria(cat.nombre)}
                    className="w-4 h-4 rounded text-[#0f3faf] border-gray-300 focus:ring-[#0f3faf] cursor-pointer"
                  />
                  <span className="text-gray-700 font-medium group-hover:text-[#0f3faf] transition-colors">{cat.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid Principal de Productos */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black">Catálogo Completo</h1>
            <span className="bg-white px-4 py-1 rounded-full text-sm font-bold border shadow-sm text-gray-600">
              {productosFiltrados.length} resultados
            </span>
          </div>

          {cargando ? (
            <div className="flex justify-center py-20 font-bold text-gray-400">Cargando catálogo...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosFiltrados.map(prod => (
                <Link href={`/producto/${prod.slug || prod.id}`} key={prod.id} className="bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col relative">
                  
                  {/* Badge de Descuento (Puedes hacerlo dinámico luego) */}
                  <div className="absolute top-3 left-3 bg-[#e11d48] text-white text-xs font-black px-2 py-1 rounded-md z-10">
                    -17%
                  </div>

                  <div className="aspect-square bg-gray-50 overflow-hidden relative border-b p-4 flex items-center justify-center">
                    <img 
                      src={prod.imagenes?.[0] || "https://via.placeholder.com/300?text=Sin+Foto"} 
                      alt={prod.titulo} 
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    {/* Estrellas estáticas (Hasta que agregues sistema de reseñas) */}
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-yellow-400 text-sm">★★★★★</span>
                      <span className="text-gray-400 text-xs font-medium">(4.8)</span>
                    </div>

                    <h2 className="font-bold text-gray-800 line-clamp-2 mb-3 flex-1 group-hover:text-[#2563eb] transition-colors leading-tight">{prod.titulo}</h2>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-xl font-black text-[#e11d48]">${prod.precio_actual}</span>
                      <span className="text-sm font-medium text-gray-400 line-through">
                        ${(prod.precio_actual * 1.17).toFixed(2)}
                      </span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault(); // Evita que se abra la vista del producto al darle click al botón
                        // agregarAlCarrito(prod);
                        alert("¡Producto agregado al carrito!"); 
                      }}
                      className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      Agregar
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}