"use client";

import { usePathname } from 'next/navigation';
import Header from './Header'; // Ajusta esta ruta según dónde esté tu Header.js
// import Footer from './Footer'; // Descomenta esto si tienes un Footer.js

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  // Detecta si la ruta actual es el panel de administración
  const esAdmin = pathname?.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!esAdmin && <Header />}
      <main className="flex-1 flex flex-col">{children}</main>
      {/* {!esAdmin && <Footer />} */}
    </div>
  );
}