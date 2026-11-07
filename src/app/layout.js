import './globals.css';
import { CartProvider } from '../context/CartContext';
import LayoutWrapper from '../components/layout/LayoutWrapper';
import RastreadorVisitas from "../components/RastreadorVisitas";
// ❌ Eliminamos la importación del Footer de aquí

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
};

export default function RootLayout({ children }) {
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
    telephone: "+50370000000",
    priceRange: "$$",
  };

  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }}
        />
      </head>
      <body suppressHydrationWarning className="bg-[#f5f7fa] text-[#111827] antialiased min-h-screen flex flex-col">
        <CartProvider>
          <RastreadorVisitas />
          {/* El LayoutWrapper ahora tiene el control absoluto de mostrar u ocultar menú y footer */}
          <LayoutWrapper>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}