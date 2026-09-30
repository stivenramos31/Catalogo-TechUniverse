import { supabase } from "../../../lib/supabase";

const URL_BASE = "https://catalogo-tech-universe.vercel.app";

async function obtenerProducto(rawId) {
  if (!rawId) return null;
  const idDecodificado = decodeURIComponent(rawId);

  const { data: porSlug } = await supabase
    .from("productos")
    .select("*")
    .eq("slug", idDecodificado)
    .maybeSingle();

  if (porSlug) return porSlug;

  if (!isNaN(idDecodificado)) {
    const { data: porId } = await supabase
      .from("productos")
      .select("*")
      .eq("id", Number(idDecodificado))
      .maybeSingle();
    return porId;
  }

  return null;
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const prod = await obtenerProducto(resolvedParams?.id);

  if (!prod) {
    return {
      title: "Producto | TECH UNIVERSE San Miguel, El Salvador",
    };
  }

  const precio = parseFloat(prod.precio_actual || 0).toFixed(2);
  const imagenPrincipal = prod.imagenes?.[0] || `${URL_BASE}/favicon.ico`;
  const urlProducto = `${URL_BASE}/producto/${prod.slug || prod.id}`;
  const descripcionCorta = prod.descripcion
    ? `${prod.descripcion.slice(0, 145)}... Disponible en San Miguel y todo El Salvador.`
    : `Compra ${prod.titulo} a $${precio} en San Miguel, El Salvador. Herramientas, redes y electrónica en TECH UNIVERSE.`;

  return {
    title: `${prod.titulo} - $${precio} | En San Miguel, El Salvador | TECH UNIVERSE`,
    description: descripcionCorta,
    keywords: [
      prod.titulo,
      `${prod.titulo} San Miguel`,
      `${prod.titulo} El Salvador`,
      "herramientas San Miguel",
      "electrónica San Miguel",
      "equipos de redes El Salvador",
      "TECH UNIVERSE",
    ],
    alternates: {
      canonical: urlProducto,
    },
    openGraph: {
      title: `${prod.titulo} - $${precio} | TECH UNIVERSE`,
      description: descripcionCorta,
      url: urlProducto,
      siteName: "TECH UNIVERSE El Salvador",
      images: [
        {
          url: imagenPrincipal,
          width: 800,
          height: 800,
          alt: `${prod.titulo} en San Miguel, El Salvador`,
        },
      ],
      locale: "es_SV",
      type: "website",
    },
  };
}

export default async function ProductoLayout({ children, params }) {
  const resolvedParams = await params;
  const prod = await obtenerProducto(resolvedParams?.id);

  const jsonLd = prod
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: prod.titulo,
        image: prod.imagenes || [],
        description: prod.descripcion,
        sku: String(prod.id),
        brand: {
          "@type": "Brand",
          name: "TECH UNIVERSE",
        },
        offers: {
          "@type": "Offer",
          url: `${URL_BASE}/producto/${prod.slug || prod.id}`,
          priceCurrency: "USD",
          price: parseFloat(prod.precio_actual || 0).toFixed(2),
          itemCondition: "https://schema.org/NewCondition",
          availability:
            prod.stock_disponible > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          areaServed: {
            "@type": "Place",
            name: "San Miguel, El Salvador",
          },
          seller: {
            "@type": "LocalBusiness",
            name: "TECH UNIVERSE San Miguel",
            address: {
              "@type": "PostalAddress",
              addressLocality: "San Miguel",
              addressRegion: "San Miguel",
              addressCountry: "SV",
            },
          },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}