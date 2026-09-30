import { supabase } from "../lib/supabase";

const URL_BASE = "https://catalogo-tech-universe.vercel.app";

export default async function sitemap() {
  const { data: productos } = await supabase
    .from("productos")
    .select("id, slug, creado_en")
    .eq("activo", true);

  const urlsProductos = (productos || []).map((prod) => ({
    url: `${URL_BASE}/producto/${prod.slug || prod.id}`,
    lastModified: prod.creado_en ? new Date(prod.creado_en) : new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [
    {
      url: URL_BASE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${URL_BASE}/catalogo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${URL_BASE}/ofertas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...urlsProductos,
  ];
}