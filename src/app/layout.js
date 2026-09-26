import './globals.css';
import { CartProvider } from '../context/CartContext';
import LayoutWrapper from '../components/layout/LayoutWrapper';
import RastreadorVisitas from "../components/RastreadorVisitas";
import Footer from "../components/layout/Footer";

export const metadata = {
  title: 'TECH UNIVERSE',
  description: 'Tu tienda de tecnología',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#f5f7fa] text-[#111827] antialiased min-h-screen flex flex-col">
        <CartProvider>
          {/* 🌐 Rastreador silencioso de visitas por IP */}
          <RastreadorVisitas />
          <LayoutWrapper>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}