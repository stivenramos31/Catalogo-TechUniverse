import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "./globals.css";

export const metadata = {
  title: "TECH UNIVERSE | Catálogo de Tecnología y Herramientas",
  description: "Encuentra herramientas de precisión, electrónica y accesorios con cotización inmediata.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-[#f5f7fa] text-[#111827] antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <CartProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}