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
  const [guardando, setGuardando] = useState(false);

  // Sincroniza automáticamente el nombre y la foto actuales al cargar
  useEffect(() => {
    setNombre(nombreOriginal);
    setFotoPreview(fotoOriginal);
    setArchivoNuevo(null);
  }, [nombreOriginal, fotoOriginal]);

  // Solo permite guardar si el nombre cambió respecto al original o si seleccionó una foto nueva
  const nombreLimpio = nombre.trim();
  const hayCambios =
    (nombreLimpio !== "" && nombreLimpio !== nombreOriginal) || archivoNuevo !== null;

  const seleccionarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoNuevo(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    if (!hayCambios) return;
    setGuardando(true);

    try {
      let urlFinal = fotoOriginal;

      // 1. Si eligió una foto nueva, la convertimos a .webp y la subimos
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

        // Borrar foto anterior del Storage si estaba en el bucket 'productos'
        if (fotoOriginal && fotoOriginal.includes("/productos/")) {
          const nombreViejo = decodeURIComponent(fotoOriginal.split("/productos/")[1].split("?")[0]);
          if (nombreViejo) {
            await supabase.storage.from("productos").remove([nombreViejo]);
          }
        }
      }

      // 2. Guardamos en Supabase Auth (user_metadata) para que persista siempre en tu cuenta
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nombre_mostrar: nombreLimpio,
          full_name: nombreLimpio,
          avatar_url: urlFinal,
          foto_url: urlFinal,
        },
      });

      if (authError) throw authError;

      // 3. Intentamos sincronizar también en la tabla perfiles_admin (si existe)
      await supabase.from("perfiles_admin").upsert({
        id: session.user.id,
        nombre_completo: nombreLimpio,
        avatar_url: urlFinal,
        rol: perfil?.rol || "Superadmin",
      });

      // 4. Actualizamos inmediatamente la barra lateral y el estado local
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
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-sm border animate-fade-in mt-4">
      <div className="border-b pb-4 mb-8">
        <h2 className="font-black text-2xl text-gray-800 flex items-center gap-2">
          <span>⚙️</span> Configuración del Perfil
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Personaliza tu identidad en el panel de administración.
        </p>
      </div>

      <form onSubmit={guardarCambios} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Columna Foto de Perfil */}
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

        {/* Columna Campos del Perfil */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Correo Electrónico (Único)
            </label>
            <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 font-bold text-sm flex items-center gap-2 select-none">
              <span>🔒</span>
              <span className="truncate">{session?.user?.email}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              El correo de acceso no puede ser modificado por seguridad.
            </p>
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
            disabled={!hayCambios || guardando}
            className={`w-full font-black py-3.5 rounded-xl transition-all text-sm ${
              hayCambios && !guardando
                ? "bg-[#0f3faf] hover:bg-blue-800 text-white shadow-lg shadow-blue-200 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {guardando ? "Guardando cambios..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}