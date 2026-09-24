"use client";

import { useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";

// Reutilizamos tu excelente función de compresión
const convertirAWebP = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // ⚡ 1. Definimos un ancho máximo razonable (ej. 800px es ideal para web/perfiles)
        const MAX_ANCHO = 800;
        let ancho = img.width;
        let alto = img.height;

        // ⚡ 2. Calculamos la nueva escala manteniendo la relación de aspecto
        if (ancho > MAX_ANCHO) {
          alto = Math.round((alto * MAX_ANCHO) / ancho);
          ancho = MAX_ANCHO;
        }

        const canvas = document.createElement("canvas");
        // ⚡ 3. Usamos las nuevas dimensiones reducidas
        canvas.width = ancho;
        canvas.height = alto;
        const ctx = canvas.getContext("2d");
        
        // ⚡ 4. Dibujamos la imagen ajustada a la nueva escala
        ctx.drawImage(img, 0, 0, ancho, alto);
        
        // ⚡ 5. Bajamos un poco más la calidad a 0.7 (70%) que en WebP no se nota pérdida visual
        canvas.toBlob((blob) => {
          if (blob) {
            const nuevoNombre = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const newFile = new File([blob], nuevoNombre, { type: "image/webp" });
            resolve(newFile);
          } else {
            reject(new Error("Falló la compresión"));
          }
        }, "image/webp", 0.7);
      };
    };
  });
};

export default function ModuloPerfil({ session, perfil, actualizarPerfilLocal }) {
  const [nombre, setNombre] = useState(perfil.nombre);
  const [procesando, setProcesando] = useState(false);
  const fotoPerfilRef = useRef(null);

  // Función para actualizar el Nombre en Supabase Auth
  const guardarNombre = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nombre }
      });
      if (error) throw error;
      
      actualizarPerfilLocal(prev => ({ ...prev, nombre }));
      alert("¡Nombre actualizado correctamente!");
    } catch (error) {
      alert("Error al actualizar nombre: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  // Función para actualizar el Avatar (sube a Storage y actualiza Auth)
  const cambiarFotoPerfil = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProcesando(true);
    try {
      const archivoWebP = await convertirAWebP(file);
      const fileName = `perfil-${Date.now()}.webp`;
      
      const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, archivoWebP);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('productos').getPublicUrl(fileName);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });
      if (updateError) throw updateError;

      actualizarPerfilLocal(prev => ({ ...prev, avatar_url: data.publicUrl }));
      alert("¡Foto de perfil actualizada con éxito!");
    } catch (error) {
      alert("Error al actualizar la foto: " + error.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8 border-b pb-4">
        <h2 className="font-black text-2xl text-gray-800">⚙️ Configuración del Perfil</h2>
        <p className="text-gray-500">Personaliza tu identidad en el panel de administración.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Zona de Fotografía */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full bg-blue-50 border-4 border-[#0f3faf] overflow-hidden shadow-lg flex items-center justify-center">
              {perfil.avatar_url ? (
                <img src={perfil.avatar_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">👨‍💻</span>
              )}
            </div>
            
            {/* Botón flotante para cambiar foto */}
            <input type="file" accept="image/*" ref={fotoPerfilRef} onChange={cambiarFotoPerfil} className="hidden" />
            <button 
              onClick={() => fotoPerfilRef.current.click()} 
              disabled={procesando}
              className="absolute bottom-2 right-2 bg-[#0f3faf] hover:bg-blue-800 text-white p-3 rounded-full shadow-xl transition-transform hover:scale-110"
              title="Cambiar fotografía"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
          </div>
          <p className="text-xs font-bold text-gray-400">Formato automático .webp</p>
        </div>

        {/* Zona de Datos */}
        <div className="flex-1">
          <form onSubmit={guardarNombre} className="space-y-6">
            
            {/* Input bloqueado: Correo */}
            <div>
              <label className="block text-sm font-black text-gray-400 mb-2 uppercase tracking-wider">Correo Electrónico (Único)</label>
              <div className="flex items-center gap-3 w-full border-2 border-gray-100 rounded-xl px-4 py-3 bg-gray-100 text-gray-500 font-bold cursor-not-allowed">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                {session.user.email}
              </div>
              <p className="text-xs text-gray-400 mt-2">El correo de acceso no puede ser modificado por seguridad.</p>
            </div>

            {/* Input editable: Nombre */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Nombre a Mostrar</label>
              <input 
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white focus:border-[#0f3faf] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-gray-800 text-lg" 
                placeholder="Ej: Marlon Ramos"
                required 
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={procesando || nombre === perfil.nombre} 
                className={`w-full py-4 rounded-xl font-black text-lg transition-all ${nombre !== perfil.nombre ? 'bg-[#0f3faf] hover:bg-blue-800 text-white shadow-xl shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {procesando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}