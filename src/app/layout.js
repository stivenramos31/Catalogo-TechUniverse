import './globals.css';
import { CartProvider } from '../context/CartContext';
import LayoutWrapper from '../components/layout/LayoutWrapper';

export const metadata = {
  title: 'TECH UNIVERSE',
  description: 'Tu tienda de tecnología',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-[#f5f7fa] text-[#111827] antialiased min-h-screen flex flex-col">
        <CartProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </CartProvider>
      </body>
    </html>
  );
}