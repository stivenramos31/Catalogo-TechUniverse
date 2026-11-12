import { supabase } from "../../lib/supabase";
import CatalogoClient from "./CatalogoClient";

// 🚀 1. SUPER SEO: Metadatos Dinámicos para Google, Facebook y WhatsApp
export const metadata = {
  title: 'Catálogo de Productos | TECH UNIVERSE',
  description: 'Explora nuestro catálogo de tecnología, herramientas y redes en San Miguel. Envíos a todo El Salvador. Calidad y los mejores precios.',
  keywords: ['tecnología', 'herramientas', 'San Miguel', 'El Salvador', 'cables', 'multímetros', 'Tech Universe'],
  openGraph: {
    title: 'Catálogo Oficial | TECH UNIVERSE',
    description: 'Encuentra las herramientas y accesorios tecnológicos que necesitas. Descuentos disponibles.',
    url: 'https://tu-dominio.com/catalogo', // Reemplaza con tu dominio real
    siteName: 'TECH UNIVERSE',
    locale: 'es_SV',
    type: 'website',
  },
  alternates: {
    canonical: 'https://tu-dominio.com/catalogo',
  }
};

// ⚡ 2. SERVER COMPONENT: Carga Ultra Rápida (Revalidate hace ISR, caché por 60 segundos)
export const revalidate = 60; 

export default async function Page() {
  // Obtenemos los datos directamente en el servidor de forma instantánea
  const [{ data: prods }, { data: cats }] = await Promise.all([
    supabase
      .from("productos")
      .select("*")
      .eq("activo", true)
      .order("id", { ascending: false }),
    supabase
      .from("categorias")
      .select("*")
      .order("nombre", { ascending: true }),
  ]);

  // Pasamos los datos listos al cliente para que tu filtro funcione al vuelo
  return <CatalogoClient productosIniciales={prods || []} categoriasIniciales={cats || []} />;
}