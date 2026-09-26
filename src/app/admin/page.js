"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

import ModuloProductos from "./components/ModuloProductos";
import ModuloCategorias from "./components/ModuloCategorias";
import ModuloOfertas from "./components/ModuloOfertas";
import ModuloCotizaciones from "./components/ModuloCotizaciones";
import ModuloComentarios from "./components/ModuloComentarios";
import ModuloCupones from "./components/ModuloCupones";
import ModuloPerfil from "./components/ModuloPerfil";
import ModuloVisitas from "./components/ModuloVisitas";

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  const [vistaActiva, setVistaActiva] = useState("productos");
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const cambiarVista = (nuevaVista) => {
    setVistaActiva(nuevaVista);
    setMenuMovilAbierto(false); // Cierra el menú automáticamente en Android al tocar una opción
  };
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [perfil, setPerfil] = useState({
    nombre_completo: "Administrador",
    rol: "Superadmin",
    avatar_url: ""
  });

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session: sesionActual } } = await supabase.auth.getSession();
      setSession(sesionActual);
      if (sesionActual) {
        await cargarDatosGrupales(sesionActual.user.id);
      }
      setCargandoAuth(false);
    };

    verificarSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        cargarDatosGrupales(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const cargarDatosGrupales = async (userId = session?.user?.id) => {
    const { data: cats } = await supabase.from("categorias").select("*").order("nombre");
    if (cats) setCategorias(cats);

    const { data: prods } = await supabase.from("productos").select("*").order("id", { ascending: false });
    if (prods) setProductos(prods);

    const { data: { user } } = await supabase.auth.getUser();
    const meta = user?.user_metadata || {};

    let nombreGuardado = meta.nombre_mostrar || meta.full_name || "Administrador";
    let fotoGuardada = meta.avatar_url || meta.foto_url || "";

    if (userId) {
      const { data: perf } = await supabase
        .from("perfiles_admin")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (perf) {
        nombreGuardado = perf.nombre_completo || perf.nombre_mostrar || nombreGuardado;
        fotoGuardada = perf.avatar_url || perf.foto_url || fotoGuardada;
      }
    }

    setPerfil({
      nombre_completo: nombreGuardado,
      nombre_mostrar: nombreGuardado,
      rol: "Superadmin",
      avatar_url: fotoGuardada,
      foto_url: fotoGuardada,
    });
  };

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setErrorLogin("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErrorLogin("Credenciales incorrectas o usuario no autorizado.");
  };

  const cerrarSesion = async () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  if (cargandoAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-black text-lg">
        Cargando Panel de Control...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a256e] to-[#0f3faf] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-5xl block mb-2">💻 🛠️</span>
            <h1 className="text-2xl font-black text-gray-900">TECH UNIVERSE</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Acceso Exclusivo Superadmin
            </p>
          </div>

          {errorLogin && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl mb-4 text-center">
              {errorLogin}
            </div>
          )}

          <form onSubmit={iniciarSesion} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 rounded-xl px-4 py-3 outline-none focus:border-[#0f3faf] font-medium"
                placeholder="admin@techuniverse.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 rounded-xl px-4 py-3 outline-none focus:border-[#0f3faf] font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0f3faf] hover:bg-blue-800 text-white font-black py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-200 mt-2"
            >
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-gray-100 flex flex-col md:flex-row relative">
      
      {/* 📱 BARRA SUPERIOR COMPACTA (Solo visible en Android / Móviles) */}
      {/* 📱 BARRA SUPERIOR COMPACTA (Botón ☰ a la izquierda, mismo lado donde abre el menú) */}
      <header className="md:hidden bg-[#0f3faf] text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-30">
        
        {/* Izquierda: Botón Hamburguesa + Título del Panel */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuMovilAbierto(true)}
            className="p-2 rounded-xl bg-blue-800 hover:bg-blue-700 text-white focus:outline-none active:scale-95 transition-transform"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-black text-sm tracking-wide uppercase text-blue-100">
            Panel Admin
          </span>
        </div>

        {/* Derecha: Tocar tu Foto o Nombre abre Configuración */}
        <button
          type="button"
          onClick={() => cambiarVista("perfil")}
          title="Abrir Configuración de Perfil"
          className={`flex items-center gap-2.5 min-w-0 p-1.5 rounded-2xl transition-all active:scale-95 ${
            vistaActiva === "perfil" ? "bg-white/20 ring-2 ring-white" : "hover:bg-blue-800/60"
          }`}
        >
          <div className="text-right min-w-0">
            <h2 className="font-black text-xs sm:text-sm truncate leading-tight">
              {perfil?.nombre_completo || "Administrador"}
            </h2>
            <span className="text-[10px] text-blue-200 font-bold flex items-center justify-end gap-1">
              ⚙️ {perfil?.rol || "Superadmin"}
            </span>
          </div>
          <div className="relative flex-shrink-0">
            {perfil?.avatar_url ? (
              <img
                src={perfil.avatar_url}
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border-2 border-white bg-white"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-white bg-blue-900 flex items-center justify-center text-lg">
                👨‍💻
              </div>
            )}
          </div>
        </button>

      </header>

      {/* Fondo oscuro al abrir el menú en Android */}
      {menuMovilAbierto && (
        <div
          onClick={() => setMenuMovilAbierto(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        />
      )}

      {/* 💻📱 BARRA LATERAL (Oculta en Android hasta presionar ☰ | Fija en PC) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 h-dvh bg-[#0f3faf] text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 flex-shrink-0 ${
          menuMovilAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-blue-800 flex items-center justify-between gap-2">
          {/* Al presionar tu foto o nombre se abre Configuración */}
          <button
            type="button"
            onClick={() => cambiarVista("perfil")}
            title="Ir a Configuración y Contactos"
            className={`flex items-center gap-3 min-w-0 flex-1 text-left p-2 rounded-2xl transition-all group cursor-pointer ${
              vistaActiva === "perfil"
                ? "bg-white text-[#0f3faf] shadow-md"
                : "hover:bg-blue-800/70 text-white"
            }`}
          >
            <div className="relative flex-shrink-0">
              {perfil?.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt="Avatar"
                  className={`w-12 h-12 rounded-full object-cover border-2 shadow-md bg-white ${
                    vistaActiva === "perfil" ? "border-[#0f3faf]" : "border-white"
                  }`}
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-blue-900 flex items-center justify-center text-2xl">
                  👨‍💻
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-xs">
                ⚙️
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-black text-base truncate leading-tight">
                {perfil?.nombre_completo || "Administrador"}
              </h2>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold inline-block mt-1 ${
                  vistaActiva === "perfil"
                    ? "bg-blue-100 text-[#0f3faf]"
                    : "bg-blue-800 text-blue-200 group-hover:bg-blue-700"
                }`}
              >
                {perfil?.rol || "Superadmin"} • Configurar
              </span>
            </div>
          </button>

          {/* Botón X para cerrar en Android */}
          <button
            onClick={() => setMenuMovilAbierto(false)}
            className="md:hidden text-blue-200 hover:text-white p-2 rounded-lg bg-blue-800/60 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto flex flex-col">
          <button onClick={() => cambiarVista('productos')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'productos' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">📦</span> Productos
          </button>
          <button onClick={() => cambiarVista('categorias')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'categorias' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">🏷️</span> Categorías
          </button>
          <button onClick={() => cambiarVista('ofertas')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'ofertas' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">⚡</span> Ofertas Flash
          </button>
          <button onClick={() => cambiarVista('cotizaciones')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'cotizaciones' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">📄</span> Cotizaciones
          </button>
          <button onClick={() => cambiarVista('comentarios')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'comentarios' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">⭐</span> Comentarios
          </button>
          <button onClick={() => cambiarVista('cupones')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'cupones' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">💸</span> Cupones
          </button>
          <button onClick={() => cambiarVista('visitas')} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all whitespace-nowrap ${vistaActiva === 'visitas' ? 'bg-white text-[#0f3faf] font-black shadow-md' : 'text-blue-100 hover:bg-blue-800'}`}>
            <span className="text-lg">🌐</span> Visitas IP
          </button>
        </nav>

        <div className="p-4 border-t border-blue-800 space-y-2">
          <a
            href="/catalogo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
          >
            🌐 Ver Tienda Pública
          </a>
          <button
            onClick={cerrarSesion}
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área Principal de Módulos (Solo esta zona se alarga y hace scroll) */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8">
        {vistaActiva === 'productos' && <ModuloProductos productos={productos} categorias={categorias} recargarDatos={cargarDatosGrupales} />}
        {vistaActiva === 'categorias' && <ModuloCategorias categorias={categorias} productos={productos} recargarDatos={cargarDatosGrupales} />}
        {vistaActiva === 'ofertas' && <ModuloOfertas productos={productos} />}
        {vistaActiva === 'cotizaciones' && <ModuloCotizaciones />}
        {vistaActiva === 'comentarios' && <ModuloComentarios productos={productos} />}
        {vistaActiva === "cupones" && <ModuloCupones />}
        {vistaActiva === "visitas" && <ModuloVisitas />}
        {vistaActiva === 'perfil' && <ModuloPerfil session={session} perfil={perfil} actualizarPerfilLocal={setPerfil} />}
      </main>
    </div>
  );
}