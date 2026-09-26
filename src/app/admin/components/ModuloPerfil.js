"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const convertirAWebP = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nuevoNombre = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              resolve(new File([blob], nuevoNombre, { type: "image/webp" }));
            } else {
              reject(new Error("Error al convertir imagen a WebP"));
            }
          },
          "image/webp",
          0.85
        );
      };
    };
  });
};

export default function ModuloPerfil({ session, perfil, actualizarPerfilLocal }) {
  const nombreOriginal =
    perfil?.nombre_mostrar ||
    perfil?.nombre_completo ||
    session?.user?.user_metadata?.nombre_mostrar ||
    session?.user?.user_metadata?.full_name ||
    "Administrador";

  const fotoOriginal =
    perfil?.foto_url ||
    perfil?.avatar_url ||
    session?.user?.user_metadata?.avatar_url ||
    session?.user?.user_metadata?.foto_url ||
    "";

  const [nombre, setNombre] = useState(nombreOriginal);
  const [fotoPreview, setFotoPreview] = useState(fotoOriginal);
  const [archivoNuevo, setArchivoNuevo] = useState(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Estado para los contactos públicos y WhatsApp de recepción de pedidos
  const [contactos, setContactos] = useState({
    whatsapp_ventas: "50370000000",
    telefono_visible: "+503 7000-0000",
    correo_contacto: "",
    direccion_tienda: "",
    horario_atencion: "",
    facebook_url: "",
    instagram_url: "",
  });
  const [contactosOriginales, setContactosOriginales] = useState(null);
  const [guardandoContactos, setGuardandoContactos] = useState(false);

  useEffect(() => {
    setNombre(nombreOriginal);
    setFotoPreview(fotoOriginal);
    setArchivoNuevo(null);
  }, [nombreOriginal, fotoOriginal]);

  useEffect(() => {
    const cargarContactos = async () => {
      const { data } = await supabase
        .from("configuracion_tienda")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (data) {
        const info = {
          whatsapp_ventas: data.whatsapp_ventas || "",
          telefono_visible: data.telefono_visible || "",
          correo_contacto: data.correo_contacto || "",
          direccion_tienda: data.direccion_tienda || "",
          horario_atencion: data.horario_atencion || "",
          facebook_url: data.facebook_url || "",
          instagram_url: data.instagram_url || "",
        };
        setContactos(info);
        setContactosOriginales(info);
      }
    };
    cargarContactos();
  }, []);

  const nombreLimpio = nombre.trim();
  const hayCambiosPerfil =
    (nombreLimpio !== "" && nombreLimpio !== nombreOriginal) || archivoNuevo !== null;

  const hayCambiosContactos =
    contactosOriginales &&
    JSON.stringify(contactos) !== JSON.stringify(contactosOriginales);

  const seleccionarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoNuevo(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const guardarCambiosPerfil = async (e) => {
    e.preventDefault();
    if (!hayCambiosPerfil) return;
    setGuardandoPerfil(true);

    try {
      let urlFinal = fotoOriginal;

      if (archivoNuevo) {
        const archivoWebP = await convertirAWebP(archivoNuevo);
        const fileName = `admin-avatar-${session.user.id}-${Date.now()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("productos")
          .upload(fileName, archivoWebP, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("productos")
          .getPublicUrl(fileName);

        urlFinal = publicUrlData.publicUrl;

        if (fotoOriginal && fotoOriginal.includes("/productos/")) {
          const nombreViejo = decodeURIComponent(
            fotoOriginal.split("/productos/")[1].split("?")[0]
          );
          if (nombreViejo) {
            await supabase.storage.from("productos").remove([nombreViejo]);
          }
        }
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nombre_mostrar: nombreLimpio,
          full_name: nombreLimpio,
          avatar_url: urlFinal,
          foto_url: urlFinal,
        },
      });

      if (authError) throw authError;

      await supabase.from("perfiles_admin").upsert({
        id: session.user.id,
        nombre_completo: nombreLimpio,
        avatar_url: urlFinal,
        rol: perfil?.rol || "Superadmin",
      });

      actualizarPerfilLocal({
        ...perfil,
        nombre_completo: nombreLimpio,
        nombre_mostrar: nombreLimpio,
        avatar_url: urlFinal,
        foto_url: urlFinal,
      });

      setArchivoNuevo(null);
      alert("✅ ¡Perfil actualizado correctamente!");
    } catch (error) {
      alert("Error al actualizar el perfil: " + error.message);
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Convierte cualquier número (ej: "50371234567" o "71234567") al formato visual "7123-4567" (máx 8 dígitos)
  const formatearOchoDigitos = (valor = "") => {
    let soloNumeros = String(valor).replace(/\D/g, "");
    // Si viene de la BD con el 503 adelante y tiene más de 8 dígitos, le quitamos el 503 inicial
    if (soloNumeros.startsWith("503") && soloNumeros.length > 8) {
      soloNumeros = soloNumeros.slice(3);
    }
    soloNumeros = soloNumeros.slice(0, 8); // Límite estricto de 8 dígitos
    if (soloNumeros.length > 4) {
      return `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4)}`;
    }
    return soloNumeros;
  };

  const manejarCambioTelefono = (campo, valorInput) => {
    const formateado = formatearOchoDigitos(valorInput);
    setContactos((prev) => ({
      ...prev,
      [campo]: formateado,
    }));
  };

  const guardarContactosTienda = async (e) => {
    e.preventDefault();
    const ochoDigitosWhatsApp = formatearOchoDigitos(contactos.whatsapp_ventas).replace(/\D/g, "");
    if (ochoDigitosWhatsApp.length !== 8) {
      return alert("⚠️ Tu número de WhatsApp debe tener exactamente 8 dígitos.");
    }

    const ochoDigitosVisible = formatearOchoDigitos(
      contactos.telefono_visible || contactos.whatsapp_ventas
    );

    setGuardandoContactos(true);
    try {
      const datosGuardar = {
        id: 1,
        ...contactos,
        // Para el enlace de WhatsApp se guarda como 503 + 8 dígitos sin guiones (ej: 50371234567)
        whatsapp_ventas: `503${ochoDigitosWhatsApp}`,
        // Para mostrar en la tienda se guarda bonito (ej: +503 7123-4567)
        telefono_visible: `+503 ${ochoDigitosVisible}`,
        actualizado_en: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("configuracion_tienda")
        .upsert(datosGuardar);

      if (error) throw error;

      setContactos(datosGuardar);
      setContactosOriginales(datosGuardar);
      alert("✅ ¡Contactos y número de WhatsApp (+503) actualizados correctamente!");
    } catch (error) {
      alert("Error al guardar contactos: " + error.message);
    } finally {
      setGuardandoContactos(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in mt-2">
      {/* BLOQUE 1: IDENTIDAD DEL ADMINISTRADOR */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border">
        <div className="border-b pb-4 mb-8">
          <h2 className="font-black text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
            <span>⚙️</span> Configuración del Perfil
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Personaliza tu identidad en el panel de administración.
          </p>
        </div>

        <form onSubmit={guardarCambiosPerfil} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-full border-4 border-[#0f3faf] p-1 bg-gray-50 flex items-center justify-center shadow-md">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Avatar Admin"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-6xl">👨‍💻</span>
              )}

              <label
                htmlFor="input-avatar-admin"
                title="Cambiar foto de perfil"
                className="absolute bottom-1 right-1 bg-[#0f3faf] hover:bg-blue-800 text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white transition-transform hover:scale-105"
              >
                📷
                <input
                  id="input-avatar-admin"
                  type="file"
                  accept="image/*"
                  onChange={seleccionarFoto}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[11px] font-bold text-gray-400 mt-3">
              Formato automático .webp
            </span>
          </div>

          <div className="md:col-span-2 space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                Correo Electrónico (Único)
              </label>
              <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 font-bold text-sm flex items-center gap-2 select-none">
                <span>🔒</span>
                <span className="truncate">{session?.user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                Nombre a Mostrar
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Marlon Ramos"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 outline-none focus:border-[#0f3faf] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!hayCambiosPerfil || guardandoPerfil}
              className={`w-full font-black py-3.5 rounded-xl transition-all text-sm ${
                hayCambiosPerfil && !guardandoPerfil
                  ? "bg-[#0f3faf] hover:bg-blue-800 text-white shadow-lg shadow-blue-200 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {guardandoPerfil ? "Guardando cambios..." : "Guardar Cambios de Perfil"}
            </button>
          </div>
        </form>
      </div>

      {/* BLOQUE 2: ADMINISTRACIÓN DE CONTACTOS Y WHATSAPP DE LA TIENDA */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border">
        <div className="border-b pb-4 mb-6">
          <h2 className="font-black text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
            <span>📱</span> Contactos y WhatsApp de Recepción
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            El código <strong>+503</strong> ya está incluido por defecto. Solo ingresa tus 8 dígitos.
          </p>
        </div>

        <form onSubmit={guardarContactosTienda} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 🟢 CAMPO WHATSAPP CON +503 FIJO Y GUIÓN AUTOMÁTICO (0000-0000) */}
            <div className="bg-green-50/60 p-4 rounded-2xl border border-green-200 sm:col-span-2">
              <label className="block text-xs font-black text-green-900 uppercase mb-1.5">
                🟢 Tu WhatsApp para Recibir Pedidos (Solo 8 dígitos) *
              </label>
              <div className="flex items-center border-2 border-green-300 rounded-xl bg-white overflow-hidden focus-within:border-green-600 transition-colors">
                <span className="bg-green-100 text-green-900 font-black px-4 py-3 text-lg border-r border-green-300 select-none">
                  +503
                </span>
                <input
                  type="tel"
                  required
                  maxLength={9} // 8 números + 1 guion automático
                  placeholder="7000-0000"
                  value={formatearOchoDigitos(contactos.whatsapp_ventas)}
                  onChange={(e) => manejarCambioTelefono("whatsapp_ventas", e.target.value)}
                  className="w-full px-4 py-2.5 font-black text-lg text-green-800 bg-white outline-none tracking-wider"
                />
              </div>
              <p className="text-[11px] text-green-700 font-medium mt-1.5">
                A este WhatsApp llegarán las cotizaciones directas de tus clientes.
              </p>
            </div>

            {/* 📞 TELÉFONO SECUNDARIO / LOCAL TAMBIÉN CON +503 FIJO */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Teléfono de Llamadas / Local (8 dígitos)
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white overflow-hidden focus-within:border-[#0f3faf] transition-colors">
                <span className="bg-gray-100 text-gray-700 font-black px-3 py-2.5 text-sm border-r border-gray-200 select-none">
                  +503
                </span>
                <input
                  type="tel"
                  maxLength={9}
                  placeholder="2600-0000"
                  value={formatearOchoDigitos(contactos.telefono_visible)}
                  onChange={(e) => manejarCambioTelefono("telefono_visible", e.target.value)}
                  className="w-full px-3 py-2.5 font-bold text-sm outline-none tracking-wider text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Correo de Contacto Público
              </label>
              <input
                type="email"
                placeholder="ventas@techuniverse.com"
                value={contactos.correo_contacto}
                onChange={(e) => setContactos({ ...contactos, correo_contacto: e.target.value })}
                className="w-full border-2 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:border-[#0f3faf]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Ubicación / Ciudad
              </label>
              <input
                type="text"
                placeholder="Ej: San Miguel, El Salvador"
                value={contactos.direccion_tienda}
                onChange={(e) => setContactos({ ...contactos, direccion_tienda: e.target.value })}
                className="w-full border-2 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:border-[#0f3faf]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                Horario de Atención
              </label>
              <input
                type="text"
                placeholder="Lun - Sáb: 8:00 AM a 6:00 PM"
                value={contactos.horario_atencion}
                onChange={(e) => setContactos({ ...contactos, horario_atencion: e.target.value })}
                className="w-full border-2 rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:border-[#0f3faf]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!hayCambiosContactos || guardandoContactos}
            className={`w-full font-black py-3.5 rounded-xl transition-all text-sm mt-2 ${
              hayCambiosContactos && !guardandoContactos
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {guardandoContactos ? "Guardando contactos..." : "Guardar Contactos de la Tienda"}
          </button>
        </form>
      </div>
    </div>
  );
}