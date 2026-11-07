"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [cargando, setCargando] = useState(false);
  
  // --- Estados para el Bloqueo de Seguridad ---
  const [intentos, setIntentos] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState("");

  const router = useRouter();
  const MAX_INTENTOS = 5;
  const TIEMPO_PENALIZACION = 30 * 60 * 1000; // 30 minutos en milisegundos

  // 1. Verificar sesión y cargar estado de penalización al montar
  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push("/admin");
    };
    verificarSesion();

    // Recuperamos los intentos y el bloqueo desde la memoria del navegador
    const guardadoIntentos = parseInt(localStorage.getItem("admin_intentos") || "0");
    const guardadoBloqueo = localStorage.getItem("admin_bloqueado_hasta");

    setIntentos(guardadoIntentos);
    if (guardadoBloqueo) {
      setBloqueadoHasta(parseInt(guardadoBloqueo));
    }
  }, [router]);

  // 2. Temporizador para la cuenta regresiva del bloqueo
  useEffect(() => {
    let intervalo;
    if (bloqueadoHasta) {
      intervalo = setInterval(() => {
        const ahora = Date.now();
        if (ahora >= bloqueadoHasta) {
          // El tiempo expiró, desbloqueamos el sistema
          setBloqueadoHasta(null);
          setIntentos(0);
          localStorage.removeItem("admin_intentos");
          localStorage.removeItem("admin_bloqueado_hasta");
          setTiempoRestante("");
          setErrorLogin("");
        } else {
          // Calculamos minutos y segundos restantes
          const diff = bloqueadoHasta - ahora;
          const minutos = Math.floor(diff / 60000);
          const segundos = Math.floor((diff % 60000) / 1000);
          setTiempoRestante(`${minutos}m ${segundos}s`);
        }
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [bloqueadoHasta]);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    // Si está bloqueado, evitamos cualquier intento a la base de datos
    if (bloqueadoHasta) return;

    setErrorLogin("");
    setCargando(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      localStorage.setItem("admin_intentos", nuevosIntentos.toString());

      if (nuevosIntentos >= MAX_INTENTOS) {
        // Alcanzó los 5 intentos, aplicar penalización
        const tiempoDesbloqueo = Date.now() + TIEMPO_PENALIZACION;
        setBloqueadoHasta(tiempoDesbloqueo);
        localStorage.setItem("admin_bloqueado_hasta", tiempoDesbloqueo.toString());
        setErrorLogin("Demasiados intentos fallidos. Sistema bloqueado.");
      } else {
        // Mostrar intentos restantes
        const restantes = MAX_INTENTOS - nuevosIntentos;
        setErrorLogin(`Credenciales incorrectas. Te faltan ${restantes} intento${restantes === 1 ? '' : 's'}.`);
      }
      setCargando(false);
    } else if (data.session) {
      // Éxito: Limpiamos el historial de errores
      localStorage.removeItem("admin_intentos");
      localStorage.removeItem("admin_bloqueado_hasta");
      
      // Damos 300ms para asegurar que la cookie de Supabase SSR se escriba en producción
      setTimeout(() => {
        window.location.href = "/admin"; 
      }, 300);
    }
  };

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

        {/* Mensajes de Error y Bloqueo */}
        {bloqueadoHasta ? (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 font-black p-4 rounded-xl mb-6 text-center animate-pulse">
            🚨 SISTEMA BLOQUEADO 🚨<br/>
            <span className="text-sm font-medium">Inténtalo de nuevo en:</span><br/>
            <span className="text-2xl">{tiempoRestante}</span>
          </div>
        ) : errorLogin ? (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl mb-4 text-center">
            {errorLogin}
          </div>
        ) : null}

        <form onSubmit={iniciarSesion} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-1" htmlFor="email">
              Correo Electrónico
            </label>
            {/* autoCoomplete="username" es vital para Proton Pass */}
            <input
              id="email"
              name="email"
              autoComplete="username"
              type="email"
              required
              disabled={!!bloqueadoHasta}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 rounded-xl px-4 py-3 outline-none focus:border-[#0f3faf] font-medium disabled:bg-gray-100 disabled:text-gray-400"
              placeholder="admin@techuniverse.com"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase mb-1" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              {/* autoComplete="current-password" evita el cuadro oscuro de los gestores */}
              <input
                id="password"
                name="password"
                autoComplete="current-password"
                type={mostrarPassword ? "text" : "password"}
                required
                disabled={!!bloqueadoHasta}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 rounded-xl pl-4 pr-12 py-3 outline-none focus:border-[#0f3faf] font-medium disabled:bg-gray-100 disabled:text-gray-400"
                placeholder="••••••••"
              />
              {/* Botón para ver/ocultar contraseña */}
              <button
                type="button"
                tabIndex="-1"
                disabled={!!bloqueadoHasta}
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#0f3faf] focus:outline-none disabled:opacity-50 cursor-pointer"
                title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarPassword ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando || !!bloqueadoHasta}
            className={`w-full text-white font-black py-3.5 rounded-xl transition-colors shadow-lg mt-2 ${
              cargando || !!bloqueadoHasta
                ? "bg-blue-400 cursor-not-allowed" 
                : "bg-[#0f3faf] hover:bg-blue-800 shadow-blue-200 cursor-pointer"
            }`}
          >
            {cargando ? "Iniciando..." : bloqueadoHasta ? "Bloqueado" : "Ingresar al Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}