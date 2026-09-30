import "./globals.css";
import { CartProvider } from "../context/CartContext";
// ⚠️ Si tienes un menú de navegación global, descomenta la siguiente línea (ajustando la ruta si es necesario):
// import LayoutWrapper from "./components/LayoutWrapper";

// 1. METADATOS GLOBALES PARA SEO LOCAL Y REDES SOCIALES
export const metadata = {
  metadataBase: new URL("https://catalogo-tech-universe.vercel.app"),
  title: {
    default: "TECH UNIVERSE | Tienda de Tecnología y Herramientas en San Miguel",
    template: "%s | TECH UNIVERSE El Salvador",
  },
  description:
    "Compra artículos de tecnología, equipos de redes, herramientas de reparación y electrónica al mejor precio en San Miguel y todo El Salvador.",
  keywords: [
    "tecnología San Miguel",
    "herramientas para celulares El Salvador",
    "venta de desarmadores San Miguel",
    "equipos de redes",
    "Tech Universe El Salvador",
    "electrónica San Miguel",
    "comprar hub usb San Miguel",
  ],
  openGraph: {
    title: "TECH UNIVERSE | Tienda de Tecnología en San Miguel",
    description: "Catálogo virtual de tecnología y herramientas en El Salvador.",
    url: "https://catalogo-tech-universe.vercel.app",
    siteName: "TECH UNIVERSE El Salvador",
    locale: "es_SV",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  // 2. AQUÍ PONDRÁS EL CÓDIGO DE GOOGLE SEARCH CONSOLE LUEGO
  // verification: {
  //   google: "TU_CODIGO_DE_VERIFICACION_AQUI",
  // },
};

export default function RootLayout({ children }) {
  // 3. ESTRUCTURA DE NEGOCIO LOCAL PARA GOOGLE MAPS Y BÚSQUEDAS (JSON-LD)
  const jsonLdLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: "TECH UNIVERSE",
    image: "https://catalogo-tech-universe.vercel.app/favicon.ico", 
    description: "Tienda de tecnología, redes y herramientas en San Miguel, El Salvador.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Miguel",
      addressRegion: "San Miguel",
      addressCountry: "SV",
    },
    url: "https://catalogo-tech-universe.vercel.app",
    telephone: "+50370000000", // Cámbialo por el número real de tu tienda
    priceRange: "$$",
  };

  return (
    <html lang="es">
      <head>
        {/* Inyección invisible de datos estructurados para Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <CartProvider>
          {/* Si usas un LayoutWrapper para tu barra de navegación, envuelve a {children} así: */}
          {/* <LayoutWrapper>{children}</LayoutWrapper> */}
          
          {children}
        </CartProvider>
      </body>
    </html>
  );
}