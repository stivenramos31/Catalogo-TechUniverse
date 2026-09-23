import Link from "next/link";

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="bg-[#111827] text-gray-300 pt-12 pb-6 mt-12 border-t-4 border-[#2563eb]">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-gray-700 pb-8">
          
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
              TECH <span className="text-yellow-400">UNIVERSE</span>
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-4">
              Tu proveedor de confianza para tecnología, electrónica y herramientas de precisión. Cotiza en línea de forma rápida y segura.
            </p>
            <div className="flex gap-4">
              {/* Redes sociales (Visuales) */}
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#2563eb] text-white transition-colors">f</a>
              <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#2563eb] text-white transition-colors">ig</a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-yellow-400 transition-colors">Inicio</Link></li>
              <li><Link href="/catalogo" className="hover:text-yellow-400 transition-colors">Catálogo de Productos</Link></li>
              <li><Link href="/carrito" className="hover:text-yellow-400 transition-colors">Mi Cotización</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Atención al Cliente</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span>📍</span> <span className="text-gray-400">San Miguel, El Salvador</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span> <span className="text-gray-400">WhatsApp: +503 0000-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span> <span className="text-gray-400">ventas@techuniverse.com</span>
              </li>
            </ul>
          </div>
          
        </div>

        <div className="text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center gap-2">
          <p>© {anio} Tech Universe. Todos los derechos reservados.</p>
          <p>Desarrollado para la excelencia.</p>
        </div>
      </div>
    </footer>
  );
}