"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ModuloCategorias from "./components/ModuloCategorias";
import ModuloProductos from "./components/ModuloProductos";
import ModuloPerfil from "./components/ModuloPerfil";
import ModuloOfertas from "./components/ModuloOfertas";
import ModuloCotizaciones from "./components/ModuloCotizaciones";
import ModuloComentarios from "./components/ModuloComentarios";

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState({ avatar_url: "", nombre: "" });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // ⚡ SISTEMA DE NAVEGACIÓN MODULAR
  const [vistaActiva, setVistaActiva] = useState("productos"); 

  // Estados Globales (Centralizados para compartirlos con los módulos)
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const inicializarPanel = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          setPerfil({
            avatar_url: session.user.user_metadata?.avatar_url || "",
            nombre: session.user.user_metadata?.full_name || "Administrador"
          });
          await cargarDatosGrupales();
        }
      } finally {
        setVerificando(false);
      }
    };
    inicializarPanel();
  }, []);

  const cargarDatosGrupales = async () => {
    const { data: prods } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prods) setProductos(prods);

    const { data: cats } = await supabase.from("categorias").select("*").order("nombre", { ascending: true });
    if (cats) setCategorias(cats);
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Error: Correo o contraseña incorrectos.");
    else window.location.reload();
    setLoading(false);
  };

  if (verificando) return <div className="min-h-screen flex items-center justify-center font-bold">Cargando panel...</div>;
  if (!session) return ( 
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <form onSubmit={iniciarSesion} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border">
          <h1 className="text-2xl font-black text-center mb-6">🔐 Acceso Restringido</h1>
          <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border mb-4 rounded-xl px-4 py-3" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border mb-4 rounded-xl px-4 py-3" required />
          <button type="submit" disabled={loading} className="w-full bg-[#0f3faf] text-white font-bold py-3 rounded-xl">{loading ? 'Verificando...' : 'Iniciar Sesión'}</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* MENÚ LATERAL (SIDEBAR) */}
      <aside className="w-full md:w-64 bg-[#0f3faf] text-white flex flex-col shadow-xl flex-shrink-0 relative z-10 md:min-h-screen">
        <div className="p-6 border-b border-blue-800 text-center md:text-left">
          <h2 className="font-black text-xl tracking-wider">TECH UNIVERSE</h2>
          <p className="text-blue-300 text-xs mt-1 font-bold">SUPERADMIN PANEL</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-x-auto md:overflow-visible flex md:flex-col">
          <button onClick={() => setVistaActiva('productos')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'productos' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">📦</span> Productos
          </button>
          <button onClick={() => setVistaActiva('categorias')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'categorias' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">🏷️</span> Categorías
          </button>
          <button onClick={() => setVistaActiva('ofertas')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'ofertas' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">⚡</span> Ofertas Flash
          </button>
          <button onClick={() => setVistaActiva('cotizaciones')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'cotizaciones' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">📄</span> Cotizaciones
          </button>
          <button onClick={() => setVistaActiva('comentarios')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'comentarios' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">⭐</span> Comentarios
          </button>
          <button onClick={() => setVistaActiva('perfil')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'perfil' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">⚙️</span> Configuración
          </button>
        </nav>

        <div className="p-4 border-t border-blue-800 hidden md:block">
          <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setVistaActiva('perfil')}>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white">
              {perfil.avatar_url ? <img src={perfil.avatar_url} className="w-full h-full object-cover" /> : <span>👨‍💻</span>}
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-bold truncate">{perfil.nombre}</p>
              <p className="text-xs text-blue-300 truncate">{session.user.email}</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="w-full bg-blue-800 hover:bg-red-600 text-white py-2 rounded-lg font-bold transition-colors">Cerrar Sesión</button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DE CONTENIDO */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {vistaActiva === 'productos' && <ModuloProductos productos={productos} categorias={categorias} recargarDatos={cargarDatosGrupales} />}
        {vistaActiva === 'categorias' && <ModuloCategorias categorias={categorias} productos={productos} recargarDatos={cargarDatosGrupales} />}
        {vistaActiva === 'ofertas' && <ModuloOfertas productos={productos} />}
        {vistaActiva === 'cotizaciones' && <ModuloCotizaciones />}
        {vistaActiva === 'comentarios' && <ModuloComentarios productos={productos} />}
        {vistaActiva === 'perfil' && <ModuloPerfil session={session} perfil={perfil} actualizarPerfilLocal={setPerfil} />}
      </main>
    </div>
  );
}