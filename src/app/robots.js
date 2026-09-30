export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/catalogo", "/ofertas", "/producto/"],
      disallow: ["/admin", "/cotizacion/"],
    },
    sitemap: "https://catalogo-tech-universe.vercel.app/sitemap.xml",
  };
}